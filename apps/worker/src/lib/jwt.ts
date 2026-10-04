import type { JwtPayload } from "../types";
import { base64UrlEncode, base64UrlDecode, textEncode, textDecode } from "./crypto";

// ============================================================
// JWT (HS256) mit WebCrypto
// ============================================================

const ALG = "HS256";
const DEFAULT_EXPIRY_SEC = 60 * 60 * 24 * 7; // 7 Tage

function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function encodeSegment(obj: unknown): string {
  return base64UrlEncode(JSON.stringify(obj));
}

/**
 * Signiert ein JWT.
 */
export async function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
  expiresInSec = DEFAULT_EXPIRY_SEC
): Promise<string> {
  const header = { alg: ALG, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSec,
  };

  const encodedHeader = encodeSegment(header);
  const encodedPayload = encodeSegment(fullPayload);
  const message = `${encodedHeader}.${encodedPayload}`;

  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, textEncode(message));

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));

  return `${message}.${encodedSignature}`;
}

/**
 * Verifiziert ein JWT.
 * @returns Payload wenn gültig, sonst null
 */
export async function verifyJwt(
  token: string,
  secret: string
): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const message = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await importKey(secret);
    const signature = base64UrlDecode(encodedSignature);

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      textEncode(message)
    );

    if (!valid) return null;

    const payload = JSON.parse(textDecode(base64UrlDecode(encodedPayload))) as JwtPayload;

    // Ablaufzeit prüfen
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch (err) {
    console.error("JWT verification error:", err);
    return null;
  }
}
