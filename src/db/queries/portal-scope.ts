import { and, eq, inArray, type SQL } from "drizzle-orm";

import { PORTAL_VISIBLE_STATUSES } from "../../lib/portal/status";
import { projects } from "../schema/projects";

// Relative imports only: the unit test imports this file without the app's
// path aliases.

/**
 * THE portal authorization rule, in SQL: a project is visible only to the
 * client it is linked to, and never when cancelled. Every portal project read
 * filters with this, so changing an id in the URL can't reach another client's
 * project. `clientId` must come from the verified session, never from input.
 */
export function portalProjectScope(clientId: string): SQL {
  const scope = and(eq(projects.clientId, clientId), inArray(projects.workStatus, [...PORTAL_VISIBLE_STATUSES]));
  if (scope === undefined) throw new Error("Portal scope is empty.");
  return scope;
}
