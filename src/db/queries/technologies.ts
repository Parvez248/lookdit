import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { technologies } from "@/db/schema";

/** An active technology in the controlled catalog. */
export type ActiveTechnology = {
  id: number;
  slug: string;
  name: string;
  category: string;
  iconKey: string | null;
  url: string | null;
  displayOrder: number;
};

/**
 * Active technologies for public display, ordered by display_order ASC with a
 * deterministic id tiebreak. Uses the (is_active, display_order) index prefix.
 */
export async function listActiveTechnologies(): Promise<ActiveTechnology[]> {
  return db
    .select({
      id: technologies.id,
      slug: technologies.slug,
      name: technologies.name,
      category: technologies.category,
      iconKey: technologies.iconKey,
      url: technologies.url,
      displayOrder: technologies.displayOrder,
    })
    .from(technologies)
    .where(eq(technologies.isActive, true))
    .orderBy(asc(technologies.displayOrder), asc(technologies.id));
}
