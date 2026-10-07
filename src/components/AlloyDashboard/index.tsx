'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useAuth, useTheme } from '@payloadcms/ui'

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FileText,
  Folder,
  Image as ImageIcon,
  Lightbulb,
  Moon,
  PenLine,
  Plus,
  Sun,
  Tags,
  Upload,
  Users,
  BarChart3,
  Clock3,
  FileClock,
  Send,
} from 'lucide-react'

import './index.scss'

/* =========================================================
   TYPES
   ========================================================= */

type Accent = 'purple' | 'green' | 'orange' | 'blue' | 'red'

type SparklinePoint = { x: number; y: number }

type CollectionCardProps = {
  slug: string
  title: string
  description: string
  count: number
  icon: ReactNode
  href: string
  accent: Accent
  sparkline: SparklinePoint[]
}

type QuickActionProps = {
  title: string
  icon: ReactNode
  href: string
  accent: Accent
}

type RecentPost = {
  id: string | number
  title?: string
  updatedAt?: string
}

type WhereClause = Record<string, unknown>

type EditorFilterKey =
  | 'publishedThisWeek'
  | 'publishedThisMonth'
  | 'updatedThisWeek'
  | 'updatedThisMonth'
  | 'draftPosts'
  | 'scheduledPosts'

type EditorStats = Record<EditorFilterKey, number>

type DashboardData = {
  posts: number
  pages: number
  users: number
  media: number
  categories: number
  tags: number
  notFoundLogs: number
  redirects: number
  recentPosts: RecentPost[]
  editorStats: EditorStats
}

type DateRanges = { now: string; weekStart: string; monthStart: string }

/* =========================================================
   CONSTANTS
   ========================================================= */

const EDITOR_FILTER_KEYS: EditorFilterKey[] = [
  'publishedThisWeek',
  'publishedThisMonth',
  'updatedThisWeek',
  'updatedThisMonth',
  'draftPosts',
  'scheduledPosts',
]

const EMPTY_EDITOR_STATS: EditorStats = {
  publishedThisWeek: 0,
  publishedThisMonth: 0,
  updatedThisWeek: 0,
  updatedThisMonth: 0,
  draftPosts: 0,
  scheduledPosts: 0,
}

const EMPTY_DATA: DashboardData = {
  posts: 0,
  pages: 0,
  users: 0,
  media: 0,
  categories: 0,
  tags: 0,
  notFoundLogs: 0,
  redirects: 0,
  recentPosts: [],
  editorStats: EMPTY_EDITOR_STATS,
}

const DEFAULT_POSTS_URL = '/admin/collections/posts'

const DEFAULT_EDITOR_URLS: Record<EditorFilterKey, string> = {
  publishedThisWeek: DEFAULT_POSTS_URL,
  publishedThisMonth: DEFAULT_POSTS_URL,
  updatedThisWeek: DEFAULT_POSTS_URL,
  updatedThisMonth: DEFAULT_POSTS_URL,
  draftPosts: DEFAULT_POSTS_URL,
  scheduledPosts: DEFAULT_POSTS_URL,
}

/**
 * - younger than CACHE_FRESH_MS -> zero network calls
 * - older                       -> cached data shows instantly,
 *                                  then refreshes in the background
 */
const CACHE_FRESH_MS = 2 * 60_000
const CACHE_MAX_AGE_MS = 30 * 60_000
const CACHE_VERSION = 'v6'

/**
 * Max requests in flight at once. Kept at 2 on purpose: Hostinger serves
 * HTTP/1.1 and Neon runs on a tiny compute, so a gentle trickle avoids
 * queueing, 429s and DB spikes. Raise to 3-4 only if measured fast.
 */
const MAX_CONCURRENCY = 2

/* =========================================================
   SPARKLINES (static, module level)
   ========================================================= */

const SPARK_XS = [0, 18, 36, 54, 72, 90, 108, 128]

const makeSpark = (ys: number[]): SparklinePoint[] =>
  ys.map((y, i) => ({ x: SPARK_XS[i], y }))

const SPARK = {
  users: [
    { x: 0, y: 24 },
    { x: 18, y: 20 },
    { x: 35, y: 22 },
    { x: 52, y: 12 },
    { x: 70, y: 17 },
    { x: 88, y: 8 },
    { x: 108, y: 14 },
    { x: 128, y: 5 },
  ] as SparklinePoint[],
  media: makeSpark([22, 16, 20, 9, 14, 6, 15, 4]),
  categories: makeSpark([22, 20, 16, 20, 11, 15, 5, 10]),
  tags: makeSpark([21, 18, 22, 11, 15, 7, 11, 4]),
  posts: makeSpark([22, 17, 19, 12, 16, 6, 12, 3]),
  pages: makeSpark([21, 18, 20, 12, 15, 8, 12, 4]),
  notFound: makeSpark([21, 18, 22, 10, 16, 7, 13, 3]),
  redirects: makeSpark([22, 16, 20, 9, 15, 6, 12, 4]),
}

