import type { Access, CollectionConfig, Where } from 'payload'

import { forbidUnlessInternalOrUser } from '../access/internalKey'

const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

export const NEWSLETTER_INTERESTS = [
  { label: 'AI Guides & Tutorials', value: 'guides-tutorials' },
  { label: 'AI Tools & Recommendations', value: 'tools-recommendations' },
  { label: 'AI Tool Reviews & Comparisons', value: 'reviews-comparisons' },
  { label: 'AI News & Updates', value: 'news-updates' },
] as const

const VALID_INTERESTS = NEWSLETTER_INTERESTS.map((i) => i.value) as string[]

const MIN_INTERESTS = 1
const MAX_INTERESTS = 4

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Cloudflare: XX = unknown, T1 = Tor
const IGNORED_COUNTRY_CODES = ['XX', 'T1']

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

const toCountryCode = (value: unknown): string | undefined => {
  const code = String(value || '').trim().toUpperCase()

  if (!/^[A-Z]{2}$/.test(code)) return undefined
  if (IGNORED_COUNTRY_CODES.includes(code)) return undefined

  return code
}

// CSV cell escape (+ CSV injection protection: =, +, -, @ la start aana cells)
const csvCell = (value: unknown): string => {
  let s = value == null ? '' : String(value)

  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`

  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// =========================================================
// COLLECTION
// =========================================================

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',

  admin: {
    useAsTitle: 'email',
    defaultColumns: [
      'email',
      'interests',
      'country',
      'status',
      'source',
      'subscribedAt',
    ],
    description: 'Newsletter subscribers and their interests.',
    group: 'Audience',

    components: {
      // Counts + CSV export buttons list-oda top-la
      beforeList: ['/components/SubscribersStats'],
    },
  },

  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },

  // =======================================================
  // CUSTOM ENDPOINT: POST /api/subscribers/subscribe
  // Body: { email, interests: string[], source?, countryCode?, website? }
  // `website` = honeypot (hidden input). Bots fill it, humans don't.
  // =======================================================

  endpoints: [
    {
      path: '/subscribe',
      method: 'post',

      handler: async (req) => {
        // Custom endpoints bypass collection access, so check manually
        const denied = forbidUnlessInternalOrUser(req)
        if (denied) return denied

        let body: Record<string, unknown> = {}

        try {
          body = (await req.json?.()) ?? {}
        } catch {
          return Response.json({ error: 'Invalid request' }, { status: 400 })
        }

        // Honeypot: pretend success, store nothing
        if (body.website) return Response.json({ ok: true })

        // ---- email ----
        const email = String(body.email || '').trim().toLowerCase()

        if (!EMAIL_RE.test(email) || email.length > 254) {
          return Response.json(
            { error: 'Please enter a valid email address.' },
            { status: 400 },
          )
        }

        // ---- interests (min 1, max 4, only known values, deduped) ----
        const interests = [
          ...new Set(
            (Array.isArray(body.interests) ? body.interests : []).filter(
              (i): i is string => typeof i === 'string' && VALID_INTERESTS.includes(i),
            ),
          ),
        ]

        if (interests.length < MIN_INTERESTS) {
          return Response.json(
            { error: 'Pick at least one topic to continue.' },
            { status: 400 },
          )
        }

        if (interests.length > MAX_INTERESTS) {
          return Response.json({ error: 'Too many topics selected.' }, { status: 400 })
        }

        const source = String(body.source || 'home-newsletter').slice(0, 60)
        const countryCode = toCountryCode(body.countryCode)

        // ---- upsert ----
        const existing = await req.payload.find({
          collection: 'subscribers',
          where: { email: { equals: email } },
          limit: 1,
          depth: 0,
        })

        const doc = existing.docs[0]

        if (doc) {
          // Already subscribed (or imported from Webpushr): merge interests,
          // re-activate, fill country only if missing.
          const merged = [...new Set([...(doc.interests || []), ...interests])]

          await req.payload.update({
            collection: 'subscribers',
            id: doc.id,
            data: {
              interests: merged as any,
              status: 'active',
              unsubscribedAt: null,
              ...(!doc.countryCode && countryCode ? { countryCode } : {}),
            } as any,
          })
        } else {
          await req.payload.create({
            collection: 'subscribers',
            data: {
              email,
              interests: interests as any,
              source,
              status: 'active',
              ...(countryCode ? { countryCode } : {}),
            } as any,
          })
        }

        // Same response in both cases: email enumeration thavirkka
        return Response.json({ ok: true })
      },
    },

    // -----------------------------------------------------
    // EXPORT CSV (admin only)
    // Optional query: ?status=active  ?interest=news-updates  ?country=IN
    // -----------------------------------------------------
    {
      path: '/export-csv',
      method: 'get',

      handler: async (req) => {
        if (req.user?.role !== 'admin') {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        const params = new URL(req.url as string).searchParams
        const status = params.get('status')
        const interest = params.get('interest')
        const country = params.get('country')

        const and: Where[] = []

        if (status) and.push({ status: { equals: status } })
        if (interest) and.push({ interests: { equals: interest } } as Where)
        if (country) and.push({ countryCode: { equals: country.toUpperCase() } })

        const lines: string[] = [
          [
            'email',
            'interests',
            'status',
            'country',
            'countryCode',
            'source',
            'subscribedAt',
            'unsubscribedAt',
          ]
            .map(csvCell)
            .join(','),
        ]

        let page = 1
        let hasNext = true

        while (hasNext) {
          const res = await req.payload.find({
            collection: 'subscribers',
            where: and.length ? { and } : undefined,
            limit: 1000,
            page,
            depth: 0,
            sort: '-subscribedAt',
          })

          for (const d of res.docs as any[]) {
            lines.push(
              [
                d.email,
                (d.interests || []).join('|'),
                d.status,
                d.country,
                d.countryCode,
                d.source,
                d.subscribedAt,
                d.unsubscribedAt,
              ]
                .map(csvCell)
                .join(','),
            )
          }

          hasNext = res.hasNextPage
          page++
        }

        const date = new Date().toISOString().slice(0, 10)

        // \uFEFF = BOM, Excel-la special characters sariyaa theriya
        return new Response('\uFEFF' + lines.join('\r\n'), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="subscribers-${date}.csv"`,
          },
        })
      },
    },
  ],

  // =======================================================
  // HOOKS
  // =======================================================

  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (data.email) {
          data.email = String(data.email).trim().toLowerCase()
        }

        if (operation === 'create') {
          // Import script own date kuduthaa atha respect pannum
          data.subscribedAt = data.subscribedAt || new Date().toISOString()
          data.unsubscribeToken = data.unsubscribeToken || crypto.randomUUID()
        }

        if (data.status === 'unsubscribed' && !data.unsubscribedAt) {
          data.unsubscribedAt = new Date().toISOString()
        }

        if (data.status === 'active') {
          data.unsubscribedAt = null
        }

        // Country name auto-derive from code
        if (data.countryCode) {
          data.countryCode = String(data.countryCode).toUpperCase()

          try {
            data.country = regionNames.of(data.countryCode) || null
          } catch {
            data.country = null
          }
        }

        return data
      },
    ],
  },

  // =======================================================
  // FIELDS
  // =======================================================

  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },

    {
      name: 'interests',
      type: 'select',
      hasMany: true,
      options: [...NEWSLETTER_INTERESTS],

      admin: {
        description:
          'Min 1, max 4 for website signups. Empty is allowed only for Webpushr imports.',
      },

      validate: ((value: unknown, { siblingData }: { siblingData?: { source?: string } }) => {
        // Imported users (no interests chosen yet)
        if (siblingData?.source === 'webpushr-import') return true

        const list = Array.isArray(value) ? value : []

        if (list.length < MIN_INTERESTS) return 'Select at least one interest.'
        if (list.length > MAX_INTERESTS) return `Maximum ${MAX_INTERESTS} interests.`

        return true
      }) as any,
    },

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,

      options: [
        { label: 'Active', value: 'active' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],

      admin: { position: 'sidebar' },
    },

    {
      name: 'source',
      type: 'text',
      index: true,

      admin: {
        position: 'sidebar',
        description: 'e.g. home-newsletter, webpushr-import',
      },
    },

    {
      name: 'countryCode',
      type: 'text',
      maxLength: 2,
      index: true,

      admin: {
        position: 'sidebar',
        description: 'ISO 3166-1 alpha-2 code, e.g. IN, US.',
      },
    },

    {
      name: 'country',
      type: 'text',

      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-filled from country code.',
      },
    },

    {
      name: 'subscribedAt',
      type: 'date',

      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },

    {
      name: 'unsubscribedAt',
      type: 'date',

      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },

    {
      name: 'unsubscribeToken',
      type: 'text',
      index: true,

      admin: {
        readOnly: true,
        description: 'Used for the unsubscribe / preferences link in emails.',
      },
    },
  ],
}