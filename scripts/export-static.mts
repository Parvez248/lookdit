// Export the PUBLIC website as plain static HTML with every stylesheet inlined
// into each page's <style> block. The result runs on any static host (cPanel,
// Netlify, GitHub Pages, S3, …): no Node.js server, no database, no build step.
//
//   pnpm export:static [--site-url https://lookdit.com] [--form-action https://formspree.io/f/xxxx]
//
// Output: ./static-site (replaced on every run). Upload the folder's CONTENTS.
//
// How it works, and why it never touches the real app:
//   1. Copies the git-tracked files to a temporary folder (no .env files),
//      installs from the local pnpm store and builds Next.js there with every secret removed from the environment, so
//      nothing can reach the database.
//   2. Patches only that copy: /work shows the concept projects when the
//      database is absent (the real site keeps failing loudly instead).
//   3. Starts the built copy, crawls every public page from "/" (admin and
//      portal are never followed), and rewrites each page:
//        - <link rel="stylesheet"> becomes an inline <style> (fonts kept as files)
//        - all Next.js runtime <script>s are removed (JSON-LD is kept)
//        - the mobile menu gets a ~10-line vanilla script instead of React
//        - the contact form posts to --form-action (a form service), since a
//          static host cannot run the Server Action that saves inquiries
//        - links and assets become relative, so the site works from any folder
//
// What a static copy cannot have: saved inquiries, real client projects from the
// database, /admin and /portal. See static-site/README.md (written by this script).

import { spawn, type ChildProcess } from "node:child_process";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "static-site");
const PORT = 3199;
const ORIGIN = `http://localhost:${PORT}`;
/** Next's fallback origin when no production URL is set (src/lib/site-url.ts). */
const FALLBACK_ORIGIN = "http://localhost:3000";
const FORM_PLACEHOLDER = "https://formspree.io/f/YOUR_FORM_ID";
/** Must match DESKTOP_QUERY in src/components/site/MobileMenu.tsx. */
const DESKTOP_QUERY = "(min-width: 64rem)";
/** Public routes only. Anything under these is never crawled. */
const PRIVATE_PREFIXES = ["/admin", "/portal"];
/** Build-copy-only route that renders the branded 404 page. */
const NOT_FOUND_ROUTE = "/static-export-not-found";

type Options = { siteUrl: string | null; formAction: string };

