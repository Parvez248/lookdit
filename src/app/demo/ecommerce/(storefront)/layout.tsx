import { StoreFooter } from "@/demo/ecommerce/components/StoreFooter";
import { StoreHeader } from "@/demo/ecommerce/components/StoreHeader";

/** The shopper-facing shell. 3B.2's cart and checkout pages join this group. */
export default function StorefrontLayout({ children }: LayoutProps<"/demo/ecommerce">) {
  return (
    <>
      <StoreHeader />
      <main id="main">{children}</main>
      <StoreFooter />
    </>
  );
}
