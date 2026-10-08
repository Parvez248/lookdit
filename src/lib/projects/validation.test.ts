import { describe, expect, it } from "vitest";

import { slugCandidate, slugify, SLUG_MAX_LENGTH } from "./slug";
import { parseProjectListParams, projectListHref } from "./status";
import { formatMetricsText, parseMetricsText, parseProjectForm } from "./validation";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const CLIENT_ID = "0199c000-0000-7000-8000-000000000001";
const valid = {
  title: "  Northwind booking site ",
  clientId: CLIENT_ID,
  workStatus: "active",
  category: "website",
  year: " 2026 ",
  summary: " A faster booking flow for a design studio. ",
};

describe("project form", () => {
  it("normalizes a full form and ignores unknown fields", () => {
    // status/slug/publishedAt can't be set from the form: publishing has its own action.
    const result = parseProjectForm(
      form({ ...valid, slug: "evil", status: "published", publishedAt: "2020-01-01" }),
    );
    expect(result).toEqual({
      ok: true,
      value: {
        title: "Northwind booking site",
        clientId: CLIENT_ID,
        workStatus: "active",
        category: "website",
        year: 2026,
        summary: "A faster booking flow for a design studio.",
        client: null,
        liveUrl: null,
        featured: false,
        metrics: null,
        seoTitle: null,
        seoDescription: null,
      },
    });
  });

  it("reads the public case-study fields", () => {
    const result = parseProjectForm(
      form({
        ...valid,
        client: "  Northwind Studio ",
        liveUrl: " https://northwind.example/book ",
        featured: "on",
        metrics: "2× | Faster checkout\n\n +38% |  Organic traffic \n",
        seoTitle: " Northwind booking ",
        seoDescription: "",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      client: "Northwind Studio",
      liveUrl: "https://northwind.example/book",
      featured: true,
      metrics: [
        { value: "2×", label: "Faster checkout" },
        { value: "+38%", label: "Organic traffic" },
      ],
      seoTitle: "Northwind booking",
      seoDescription: null,
    });
  });

  it("accepts only http(s) live URLs, since they render as public links", () => {
    for (const liveUrl of ["javascript:alert(1)", "data:text/html,x", "northwind.example", "https://", "https://a b.com"]) {
      expect(parseProjectForm(form({ ...valid, liveUrl })).ok).toBe(false);
    }
    expect(parseProjectForm(form({ ...valid, liveUrl: "http://northwind.example" })).ok).toBe(true);
  });

  it("rejects malformed or too many results", () => {
    expect(parseMetricsText("no separator")).toEqual({ ok: false, error: "Line 1: write it as Value | Label." });
    expect(parseMetricsText("2× | ").ok).toBe(false);
    expect(parseMetricsText(Array.from({ length: 7 }, (_, i) => `${i} | x`).join("\n")).ok).toBe(false);
    const result = parseProjectForm(form({ ...valid, metrics: "| Faster" }));
    expect(result.ok === false && result.errors.metrics).toBe("Line 1: write it as Value | Label.");
  });

  it("round-trips results through the edit form", () => {
    const metrics = [{ value: "2×", label: "Faster checkout" }];
    expect(parseMetricsText(formatMetricsText(metrics))).toEqual({ ok: true, value: metrics });
    expect(formatMetricsText(null)).toBe("");
  });

  it("treats no client as null", () => {
    const result = parseProjectForm(form({ ...valid, clientId: "" }));
    expect(result.ok && result.value.clientId).toBeNull();
  });

  it("reports every invalid field", () => {
    const result = parseProjectForm(
      form({ title: "  ", clientId: "nope", workStatus: "done", category: "seo", year: "26", summary: "" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      ["category", "clientId", "summary", "title", "workStatus", "year"].sort(),
    );
  });

  it("checks lengths and the year range", () => {
    const cases: Record<string, string>[] = [
      { title: "x".repeat(121) },
      { summary: "x".repeat(301) },
      { year: "1999" },
      { year: "2101" },
      { title: "a\u0000b" },
    ];
    for (const override of cases) {
      expect(parseProjectForm(form({ ...valid, ...override })).ok).toBe(false);
    }
    expect(parseProjectForm(form({ ...valid, summary: "x".repeat(300), year: "2000" })).ok).toBe(true);
  });

  it("requires the fields when they are missing entirely", () => {
    const result = parseProjectForm(new FormData());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.title).toBe("Title is required.");
    expect(result.errors.clientId).toBeUndefined();
  });
});

describe("slugify", () => {
  it("makes a format-safe slug", () => {
    expect(slugify("Northwind: Booking Site (v2)")).toBe("northwind-booking-site-v2");
    expect(slugify("Café Été — Brand & Web")).toBe("cafe-ete-brand-web");
    expect(slugify("  --  ")).toBe("project");
    expect(slugify("東京")).toBe("project");
  });

  it("stays within the limit, cutting at a word boundary", () => {
    const slug = slugify(`${"word ".repeat(40)}end`);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
    expect(slugify("x".repeat(200))).toHaveLength(SLUG_MAX_LENGTH);
  });

  it("always matches the database CHECK", () => {
    for (const title of ["A", "a--b", "Ünïcödé", "2026 Rebrand!", "x".repeat(200)]) {
      expect(slugify(title)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("numbers taken slugs from 2", () => {
    expect(slugCandidate("site", 1)).toBe("site");
    expect(slugCandidate("site", 2)).toBe("site-2");
  });
});

describe("project list params", () => {
  it("accepts only known statuses and positive pages", () => {
    expect(parseProjectListParams({ status: "on_hold", page: "2" })).toEqual({ status: "on_hold", page: 2 });
    expect(parseProjectListParams({ status: "published", page: "0" })).toEqual({ status: null, page: 1 });
  });

  it("builds list links", () => {
    expect(projectListHref(null)).toBe("/admin/projects");
    expect(projectListHref("active", 3)).toBe("/admin/projects?status=active&page=3");
  });
});
