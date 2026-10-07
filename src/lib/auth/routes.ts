/** Admin URLs, in one place for redirects and links. */
export const adminRoutes = {
  home: "/admin",
  signIn: "/admin/sign-in",
  inquiries: "/admin/inquiries",
} as const;

/** The admin's primary sections, in nav order. */
export const adminNav = [
  { href: adminRoutes.home, label: "Dashboard" },
  { href: adminRoutes.inquiries, label: "Inquiries" },
] as const;
