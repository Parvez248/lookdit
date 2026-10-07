import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signIn } from "@/app/actions/auth";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignInShell } from "@/components/auth/SignInShell";
import { adminRoutes } from "@/lib/auth/routes";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage() {
  if ((await getCurrentUser()) !== null) redirect(adminRoutes.home);

  return (
    <SignInShell label="Admin" lede="For the LOOKDIT team. Accounts are set up by an administrator.">
      <SignInForm action={signIn} />
    </SignInShell>
  );
}
