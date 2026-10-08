// Create, or reset, the client portal sign-in for one client. There is no
// sign-up and no password reset by email; this is the only way an account is
// made or its password changed.
//
//   pnpm portal:create-account <client id> client@example.com "Their Name"
//
// The client id is the one in the admin's client URL (/admin/clients/<id>).
// Each client has at most one account: running this again for the same client
// replaces that account's email, name and password, and signs it out everywhere.
//
// Reads DATABASE_URL from .env.local. Run it against the Neon TEST branch first.
// The password is typed at a hidden prompt, so it never lands in shell history,
// and only its scrypt hash is stored. Nothing secret is printed.

import { neon } from "@neondatabase/serverless";

import { hashPassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../src/lib/auth/password.ts";

import { fail, promptHidden } from "./lib/prompt.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const USAGE = 'Usage: pnpm portal:create-account <client id> <email> "<full name>"';

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

async function main() {
  const [rawClientId, rawEmail, ...nameParts] = process.argv.slice(2);
  const clientId = rawClientId?.trim().toLowerCase() ?? "";
  const email = rawEmail?.trim().toLowerCase() ?? "";
  const name = nameParts.join(" ").trim();
  if (
    !UUID_PATTERN.test(clientId) ||
    !EMAIL_PATTERN.test(email) ||
    email.length > 254 ||
    name === "" ||
    name.length > 120
  ) {
    fail(USAGE);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) fail("DATABASE_URL is not set. Add it to .env.local.");
  const sql = neon(databaseUrl);

  const [client] = await sql`select name from clients where id = ${clientId}`;
  if (!client) fail("No client has that id. Copy it from the client's admin page URL.");

  const password = await promptHidden(
    `Portal password for ${email}, client "${String(client.name)}" (at least ${MIN_PASSWORD_LENGTH} characters): `,
  );
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    fail(`The password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters.`);
  }
  if ((await promptHidden("Repeat the password: ")) !== password) fail("The passwords don't match.");

  const passwordHash = await hashPassword(password);

  // One statement: create or replace the client's account, then drop its
  // sessions (the delete sees the sessions that existed before this statement).
  let rows: Record<string, unknown>[];
  try {
    rows = await sql`
      with account as (
        insert into client_accounts (client_id, email, name, password_hash)
        values (${clientId}, ${email}, ${name}, ${passwordHash})
        on conflict (client_id) do update
          set email = excluded.email,
              name = excluded.name,
              password_hash = excluded.password_hash,
              updated_at = now()
        returning id, (xmax <> 0) as replaced
      ),
      revoked as (
        delete from client_sessions where account_id in (select id from account) returning 1
      )
      select replaced, (select count(*) from revoked)::int as revoked from account
    `;
  } catch (error) {
    if (isUniqueViolation(error)) fail(`${email} already signs in for another client. Nothing was changed.`);
    throw error;
  }

  const [result] = rows;
  if (result?.replaced === true) {
    console.log(`Reset the portal account for this client to ${email}; ${String(result.revoked)} session(s) signed out.`);
  } else {
    console.log(`Created the portal account for ${email}.`);
  }
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : "Something went wrong.");
});
