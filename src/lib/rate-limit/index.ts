/**
 * SARIRO — In-memory rate limiter + IP blocklist
 *
 * Simple sliding-window rate limiter using a Map<key, number[]>.
 *
 * Pros:
 *   - Zero dependencies
 *   - Works in any runtime (Node, edge, serverless)
 *   - Sub-millisecond overhead
 *
 * Cons:
 *   - Per-instance (no shared state across serverless cold starts or
 *     multi-instance deployments). For multi-instance, use Redis.
 *   - Memory grows with unique keys — we cap the map size + prune
 *     empty entries to prevent unbounded growth.
 *
 * Usage:
 *   import { rateLimit, getRateLimitInfo } from '@/lib/rate-limit';
 *
 *   const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
 *   const rl = rateLimit({ key: `chat:${ip}`, limit: 20, windowMs: 60_000 });
 *   if (!rl.ok) {
 *     return NextResponse.json(
 *       { error: 'Too many requests', retryAfter: rl.retryAfterMs / 1000 },
 *       { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
 *     );
 *   }
 *
 * IP BLOCKLIST:
 *   After repeated rate-limit violations, IPs get auto-blocked. Blocked
 *   IPs get 403 immediately on ALL endpoints. Use `isIpBlocked(ip)` at
 *   the top of any request handler to short-circuit abusers.
 *
 *   The blocklist also feeds off honeypot trips — see
 *   `recordHoneypotTrip(ip)` which is called from form endpoints when
 *   a bot fills a honeypot field.
 */

interface RateLimitBucket {
  /** Sorted (ascending) timestamps of requests within the window. */
  timestamps: number[];
  /** Last access time — used for eviction of stale buckets. */
  lastAccess: number;
}

interface IpBlockEntry {
  /** When the block was applied. */
  blockedAt: number;
  /** When the block expires. */
  expiresAt: number;
  /** Reason: 'rate_limit_violations' | 'honeypot_trip' | 'manual' */
  reason: string;
  /** Number of violations that triggered the block. */
  violationCount: number;
}

const buckets = new Map<string, RateLimitBucket>();

/** Map of blocked IPs → block entry. */
const blocklist = new Map<string, IpBlockEntry>();

/** Tracks violation counts per IP (rate-limit 429s + honeypot trips). */
const violationCounter = new Map<string, { count: number; firstAt: number }>();

/** Hard cap on the number of tracked keys to prevent unbounded memory growth. */
const MAX_BUCKETS = 10_000;

/** Periodic eviction interval (ms). Stale buckets (no access in 2x window) are removed. */
const EVICTION_INTERVAL_MS = 60_000;
let lastEvictionAt = 0;

/** Threshold: 5 violations in 10 minutes → 1-hour block. */
const BLOCK_THRESHOLD = 5;
const BLOCK_WINDOW_MS = 10 * 60 * 1000; // 10 min
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface RateLimitOptions {
  /** Bucket key — typically `${routeName}:${identifier}` (e.g. `chat:ip-1.2.3.4`). */
  key: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Sliding window length in milliseconds. */
  windowMs: number;
  /** Optional — the raw IP for violation tracking. If provided, repeated
   *  429s will escalate to a 1-hour IP block. */
  ip?: string;
}

interface RateLimitResult {
  /** True if the request is allowed; false if rate-limited. */
  ok: boolean;
  /** Number of requests in the current window (after this one). */
  count: number;
  /** Remaining requests in the window (after this one). */
  remaining: number;
  /** Milliseconds until the oldest request in the window expires (Retry-After hint). */
  retryAfterMs: number;
  /** Universal reset timestamp (epoch ms) — for X-RateLimit-Reset header. */
  resetAtMs: number;
}

/**
 * Records a request in the bucket and returns whether it's allowed.
 *
 * Always records the request (even if rate-limited) so that sustained
 * abuse keeps the bucket full. If you'd rather not count rejected
 * requests, check `ok` first and only call again if allowed — but this
 * helper does both in one call for simplicity.
 *
 * When `ip` is provided and the request is denied, the violation is
 * recorded against that IP. After 5 violations in 10 minutes, the IP
 * gets auto-blocked for 1 hour (see `isIpBlocked`).
 */
export function rateLimit({ key, limit, windowMs, ip }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Eviction sweep — runs at most once per EVICTION_INTERVAL_MS.
  if (now - lastEvictionAt > EVICTION_INTERVAL_MS) {
    lastEvictionAt = now;
    for (const [k, v] of buckets) {
      if (now - v.lastAccess > 2 * windowMs) {
        buckets.delete(k);
      }
    }
  }

  let bucket = buckets.get(key);
  if (!bucket) {
    // Cap check — if we have too many buckets, refuse to create more
    // (fail open: allow the request, but don't track it).
    if (buckets.size >= MAX_BUCKETS) {
      return {
        ok: true,
        count: 1,
        remaining: limit - 1,
        retryAfterMs: 0,
        resetAtMs: now + windowMs,
      };
    }
    bucket = { timestamps: [], lastAccess: now };
    buckets.set(key, bucket);
  }
  bucket.lastAccess = now;

  // Prune expired timestamps.
  while (bucket.timestamps.length > 0 && bucket.timestamps[0] < windowStart) {
    bucket.timestamps.shift();
  }

  // Check limit BEFORE recording this request — so we don't count
  // rejected requests against the user.
  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterMs = Math.max(1000, oldest + windowMs - now);
    // Record violation for IP escalation (if IP was provided)
    if (ip) recordViolation(ip);
    return {
      ok: false,
      count: bucket.timestamps.length,
      remaining: 0,
      retryAfterMs,
      resetAtMs: oldest + windowMs,
    };
  }

  // Record this request.
  bucket.timestamps.push(now);

  return {
    ok: true,
    count: bucket.timestamps.length,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    retryAfterMs: 0,
    resetAtMs: now + windowMs,
  };
}

