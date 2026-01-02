import crypto from "crypto";

const HASH_PREFIX = "scrypt";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export function hashPassword(plain: string) {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = crypto.scryptSync(plain, salt, KEY_LENGTH) as Buffer;
  return `${HASH_PREFIX}$${salt}$${hash.toString("hex")}`;
}

export function isHashed(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith(`${HASH_PREFIX}$`);
}

export function verifyPassword(plain: string, stored: string | null | undefined) {
  if (!stored) return false;
  if (!isHashed(stored)) {
    return plain === stored;
  }

  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const hashHex = parts[2];
  if (!salt || !hashHex) return false;
  const storedHash = Buffer.from(hashHex, "hex");
  const derived = crypto.scryptSync(plain, salt, KEY_LENGTH) as Buffer;
  if (storedHash.length !== derived.length) return false;
  return crypto.timingSafeEqual(storedHash, derived);
}
