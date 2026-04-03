import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../security/password";

// These tests run in Node 18+ where crypto.subtle is available globally.
// They test the full PBKDF2 round-trip which is the critical path for campaign join.

describe("hashPassword / verifyPassword", () => {
  it("produces a hash and salt", async () => {
    const { hash, salt } = await hashPassword("my-secure-pass");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
    expect(typeof salt).toBe("string");
    expect(salt.length).toBeGreaterThan(0);
  });

  it("different salts produce different hashes for the same password", async () => {
    const { hash: h1 } = await hashPassword("same-password");
    const { hash: h2 } = await hashPassword("same-password");
    // Salts are random — hashes must differ
    expect(h1).not.toBe(h2);
  });

  it("verifies correct password", async () => {
    const { hash, salt } = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", hash, salt)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const { hash, salt } = await hashPassword("correct-password");
    expect(await verifyPassword("wrong-password", hash, salt)).toBe(false);
  });

  it("rejects empty password against real hash", async () => {
    const { hash, salt } = await hashPassword("real-password");
    expect(await verifyPassword("", hash, salt)).toBe(false);
  });

  it("handles unicode passwords correctly", async () => {
    const pass = "dračí hlídka — ✨🐉";
    const { hash, salt } = await hashPassword(pass);
    expect(await verifyPassword(pass, hash, salt)).toBe(true);
    expect(await verifyPassword("draci hlidka", hash, salt)).toBe(false);
  });
});
