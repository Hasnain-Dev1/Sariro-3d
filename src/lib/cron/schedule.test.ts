import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { schedulerVerdict, selfOrigin, SCHEDULED_JOBS } from './schedule';

/**
 * SARIRO — the jobs that have never once run
 * ============================================================================
 * Three scheduled routes, none of which has ever executed in production
 * because each needed a line in a hosting panel nobody added. Moving the
 * schedule into the app makes a deploy enough.
 *
 * The tests that matter are the ones about when it must NOT run: a developer's
 * laptop sending real reminders to real learners is a mistake only noticed by
 * the people who receive them.
 */

const env = (o: Record<string, string | undefined>) => o as unknown as NodeJS.ProcessEnv;

describe('when the scheduler runs', () => {
  test('production with a secret runs', () => {
    const v = schedulerVerdict(env({ NODE_ENV: 'production', CRON_SECRET: 's' }));
    assert.equal(v.run, true);
  });

  test('a developer machine does NOT run', () => {
    // Real reminders to real learners, from a laptop, at whatever hour the
    // dev server happens to be up.
    const v = schedulerVerdict(env({ NODE_ENV: 'development', CRON_SECRET: 's' }));
    assert.equal(v.run, false);
    assert.match(v.reason, /not production/);
  });

  test('a developer can force it on deliberately', () => {
    const v = schedulerVerdict(env({ NODE_ENV: 'development', CRON_SECRET: 's', SARIRO_INPROCESS_CRON: '1' }));
    assert.equal(v.run, true);
  });

  test('no CRON_SECRET means the jobs would be refused, so it does not start', () => {
    // The routes fail closed without it. Starting anyway would log a 401 every
    // ten minutes for ever and bury anything real.
    const v = schedulerVerdict(env({ NODE_ENV: 'production' }));
    assert.equal(v.run, false);
    assert.match(v.reason, /CRON_SECRET/);
  });

  test('the off switch beats everything', () => {
    // So that configuring a real external scheduler needs no code change.
    const v = schedulerVerdict(env({
      NODE_ENV: 'production', CRON_SECRET: 's', SARIRO_INPROCESS_CRON: '0',
    }));
    assert.equal(v.run, false);
    assert.match(v.reason, /disabled/);
  });

  test('the off switch beats the force switch too', () => {
    const v = schedulerVerdict(env({
      NODE_ENV: 'development', CRON_SECRET: 's', SARIRO_INPROCESS_CRON: '0',
    }));
    assert.equal(v.run, false);
  });
});

describe('where it calls itself', () => {
  test('loopback on the configured port', () => {
    assert.equal(selfOrigin(env({ PORT: '4000' })), 'http://127.0.0.1:4000');
  });

  test('defaults to 3000', () => {
    assert.equal(selfOrigin(env({})), 'http://127.0.0.1:3000');
  });

  test('an explicit origin wins, without a trailing slash', () => {
    // Behind a proxy that terminates TLS, loopback may not be the app.
    assert.equal(selfOrigin(env({ SARIRO_CRON_ORIGIN: 'https://sariro.com/' })), 'https://sariro.com');
  });

  test('a blank explicit origin falls back rather than producing "/api/..."', () => {
    assert.equal(selfOrigin(env({ SARIRO_CRON_ORIGIN: '   ', PORT: '8080' })), 'http://127.0.0.1:8080');
  });
});

describe('the jobs themselves', () => {
  test('reminders run often enough to still be a reminder', () => {
    // The route looks for classes starting in ~30 minutes. A gap wider than
    // that turns "starts in 30 minutes" into "starts in 4", which is an
    // apology rather than a reminder.
    const reminders = SCHEDULED_JOBS.find((j) => j.name === 'class-reminders')!;
    assert.ok(reminders.everyMs <= 15 * 60_000, 'reminders must run at least every 15 minutes');
  });

  test('every job is staggered, so a restart does not fire them together', () => {
    const offsets = SCHEDULED_JOBS.map((j) => j.offsetMs);
    assert.equal(new Set(offsets).size, offsets.length);
    assert.ok(Math.min(...offsets) > 0, 'nothing fires during boot itself');
  });

  test('every job points at a cron route', () => {
    for (const j of SCHEDULED_JOBS) {
      assert.match(j.path, /^\/api\/cron\//, j.name);
      assert.ok(j.everyMs >= 60_000, `${j.name} would hammer itself`);
    }
  });
});
