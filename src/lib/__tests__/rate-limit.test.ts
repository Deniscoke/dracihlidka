import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "../rate-limit";

// Each test uses a unique key prefix so the shared module-level store doesn't bleed between tests.
let counter = 0;
function key(suffix = ""): string {
  return `test:${++counter}:${suffix}`;
}

describe("checkRateLimit", () => {
  it("allows first request", () => {
    expect(checkRateLimit(key(), 5, 60_000)).toEqual({ ok: true });
  });

  it("allows requests up to the limit", () => {
    const k = key();
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(k, 5, 60_000).ok).toBe(true);
    }
  });

  it("blocks after limit is reached", () => {
    const k = key();
    for (let i = 0; i < 3; i++) checkRateLimit(k, 3, 60_000);
    const result = checkRateLimit(k, 3, 60_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets after window expires", async () => {
    const k = key();
    const SHORT_WINDOW = 50; // 50ms
    checkRateLimit(k, 1, SHORT_WINDOW);
    checkRateLimit(k, 1, SHORT_WINDOW); // This call will be blocked initially
    // Wait for window to pass
    await new Promise((r) => setTimeout(r, 60));
    expect(checkRateLimit(k, 1, SHORT_WINDOW).ok).toBe(true);
  });

  it("different keys have independent counters", () => {
    const k1 = key("a");
    const k2 = key("b");
    for (let i = 0; i < 3; i++) checkRateLimit(k1, 3, 60_000);
    // k1 is blocked; k2 should still allow
    expect(checkRateLimit(k1, 3, 60_000).ok).toBe(false);
    expect(checkRateLimit(k2, 3, 60_000).ok).toBe(true);
  });

  it("retryAfter is a positive integer in seconds", () => {
    const k = key();
    checkRateLimit(k, 1, 30_000);
    const result = checkRateLimit(k, 1, 30_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(30);
      expect(Number.isInteger(result.retryAfter)).toBe(true);
    }
  });
});
