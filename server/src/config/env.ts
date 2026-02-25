import dotenv from "dotenv";
dotenv.config({ override: true });

export const env = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || "",
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || "",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
} as const;