/* =========================================================
   QUICK ACTIONS (static)
   ========================================================= */

const QUICK_ACTIONS: QuickActionProps[] = [
  {
    title: 'New Post',
    icon: <FilePlus2 />,
    href: '/admin/collections/posts/create',
    accent: 'green',
  },
  {
    title: 'Upload Media',
    icon: <Upload />,
    href: '/admin/collections/media',
    accent: 'purple',
  },
  {
    title: 'New Page',
    icon: <FileText />,
    href: '/admin/collections/pages/create',
    accent: 'blue',
  },
  {
    title: 'New Category',
    icon: <Folder />,
    href: '/admin/collections/categories/create',
    accent: 'orange',
  },
]

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

const getTotalDocs = (value: unknown): number => {
  if (!value || typeof value !== 'object') return 0

  const totalDocs = (value as { totalDocs?: unknown }).totalDocs

  return typeof totalDocs === 'number' && Number.isFinite(totalDocs)
    ? totalDocs
    : 0
}

const getRecentPosts = (value: unknown): RecentPost[] => {
  if (!value || typeof value !== 'object') return []

  const docs = (value as { docs?: unknown }).docs

  if (!Array.isArray(docs)) return []

  return docs
    .filter(
      (doc): doc is Record<string, unknown> =>
        Boolean(doc && typeof doc === 'object'),
    )
    .map((doc, index) => ({
      id:
        typeof doc.id === 'string' || typeof doc.id === 'number'
          ? doc.id
          : `recent-${index}`,
      title: typeof doc.title === 'string' ? doc.title : undefined,
      updatedAt:
        typeof doc.updatedAt === 'string' ? doc.updatedAt : undefined,
    }))
}

const getDisplayName = (value: unknown): string => {
  if (!value || typeof value !== 'object') return 'there'

  const record = value as {
    displayName?: unknown
    name?: unknown
    email?: unknown
  }

  if (
    typeof record.displayName === 'string' &&
    record.displayName.trim()
  ) {
    return record.displayName.trim()
  }

  if (typeof record.name === 'string' && record.name.trim()) {
    return record.name.trim()
  }

  if (typeof record.email === 'string' && record.email.includes('@')) {
    const emailName = record.email.split('@')[0]

    return emailName
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  return 'there'
}

/* =========================================================
   DATE RANGES
   ========================================================= */

const getDateRanges = (): DateRanges => {
  const now = new Date()

  // Monday is the beginning of the editorial week.
  const weekStart = new Date(now)
  const day = weekStart.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1

  weekStart.setDate(weekStart.getDate() - daysFromMonday)
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  monthStart.setHours(0, 0, 0, 0)

  return {
    now: now.toISOString(),
    weekStart: weekStart.toISOString(),
    monthStart: monthStart.toISOString(),
  }
}

/* =========================================================
   PAYLOAD API
   ========================================================= */

const JSON_HEADERS = { Accept: 'application/json' }

/**
 * GET /api/{slug}/count?where[...]  ->  { totalDocs }
 * Never loads documents (unlike `?limit=1`).
 */
const fetchCollectionCount = async (
  slug: string,
  whereQuery: string,
  signal: AbortSignal,
): Promise<number> => {
  const url = whereQuery
    ? `/api/${slug}/count?${whereQuery}`
    : `/api/${slug}/count`

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: JSON_HEADERS,
    signal,
  })

  if (!response.ok) throw new Error(`Failed to load ${slug} count`)

  return getTotalDocs(await response.json())
}

type RecentPostsResult = {
  posts: RecentPost[]
  totalDocs: number
}

/**
 * Only the fields the dashboard shows (`id` always included).
 * `find` already returns `totalDocs`, so this one request also gives us
 * the total posts count (no separate /posts/count query needed).
 */
const fetchRecentPosts = async (
  signal: AbortSignal,
): Promise<RecentPostsResult> => {
  const response = await fetch(
    '/api/posts?limit=3&depth=0&sort=-updatedAt&select[title]=true&select[updatedAt]=true',
    {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: JSON_HEADERS,
      signal,
    },
  )

  if (!response.ok) throw new Error('Failed to load recent posts')

  const json = await response.json()

  return {
    posts: getRecentPosts(json),
    totalDocs: getTotalDocs(json),
  }
}

/**
 * Tiny promise pool: runs tasks with at most `limit` in flight and
 * keeps order, so important requests go first.
 */
