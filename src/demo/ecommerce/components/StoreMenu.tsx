"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { StoreNavItem } from "../navigation";
import styles from "./StoreMenu.module.css";

type StoreMenuProps = {
  items: readonly StoreNavItem[];
  brandName: string;
  homeHref: string;
};

/** Must match the breakpoint where StoreHeader shows the inline nav. */
const DESKTOP_QUERY = "(min-width: 64rem)";

/**
 * The store's small-screen navigation, in a native modal <dialog>. `showModal()` makes the
 * page behind it inert, moves focus in, closes on Esc and returns focus to the Menu button,
 * so the only state kept here is `open` for aria-expanded.
 */
export function StoreMenu({ items, brandName, homeHref }: StoreMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Covers Esc, link clicks and the Close button.
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);

    // A modal hidden by CSS would leave the page inert, so close it at the desktop width.
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
        aria-controls="store-menu"
        onClick={openMenu}
      >
        Menu
      </button>

      <dialog ref={dialogRef} id="store-menu" className={styles.dialog} aria-label="Menu">
        <div className={`container ${styles.bar}`}>
          <Link href={homeHref} className={styles.wordmark} onClick={close}>
            {brandName}
          </Link>
          <button type="button" className={styles.trigger} onClick={close}>
            Close
          </button>
        </div>

        <nav aria-label="Main" className="container">
          <ul className={styles.links}>
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link} onClick={close}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
