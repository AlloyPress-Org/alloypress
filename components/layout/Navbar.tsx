"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Listicles", href: "/blogs/listicles" },
  { label: "Informatives", href: "/blogs/informatives" },
  { label: "Reviews", href: "/reviews" },
  { label: "News", href: "/news" },
  { label: "Alternatives", href: "/alternatives" },
  { label: "Comparisons", href: "/comparisons" },
];

const brandItems = [
  { label: "Get Reviewed", href: "/get-reviewed" },
  { label: "Get Featured", href: "/get-featured" },
  { label: "Testing Partner", href: "/testing-partner" },
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

function ChevronIcon() {
  return (
    <svg
      className="nav-dropdown-chevron"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 4.5l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.8"
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
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const brandsRef = useRef<HTMLDivElement>(null);
  const brandsTriggerRef = useRef<HTMLButtonElement>(null);

  const brandsActive = brandItems.some(
    (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "dark" : "light");
    setMounted(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.documentElement.classList.remove("theme-preload")
      )
    );
  }, []);

  /*
   * Close every open menu after navigating
   * to another page.
   */
  useEffect(() => {
    setBrandsOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  /*
   * "For Brands" dropdown: close on a click or tap anywhere
   * outside it, and on Escape (focus returns to the trigger).
   * Listeners exist only while the dropdown is open.
   */
  useEffect(() => {
    if (!brandsOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        brandsRef.current &&
        !brandsRef.current.contains(target)
      ) {
        setBrandsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBrandsOpen(false);
        brandsTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [brandsOpen]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    /*
     * Update DOM immediately.
     */
    document.documentElement.dataset.theme = nextTheme;

    /*
     * Save the exact same key used everywhere.
     */
    window.localStorage.setItem(THEME_KEY, nextTheme);

    /*
     * Update React state.
     */
    setTheme(nextTheme);
  }, [theme]);

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const closeBrands = useCallback(() => {
    setBrandsOpen(false);
  }, []);

  const themeLabel = mounted
    ? `Switch to ${theme === "dark" ? "light" : "dark"} mode`
    : "Toggle theme";

  return (
    <header className="site-header">
      <style dangerouslySetInnerHTML={{ __html: dropdownStyles }} />

      <div className="site-header-inner">
        {/* Logo */}
        <Link href="/" className="brand-logo">
          <Image
            src="/ap-icons.png"
            alt="AlloyPress"
            width={34}
            height={34}
            priority
          />

          <span className="brand-name">AlloyPress</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}

          {/* For Brands dropdown */}
          <div
            className={`nav-dropdown ${brandsOpen ? "is-open" : ""}`}
            ref={brandsRef}
          >
            <button
              type="button"
              ref={brandsTriggerRef}
              className={`nav-link nav-dropdown-trigger ${brandsActive ? "is-active" : ""
                }`}
              aria-expanded={brandsOpen}
              aria-controls="for-brands-menu"
              onClick={() => setBrandsOpen((value) => !value)}
            >
              For Brands
              <ChevronIcon />
            </button>

            <div
              id="for-brands-menu"
              className="nav-dropdown-menu"
              aria-label="For Brands"
            >
              {brandItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-dropdown-item ${pathname === item.href ? "is-current" : ""
                    }`}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={closeBrands}
                >
                  {item.label}
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Desktop Actions */}
        <div className="header-actions">
          {/* Search */}
          <Link
            href="/search"
            prefetch={false}
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
            aria-label={themeLabel}
            onClick={toggleTheme}
          >
            <span className="theme-icon-sun"><SunIcon /></span>
            <span className="theme-icon-moon"><MoonIcon /></span>
          </button>

          {/* CTA */}
          <Link href="/contact-us" className="header-cta">
            Contact Us
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="mobile-actions">
          {/* Search */}
          <Link
            href="/search"
            prefetch={false}
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
            aria-label={themeLabel}
            onClick={toggleTheme}
          >
            <span className="theme-icon-sun"><SunIcon /></span>
            <span className="theme-icon-moon"><MoonIcon /></span>
          </button>

          <button
            type="button"
            className="mobile-menu-button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${mobileOpen ? "is-open" : ""}`}>
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

          <span className="mobile-nav-label">For Brands</span>

          {brandItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-nav-link mobile-nav-sublink"
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-nav-divider" />

          <Link
            href="/contact-us"
            className="mobile-nav-cta"
            onClick={closeMobileMenu}
          >
            Contact Us
            <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

const dropdownStyles = `
.nav-dropdown {
  position: relative;
}

.nav-link.nav-dropdown-trigger {
  gap: 5px;
  border: 0;
  background: transparent;
  color: var(--brand);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.nav-link.nav-dropdown-trigger:hover,
.nav-link.nav-dropdown-trigger.is-active,
.nav-dropdown.is-open .nav-link.nav-dropdown-trigger {
  background: transparent;
  color: var(--brand-hover, var(--brand));
}

.nav-dropdown-trigger:focus-visible,
.nav-dropdown-item:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.nav-dropdown-chevron {
  transition: transform 0.2s ease;
}

.nav-dropdown.is-open .nav-dropdown-chevron {
  transform: rotate(180deg);
}

.nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  z-index: 60;
  display: grid;
  gap: 2px;
  min-width: 220px;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--background);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.14);
  opacity: 0;
  visibility: hidden;
  transform: translate(-50%, -6px);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease,
    visibility 0.16s;
}

.nav-dropdown.is-open .nav-dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}

.nav-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 8px;
  color: var(--foreground);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.nav-dropdown-item span {
  color: var(--text-secondary);
  font-size: var(--text-md);
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.nav-dropdown-item:hover,
.nav-dropdown-item.is-current {
  color: var(--brand);
  background: color-mix(in srgb, var(--brand) 10%, transparent);
}

.nav-dropdown-item:hover span {
  color: var(--brand);
  transform: translate(2px, -2px);
}

.mobile-nav-label {
  display: block;
  padding: 14px 0 6px;
  color: var(--brand);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mobile-nav-sublink[aria-current="page"] {
  color: var(--brand);
}

@media (max-width: 850px) {
  .mobile-nav.is-open {
    max-height: 90vh;
    overflow-y: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-dropdown-menu,
  .nav-dropdown-chevron {
    transition: none;
  }
}
`;