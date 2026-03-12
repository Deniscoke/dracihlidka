// ============================================================
// Campaign Password — app-level UI lock only, NOT secure auth.
// Uses WebCrypto PBKDF2 when available, falls back to a pure-JS
// djb2 hash so it works on http:// and older environments too.
// ============================================================

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

/* ── Pure-JS fallback (djb2 variant) ────────────────── */
function djb2Hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h) ^ text.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h;
}

function fallbackHash(password: string, saltB64: string): string {
  // Mix password and salt through multiple rounds of djb2
  let state = djb2Hash(saltB64 + password);
  for (let i = 0; i < 1000; i++) {
    state = djb2Hash(state.toString(36) + password + i);
  }
  return state.toString(36) + saltB64.slice(0, 8);
}

function randomBase64(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return btoa(String.fromCharCode(...arr));
}

function isSubtleAvailable(): boolean {
  try {
    return (
      typeof crypto !== "undefined" &&
      typeof crypto.subtle !== "undefined" &&
      typeof crypto.subtle.importKey === "function"
    );
  } catch {
    return false;
  }
}

/* ── WebCrypto PBKDF2 path ───────────────────────────── */
const ITERATIONS = 100_000;
const KEY_LENGTH  = 256;

async function pbkdf2Hash(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH
  );
  return toBase64(derived);
}

/* ── Public API ─────────────────────────────────────── */

export async function hashPassword(
  password: string
): Promise<{ hash: string; salt: string }> {
  const saltB64 = randomBase64(16);

  if (isSubtleAvailable()) {
    const salt = fromBase64(saltB64);
    const hash = await pbkdf2Hash(password, salt);
    return { hash, salt: toBase64(salt.buffer as ArrayBuffer) };
  }

  return { hash: fallbackHash(password, saltB64), salt: saltB64 };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  if (isSubtleAvailable()) {
    try {
      const salt = fromBase64(storedSalt);
      const hash = await pbkdf2Hash(password, salt);
      return hash === storedHash;
    } catch {
      // If WebCrypto fails mid-way, try fallback
    }
  }

  return fallbackHash(password, storedSalt) === storedHash;
}
