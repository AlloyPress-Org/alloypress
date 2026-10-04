'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@payloadcms/ui'

import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Folder,
  Tag,
  Users,
  UserRound,
  Link2,
  AlertTriangle,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react'

type UserRole = 'admin' | 'editor'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

/* =========================================================
   COMMON CONTENT
   Available for both Admin and Editor
   ========================================================= */

const contentItems: NavItem[] = [
  {
    label: 'Posts',
    href: '/admin/collections/posts',
    icon: FileText,
  },
  {
    label: 'Pages',
    href: '/admin/collections/pages',
    icon: FileText,
  },
  {
    label: 'Media',
    href: '/admin/collections/media',
    icon: ImageIcon,
  },
  {
    label: 'Categories',
    href: '/admin/collections/categories',
    icon: Folder,
  },
  {
    label: 'Tags',
    href: '/admin/collections/tags',
    icon: Tag,
  },
]

/* =========================================================
   ADMIN ONLY
   ========================================================= */

const advancedItems: NavItem[] = [
  {
    label: 'Homepage Settings',
    href: '/admin/collections/homepage-settings',
    icon: Settings,
  },
  {
    label: 'Users',
    href: '/admin/collections/users',
    icon: Users,
  },
  {
    label: 'Redirects',
    href: '/admin/collections/redirects',
    icon: Link2,
  },
  {
    label: 'Not Found Logs',
    href: '/admin/collections/not-found-logs',
    icon: AlertTriangle,
  },
]

/* =========================================================
   ACTIVE LINK
   ========================================================= */

const isActive = (
  pathname: string,
  href: string,
): boolean => {
  if (href === '/admin') {
    return pathname === '/admin'
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  )
}

/* =========================================================
   NAV ITEM
   ========================================================= */

