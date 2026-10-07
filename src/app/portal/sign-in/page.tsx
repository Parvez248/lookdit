import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { portalSignIn } from "@/app/actions/portal-auth";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignInShell } from "@/components/auth/SignInShell";
import { portalRoutes } from "@/lib/portal/routes";
import { getCurrentClient } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function PortalSignInPage() {
  if ((await getCurrentClient()) !== null) redirect(portalRoutes.home);

  return (
    <SignInShell
      label="Client portal"
      lede="Follow the progress of your projects with LOOKDIT."
      note="Your sign-in details come from your LOOKDIT contact. Ask them if you can’t sign in."
    >
      <SignInForm action={portalSignIn} />
    </SignInShell>
  );
}
