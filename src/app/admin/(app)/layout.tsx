import { AdminHeader } from "@/components/admin/AdminHeader";
import { requireUser } from "@/lib/auth/session";

/**
 * Shell for signed-in admin pages. The check here keeps the header from ever
 * rendering for a visitor, but it is not the guard: layouts don't re-run on
 * client navigation, so every page and Server Action calls requireUser() too.
 */
export default async function AdminAppLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();

  return (
    <>
      <AdminHeader userName={user.name} />
      <main id="main">{children}</main>
    </>
  );
}
