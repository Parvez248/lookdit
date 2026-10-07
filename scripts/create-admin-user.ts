// Create a LOOKDIT admin account. There is no public sign-up; this is the only
// way an account is made.
//
//   pnpm admin:create-user you@example.com "Your Name"
//
// Reads DATABASE_URL from .env.local. Run it against the Neon TEST branch first.
// The password is typed at a hidden prompt, so it never lands in shell history,
// and only its scrypt hash is stored. Nothing secret is printed.

import { neon } from "@neondatabase/serverless";

import { hashPassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../src/lib/auth/password.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

/** Read a line from the terminal without echoing it. */
function promptHidden(question: string): Promise<string> {
  const { stdin, stdout } = process;
  if (!stdin.isTTY) fail("Run this in an interactive terminal, so the password can be typed hidden.");

  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error?: Error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") return finish();
        if (char === "\u0003") return finish(new Error("Cancelled."));
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main() {
  const [rawEmail, ...nameParts] = process.argv.slice(2);
  const email = rawEmail?.trim().toLowerCase() ?? "";
  const name = nameParts.join(" ").trim();
  if (!EMAIL_PATTERN.test(email) || email.length > 254 || name === "" || name.length > 120) {
    fail('Usage: pnpm admin:create-user <email> "<full name>"');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) fail("DATABASE_URL is not set. Add it to .env.local.");

  const password = await promptHidden(`Password for ${email} (at least ${MIN_PASSWORD_LENGTH} characters): `);
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    fail(`The password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters.`);
  }
  if ((await promptHidden("Repeat the password: ")) !== password) fail("The passwords don't match.");

  const passwordHash = await hashPassword(password);
  const sql = neon(databaseUrl);
  const rows = await sql`
    insert into users (email, name, password_hash)
    values (${email}, ${name}, ${passwordHash})
    on conflict (email) do nothing
    returning id
  `;

  if (rows.length === 0) fail(`An account for ${email} already exists. Nothing was changed.`);
  console.log(`Created the admin account for ${email}.`);
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : "Something went wrong.");
});
