'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

type Counts = {
  all: number
  published: number
  draft: number
}

type TabKey = 'all' | 'published' | 'draft'

const STATUS_KEY = /\[_status\]\[equals\]$/

/**
 * WordPress-style status tabs for the Posts list:  All (28) | Published (27) | Draft (1)
 *
 * - Uses Payload's normal `where[_status][equals]=...` list query, so filtering,
 *   sorting, search and pagination keep working exactly like the built-in filter.
 * - Counts are calculated on the server (see PostStatusTabs.tsx).
 */
export function PostStatusTabsClient({ counts }: { counts: Counts }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Which tab is active? Look for any `...[_status][equals]=value` in the URL
  // (also matches the nested form Payload's own filter UI produces).
  let active: TabKey = 'all'
  for (const [key, value] of searchParams.entries()) {
    if (STATUS_KEY.test(key)) {
      if (value === 'published') active = 'published'
      else if (value === 'draft') active = 'draft'
    }
  }

  const hrefFor = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString())

    // drop every existing filter + go back to page 1; keep limit / sort / search
    for (const key of Array.from(params.keys())) {
      if (key === 'where' || key.startsWith('where[') || key === 'page') {
        params.delete(key)
      }
    }

    if (tab !== 'all') params.set('where[_status][equals]', tab)

    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'published', label: 'Published', count: counts.published },
    { key: 'draft', label: 'Draft', count: counts.draft },
  ]

  return (
    <nav
      aria-label="Filter posts by status"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0 var(--gutter-h, 1.5rem) 0.75rem',
        fontSize: '0.95rem',
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.key === active

        return (
          <React.Fragment key={tab.key}>
            {index > 0 && (
              <span aria-hidden="true" style={{ opacity: 0.4 }}>
                |
              </span>
            )}

            <Link
              href={hrefFor(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                textDecoration: 'none',
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? 'var(--theme-text)'
                  : 'var(--theme-success-600, #15803d)',
                borderBottom: isActive
                  ? '2px solid var(--theme-success-500, #16a34a)'
                  : '2px solid transparent',
                paddingBottom: '2px',
              }}
            >
              {tab.label}{' '}
              <span style={{ fontWeight: 400, opacity: 0.7 }}>({tab.count})</span>
            </Link>
          </React.Fragment>
        )
      })}
    </nav>
  )
}