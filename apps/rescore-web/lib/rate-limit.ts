import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";

/**
 * Rate limiting for the free report reader.
 *
 * The endpoint is unauthenticated and every call costs money, so it carries three
 * limits: per reader per hour, per reader per day, and a hard ceiling for the whole
 * site per day so a burst cannot drain the account overnight.
 *
 * Counters live in Netlify Blobs, which is shared across function instances. Where
 * Blobs is not available, local development for instance, the request is allowed:
 * a broken counter should not take the reader down.
 */
export const LIMITS = {
  perIpPerHour: 5,
  perIpPerDay: 15,
  perSitePerDay: 300,
} as const;

const STORE = "rescore-rate-limit";

/** The caller, hashed, because a raw address is personal data and we only need to count. */
export function callerKey(request: Request): string {
  const forwarded =
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return createHash("sha256").update(forwarded).digest("hex").slice(0, 32);
}

export interface RateDecision {
  allowed: boolean;
  reason: string | null;
  /** Seconds until the reader may try again, where we can say. */
  retryAfter: number | null;
}

interface Counter {
  count: number;
  windowStartedAt: number;
}

function windowKeys(caller: string, now: Date) {
  const day = now.toISOString().slice(0, 10);
  const hour = now.toISOString().slice(0, 13);
  return { ipHour: `ip/${caller}/${hour}`, ipDay: `ip/${caller}/${day}`, siteDay: `site/${day}` };
}

async function bump(
  store: ReturnType<typeof getStore>,
  key: string,
  limit: number,
  now: number,
): Promise<boolean> {
  const existing = (await store.get(key, { type: "json" })) as Counter | null;
  const count = (existing?.count ?? 0) + 1;
  if (count > limit) return false;
  await store.setJSON(key, { count, windowStartedAt: existing?.windowStartedAt ?? now } satisfies Counter);
  return true;
}

function secondsUntilNextHour(now: Date): number {
  const next = new Date(now);
  next.setUTCMinutes(60, 0, 0);
  return Math.max(1, Math.round((next.getTime() - now.getTime()) / 1000));
}

function secondsUntilNextDay(now: Date): number {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.round((next.getTime() - now.getTime()) / 1000));
}

/** Counts this read and says whether it may go ahead. */
export async function checkRateLimit(request: Request, now = new Date()): Promise<RateDecision> {
  let store: ReturnType<typeof getStore>;
  try {
    store = getStore({ name: STORE, consistency: "strong" });
  } catch {
    // Blobs is not configured here. Let the read through rather than break the reader.
    return { allowed: true, reason: null, retryAfter: null };
  }

  const keys = windowKeys(callerKey(request), now);
  const stamp = now.getTime();

  try {
    if (!(await bump(store, keys.siteDay, LIMITS.perSitePerDay, stamp))) {
      return {
        allowed: false,
        reason:
          "The free reader has hit its limit for today. It resets tomorrow, and your report will still be here.",
        retryAfter: secondsUntilNextDay(now),
      };
    }
    if (!(await bump(store, keys.ipDay, LIMITS.perIpPerDay, stamp))) {
      return {
        allowed: false,
        reason: "You have read a lot of reports today. Try again tomorrow, or start a case to keep going.",
        retryAfter: secondsUntilNextDay(now),
      };
    }
    if (!(await bump(store, keys.ipHour, LIMITS.perIpPerHour, stamp))) {
      return {
        allowed: false,
        reason: "That is a few reads in one hour. Give it an hour and try again.",
        retryAfter: secondsUntilNextHour(now),
      };
    }
    return { allowed: true, reason: null, retryAfter: null };
  } catch {
    return { allowed: true, reason: null, retryAfter: null };
  }
}
