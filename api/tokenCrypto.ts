/**
 * Omega Swarm v5.1 — Token Encryption at Rest
 *
 * AES-256-GCM encryption for OAuth tokens stored in the database
 * (social_accounts.access_token). Key comes from TOKEN_ENCRYPTION_KEY
 * (Railway variable); if unset we fall back to a key derived from
 * OPENROUTER_API_KEY so encryption is always on — never silently plaintext.
 *
 * Format: "v1:<iv_b64>:<tag_b64>:<cipher_b64>". Values without the v1:
 * prefix are treated as legacy plaintext and returned as-is (transparent
 * migration — rows get encrypted on their next write).
 */

import crypto from "node:crypto";

const PREFIX = "v1:";

function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.OPENROUTER_API_KEY || "";
  // sha256 normalizes any secret to a valid 32-byte AES-256 key
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(plain: string): string {
  if (!plain) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptToken(stored: string): string {
  if (!stored || !stored.startsWith(PREFIX)) return stored; // legacy plaintext
  try {
    const [, ivB64, tagB64, dataB64] = stored.split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
  } catch (err) {
    console.error("[TokenCrypto] Decrypt failed:", (err as Error).message);
    return ""; // fail closed — never return garbage as a token
  }
}
