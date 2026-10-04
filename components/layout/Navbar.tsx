"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";


const navItems = [
  { label: "Home", href: "/" },
  { label: "Blogs", href: "/blogs" },
  { label: "Reviews", href: "/reviews" },
  { label: "News", href: "/news" },
  { label: "Alternatives", href: "/alternatives" },
  { label: "Comparisons", href: "/comparisons" },
];

const THEME_KEY = "alloypress-theme";

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`menu-icon ${open ? "is-open" : ""}`}>
      <span />
      <span />
      <span />
    </span>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] =
    useState<"light" | "dark">("light");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /*
     * Read the same theme key used by the
     * blocking script in layout.tsx.
     */
    const savedTheme =
      window.localStorage.getItem(THEME_KEY);

    let initialTheme: "light" | "dark";

    if (
      savedTheme === "light" ||
      savedTheme === "dark"
    ) {
      initialTheme = savedTheme;
    } else {
      initialTheme = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "dark"
        : "light";
    }

    /*
     * Make sure the actual HTML element and
     * React state are always synchronized.
     */
    document.documentElement.dataset.theme =
      initialTheme;

    setTheme(initialTheme);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme =
      theme === "dark" ? "light" : "dark";

    /*
     * Update DOM immediately.
     */
    document.documentElement.dataset.theme =
      nextTheme;

    /*
     * Save the exact same key used everywhere.
     */
    window.localStorage.setItem(
      THEME_KEY,
      nextTheme
    );

    /*
     * Update React state.
     */
    setTheme(nextTheme);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">

        {/* Logo */}
        <Link href="/" className="brand-logo">
          <Image
            src="/ap-icon.png"
            alt="AlloyPress"
            width={34}
            height={34}
            priority
          />

          <span className="brand-name">AlloyPress</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="desktop-nav"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="header-actions">

          {/* Search */}
          <Link
            href="/search"
            className="header-icon-button"
            aria-label="Search AlloyPress"
            title="Search AlloyPress"
          >
            <SearchIcon />
          </Link>

          {/* Theme */}
          <button
            type="button"
            className="header-icon-button"
            aria-label={
              mounted
                ? `Switch to ${theme === "dark"
                  ? "light"
                  : "dark"
                } mode`
                : "Toggle theme"
            }
            onClick={toggleTheme}
          >
            {mounted && theme === "dark" ? (
              <SunIcon />
            ) : (
              <MoonIcon />
            )}
          </button>

          {/* CTA */}
          <Link
            href="/get-reviewed"
            className="header-cta"
          >
            Get Reviewed
            <span aria-hidden="true">
              ↗
            </span>
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="mobile-actions">

          {/* Search */}
          <Link
            href="/search"
            className="header-icon-button"
            aria-label="Search AlloyPress"
            title="Search AlloyPress"
            onClick={closeMobileMenu}
          >
            <SearchIcon />
          </Link>

          <button
            type="button"
            className="header-icon-button"
            aria-label={
              mounted
                ? `Switch to ${theme === "dark"
                  ? "light"
                  : "dark"
                } mode`
                : "Toggle theme"
            }
            onClick={toggleTheme}
          >
            {mounted && theme === "dark" ? (
              <SunIcon />
            ) : (
              <MoonIcon />
            )}
          </button>

          <button
            type="button"
            className="mobile-menu-button"
            aria-label={
              mobileOpen
                ? "Close menu"
                : "Open menu"
            }
            aria-expanded={mobileOpen}
            onClick={() =>
              setMobileOpen(
                (value) => !value
              )
            }
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`mobile-nav ${mobileOpen ? "is-open" : ""
          }`}
      >
        <nav aria-label="Mobile navigation">

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-nav-link"
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-nav-divider" />

          <Link
            href="/get-reviewed"
            className="mobile-nav-cta"
            onClick={closeMobileMenu}
          >
            Get Reviewed
            <span aria-hidden="true">
              ↗
            </span>
          </Link>

        </nav>
      </div>
    </header>
  );
}