function NavItemLink({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const Icon = item.icon
  const active = isActive(pathname, item.href)

  return (
    <Link
      href={item.href}
      className={`alloy-nav__item ${
        active
          ? 'alloy-nav__item--active'
          : ''
      }`}
      aria-current={
        active ? 'page' : undefined
      }
    >
      <span
        className="alloy-nav__icon"
        aria-hidden="true"
      >
        <Icon
          size={19}
          strokeWidth={1.9}
        />
      </span>

      <span className="alloy-nav__label">
        {item.label}
      </span>
    </Link>
  )
}

/* =========================================================
   USER HELPERS
   ========================================================= */

type PayloadUser = {
  role?: unknown
  roles?: unknown
  displayName?: unknown
  name?: unknown
  email?: unknown
}

function getUserRole(
  user: PayloadUser | null | undefined,
): UserRole | null {
  if (!user) {
    return null
  }

  const directRole = user.role

  const arrayRole = Array.isArray(user.roles)
    ? user.roles[0]
    : undefined

  const rawRole =
    directRole ?? arrayRole

  if (
    typeof rawRole === 'string' &&
    rawRole.toLowerCase() === 'editor'
  ) {
    return 'editor'
  }

  return 'admin'
}

function getUserDisplayName(
  user: PayloadUser | null | undefined,
): string {
  if (!user) {
    return 'AlloyPress Team'
  }

  if (
    typeof user.displayName === 'string' &&
    user.displayName.trim()
  ) {
    return user.displayName.trim()
  }

  if (
    typeof user.name === 'string' &&
    user.name.trim()
  ) {
    return user.name.trim()
  }

  if (
    typeof user.email === 'string' &&
    user.email.includes('@')
  ) {
    return user.email.split('@')[0]
  }

  return 'AlloyPress Team'
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AlloyNav() {
  const pathname = usePathname()

  /*
   * IMPORTANT:
   *
   * Payload authentication is now the single source
   * of truth.
   *
   * We DO NOT fetch /api/users/me here.
   *
   * This prevents:
   *
   * Nav
   *   -> fetch user
   *   -> role null
   *   -> role resolved
   *   -> sidebar re-render
   *
   * Payload already provides the authenticated user
   * through useAuth().
   */
  const { user } = useAuth()

  const payloadUser =
    user as PayloadUser | null | undefined

  /*
   * Resolve role directly from Payload auth state.
   */
  const userRole =
    getUserRole(payloadUser)

  /*
   * Do NOT use a state variable for these.
   *
   * They are derived values.
   */
  const isEditor =
    userRole === 'editor'

  const isAdmin =
    userRole === 'admin'

  const teamName =
    getUserDisplayName(payloadUser)

  /*
   * -------------------------------------------------------
   * IMPORTANT SIDEBAR BEHAVIOUR
   * -------------------------------------------------------
   *
   * We intentionally do NOT:
   *
   * - set sidebar open/close state here
   * - reset sidebar when role changes
   * - fetch user inside useEffect
   * - return null while role loads
   *
   * Payload controls the admin shell.
   * This component only controls which links are visible.
   */

  return (
    <nav
      className="alloy-nav"
      aria-label="AlloyPress navigation"
    >
      {/* =====================================================
          BRAND
          ===================================================== */}

      <div className="alloy-nav__brand">
        <Link
          href="/admin"
          className="alloy-nav__brand-link"
          aria-label="AlloyPress Dashboard"
        >
          <img
            src="/ap-logo.png"
            alt="AlloyPress"
            className="alloy-nav__brand-logo"
          />
        </Link>
      </div>

      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <div className="alloy-nav__scroll">

        {/* ===================================================
            DASHBOARD
            =================================================== */}

        <div className="alloy-nav__dashboard">
          <NavItemLink
            item={{
              label: 'Dashboard',
              href: '/admin',
              icon: LayoutDashboard,
            }}
            pathname={pathname}
          />
        </div>

        {/* ===================================================
            CONTENT
            =================================================== */}

        <section className="alloy-nav__section">
          <div className="alloy-nav__section-title">
            CONTENT
          </div>

          <div className="alloy-nav__items">
            {contentItems.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                pathname={pathname}
              />
            ))}
          </div>
        </section>

        {/* ===================================================
            ADVANCED
            ADMIN ONLY
            =================================================== */}

        {isAdmin && (
          <section className="alloy-nav__section">
            <div className="alloy-nav__section-title">
              ADVANCED
            </div>

            <div className="alloy-nav__items">
              {advancedItems.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </div>
          </section>
        )}

        {/* ===================================================
            TEAM PROMO
            ADMIN ONLY
            =================================================== */}

        {isAdmin && (
          <div className="alloy-nav__promo">

            <div
              className="alloy-nav__promo-art"
              aria-hidden="true"
            >
              <span className="alloy-nav__promo-star">
                ✦
              </span>

              <span
                className="
                  alloy-nav__promo-person
                  alloy-nav__promo-person--one
                "
              />

              <span
                className="
                  alloy-nav__promo-person
                  alloy-nav__promo-person--two
                "
              />
            </div>

            <div className="alloy-nav__promo-copy">
              <strong>
                Make AlloyPress better
              </strong>

              <p>
                Invite your team and
                streamline content
                management together.
              </p>
            </div>

            <Link
              href="/admin/collections/users/create"
              className="alloy-nav__promo-button"
            >
              Invite Team
            </Link>
          </div>
        )}

      </div>

      {/* =====================================================
          BOTTOM AREA
          ===================================================== */}

      <div className="alloy-nav__bottom">

        {/* ===================================================
            USER
            =================================================== */}

        <div className="alloy-nav__account">
          <span
            className="alloy-nav__avatar"
            aria-hidden="true"
          >
            <UserRound
              size={17}
              strokeWidth={2}
            />
          </span>

          <div className="alloy-nav__account-copy">
            <strong>
              {teamName}
            </strong>

            <span>
              {isEditor
                ? 'Editor'
                : 'Admin'}
            </span>
          </div>
        </div>

        {/* ===================================================
            VIEW SITE
            =================================================== */}

        <Link
          href="/"
          className="
            alloy-nav__bottom-item
            alloy-nav__view-site
          "
          target="_blank"
          rel="noreferrer"
        >
          <span
            className="alloy-nav__icon"
            aria-hidden="true"
          >
            <ExternalLink
              size={17}
              strokeWidth={1.9}
            />
          </span>

          <span className="alloy-nav__label">
            View Site
          </span>
        </Link>

        {/* ===================================================
            ACCOUNT
            =================================================== */}

        <Link
          href="/admin/account"
          className="alloy-nav__bottom-item"
        >
          <span
            className="alloy-nav__icon"
            aria-hidden="true"
          >
            <Settings
              size={18}
              strokeWidth={1.9}
            />
          </span>

          <span className="alloy-nav__label">
            Account
          </span>
        </Link>

        {/* ===================================================
            LOGOUT
            =================================================== */}

        <a
          href="/admin/logout"
          className="alloy-nav__bottom-item"
        >
          <span
            className="alloy-nav__icon"
            aria-hidden="true"
          >
            <LogOut
              size={18}
              strokeWidth={1.9}
            />
          </span>

          <span className="alloy-nav__label">
            Logout
          </span>
        </a>

      </div>
    </nav>
  )
}