/**
 * Returns stats about the rate limiter — useful for /api/health.
 */
export function getRateLimitInfo(): {
  buckets: number;
  maxBuckets: number;
  blockedIps: number;
  recentViolations: number;
} {
  // Cleanup expired blocks
  const now = Date.now();
  for (const [ip, entry] of blocklist) {
    if (entry.expiresAt < now) blocklist.delete(ip);
  }
  return {
    buckets: buckets.size,
    maxBuckets: MAX_BUCKETS,
    blockedIps: blocklist.size,
    recentViolations: violationCounter.size,
  };
}

/**
 * Helper — extract a best-effort client identifier from a Next.js request.
 * Prefers x-forwarded-for (set by most proxies / load balancers), falls
 * back to x-real-ip, then to 'unknown' (rate limit becomes global).
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // x-forwarded-for can be a comma-separated list; first entry is the original client.
    return xff.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/* ─────────────────────── IP BLOCKLIST ─────────────────────── */

/**
 * Checks if an IP is currently blocked. Call this at the top of any
 * request handler:
 *
 *   const ip = getClientIp(req);
 *   if (isIpBlocked(ip)) {
 *     return new Response('Forbidden', { status: 403 });
 *   }
 */
export function isIpBlocked(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  const entry = blocklist.get(ip);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    blocklist.delete(ip);
    return false;
  }
  return true;
}

/**
 * Returns the block entry for an IP (if blocked), for admin display.
 */
export function getIpBlockInfo(ip: string): IpBlockEntry | null {
  if (!ip) return null;
  const entry = blocklist.get(ip);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    blocklist.delete(ip);
    return null;
  }
  return entry;
}

/**
 * Records a rate-limit violation for an IP. After BLOCK_THRESHOLD
 * violations within BLOCK_WINDOW_MS, the IP gets auto-blocked for
 * BLOCK_DURATION_MS.
 *
 * Called automatically by `rateLimit()` when a request is denied.
 */
function recordViolation(ip: string, reason: string = 'rate_limit_violations'): void {
  if (!ip || ip === 'unknown') return;
  const now = Date.now();
  const existing = violationCounter.get(ip);
  if (!existing || now - existing.firstAt > BLOCK_WINDOW_MS) {
    violationCounter.set(ip, { count: 1, firstAt: now });
    return;
  }
  existing.count += 1;
  if (existing.count >= BLOCK_THRESHOLD) {
    blocklist.set(ip, {
      blockedAt: now,
      expiresAt: now + BLOCK_DURATION_MS,
      reason,
      violationCount: existing.count,
    });
    violationCounter.delete(ip);
    console.warn(`[rate-limit] IP ${ip} auto-blocked for ${BLOCK_DURATION_MS / 60000}min (${reason}, ${existing.count} violations)`);
  }
}

/**
 * Records a honeypot trip. Honeypot trips count DOUBLE toward the
 * threshold (since they're stronger bot signals than rate-limit hits).
 */
export function recordHoneypotTrip(ip: string): void {
  if (!ip || ip === 'unknown') return;
  recordViolation(ip, 'honeypot_trip');
  recordViolation(ip, 'honeypot_trip'); // double-weight
}

/**
 * Manually blocks an IP (super-admin action).
 */
export function blockIp(ip: string, reason: string = 'manual', durationMs: number = BLOCK_DURATION_MS): void {
  if (!ip) return;
  const now = Date.now();
  blocklist.set(ip, {
    blockedAt: now,
    expiresAt: now + durationMs,
    reason,
    violationCount: 0,
  });
  console.warn(`[rate-limit] IP ${ip} manually blocked (${reason})`);
}

/**
 * Manually unblocks an IP (super-admin action).
 */
export function unblockIp(ip: string): boolean {
  if (!ip) return false;
  const existed = blocklist.delete(ip);
  violationCounter.delete(ip);
  return existed;
}

/**
 * Returns all currently-blocked IPs — for the admin dashboard.
 */
export function getBlocklist(): Array<IpBlockEntry & { ip: string }> {
  const now = Date.now();
  const out: Array<IpBlockEntry & { ip: string }> = [];
  for (const [ip, entry] of blocklist) {
    if (entry.expiresAt < now) {
      blocklist.delete(ip);
      continue;
    }
    out.push({ ip, ...entry });
  }
  return out.sort((a, b) => b.blockedAt - a.blockedAt);
}

/**
 * Helper — build a 429 response with proper headers.
 */
export function rateLimitedResponse(retryAfterMs: number, message = 'Too many requests'): Response {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({ error: message, retryAfter: retryAfterSec }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': 'exceeded',
      },
    }
  );
}
