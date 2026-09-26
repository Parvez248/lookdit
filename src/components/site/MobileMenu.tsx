"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/ButtonLink";
import type { NavItem } from "@/content/site";

import styles from "./MobileMenu.module.css";
import { Wordmark } from "./Wordmark";

type MobileMenuProps = {
  items: readonly NavItem[];
  cta: NavItem;
};

/** Must match the breakpoint where SiteHeader shows the inline nav. */
const DESKTOP_QUERY = "(min-width: 64rem)";

/**
 * Below 1024px the nav lives in a native modal <dialog>. `showModal()` gives us
 * the hard parts for free: the rest of the page is inert, focus moves into the
 * dialog, Esc closes it, and focus returns to the Menu button on close.
 */
export function MobileMenu({ items, cta }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Covers Esc, link clicks and the Close button alike.
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);

    // An open modal hidden by CSS would leave the page inert, so close it
    // when the viewport grows into the desktop layout.
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) dialog.close();
    };
    desktop.addEventListener("change", onChange);

    return () => {
      dialog.removeEventListener("close", onClose);
      desktop.removeEventListener("change", onChange);
    };
  }, []);

  const openMenu = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={openMenu}
      >
        Menu
      </button>

      <dialog ref={dialogRef} id="mobile-menu" className={styles.dialog} aria-label="Menu">
        <div className={`container ${styles.bar}`}>
          <Link href="/" className={styles.home} aria-label="Lookdit, home" onClick={close}>
            <Wordmark />
          </Link>
          <button type="button" className={styles.trigger} onClick={close}>
            Close
          </button>
        </div>

        <nav aria-label="Primary" className={`container ${styles.body}`}>
          <ul className={styles.links}>
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link} onClick={close}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href={cta.href} className={styles.cta} onClick={close}>
            {cta.label}
          </ButtonLink>
        </nav>
      </dialog>
    </>
  );
}
