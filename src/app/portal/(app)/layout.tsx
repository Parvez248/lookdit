import { PortalHeader } from "@/components/portal/PortalHeader";
import { requireClient } from "@/lib/portal/session";

/**
 * Shell for signed-in portal pages. The check here keeps the header from ever
 * rendering for a visitor, but it is not the guard: layouts don't re-run on
 * client navigation, so every portal page calls requireClient() too.
 */
export default async function PortalAppLayout({ children }: LayoutProps<"/portal">) {
  const client = await requireClient();
  // The organisation line: the company, else the client record's name when it isn't the person's own.
  const organisation = client.company ?? (client.clientName !== client.name ? client.clientName : null);

  return (
    <>
      <PortalHeader name={client.name} organisation={organisation} />
      <main id="main">{children}</main>
    </>
  );
}
