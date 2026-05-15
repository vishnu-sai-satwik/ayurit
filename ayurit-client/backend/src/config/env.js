import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const devSecret = (name) => {
  if (process.env[name]) {
    return process.env[name];
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable in production: ${name}`);
  }

  const generated = crypto.randomBytes(32).toString("hex");
  console.warn(`[env] ${name} not set. Generated temporary development secret.`);
  return generated;
};

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  dbProvider: process.env.DB_PROVIDER || "mongodb",
  mongoUri: process.env.MONGODB_URI,
  postgresUri: process.env.POSTGRES_URI,
  jwtSecret: devSecret("JWT_SECRET"),
  aesSecret: devSecret("AES_SECRET"),
  geminiApiKey: process.env.API_KEY || "",
  integrationApiKey: process.env.INTEGRATION_API_KEY || "",
  cloudProvider: process.env.CLOUD_PROVIDER || "aws",
  allowedOrigin: process.env.ALLOWED_ORIGIN || "*"
};
