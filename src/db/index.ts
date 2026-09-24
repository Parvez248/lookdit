import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Runtime connection over Neon's stateless HTTP driver, using the pooled URL.
// This is the serverless-friendly default; WebSocket/Pool support is added
// only when a real interactive-transaction / session requirement appears.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Concise, secret-free configuration error — never log or expose the value.
  throw new Error("DATABASE_URL is not set. Configure it before using the database.");
}

const sql = neon(databaseUrl);

export const db = drizzle(sql);
