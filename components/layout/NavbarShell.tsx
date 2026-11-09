"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import cfLoader from "@/lib/imageLoader";
import { usePathname, useRouter } from "next/navigation";

type IconName =
  | "list"
  | "book"
  | "star"
  | "news"
  | "swap"
  | "scale"
  | "columns"
  | "steps"
  | "tool"
  | "sparkles"
  | "search"
  | "send"
  | "flask"
  | "users"
  | "shield"
  | "bolt"
  | "chart";

type MenuItem = {
  label: string;
  description: string;
  href: string;
  icon?: IconName;
  badge?: string;
};

type MegaMenu = {
  id: string;
  label: string;
  items: MenuItem[];
  columns: 1 | 2 | 3;
  featured?: boolean;
  intro?: {
    eyebrow: string;
    title: string;
    description: string;
    cta: { label: string; href: string };
  };
  footnote?: string;
};

type FeaturedArticle = {
  tag: string;
  title: string;
  description?: string;
  href: string;
  image?: string;
  imageAlt?: string;
};

type NavEntry =
  | { kind: "link"; label: string; href: string; badge?: string }
  | { kind: "menu"; menu: MegaMenu };

type NavbarProps = {
  featuredArticle?: FeaturedArticle | null;
};

const defaultFeatured: FeaturedArticle = {
  tag: "Best Of",
  title: "Best AI Website Builders, Tested Hands-On",
  href: "/blogs/listicles",
};

const homeLink = { label: "Home", href: "/" };
const howWeTestLink = { label: "How We Test", href: "/how-we-test" };
const ctaLink = { label: "Get Reviewed", href: "/review-your-ai-tool" };

const categoryItems: MenuItem[] = [
  {
    label: "Reviews",
    description: "Hands-on tool reviews",
    href: "/reviews",
    icon: "star",
  },
  {
    label: "Comparisons",
    description: "Head-to-head showdowns",
    href: "/comparisons",
    icon: "columns",
  },
  {
    label: "Alternatives",
    description: "Better options to popular tools",
    href: "/alternatives",
    icon: "swap",
  },
  {
    label: "Best Of",
    description: "Top AI tools by category",
    href: "/blogs/listicles",
    icon: "list",
  },
  {
    label: "Explainers",
    description: "AI concepts, made simple",
    href: "/blogs/informatives",
    icon: "book",
  },
  {
    label: "Tutorials",
    description: "Step-by-step, with AI tools",
    href: "/tutorial",
    icon: "steps",
  },
  {
    label: "News",
    description: "Latest AI news and updates",
    href: "/news",
    icon: "news",
  },
];

const brandItems: MenuItem[] = [
  {
    label: "Review Your AI Tool",
    description:
      "Request an in-depth review of your AI tool. We test it on real workflows, show original screenshots and pricing, and update it as you launch new features.",
    href: "/review-your-ai-tool",
    icon: "search",
  },
  {
    label: "Submit Your AI Tool",
    description:
      "Submit your AI tool to be considered for AlloyPress's tested lists and alternatives articles. Inclusion is editorial, based on real hands-on testing.",
    href: "/submit-your-ai-tool",
    icon: "send",
  },
  {
    label: "Your AI Testing Partner",
    description:
      "Honest, hands-on testing for your AI product. We spot bugs, suggest new features and share SEO input, backed by deep AI testing and marketing experience.",
    href: "/testing-partner",
    icon: "flask",
  },
];

const toolItems: MenuItem[] = [];

const categoriesMenu: MegaMenu = {
  id: "categories",
  label: "Categories",
  items: categoryItems,
  columns: 2,
  featured: true,
};

const brandsMenu: MegaMenu = {
  id: "brands",
  label: "For Brands",
  items: brandItems,
  columns: 3,
  intro: {
    eyebrow: "For Brands",
    title: "Work with AlloyPress",
    description:
      "Get your AI tool tested independently, with a verdict readers can trust.",
    cta: { label: "Contact Us", href: "/contact-us" },
  },
  footnote: "Fees cover testing time, never the verdict.",
};

const toolsMenu: MegaMenu = {
  id: "tools",
  label: "Tools",
  items: toolItems.slice(0, 6),
  columns: 2,
  intro: {
    eyebrow: "Tools",
    title: "AlloyPress Tools",
    description: "Free tools for working with AI. No sign-up.",
    cta: { label: "All Tools", href: "/tools" },
  },
};

