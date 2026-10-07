import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Runtime connection over Neon's stateless HTTP driver, using the pooled URL.
// This is the serverless-friendly default; WebSocket/Pool support is added
// only when a real interactive-transaction / session requirement appears.
//
// Created on first use, not at import: `next build` imports every route module,
// so an import-time check would make DATABASE_URL a build requirement for the
// whole site, including pages that never query.

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // Concise, secret-free configuration error — never log or expose the value.
    throw new Error("DATABASE_URL is not set. Configure it before using the database.");
  }
  return drizzle(neon(databaseUrl));
}

let instance: ReturnType<typeof createDb> | undefined;

/** The shared database client. Throws if DATABASE_URL is missing. */
export function getDb() {
  instance ??= createDb();
  return instance;
}
