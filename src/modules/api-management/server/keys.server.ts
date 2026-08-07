/**
 * API Management — Seguridad de API Keys.
 * Las claves nunca se almacenan en claro: se guarda un hash SHA-256.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const KEY_PREFIX = "lvk_";

export interface GeneratedKey {
  /** Valor completo, mostrado una única vez al crearla. */
  raw: string;
  hash: string;
  prefix: string;
  last4: string;
}

export function generateApiKey(): GeneratedKey {
  const secret = randomBytes(24).toString("base64url");
  const raw = `${KEY_PREFIX}${secret}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, KEY_PREFIX.length + 6),
    last4: raw.slice(-4),
  };
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw.trim()).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function extractApiKey(request: Request): string | null {
  const header = request.headers.get("x-api-key");
  if (header && header.trim().length > 0) return header.trim();
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("apikey ")) {
    return authorization.slice(7).trim();
  }
  return null;
}
