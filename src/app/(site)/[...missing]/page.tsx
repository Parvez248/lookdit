import { notFound } from "next/navigation";

// Any URL no other route matches lands here, so it gets the site's own 404
// (not-found.tsx, inside the site layout) instead of the bare framework page.
export default function Missing() {
  notFound();
}
