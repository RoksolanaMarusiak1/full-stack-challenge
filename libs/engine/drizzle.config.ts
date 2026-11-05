import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env by itself. In Docker the variable comes from
// docker-compose, so a missing file is fine.
try {
  process.loadEnvFile("../../.env");
} catch {}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (see .env.example)");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL },
});
