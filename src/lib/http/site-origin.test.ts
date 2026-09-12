import test from 'node:test';
import assert from 'node:assert/strict';
import { siteOrigin, isLocal } from './site-origin';
import type { NextRequest } from 'next/server';

/* The bug this guards: a live family, booked, sent to http://localhost:3000. */

function req(url: string, headers: Record<string, string> = {}): NextRequest {
  return {
    url,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  } as unknown as NextRequest;
}

const withEnv = (value: string | undefined, fn: () => void) => {
  const before = process.env.NEXT_PUBLIC_SITE_URL;
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = value;
  try { fn(); } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = before;
  }
};

test('an explicit site URL wins, trailing slash and all', () => {
  withEnv('https://sariro.com/', () => {
    assert.equal(siteOrigin(req('http://localhost:3000/api/trial/self-book')), 'https://sariro.com');
  });
});

test('behind a proxy, the forwarded host is used rather than localhost', () => {
  withEnv(undefined, () => {
    const r = req('http://localhost:3000/api/trial/self-book', {
      'x-forwarded-host': 'sariro.com',
      'x-forwarded-proto': 'https',
    });
    assert.equal(siteOrigin(r), 'https://sariro.com');
  });
});

test('a forwarded proto list takes the first hop', () => {
  withEnv(undefined, () => {
    const r = req('http://localhost:3000/x', { 'x-forwarded-host': 'sariro.com', 'x-forwarded-proto': 'https, http' });
    assert.equal(siteOrigin(r), 'https://sariro.com');
  });
});

test('https is assumed when a proxy names a host but no scheme', () => {
  withEnv(undefined, () => {
    assert.equal(siteOrigin(req('http://localhost:3000/x', { host: 'sariro.com' })), 'https://sariro.com');
  });
});

test('in development it is still plain localhost', () => {
  withEnv(undefined, () => {
    const r = req('http://localhost:3000/api/trial/self-book', { host: 'localhost:3000' });
    assert.equal(siteOrigin(r), 'http://localhost:3000');
  });
});

test('a local host is never mistaken for the live site', () => {
  for (const host of ['localhost', 'localhost:3000', '127.0.0.1:3000', '[::1]:3000']) {
    assert.equal(isLocal(host), true, `${host} is local`);
  }
  for (const host of ['sariro.com', 'www.sariro.com', 'sariro.com:443']) {
    assert.equal(isLocal(host), false, `${host} is not local`);
  }
});