const runPool = async (
  tasks: Array<() => Promise<void>>,
  limit: number,
  signal: AbortSignal,
) => {
  let next = 0

  const worker = async () => {
    while (next < tasks.length && !signal.aborted) {
      const task = tasks[next++]
      await task()
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  )
}

/* =========================================================
   PAYLOAD WHERE SERIALIZER
   =========================================================
   Same serializer for the count request AND the posts-list
   link, so a card's number always matches the clicked list.
   ========================================================= */

const serializeWhere = (where: WhereClause): string => {
  const pairs: string[] = []

  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`))
      return
    }

    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(
        ([key, val]) => walk(val, `${path}[${key}]`),
      )
      return
    }

    if (value !== undefined) {
      pairs.push(`${path}=${encodeURIComponent(String(value))}`)
    }
  }

  walk(where, 'where')

  return pairs.join('&')
}

/* =========================================================
   EDITOR FILTERS
   =========================================================
   Published This Week / Month
     _status = published AND publishedAt in range

   Updated This Week / Month
     migrated post -> legacy.wordpressModifiedAt
     native post   -> updatedAt fallback

   Draft Posts      draft + draft workflow, NOT scheduled
   Scheduled Posts  draft + draft workflow + future publishedAt
   ========================================================= */

const buildEditorFilters = (
  ranges: DateRanges,
): Record<EditorFilterKey, WhereClause> => {
  const publishedFilter = (start: string): WhereClause => ({
    and: [
      { _status: { equals: 'published' } },
      { publishedAt: { greater_than_equal: start } },
      { publishedAt: { less_than_equal: ranges.now } },
    ],
  })

  const updatedFilter = (start: string): WhereClause => ({
    or: [
      {
        and: [
          { 'legacy.wordpressModifiedAt': { exists: true } },
          { 'legacy.wordpressModifiedAt': { greater_than_equal: start } },
          { 'legacy.wordpressModifiedAt': { less_than_equal: ranges.now } },
        ],
      },
      {
        and: [
          { 'legacy.wordpressModifiedAt': { exists: false } },
          { updatedAt: { greater_than_equal: start } },
          { updatedAt: { less_than_equal: ranges.now } },
        ],
      },
    ],
  })

  return {
    publishedThisWeek: publishedFilter(ranges.weekStart),
    publishedThisMonth: publishedFilter(ranges.monthStart),
    updatedThisWeek: updatedFilter(ranges.weekStart),
    updatedThisMonth: updatedFilter(ranges.monthStart),

    draftPosts: {
      and: [
        { _status: { equals: 'draft' } },
        { workflowStatus: { equals: 'draft' } },
        {
          or: [
            { publishedAt: { exists: false } },
            { publishedAt: { less_than_equal: ranges.now } },
          ],
        },
      ],
    },

    scheduledPosts: {
      and: [
        { _status: { equals: 'draft' } },
        { workflowStatus: { equals: 'draft' } },
        { publishedAt: { greater_than: ranges.now } },
      ],
    },
  }
}

const buildEditorPostUrl = (where: WhereClause): string => {
  const query = serializeWhere(where)

  return query ? `${DEFAULT_POSTS_URL}?${query}` : DEFAULT_POSTS_URL
}

/* =========================================================
   SESSION CACHE
   ========================================================= */

type CachePayload = { ts: number; data: DashboardData }

const cacheKey = (userId: string | number, role: string) =>
  `alloy-dashboard:${CACHE_VERSION}:${userId}:${role}`

const readCache = (key: string): CachePayload | null => {
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachePayload

    if (
      !parsed ||
      typeof parsed.ts !== 'number' ||
      !parsed.data ||
      Date.now() - parsed.ts > CACHE_MAX_AGE_MS
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

const writeCache = (key: string, data: DashboardData) => {
  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({ ts: Date.now(), data } satisfies CachePayload),
    )
  } catch {
    // storage full / blocked: caching is optional
  }
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AlloyDashboard() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  // Payload auth context: undefined means auth is still resolving.
  const authResolved = user !== undefined
  const userId = user?.id
  const userRole = typeof user?.role === 'string' ? user.role : null
  const isEditor = userRole === 'editor'
  const isAdmin = userRole === 'admin'
  const displayName = getDisplayName(user)

  const [data, setData] = useState<DashboardData>(EMPTY_DATA)
  // Per-item readiness: cards fill in one by one as results arrive.
  const [ready, setReady] = useState<Record<string, boolean>>({})
  const [allReady, setAllReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [today, setToday] = useState('')
  const [currentYear, setCurrentYear] = useState<number | null>(null)
  const [activeTip, setActiveTip] = useState(0)
  const [pauseTips, setPauseTips] = useState(false)
  const [editorStatUrls, setEditorStatUrls] =
    useState<Record<EditorFilterKey, string>>(DEFAULT_EDITOR_URLS)

  const isReady = (id: string) => allReady || Boolean(ready[id])

  /* ---------------------------------------------------------
     DATA LOADING
     - keyed on userId + role (primitives), not the `user` object
     - /count + select  -> tiny responses
     - concurrency pool -> no 15-request burst on a small host / DB
     - results stream into the UI as they arrive
     - session cache    -> repeat visits cost zero requests
     --------------------------------------------------------- */

  useEffect(() => {
    if (!authResolved || userId === undefined || userId === null || !userRole) {
      return
    }

    const controller = new AbortController()
    const { signal } = controller
    const key = cacheKey(userId, userRole)

    const ranges = getDateRanges()
    const filters = buildEditorFilters(ranges)

    // Links are cheap, always fresh.
    setEditorStatUrls(
      Object.fromEntries(
        EDITOR_FILTER_KEYS.map((k) => [k, buildEditorPostUrl(filters[k])]),
      ) as Record<EditorFilterKey, string>,
    )

    // Show cached data instantly if present.
    const cached = readCache(key)

    if (cached) {
      setData(cached.data)
      setAllReady(true)

      if (Date.now() - cached.ts < CACHE_FRESH_MS) {
        return () => controller.abort()
      }
    } else {
      setAllReady(false)
      setReady({})
    }

    setLoadError(false)

    // Working copy that tasks write into; snapshotted into state.
    const result: DashboardData = {
      ...EMPTY_DATA,
      editorStats: { ...EMPTY_EDITOR_STATS },
      recentPosts: [],
    }

    const doneIds: Record<string, boolean> = {}
    let failed = false

    const flush = (id: string) => {
      if (signal.aborted) return

      doneIds[id] = true
      setData({
        ...result,
        editorStats: { ...result.editorStats },
        recentPosts: [...result.recentPosts],
      })
      setReady({ ...doneIds })
    }

    const task =
      (id: string, run: () => Promise<void>) => async () => {
        try {
          await run()
        } catch (error) {
          if (signal.aborted) return
          failed = true
          console.error(`AlloyPress dashboard: "${id}" failed`, error)
        } finally {
          flush(id)
        }
      }

    const countSlugs: Array<[string, keyof DashboardData]> =
      userRole === 'editor'
        ? [
          ['pages', 'pages'],
          ['media', 'media'],
          ['categories', 'categories'],
          ['tags', 'tags'],
        ]
        : [
          ['pages', 'pages'],
          ['users', 'users'],
          ['media', 'media'],
          ['categories', 'categories'],
          ['tags', 'tags'],
          ['not-found-logs', 'notFoundLogs'],
          ['redirects', 'redirects'],
        ]

    // Order = priority: cheap collection counts + recent activity first,
    // heavier filtered stats after.
    const tasks: Array<() => Promise<void>> = [
      // Recent posts first: also supplies the total posts count.
      task('recent', async () => {
        const recent = await fetchRecentPosts(signal)

        result.recentPosts = recent.posts
        result.posts = recent.totalDocs
      }),

      ...countSlugs.map(([slug, field]) =>
        task(`c:${slug}`, async () => {
          const value = await fetchCollectionCount(slug, '', signal)
          ;(result as unknown as Record<string, number>)[field] = value
        }),
      ),

      ...EDITOR_FILTER_KEYS.map((k) =>
        task(`s:${k}`, async () => {
          result.editorStats[k] = await fetchCollectionCount(
            'posts',
            serializeWhere(filters[k]),
            signal,
          )
        }),
      ),
    ]

    const load = async () => {
      await runPool(tasks, MAX_CONCURRENCY, signal)

      if (signal.aborted) return

      setAllReady(true)

      if (failed) {
        // Show what loaded, don't cache a partial result.
        setLoadError(true)
      } else {
        writeCache(key, {
          ...result,
          editorStats: { ...result.editorStats },
        })
      }
    }

    void load()

    return () => controller.abort()
  }, [authResolved, userId, userRole])

  useEffect(() => {
    const now = new Date()

    setToday(
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(now),
    )

    setCurrentYear(now.getFullYear())
  }, [])

  /* =========================================================
     QUICK TIPS
     ========================================================= */

  const quickTips = useMemo(() => {
    const postsTip = {
      key: 'posts',
      title: 'Posts',
      eyebrow: 'Publishing',
      description:
        'Keep your editorial workflow organized and review recently updated articles before publishing.',
      href: '/admin/collections/posts',
      count: data.posts,
      icon: <PenLine />,
      accent: 'green' as Accent,
    }

    const mediaTip = {
      key: 'media',
      title: 'Media',
      eyebrow: 'Asset Library',
      description:
        'Keep images and uploaded files easy to find so editors can reuse the right assets quickly.',
      href: '/admin/collections/media',
      count: data.media,
      icon: <ImageIcon />,
      accent: 'purple' as Accent,
    }

    if (isEditor) {
      return [
        postsTip,
        mediaTip,
        {
          key: 'categories',
          title: 'Categories',
          eyebrow: 'Organization',
          description:
            'Keep posts organized with clear categories and make your editorial workflow easier to manage.',
          href: '/admin/collections/categories',
          count: data.categories,
          icon: <Folder />,
          accent: 'orange' as Accent,
        },
      ]
    }

    return [
      postsTip,
      mediaTip,
      {
        key: 'users',
        title: 'Users',
        eyebrow: 'Access Control',
        description:
          'Review your team accounts and make sure the right people have access to the admin workspace.',
        href: '/admin/collections/users',
        count: data.users,
        icon: <Users />,
        accent: 'blue' as Accent,
      },
    ]
  }, [isEditor, data.posts, data.media, data.categories, data.users])

  /* =========================================================
     QUICK TIP AUTO ROTATION
     ========================================================= */

  useEffect(() => {
    if (quickTips.length < 2 || pauseTips) return

    const timer = window.setInterval(() => {
      setActiveTip((current) => (current + 1) % quickTips.length)
    }, 6500)

    return () => window.clearInterval(timer)
  }, [pauseTips, quickTips.length])

  useEffect(() => {
    if (activeTip >= quickTips.length) setActiveTip(0)
  }, [activeTip, quickTips.length])

  /* =========================================================
     COLLECTION CARDS
     ========================================================= */

  const collections = useMemo<CollectionCardProps[]>(() => {
    const cards = {
      users: {
        slug: 'users',
        title: 'Users',
        description: 'Manage all users',
        count: data.users,
        icon: <Users />,
        href: '/admin/collections/users',
        accent: 'purple' as Accent,
        sparkline: SPARK.users,
      },
      media: {
        slug: 'media',
        title: 'Media',
        description: 'Manage media files',
        count: data.media,
        icon: <ImageIcon />,
        href: '/admin/collections/media',
        accent: 'green' as Accent,
        sparkline: SPARK.media,
      },
      categories: {
        slug: 'categories',
        title: 'Categories',
        description: 'Organize categories',
        count: data.categories,
        icon: <Folder />,
        href: '/admin/collections/categories',
        accent: 'orange' as Accent,
        sparkline: SPARK.categories,
      },
      tags: {
        slug: 'tags',
        title: 'Tags',
        description: 'Manage tags',
        count: data.tags,
        icon: <Tags />,
        href: '/admin/collections/tags',
        accent: 'blue' as Accent,
        sparkline: SPARK.tags,
      },
      posts: {
        slug: 'posts',
        title: 'Posts',
        description: 'Manage blog posts',
        count: data.posts,
        icon: <FileText />,
        href: '/admin/collections/posts',
        accent: 'green' as Accent,
        sparkline: SPARK.posts,
      },
      pages: {
        slug: 'pages',
        title: 'Pages',
        description: 'Manage website pages',
        count: data.pages,
        icon: <BookOpen />,
        href: '/admin/collections/pages',
        accent: 'blue' as Accent,
        sparkline: SPARK.pages,
      },
      notFound: {
        slug: 'not-found-logs',
        title: 'Not Found Logs',
        description: '404 error logs',
        count: data.notFoundLogs,
        icon: <AlertTriangleIcon />,
        href: '/admin/collections/not-found-logs',
        accent: 'red' as Accent,
        sparkline: SPARK.notFound,
      },
      redirects: {
        slug: 'redirects',
        title: 'Redirects',
        description: 'Manage URL redirects',
        count: data.redirects,
        icon: <Send />,
        href: '/admin/collections/redirects',
        accent: 'purple' as Accent,
        sparkline: SPARK.redirects,
      },
    }

    if (isEditor) {
      return [cards.media, cards.categories, cards.tags, cards.posts, cards.pages]
    }

    return [
      cards.users,
      cards.media,
      cards.categories,
      cards.tags,
      cards.posts,
      cards.pages,
      cards.notFound,
      cards.redirects,
    ]
  }, [isEditor, data])

  /* =========================================================
     EDITOR PRODUCTIVITY STATS
     ========================================================= */

  const editorStatCards = useMemo(
    () => [
      {
        id: 'publishedThisWeek' as EditorFilterKey,
        title: 'Published This Week',
        description: 'Posts published since Monday',
        value: data.editorStats.publishedThisWeek,
        icon: <Send />,
        accent: 'green' as Accent,
      },
      {
        id: 'publishedThisMonth' as EditorFilterKey,
        title: 'Published This Month',
        description: 'Posts published this month',
        value: data.editorStats.publishedThisMonth,
        icon: <BarChart3 />,
        accent: 'purple' as Accent,
      },
      {
        id: 'updatedThisWeek' as EditorFilterKey,
        title: 'Updated This Week',
        description: 'Posts updated since Monday',
        value: data.editorStats.updatedThisWeek,
        icon: <PenLine />,
        accent: 'blue' as Accent,
      },
      {
        id: 'updatedThisMonth' as EditorFilterKey,
        title: 'Updated This Month',
        description: 'Posts updated this month',
        value: data.editorStats.updatedThisMonth,
        icon: <Clock3 />,
        accent: 'orange' as Accent,
      },
      {
        id: 'draftPosts' as EditorFilterKey,
        title: 'Draft Posts',
        description: 'Posts currently in draft',
        value: data.editorStats.draftPosts,
        icon: <FileClock />,
        accent: 'red' as Accent,
      },
      {
        id: 'scheduledPosts' as EditorFilterKey,
        title: 'Scheduled Posts',
        description: 'Posts waiting for publication',
        value: data.editorStats.scheduledPosts,
        icon: <CalendarDays />,
        accent: 'purple' as Accent,
      },
    ],
    [data.editorStats],
  )

  /* =========================================================
     CAROUSEL CONTROLS
     ========================================================= */

  const goToTip = (index: number) => {
    setActiveTip((index + quickTips.length) % quickTips.length)
  }

  const nextTip = () => {
    setActiveTip((current) => (current + 1) % quickTips.length)
  }

  const previousTip = () => {
    setActiveTip(
      (current) => (current - 1 + quickTips.length) % quickTips.length,
    )
  }

  /* =========================================================
     RENDER
     ========================================================= */

  // Keep a stable shell while Payload auth is resolving. Never return null:
  // doing so creates the large white gap during refresh/layout hydration.
  if (!authResolved) {
    return (
      <main
        className="alloy-dashboard alloy-dashboard--loading"
        aria-busy="true"
      >
        <div className="alloy-dashboard__loading-shell">
          <div className="alloy-dashboard__loading-line alloy-dashboard__loading-line--wide" />
          <div className="alloy-dashboard__loading-line alloy-dashboard__loading-line--medium" />
          <div className="alloy-dashboard__loading-block" />
        </div>
      </main>
    )
  }

  // Never guess admin when the role is missing or invalid.
  if (!user || !userRole || (!isAdmin && !isEditor)) {
    return (
      <main className="alloy-dashboard">
        <section className="alloy-dashboard__error" role="alert">
          <h1>Unable to load dashboard</h1>
          <p>Your AlloyPress account does not have a valid dashboard role.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </section>
      </main>
    )
  }

  const recentLoading = !isReady('recent')

  return (
    <main className="alloy-dashboard">
      {/* =====================================================
          TOPBAR
          ===================================================== */}

      <header className="alloy-dashboard__topbar">
        <div className="alloy-dashboard__topbar-copy">
          <span className="alloy-dashboard__topbar-dot" />
          <span>AlloyPress</span>
          <span className="alloy-dashboard__topbar-separator">/</span>
          <strong>Dashboard</strong>
        </div>

        <button
          type="button"
          className="alloy-theme-toggle"
          aria-label="Toggle Payload theme"
          title="Toggle Payload theme"
          onClick={() => {
            setTheme(theme === 'light' ? 'dark' : 'light')
          }}
        >
          <span className="alloy-theme-toggle__icon alloy-theme-toggle__icon--sun">
            <Sun size={14} aria-hidden="true" />
          </span>

          <span className="alloy-theme-toggle__track" aria-hidden="true">
            <span className="alloy-theme-toggle__thumb">
              <Moon size={10} />
            </span>
          </span>

          <span className="alloy-theme-toggle__label">Theme</span>
        </button>
      </header>

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="alloy-dashboard__hero">
        <div className="alloy-dashboard__hero-left">
          <div className="alloy-dashboard__eyebrow">
            <span className="alloy-dashboard__eyebrow-dot" />
            AlloyPress Control Center
          </div>

          <h1>
            Welcome back, {displayName}!
            <span aria-hidden="true"> 👋</span>
          </h1>

          <p>
            {isEditor
              ? 'Keep your editorial workflow moving.'
              : 'Manage your content and keep your site updated.'}
          </p>

          <div className="alloy-dashboard__hero-actions">
            <div className="alloy-dashboard__date">
              <CalendarDays size={17} aria-hidden="true" />
              <span>{today || '—'}</span>
            </div>

            <Link
              href="/admin/collections/posts/create"
              className="alloy-dashboard__new-content"
            >
              <Plus size={17} aria-hidden="true" />
              <span>New Content</span>
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {loadError && (
            <div className="alloy-dashboard__status" role="status">
              <span>Some dashboard data could not be loaded.</span>

              <button type="button" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* ===================================================
            QUICK ACTIONS
            =================================================== */}

        <div className="alloy-quick-actions">
          <div className="alloy-quick-actions__heading">
            <span className="alloy-section-kicker">⚡</span>
            <h2>Quick Actions</h2>
          </div>

          <div className="alloy-quick-actions__grid">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className={`alloy-quick-action alloy-accent--${action.accent}`}
              >
                <div className="alloy-quick-action__icon">{action.icon}</div>
                <span>{action.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT PERFORMANCE
          ===================================================== */}

      {(isEditor || isAdmin) && (
        <>
          <section className="alloy-section-header">
            <div className="alloy-section-header__title">
              <div className="alloy-section-header__title-row">
                <span className="alloy-section-header__symbol">◈</span>
                <h2>Content Performance</h2>
              </div>

              <p>Track your publishing and editorial activity.</p>
            </div>

            <Link
              href="/admin/collections/posts"
              className="alloy-section-header__link"
            >
              <span>View posts</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>

          <section
            className="alloy-editor-stats"
            aria-label="Content performance statistics"
          >
            {editorStatCards.map((stat) => (
              <Link
                key={stat.title}
                href={editorStatUrls[stat.id]}
                className={`alloy-editor-stat alloy-accent--${stat.accent}`}
              >
                <div className="alloy-editor-stat__top">
                  <div className="alloy-editor-stat__icon">{stat.icon}</div>

                  <span className="alloy-editor-stat__arrow">
                    <ChevronRight size={16} aria-hidden="true" />
                  </span>
                </div>

                <div className="alloy-editor-stat__content">
                  <span className="alloy-editor-stat__title">
                    {stat.title}
                  </span>

                  <strong>
                    {isReady(`s:${stat.id}`)
                      ? stat.value.toLocaleString()
                      : '—'}
                  </strong>

                  <span className="alloy-editor-stat__description">
                    {stat.description}
                  </span>
                </div>
              </Link>
            ))}
          </section>
        </>
      )}

      {/* =====================================================
          COLLECTION HEADER
          ===================================================== */}

      <section className="alloy-section-header">
        <div className="alloy-section-header__title">
          <div className="alloy-section-header__title-row">
            <span className="alloy-section-header__symbol">◈</span>
            <h2>Collections</h2>
          </div>

          <p>
            {isEditor
              ? 'Manage your editorial content and resources.'
              : 'Manage your AlloyPress content and resources.'}
          </p>
        </div>

        <Link
          href="/admin/collections/posts"
          className="alloy-section-header__link"
        >
          <span>View all</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      {/* =====================================================
          COLLECTION CARDS
          ===================================================== */}

      <section className="alloy-collections" aria-label="Collections">
        {collections.map((collection) => (
          <Link
            href={collection.href}
            key={collection.title}
            className={`alloy-collection-card alloy-accent--${collection.accent}`}
          >
            <div className="alloy-collection-card__top">
              <div className="alloy-collection-card__identity">
                <div className="alloy-collection-card__icon">
                  {collection.icon}
                </div>

                <div className="alloy-collection-card__content">
                  <h3>{collection.title}</h3>
                  <p>{collection.description}</p>
                </div>
              </div>

              <div className="alloy-collection-card__arrow">
                <ChevronRight size={18} aria-hidden="true" />
              </div>
            </div>

            <div className="alloy-collection-card__bottom">
              <strong>
                {isReady(
                  collection.slug === 'posts'
                    ? 'recent'
                    : `c:${collection.slug}`,
                )
                  ? collection.count.toLocaleString()
                  : '—'}
              </strong>

              <svg
                className="alloy-sparkline"
                viewBox="0 0 128 28"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline
                  className="alloy-sparkline__line"
                  points={collection.sparkline
                    .map((point) => `${point.x},${point.y}`)
                    .join(' ')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Link>
        ))}
      </section>

      {/* =====================================================
          BOTTOM CONTENT
          ===================================================== */}

      <section className="alloy-dashboard__bottom">
        {/* ===================================================
            RECENT ACTIVITY
            =================================================== */}

        <div className="alloy-panel">
          <div className="alloy-panel__header">
            <div>
              <div className="alloy-panel__title-row">
                <span className="alloy-panel__title-icon">
                  <PenLine size={16} />
                </span>
                <h2>Recent Activity</h2>
              </div>

              <p>Latest content updates</p>
            </div>

            <Link
              href="/admin/collections/posts"
              className="alloy-panel__view-link"
            >
              <span>View all</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="alloy-activity">
            {recentLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  className="alloy-activity__item alloy-skeleton-row"
                  key={index}
                >
                  <span className="alloy-skeleton alloy-skeleton--icon" />
                  <span className="alloy-skeleton alloy-skeleton--text" />
                  <span className="alloy-skeleton alloy-skeleton--dot" />
                </div>
              ))
            ) : data.recentPosts.length === 0 ? (
              <div className="alloy-empty">
                <FileText size={22} aria-hidden="true" />
                <span>No posts available yet.</span>
              </div>
            ) : (
              data.recentPosts.map((post) => {
                const title = post.title || 'Untitled post'

                const updatedAt = post.updatedAt
                  ? new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }).format(new Date(post.updatedAt))
                  : 'Recently'

                return (
                  <Link
                    href={`/admin/collections/posts/${post.id}`}
                    key={post.id}
                    className="alloy-activity__item"
                  >
                    <div className="alloy-activity__icon">
                      <PenLine size={18} aria-hidden="true" />
                    </div>

                    <div className="alloy-activity__content">
                      <strong>{title}</strong>
                      <span>Post updated</span>
                    </div>

                    <time>{updatedAt}</time>

                    <span className="alloy-activity__dot" aria-hidden="true" />
                  </Link>
                )
              })
            )}
          </div>

          {data.recentPosts.length > 0 && !recentLoading && (
            <div className="alloy-panel__footer">
              <Link href="/admin/collections/posts">
                <span>View all activity</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {/* ===================================================
            QUICK TIPS
            =================================================== */}

        <div
          className="alloy-panel alloy-panel--tips"
          onMouseEnter={() => setPauseTips(true)}
          onMouseLeave={() => setPauseTips(false)}
          onFocusCapture={() => setPauseTips(true)}
          onBlurCapture={() => setPauseTips(false)}
        >
          <div className="alloy-panel__header">
            <div>
              <div className="alloy-panel__title-row">
                <span className="alloy-panel__title-icon">
                  <Lightbulb size={16} />
                </span>
                <h2>Quick Tips</h2>
              </div>

              <p>
                {isEditor
                  ? 'Helpful editorial shortcuts'
                  : 'Tips to help you manage your site better'}
              </p>
            </div>

            <Lightbulb
              className="alloy-panel__header-tip-icon"
              size={20}
              aria-hidden="true"
            />
          </div>

          <div className="alloy-tip-carousel">
            <div className="alloy-tip-carousel__viewport">
              {quickTips.map((tip, index) => (
                <article
                  key={tip.key}
                  className={`alloy-tip alloy-accent--${tip.accent} ${index === activeTip ? 'is-active' : ''
                    }`}
                  aria-hidden={index !== activeTip}
                >
                  <div className="alloy-tip__visual">
                    <span className="alloy-tip__visual-orbit alloy-tip__visual-orbit--one" />
                    <span className="alloy-tip__visual-orbit alloy-tip__visual-orbit--two" />

                    <div className="alloy-tip__visual-icon">{tip.icon}</div>

                    <span className="alloy-tip__visual-count">
                      {tip.count.toLocaleString()}
                    </span>
                  </div>

                  <div className="alloy-tip__content">
                    <span className="alloy-tip__eyebrow">{tip.eyebrow}</span>

                    <h3>{tip.title}</h3>

                    <p>{tip.description}</p>

                    <Link href={tip.href}>
                      <span>Open {tip.title}</span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="alloy-tip-carousel__footer">
              <div
                className="alloy-tip-carousel__dots"
                aria-label="Quick tip slides"
              >
                {quickTips.map((tip, index) => (
                  <button
                    key={tip.key}
                    type="button"
                    className={`alloy-tip-carousel__dot ${index === activeTip ? 'is-active' : ''
                      }`}
                    aria-label={`Show ${tip.title} tip`}
                    aria-current={index === activeTip ? 'true' : undefined}
                    onClick={() => goToTip(index)}
                  />
                ))}
              </div>

              <div className="alloy-tip-carousel__controls">
                <button
                  type="button"
                  onClick={previousTip}
                  aria-label="Previous quick tip"
                >
                  <ChevronLeft size={15} />
                </button>

                <span>
                  {activeTip + 1}/{quickTips.length}
                </span>

                <button
                  type="button"
                  onClick={nextTip}
                  aria-label="Next quick tip"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="alloy-dashboard__footer">
        <span>
          © {currentYear ?? 'AlloyPress'} AlloyPress. All rights reserved.
        </span>

        <span>Payload CMS V3.0.0</span>
      </footer>
    </main>
  )
}

/* =========================================================
   LOCAL ICON
   ========================================================= */

function AlertTriangleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10.3 3.6 2.7 17a2 2 0 0 0 1.74 3h15.12a2 2 0 0 0 1.74-3L13.7 3.6a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  )
}