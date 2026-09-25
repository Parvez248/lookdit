import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load local development env explicitly (never the bare `.env`).
// Existing process.env values must continue to win, so no `override`.
config({
  path: ".env.local",
  quiet: true,
});

// Migrations use the direct (unpooled) connection. Absence is allowed:
// `drizzle-kit generate` works offline from the schema; only DB-touching
// commands (e.g. `migrate`) need credentials. Never fall back to DATABASE_URL.
const migrationUrl = process.env.DATABASE_URL_UNPOOLED;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  ...(migrationUrl
    ? {
        dbCredentials: {
          url: migrationUrl,
        },
      }
    : {}),
});