function parseArgs(argv: readonly string[]): Options {
  const value = (flag: string): string | null => {
    const index = argv.indexOf(flag);
    return index === -1 ? null : (argv[index + 1] ?? null);
  };
  const siteUrl = value("--site-url");
  const formAction = value("--form-action") ?? FORM_PLACEHOLDER;
  for (const [flag, url] of [["--site-url", siteUrl], ["--form-action", formAction]] as const) {
    if (url !== null && !/^https:\/\/[^\s"<>]+$/.test(url)) fail(`${flag} must be an https:// URL.`);
  }
  return { siteUrl: siteUrl?.replace(/\/+$/, "") ?? null, formAction };
}

function fail(message: string): never {
  console.error(`export-static: ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1–2. Isolated build
// ---------------------------------------------------------------------------

function prepareCopy(): string {
  const dir = mkdtempSync(join(tmpdir(), "lookdit-static-"));
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(Boolean);
  for (const file of tracked) {
    if (!existsSync(join(ROOT, file))) continue; // deleted but not yet committed
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    cpSync(join(ROOT, file), join(dir, file));
  }

  // /work reads published projects at request time. Without a database the
  // static copy lists the concept projects only.
  const workPage = join(dir, "src/app/(site)/work/page.tsx");
  const before = readFileSync(workPage, "utf8");
  const after = before.replace(
    "const projects = await listPublishedProjects();",
    "const projects = await listPublishedProjects().catch(() => []);",
  );
  if (after === before) fail("could not patch /work; src/app/(site)/work/page.tsx changed. Update this script.");
  writeFileSync(workPage, after);

  // A route that renders the branded 404 as ordinary HTML. (A real 404 from
  // `notFound()` is streamed and only appears once React runs in the browser.)
  const notFoundRoute = join(dir, "src/app/(site)", NOT_FOUND_ROUTE.slice(1), "page.tsx");
  mkdirSync(dirname(notFoundRoute), { recursive: true });
  writeFileSync(
    notFoundRoute,
    'import NotFound from "../not-found";\nexport { metadata } from "../not-found";\nexport default NotFound;\n',
  );
  return dir;
}

/** The build and server get no secrets at all, so the copy can never reach a database or store. */
function safeEnv(siteUrl: string | null): NodeJS.ProcessEnv {
  const keep = ["PATH", "HOME", "LANG", "TMPDIR", "NODE_OPTIONS", "HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY", "NODE_EXTRA_CA_CERTS"];
  const env: NodeJS.ProcessEnv = { NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" };
  for (const key of keep) if (process.env[key] !== undefined) env[key] = process.env[key];
  if (siteUrl) env.VERCEL_PROJECT_PRODUCTION_URL = new URL(siteUrl).host;
  return env;
}

/** Installs from the local pnpm store (Turbopack refuses a symlinked node_modules), then builds. */
function build(cwd: string, env: NodeJS.ProcessEnv): void {
  execFileSync("pnpm", ["install", "--frozen-lockfile", "--prefer-offline", "--ignore-scripts"], { cwd, env, stdio: "inherit" });
  execFileSync(join(cwd, "node_modules/.bin/next"), ["build"], { cwd, env, stdio: "inherit" });
}

async function startServer(cwd: string, env: NodeJS.ProcessEnv): Promise<ChildProcess> {
  const server = spawn(join(cwd, "node_modules/.bin/next"), ["start", "-p", String(PORT)], { cwd, env, stdio: "ignore" });
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await fetch(ORIGIN);
      return server;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  server.kill();
  return fail("the built site did not start.");
}

// ---------------------------------------------------------------------------
// 3. Crawl and rewrite
// ---------------------------------------------------------------------------

async function get(path: string): Promise<Response> {
  const response = await fetch(ORIGIN + path, { redirect: "manual" });
  if (!response.ok) fail(`GET ${path} returned ${response.status}.`);
  return response;
}

/** "/about" -> "about/index.html"; "/" -> "index.html". */
const outputFile = (route: string): string => (route === "/" ? "index.html" : `${route.slice(1)}/index.html`);

/**
 * Relative href from the page at `fromRoute` to the page or file at `target` (an absolute path).
 * `fromRoute` null means "served at any depth" (the 404 page): links stay root-absolute.
 */
function relative(fromRoute: string | null, target: string, isPage: boolean): string {
  if (fromRoute === null) {
    const [path, hash = ""] = target.split("#");
    return (isPage && path !== "/" ? `${path}/` : path) + (hash ? `#${hash}` : "");
  }
  const fromDir = fromRoute === "/" ? "/" : `${fromRoute}/`;
  const [path, hash = ""] = target.split("#");
  const to = isPage && path !== "/" ? `${path}/` : path;
  let rel = posix.relative(fromDir, to || "/");
  if (isPage) rel = rel === "" ? "./" : `${rel}/`;
  return rel + (hash ? `#${hash}` : "");
}

const isPrivate = (path: string) => PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const decode = (text: string) => text.replaceAll("&amp;", "&");

class Exporter {
  private readonly css = new Map<string, string>();
  private readonly assets = new Map<string, string>(); // server path -> output path (from site root)

  private readonly options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  /** Downloads a file once and returns its path in the output, relative to the site root. */
  async asset(serverPath: string, outPath: string): Promise<string> {
    const known = this.assets.get(serverPath);
    if (known) return known;
    const bytes = Buffer.from(await (await get(serverPath)).arrayBuffer());
    mkdirSync(dirname(join(OUT, outPath)), { recursive: true });
    writeFileSync(join(OUT, outPath), bytes);
    this.assets.set(serverPath, outPath);
    return outPath;
  }

  /** Stylesheet text with its font URLs pointing at assets/fonts, relative to the page. */
  async stylesheet(href: string, route: string | null): Promise<string> {
    let text = this.css.get(href);
    if (text === undefined) {
      text = await (await get(href)).text();
      for (const [, file] of text.matchAll(/url\(\.\.\/media\/([^)"']+)\)/g)) {
        await this.asset(`/_next/static/media/${file}`, `assets/fonts/${file}`);
      }
      this.css.set(href, text);
    }
    const toFonts = relative(route, "/assets/fonts", false);
    return text.replace(/url\(\.\.\/media\//g, `url(${toFonts}/`).replaceAll("</style", "<\\/style");
  }

  async page(route: string | null, html: string): Promise<{ html: string; links: string[] }> {
    const links = new Set<string>();
    let out = html;

    // Stylesheets -> one inline <style> each, in the same order.
    for (const match of [...out.matchAll(/<link rel="stylesheet" href="([^"]+)"[^>]*\/>/g)]) {
      out = out.replace(match[0], `<style>${await this.stylesheet(match[1], route)}</style>`);
    }

    // Next.js runtime: script tags, script preloads, the RSC payload. JSON-LD stays.
    out = out
      .replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<link rel="preload" as="script"[^>]*\/>/g, "")
      .replace(/<link rel="preload" as="image" imageSrcSet="\/_next\/image[^>]*\/>/g, "")
      .replace(/<meta name="next-size-adjust"[^>]*\/>/g, "")
      .replace(/<div hidden="">(?:<!--\/?\$-->)*<\/div>/g, "")
      .replace(/<!--\/?\$\??-->|<!--&-->/g, "");

    // Font preloads -> the copied font file.
    for (const match of [...out.matchAll(/<link rel="preload" href="\/_next\/static\/media\/([^"]+)"/g)]) {
      const file = await this.asset(`/_next/static/media/${match[1]}`, `assets/fonts/${match[1]}`);
      out = out.replace(match[0], `<link rel="preload" href="${relative(route, `/${file}`, false)}"`);
    }

    // Optimised images -> the original file, no srcset (there is no image server).
    for (const match of [...out.matchAll(/<img([^>]*?) srcSet="\/_next\/image[^"]*"([^>]*?) src="\/_next\/image\?url=([^"&]+)[^"]*"/g)]) {
      const source = decodeURIComponent(decode(match[3]));
      const file = await this.asset(source, `assets${source}`);
      out = out.replace(match[0], `<img${match[1]}${match[2]} src="${relative(route, `/${file}`, false)}"`);
    }

    // App icons.
    for (const [pattern, name] of [[/href="\/icon\.png\?[^"]*"/, "favicon.png"], [/href="\/apple-icon\.png\?[^"]*"/, "apple-touch-icon.png"]] as const) {
      const match = out.match(pattern);
      if (!match) continue;
      const file = await this.asset(decode(match[0].slice(6, -1)), name);
      out = out.replace(match[0], `href="${relative(route, `/${file}`, false)}"`);
    }

    // Internal page links -> relative directory links.
    out = out.replace(/href="(\/(?!\/)[^"]*)"/g, (whole, target: string) => {
      const path = decode(target).split("#")[0] || "/";
      if (path.startsWith("/assets/") || /\.[a-z0-9]+$/i.test(path)) return whole;
      if (isPrivate(path)) return whole;
      links.add(path.replace(/\/+$/, "") || "/");
      return `href="${relative(route, decode(target), true)}"`;
    });

    // Contact form: a plain POST to the form service. No Server Action exists here.
    out = out
      .replace(/<form([^>]*?) noValidate=""([^>]*?) action=""[^>]*>/g, `<form$1$2 action="${this.options.formAction}" method="POST">`)
      .replace(/<input type="hidden" name="\$ACTION[^"]*"[^>]*\/>/g, "")
      .replace('name="company_website"', 'name="_gotcha"'); // Formspree's honeypot field name

    // Mobile menu: the native <dialog> behaviour, without React.
    if (out.includes('id="mobile-menu"')) out = out.replace("</body>", `<script>${MENU_SCRIPT}</script></body>`);

    out = this.absoluteUrls(out, route);
    return { html: out, links: [...links] };
  }

  /** Canonical / Open Graph / JSON-LD need the real domain. Without one they are dropped, never left on localhost. */
  private absoluteUrls(html: string, route: string | null): string {
    const { siteUrl } = this.options;
    if (siteUrl && route !== null) {
      // Static hosts serve /about as /about/, so the canonical URL carries the slash.
      const canonical = route === "/" ? `${siteUrl}/` : `${siteUrl}${route}/`;
      return html
        .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${canonical}"`)
        .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${canonical}"`);
    }
    return html
      .replace(new RegExp(`<link rel="canonical" href="${FALLBACK_ORIGIN}[^"]*"/>`, "g"), "")
      .replace(new RegExp(`<meta property="og:(?:url|image)[^"]*" content="${FALLBACK_ORIGIN}[^"]*"/>`, "g"), "")
      .replace(new RegExp(`<meta name="twitter:image" content="${FALLBACK_ORIGIN}[^"]*"/>`, "g"), "")
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, (block) => (block.includes(FALLBACK_ORIGIN) ? "" : block));
  }
}

const MENU_SCRIPT = `(function(){var d=document.getElementById("mobile-menu"),t=document.querySelector('[aria-controls="mobile-menu"]');if(!d||!t||!d.showModal)return;t.addEventListener("click",function(){d.showModal();t.setAttribute("aria-expanded","true")});d.addEventListener("close",function(){t.setAttribute("aria-expanded","false")});d.querySelectorAll("a,button").forEach(function(e){e.addEventListener("click",function(){d.close()})});var m=matchMedia("${DESKTOP_QUERY}");m.addEventListener("change",function(e){if(e.matches)d.close()})})();`;

// ---------------------------------------------------------------------------

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const copy = prepareCopy();
  const env = safeEnv(options.siteUrl);
  let server: ChildProcess | null = null;
  try {
    console.log("export-static: building an isolated copy (no secrets, no database)…");
    build(copy, env);
    server = await startServer(copy, env);

    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });
    const exporter = new Exporter(options);
    const queue = ["/"];
    const done = new Set<string>();
    const indexable: string[] = [];

    while (queue.length > 0) {
      const route = queue.shift()!;
      if (done.has(route) || isPrivate(route) || route === NOT_FOUND_ROUTE) continue;
      done.add(route);
      const { html, links } = await exporter.page(route, await (await get(route)).text());
      mkdirSync(dirname(join(OUT, outputFile(route))), { recursive: true });
      writeFileSync(join(OUT, outputFile(route)), html);
      if (!/<meta name="robots" content="[^"]*noindex/.test(html)) indexable.push(route);
      queue.push(...links.filter((link) => !done.has(link)));
    }

    // Branded 404 (most static hosts serve /404.html for unknown paths, at any depth).
    const notFound = await exporter.page(null, await (await get(NOT_FOUND_ROUTE)).text());
    const notFoundHtml = notFound.html
      .replace(/<link rel="canonical"[^>]*\/>|<meta property="og:url"[^>]*\/>/g, "")
      .replace("<head>", '<head><meta name="robots" content="noindex"/>');
    writeFileSync(join(OUT, "404.html"), notFoundHtml);

    writeFileSync(join(OUT, "robots.txt"), robots(options.siteUrl));
    if (options.siteUrl) writeFileSync(join(OUT, "sitemap.xml"), sitemap(options.siteUrl, indexable));
    writeFileSync(join(OUT, "README.md"), readme(options, [...done]));

    verify(done);
    console.log(`export-static: wrote ${done.size} pages + 404.html to static-site/`);
    if (options.formAction === FORM_PLACEHOLDER) {
      console.warn("export-static: WARNING the contact form posts to a placeholder. Re-run with --form-action <your form endpoint>.");
    }
    if (!options.siteUrl) console.warn("export-static: no --site-url given, so canonical URLs, sitemap.xml and JSON-LD were left out.");
  } finally {
    server?.kill();
    rmSync(copy, { recursive: true, force: true });
  }
}

/** Fails if anything in the output still depends on the Next.js server. */
function verify(routes: Set<string>): void {
  for (const route of [...routes, "/404"]) {
    const file = route === "/404" ? "404.html" : outputFile(route);
    const html = readFileSync(join(OUT, file), "utf8");
    for (const [needle, why] of [["/_next/", "a Next.js asset"], ["<link rel=\"stylesheet\"", "an external stylesheet"], ["$ACTION", "a Server Action"], [ORIGIN, "the export server"]] as const) {
      if (html.includes(needle)) fail(`${file} still references ${why} (${needle}).`);
    }
  }
}

function robots(siteUrl: string | null): string {
  return `User-agent: *\nAllow: /\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ""}`;
}

function sitemap(siteUrl: string, routes: readonly string[]): string {
  const urls = routes.map((route) => `  <url><loc>${siteUrl}${route === "/" ? "/" : `${route}/`}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function readme(options: Options, routes: readonly string[]): string {
  return `# LOOKDIT static site

Generated by \`pnpm export:static\` (scripts/export-static.mts). Do not edit these files by hand:
change the app, then export again.

Upload everything in this folder to your web host's public folder (for example \`public_html\`).
Each page is one HTML file with all of its CSS inside a \`<style>\` block. Fonts and images are
in \`assets/\`.

Pages (${routes.length}): ${[...routes].sort().join(", ")}

## Before going live

- Contact form: ${options.formAction === FORM_PLACEHOLDER
    ? `**not connected.** It posts to the placeholder \`${FORM_PLACEHOLDER}\`. Create a form on a service such as Formspree and export again with \`--form-action <its URL>\`.`
    : `posts to ${options.formAction}.`}
- Site URL: ${options.siteUrl ?? "**not set.** Canonical URLs, sitemap.xml and JSON-LD were left out. Export again with `--site-url https://your-domain`."}

## Not included (needs the full Next.js app)

- Saving inquiries to the database, and the admin (\`/admin\`) and client portal (\`/portal\`).
- Real client projects on /work and the home page: only the concept projects are shown.
- Automatic updates: export and upload again after any change.
`;
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
