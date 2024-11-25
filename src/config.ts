import dotenv from "dotenv";

export const NODE_ENV = process.env.NODE_ENV || "";

// Load .env file only in development
if (["development", "devtest"].includes(NODE_ENV)) {
  dotenv.config();
}

export const ACTIVE_DB =
  NODE_ENV === "devtest" || process.env.ACTIVE_DB === "test"
    ? "test"
    : "production";
export const MONGO_URI =
  NODE_ENV === "devtest"
    ? process.env.MONGO_URI_TEST || ""
    : process.env.MONGO_URI || "";
export const PORT = "4000";
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "";
export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "";
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
export const S3_REGION = process.env.S3_REGION || "";
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