const navEntries: NavEntry[] = [
  { kind: "link", ...homeLink },
  { kind: "link", ...howWeTestLink },
  { kind: "menu", menu: categoriesMenu },
  { kind: "menu", menu: brandsMenu },
  ...(toolItems.length >= 6
    ? [{ kind: "menu", menu: toolsMenu } as NavEntry]
    : toolItems.length > 0
      ? [
          {
            kind: "link",
            label: "Tools",
            href: "/tools",
            badge: "New",
          } as NavEntry,
        ]
      : []),
];

const megaMenus: MegaMenu[] = navEntries.flatMap((entry) =>
  entry.kind === "menu" ? [entry.menu] : []
);

const THEME_KEY = "alloypress-theme";
const OPEN_DELAY = 100;
const CLOSE_DELAY = 150;

function isPathActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function trackNav(label: string) {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };
  if (typeof w.gtag === "function") {
    w.gtag("event", "nav_click", { label });
  } else if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: "nav_click", label });
  }
}

const itemIcons: Record<IconName, ReactNode> = {
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  book: (
    <>
      <path d="M4 19.5V5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 1.5Z" />
      <path d="M4 19.5A2 2 0 0 0 6 21h14" />
    </>
  ),
  star: (
    <path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  ),
  news: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </>
  ),
  swap: <path d="M4 8h14m0 0-3-3m3 3-3 3M20 16H6m0 0 3-3m-3 3 3 3" />,
  scale: (
    <>
      <path d="M12 4v16M7 20h10M5 7h14" />
      <path d="m5 7-2.5 6a3 3 0 0 0 5 0L5 7Zm14 0-2.5 6a3 3 0 0 0 5 0L19 7Z" />
    </>
  ),
  columns: (
    <>
      <rect x="3" y="4" width="7" height="16" rx="1.5" />
      <rect x="14" y="4" width="7" height="16" rx="1.5" />
    </>
  ),
  steps: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5 3.5-5 3.5z" />
    </>
  ),
  tool: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1l-5.8 5.8a1.5 1.5 0 0 0 2.1 2.1l5.8-5.8a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.1-.6-.6-2.1 2.3-2.3Z" />
  ),
  sparkles: (
    <path d="m11 3 1.8 4.7L17.5 9.5l-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8L11 3Zm8 11 .9 2.1 2.1.9-2.1.9L19 20l-.9-2.1-2.1-.9 2.1-.9L19 14Z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  send: <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z" />,
  flask: (
    <path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3M7.5 15h9" />
  ),
  users: (
    <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.2a3.5 3.5 0 0 1 0 6.6" />
  ),
  shield: (
    <path d="m12 3 7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6l7-3Zm-3 9 2.2 2.2L15.5 10" />
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
};

function ItemIcon({ name, size = 20 }: { name?: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {itemIcons[name ?? "sparkles"] ?? itemIcons.sparkles}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function ChevronIcon({ className = "nav-dropdown-chevron" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
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

function FeaturedCard({
  article,
  onNavigate,
}: {
  article: FeaturedArticle;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={article.href}
      className="mega-featured"
      onClick={() => {
        trackNav(`Featured: ${article.title}`);
        onNavigate();
      }}
    >
      <span className="mega-eyebrow">Featured</span>
      <span className="mega-featured-thumb">
        {article.image && (
          <Image
            loader={cfLoader}
            src={article.image}
            alt={article.imageAlt ?? ""}
            fill
            sizes="360px"
            loading="lazy"
          />
        )}
        <span className="mega-featured-tag">{article.tag}</span>
      </span>
      <span className="mega-featured-title">{article.title}</span>
      {article.description && (
        <span className="mega-featured-desc">{article.description}</span>
      )}
      <span className="mega-featured-link">
        Read article <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

export default function NavbarShell({ featuredArticle }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const featured = featuredArticle ?? defaultFeatured;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let current = document.documentElement.dataset.theme;
    if (current !== "light" && current !== "dark") {
      const saved = window.localStorage.getItem(THEME_KEY);
      current =
        saved === "light" || saved === "dark"
          ? saved
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      document.documentElement.dataset.theme = current;
    }
    setTheme(current as "light" | "dark");
    setMounted(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.documentElement.classList.remove("theme-preload")
      )
    );
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        trackNav("Search");
        router.push("/search");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        headerRef.current &&
        !headerRef.current.contains(target)
      ) {
        setOpenMenu(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const id = openMenu;
        setOpenMenu(null);
        triggerRefs.current[id]?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const canHover = useCallback(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    []
  );

  const cancelTimers = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (!canHover()) return;
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenMenu(null), CLOSE_DELAY);
  }, [canHover, cancelClose]);

  const openOnHover = useCallback(
    (id: string) => {
      if (!canHover()) return;
      cancelTimers();
      if (openMenu) {
        setOpenMenu(id);
        return;
      }
      openTimer.current = setTimeout(() => setOpenMenu(id), OPEN_DELAY);
    },
    [canHover, cancelTimers, openMenu]
  );

  const onTriggerClick = useCallback(
    (id: string) => {
      cancelTimers();
      setOpenMenu((current) => (current === id ? null : id));
    },
    [cancelTimers]
  );

  const closeMegaMenu = useCallback(() => {
    cancelTimers();
    setOpenMenu(null);
  }, [cancelTimers]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_KEY, nextTheme);
    setTheme(nextTheme);
  }, [theme]);

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
    setMobileSection(null);
  }, []);

  const themeLabel = mounted
    ? `Switch to ${theme === "dark" ? "light" : "dark"} mode`
    : "Toggle theme";

  return (
    <header
      className="site-header"
      ref={headerRef}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <div className="site-header-inner">
        <Link href="/" className="brand-logo" onClick={() => trackNav("Logo")}>
          <Image
            src="/ap-icons.png"
            alt="AlloyPress"
            width={34}
            height={34}
            priority
          />
          <span className="brand-name">AlloyPress</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navEntries.map((entry) => {
            if (entry.kind === "link") {
              const active = isPathActive(pathname, entry.href);
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={`nav-link ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={scheduleClose}
                  onClick={() => trackNav(entry.label)}
                >
                  {entry.label}
                  {entry.badge && (
                    <span className="nav-link-badge">{entry.badge}</span>
                  )}
                </Link>
              );
            }

            const { menu } = entry;
            const isOpen = openMenu === menu.id;
            const isActive = menu.items.some((item) =>
              isPathActive(pathname, item.href)
            );

            return (
              <button
                key={menu.id}
                type="button"
                ref={(node) => {
                  triggerRefs.current[menu.id] = node;
                }}
                className={`nav-link nav-dropdown-trigger ${isOpen ? "is-open" : ""} ${isActive ? "is-active" : ""}`}
                aria-expanded={isOpen}
                aria-controls={`mega-${menu.id}`}
                onMouseEnter={() => openOnHover(menu.id)}
                onClick={() => onTriggerClick(menu.id)}
              >
                {menu.label}
                <ChevronIcon />
              </button>
            );
          })}
        </nav>

        <div className="header-actions">
          <Link
            href="/search"
            prefetch={false}
            className="header-icon-button"
            aria-label="Search AlloyPress (Ctrl+K)"
            title="Search AlloyPress (Ctrl+K)"
            onClick={() => trackNav("Search")}
          >
            <SearchIcon />
          </Link>

          <button
            type="button"
            className="header-icon-button"
            aria-label={themeLabel}
            title={themeLabel}
            onClick={toggleTheme}
          >
            <span className="theme-icon-sun">
              <SunIcon />
            </span>
            <span className="theme-icon-moon">
              <MoonIcon />
            </span>
          </button>

          <Link
            href={ctaLink.href}
            className="header-cta"
            onClick={() => trackNav(ctaLink.label)}
          >
            {ctaLink.label}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="mobile-actions">
          <Link
            href="/search"
            prefetch={false}
            className="header-icon-button"
            aria-label="Search AlloyPress"
            title="Search AlloyPress"
            onClick={() => {
              trackNav("Search");
              closeMobileMenu();
            }}
          >
            <SearchIcon />
          </Link>

          <button
            type="button"
            className="header-icon-button"
            aria-label={themeLabel}
            onClick={toggleTheme}
          >
            <span className="theme-icon-sun">
              <SunIcon />
            </span>
            <span className="theme-icon-moon">
              <MoonIcon />
            </span>
          </button>

          <button
            type="button"
            className="mobile-menu-button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      <div
        className={`mega-backdrop ${openMenu ? "is-open" : ""}`}
        onClick={closeMegaMenu}
        onMouseEnter={scheduleClose}
        aria-hidden="true"
      />

      {megaMenus.map((menu) => {
        const isOpen = openMenu === menu.id;

        return (
          <div
            key={menu.id}
            id={`mega-${menu.id}`}
            className={`mega-panel ${isOpen ? "is-open" : ""}`}
            aria-hidden={!isOpen}
            onMouseEnter={cancelClose}
          >
            <div className="mega-panel-inner">
              {menu.featured ? (
                <FeaturedCard article={featured} onNavigate={closeMegaMenu} />
              ) : (
                menu.intro && (
                  <div className="mega-intro">
                    <span className="mega-eyebrow">{menu.intro.eyebrow}</span>
                    <h3 className="mega-intro-title">{menu.intro.title}</h3>
                    <p className="mega-intro-desc">{menu.intro.description}</p>
                    <Link
                      href={menu.intro.cta.href}
                      className="mega-intro-cta"
                      onClick={() => {
                        trackNav(menu.intro?.cta.label ?? "");
                        closeMegaMenu();
                      }}
                    >
                      {menu.intro.cta.label}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                )
              )}

              <div className="mega-grid" data-cols={menu.columns}>
                {menu.items.map((item, index) => {
                  const current = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`mega-item ${current ? "is-current" : ""}`}
                      style={{ "--i": index } as CSSProperties}
                      aria-current={current ? "page" : undefined}
                      tabIndex={isOpen ? undefined : -1}
                      onClick={() => {
                        trackNav(item.label);
                        closeMegaMenu();
                      }}
                    >
                      <span className="mega-item-icon">
                        <ItemIcon name={item.icon} />
                      </span>

                      <span className="mega-item-text">
                        <span className="mega-item-title">
                          {item.label}
                          {item.badge && (
                            <span className="mega-item-badge">{item.badge}</span>
                          )}
                        </span>
                        <span className="mega-item-desc">{item.description}</span>
                        {menu.columns === 3 && (
                          <span className="mega-item-more" aria-hidden="true">
                            Learn more <span>→</span>
                          </span>
                        )}
                      </span>

                      <span className="mega-item-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {menu.footnote && (
              <div className="mega-footer">
                <span className="mega-footer-note">{menu.footnote}</span>
              </div>
            )}
          </div>
        );
      })}

      <div
        id="mobile-nav"
        className={`mobile-nav ${mobileOpen ? "is-open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <nav className="mobile-nav-scroll" aria-label="Mobile navigation">
          {navEntries.map((entry) => {
            if (entry.kind === "link") {
              const active = isPathActive(pathname, entry.href);
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={`mobile-nav-link ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    trackNav(entry.label);
                    closeMobileMenu();
                  }}
                >
                  {entry.label}
                  {entry.badge && (
                    <span className="nav-link-badge">{entry.badge}</span>
                  )}
                </Link>
              );
            }

            const { menu } = entry;
            const isOpen = mobileSection === menu.id;

            return (
              <div key={menu.id} className="mobile-accordion">
                <button
                  type="button"
                  className={`mobile-nav-link mobile-accordion-trigger ${isOpen ? "is-open" : ""}`}
                  aria-expanded={isOpen}
                  aria-controls={`mobile-${menu.id}`}
                  onClick={() =>
                    setMobileSection((current) =>
                      current === menu.id ? null : menu.id
                    )
                  }
                >
                  {menu.label}
                  <ChevronIcon className="mobile-accordion-chevron" />
                </button>

                <div
                  id={`mobile-${menu.id}`}
                  className={`mobile-accordion-panel ${isOpen ? "is-open" : ""}`}
                >
                  <div className="mobile-accordion-inner">
                    {menu.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="mobile-nav-sublink"
                        aria-current={pathname === item.href ? "page" : undefined}
                        tabIndex={isOpen ? undefined : -1}
                        onClick={() => {
                          trackNav(item.label);
                          closeMobileMenu();
                        }}
                      >
                        <ItemIcon name={item.icon} size={16} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mobile-nav-footer">
          <Link
            href={ctaLink.href}
            className="mobile-nav-cta"
            onClick={() => {
              trackNav(ctaLink.label);
              closeMobileMenu();
            }}
          >
            {ctaLink.label}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </header>
  );
}