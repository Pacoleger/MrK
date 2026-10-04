// ============================================================
// Kryptographische Utilities (WebCrypto API)
// ============================================================

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";
const SALT_BYTES = 16;
const KEY_BITS = 256;

/**
 * Generiert einen kryptographisch sicheren Zufallswert als Base64.
 */
export function randomBase64(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64Encode(buf);
}

/**
 * Generiert eine UUID v4.
 */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Base64 Encoding (URL-safe optional).
 */
export function base64Encode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.byteLength; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/**
 * Base64 Decoding.
 */
export function base64Decode(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Base64URL Encoding (ohne Padding, + → -, / → _)
 */
export function base64UrlEncode(data: Uint8Array | string): string {
  const b64 = typeof data === "string" ? btoa(data) : base64Encode(data);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Base64URL Decoding.
 */
export function base64UrlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return base64Decode(padded);
}

/**
 * Text-Encoder / Decoder (UTF-8).
 */
export function textEncode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function textDecode(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

// ============================================================
// Passwort-Hashing (PBKDF2)
// ============================================================

/**
 * Hasht ein Passwort mit PBKDF2-HMAC-SHA256.
 * @returns Base64-codierter Hash
 */
export async function hashPassword(
  password: string,
  saltBase64: string
): Promise<string> {
  const salt = base64Decode(saltBase64);

  // Importiere das Passwort als Roh-Key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // PBKDF2 ableiten
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    KEY_BITS
  );

  return base64Encode(new Uint8Array(derivedBits));
}

/**
 * Prüft ein Passwort gegen einen Hash.
 */
export async function verifyPassword(
  password: string,
  saltBase64: string,
  expectedHashBase64: string
): Promise<boolean> {
  const hash = await hashPassword(password, saltBase64);
  return timingSafeEqual(hash, expectedHashBase64);
}

/**
 * Timing-safe Vergleich von Strings.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
