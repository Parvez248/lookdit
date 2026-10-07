/** Client portal URLs, in one place for redirects and links. */
export const portalRoutes = {
  home: "/portal",
  signIn: "/portal/sign-in",
} as const;

export function portalProjectHref(id: string): string {
  return `/portal/projects/${id}`;
}
