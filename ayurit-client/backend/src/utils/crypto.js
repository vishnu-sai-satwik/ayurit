import crypto from "crypto";
import { env } from "../config/env.js";

const getKey = () => crypto.createHash("sha256").update(String(env.aesSecret || "ayurit-dev-secret")).digest();

export const encryptSecret = (value) => {
  const text = String(value || "");
  if (!text) return "";

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decryptSecret = (value) => {
  const text = String(value || "");
  if (!text) return "";

  const buffer = Buffer.from(text, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

export const maskSecret = (value, visibleChars = 4) => {
  const text = String(value || "");
  if (!text) return "";
  const tail = text.slice(-visibleChars);
  return `${"*".repeat(Math.max(0, text.length - visibleChars))}${tail}`;
};