import { and, eq } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { SESSION_COOKIE_NAME } from "../../lib/auth/session-token";
import { PORTAL_SESSION_COOKIE_NAME } from "../../lib/portal/session-cookie";
import { PORTAL_STATUS_LABELS, PORTAL_VISIBLE_STATUSES } from "../../lib/portal/status";
import { projects } from "../schema/projects";
import { portalProjectScope } from "./portal-scope";

const dialect = new PgDialect();
const CLIENT_A = "0199c000-0000-7000-8000-00000000000a";
const PROJECT = "0199d000-0000-7000-8000-000000000001";

describe("portalProjectScope", () => {
  it("filters on the session's client id as a bound parameter", () => {
    const { sql, params } = dialect.sqlToQuery(portalProjectScope(CLIENT_A));
    expect(sql).toContain('"projects"."client_id" = $1');
    expect(params[0]).toBe(CLIENT_A);
  });

  it("keeps the client filter when combined with a project id from the URL", () => {
    const { sql, params } = dialect.sqlToQuery(and(eq(projects.id, PROJECT), portalProjectScope(CLIENT_A))!);
    expect(sql).toMatch(/"projects"\."id" = \$1 and \("projects"\."client_id" = \$2/);
    expect(params.slice(0, 2)).toEqual([PROJECT, CLIENT_A]);
  });

  it("never shows cancelled projects", () => {
    const { sql, params } = dialect.sqlToQuery(portalProjectScope(CLIENT_A));
    expect(sql).toContain('"projects"."work_status" in');
    expect(params).not.toContain("cancelled");
    expect([...params.slice(1)].sort()).toEqual([...PORTAL_VISIBLE_STATUSES].sort());
  });
});

describe("portal session cookie", () => {
  it("is separate from the staff cookie and host-locked", () => {
    expect(PORTAL_SESSION_COOKIE_NAME).not.toBe(SESSION_COOKIE_NAME);
    expect(PORTAL_SESSION_COOKIE_NAME.startsWith("__Host-")).toBe(true);
  });
});

describe("portal status labels", () => {
  it("has a client-facing label for every visible status", () => {
    for (const status of PORTAL_VISIBLE_STATUSES) expect(PORTAL_STATUS_LABELS[status]).toBeTruthy();
    expect(PORTAL_STATUS_LABELS.active).toBe("In progress");
  });
});
