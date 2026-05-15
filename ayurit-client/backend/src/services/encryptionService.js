import crypto from "crypto";
import { env } from "../config/env.js";

const key = crypto.scryptSync(env.aesSecret, "ayurit-salt", 32);

export const encryptText = (plainText = "") => {
  if (!plainText) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptText = (encryptedText = "") => {
  if (!encryptedText) return "";
  const [ivHex, payloadHex] = encryptedText.split(":");
  if (!ivHex || !payloadHex) return "";

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(ivHex, "hex")
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadHex, "hex")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
};
