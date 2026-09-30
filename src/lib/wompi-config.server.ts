import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type WompiCredentials = {
  publicKey: string;
  privateKey: string;
  eventsSecret: string;
  integritySecret: string;
};

function encryptionKey(): Buffer {
  const encoded = process.env.PAYMENT_CONFIG_KEY;
  if (!encoded) throw new Error("PAYMENT_CONFIG_KEY is not configured");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("PAYMENT_CONFIG_KEY must decode to 32 bytes");
  return key;
}

export function hasWompiEncryptionKey(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptWompiCredentials(credentials: WompiCredentials): string {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptWompiCredentials(value: string): WompiCredentials {
  const [version, iv, tag, encrypted] = value.split(":");
  if (version !== "v1" || !iv || !tag || !encrypted)
    throw new Error("Unsupported Wompi configuration");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(plain.toString("utf8")) as WompiCredentials;
}
