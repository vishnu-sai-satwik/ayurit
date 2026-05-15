import mongoose from "mongoose";
import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;
let pool = null;
let activeProvider = env.dbProvider;

export const connectDb = async () => {
  try {
    if (env.dbProvider === "mongodb") {
      if (!env.mongoUri) {
        throw new Error("MONGODB_URI is missing in environment");
      }
      console.log("[db] Attempting to connect to MongoDB...");
      console.log("[db] URI (masked):", env.mongoUri.replace(/(mongodb\+srv:\/\/)(.+):(.+)@/, "$1***:***@"));
      
      await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      activeProvider = "mongodb";
      console.log("[db] ✓ Successfully connected to MongoDB");
      console.log("[db] Database:", mongoose.connection.db?.name || "ayurit_dev");
      return { provider: "mongodb" };
    }

    if (env.dbProvider === "postgres") {
      if (!env.postgresUri) {
        throw new Error("POSTGRES_URI is missing");
      }
      console.log("[db] Attempting to connect to PostgreSQL...");
      pool = new Pool({ connectionString: env.postgresUri });
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'patient',
          password_hash TEXT NOT NULL,
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          profile_json TEXT DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS patients (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'patient',
          encrypted_notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS foods (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          calories INTEGER NOT NULL,
          protein NUMERIC NOT NULL,
          carbs NUMERIC NOT NULL,
          fats NUMERIC NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS charts (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
          metric TEXT NOT NULL,
          value NUMERIC NOT NULL,
          logged_at TIMESTAMP DEFAULT NOW()
        );
      `);
      activeProvider = "postgres";
      console.log("[db] ✓ Successfully connected to PostgreSQL");
      return { provider: "postgres" };
    }

    if (env.dbProvider === "memory") {
      console.log("[db] Using in-memory provider (development mode)");
      activeProvider = "memory";
      return { provider: "memory" };
    }

    throw new Error(`Unsupported DB_PROVIDER: ${env.dbProvider}`);
  } catch (error) {
    activeProvider = "memory";
    pool = null;
    console.error("[db] ✗ Database connection failed:");
    console.error("[db]   Error:", error.message);
    console.error("[db]   Configured provider:", env.dbProvider);
    console.error("[db] ⚠ Falling back to in-memory store (data will be lost on restart)");
    console.error("[db] → To fix, set DB_PROVIDER=memory in .env, or configure a valid MongoDB/PostgreSQL URI");
    return { provider: "memory" };
  }
};

export const getPgPool = () => pool;
export const getActiveProvider = () => activeProvider;
