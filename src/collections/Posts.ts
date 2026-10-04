import type { Access, Block, CollectionConfig, Field } from 'payload'
import type { PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres/drizzle'

import {
  BlocksFeature,
  CodeBlock,
  EXPERIMENTAL_TableFeature,
  TextStateFeature,
  LinkFeature,
  UploadFeature,
  FixedToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { textStateConfig } from '@/fields/textStateConfig'

const isEditorOrAdmin: Access = ({ req }) => {
  const role = req.user?.role

  return role === 'editor' || role === 'admin'
}

const isAdmin: Access = ({ req }) => {
  const role = req.user?.role

  return role === 'admin'
}

const SEARCH_MAX_RESULTS = 8
const SEARCH_MAX_QUERY_LENGTH = 80
const SEARCH_MAX_TERMS = 6
const SEARCH_WORD_SIMILARITY_THRESHOLD = 0.30

const SEARCH_ALLOWED_CATEGORY_SLUGS = [
  'blogs',
  'reviews',
  'news',
  'alternatives',
  'comparisons',
] as const

const SEARCH_STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'to',
  'of',
  'in',
  'on',
  'with',
  'is',
  'are',
])

type SearchResultRow = {
  id: string | number
  title: string | null
  slug: string | null
  excerpt: string | null
  publishedAt: string | null
  featuredImage: {
    id: string | number
    url: string | null
    alt: string | null
  } | null
  category: {
    id: string | number
    name: string | null
    slug: string | null
  } | null
  score: number | string
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

function normalizeSearchQuery(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .slice(0, SEARCH_MAX_QUERY_LENGTH)

  const terms = [
    ...new Set(
      normalized
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .split(/\s+/)
        .map((term) => term.trim())
        .filter(
          (term) =>
            term.length >= 2 && !SEARCH_STOP_WORDS.has(term),
        ),
    ),
  ].slice(0, SEARCH_MAX_TERMS)

  return {
    normalized,
    terms,
  }
}

async function searchPostsWithSimilarity(
  req: PayloadRequest,
  query: string,
  requestedLimit: number,
): Promise<SearchResultRow[]> {
  const { normalized, terms } = normalizeSearchQuery(query)

  if (!normalized || terms.length === 0) {
    return []
  }

  const limit = Math.min(
    Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 20, 1),
    SEARCH_MAX_RESULTS,
  )

  const candidateConditions = terms.map((term) => {
    const partial = `%${escapeLikePattern(term)}%`

    const fuzzyThreshold =
      term.length <= 4
        ? 0.30
        : term.length <= 6
          ? 0.25
          : 0.25

    return sql`
    (
      word_similarity(${term}, COALESCE(p.title, '')) >= ${fuzzyThreshold}
      OR word_similarity(${term}, COALESCE(p.slug, '')) >= ${fuzzyThreshold}
      OR word_similarity(${term}, COALESCE(p.excerpt, '')) >= ${fuzzyThreshold}
      OR word_similarity(${term}, COALESCE(c.name, '')) >= ${fuzzyThreshold}
      OR word_similarity(${term}, COALESCE(c.slug, '')) >= ${fuzzyThreshold}
      OR p.title ILIKE ${partial}
      OR p.slug ILIKE ${partial}
      OR p.excerpt ILIKE ${partial}
      OR c.name ILIKE ${partial}
      OR c.slug ILIKE ${partial}
    )
  `
  })

  const scoreParts = terms.map((term) => {
    const shortTermWeight =
      term.length <= 2
        ? 0.35
        : term.length === 3
          ? 0.65
          : 1

    return sql`
      GREATEST(
        word_similarity(${term}, COALESCE(p.title, '')) * 1.00,
        word_similarity(${term}, COALESCE(p.slug, '')) * 0.90,
        word_similarity(${term}, COALESCE(p.excerpt, '')) * 0.45,
        word_similarity(${term}, COALESCE(c.name, '')) * 0.65,
        word_similarity(${term}, COALESCE(c.slug, '')) * 0.65
      ) * ${shortTermWeight}
    `
  })

  const scoreExpression = sql.join(
    scoreParts.map((part) => sql`(${part})`),
    sql` + `,
  )

  const exactPhraseBoost = sql`
    CASE
      WHEN p.title ILIKE ${`%${escapeLikePattern(normalized)}%`} THEN 4
      ELSE 0
    END
  `

  const titlePrefixBoost = sql`
    CASE
      WHEN p.title ILIKE ${`${escapeLikePattern(terms[0])}%`} THEN 1.5
      ELSE 0
    END
  `

  const result = await req.payload.db.drizzle.execute(sql`
    SELECT
      p.id AS "id",
      p.title AS "title",
      p.slug AS "slug",
      p.excerpt AS "excerpt",
     p.published_at AS "publishedAt",
CASE
  WHEN m.id IS NULL THEN NULL
  ELSE jsonb_build_object(
    'id', m.id,
    'url', m.url,
    'alt', m.alt
  )
END AS "featuredImage",
jsonb_build_object(
  'id', c.id,
  'name', c.name,
  'slug', c.slug
) AS "category",
      (
        ${scoreExpression}
        + ${exactPhraseBoost}
        + ${titlePrefixBoost}
      ) AS "score"
    FROM posts AS p
INNER JOIN categories AS c
  ON c.id = p.category_id
LEFT JOIN media AS m
  ON m.id = p.featured_image_id
    WHERE
      p._status = 'published'
      AND c.slug IN (${sql.join(
    SEARCH_ALLOWED_CATEGORY_SLUGS.map((slug) => sql`${slug}`),
    sql`, `,
  )})
      AND (
        ${sql.join(candidateConditions, sql` OR `)}
      )
    ORDER BY
      "score" DESC,
      p.published_at DESC NULLS LAST
    LIMIT ${limit}
  `)

  return (result.rows || []) as unknown as SearchResultRow[]
}

/* -------------------------------------------------------------------------- */
/* Code block with Code / Preview toggle in the admin editor                   */
/* -------------------------------------------------------------------------- */

const baseCodeBlock = CodeBlock({
  languages: {
    plaintext: 'Plain Text',
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'JSX',
    tsx: 'TSX',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    bash: 'Bash',
    sql: 'SQL',
  },
})

// Same built-in block (slug, header, language dropdown, copy button unchanged);
// only the `code` field gets the custom Code / Preview wrapper.
const CodeBlockWithPreview: Block = {
  ...baseCodeBlock,
  fields: baseCodeBlock.fields.map((f: any) =>
    f.name === 'code'
      ? {
        ...f,
        admin: {
          ...f.admin,
          components: {
            ...f.admin?.components,
            Field: '/components/admin/CodePreviewField#CodePreviewField',
          },
        },
      }
      : f,
  ) as Block['fields'],
}

/* -------------------------------------------------------------------------- */
/* Main rich-text content field (moved out so the tabs layout stays readable)  */
/* -------------------------------------------------------------------------- */

const contentField: Field = {
  name: 'content',
  type: 'richText',
  required: true,
  label: 'Content',

  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,

      FixedToolbarFeature(),

      TextStateFeature({
        state: {
          color: textStateConfig.color,
          backgroundColor: textStateConfig.backgroundColor,
          fontFamily: textStateConfig.fontFamily,
          fontSize: textStateConfig.fontSize,
          textStyle: textStateConfig.textStyle,
          decoration: textStateConfig.decoration,
        },
      }),

      LinkFeature({
        fields: ({ defaultFields }) => [
          ...defaultFields.filter(
            (field) => field.name !== 'rel',
          ),

          {
            name: 'nofollow',
            type: 'checkbox',
            label: 'Set to nofollow',
            defaultValue: false,

            admin: {
              description:
                'Use this when search engines should not pass SEO authority through this link.',
            },
          },

          {
            name: 'sponsored',
            type: 'checkbox',
            label: 'Set to sponsored',
            defaultValue: false,

            admin: {
              description:
                'Use this for paid, sponsored, affiliate, or advertising links.',
            },
          },

          {
            name: 'noopener',
            type: 'checkbox',
            label: 'Set to noopener',
            defaultValue: false,

            admin: {
              description:
                'Prevents the destination page from accessing the original page through window.opener.',
            },
          },

          {
            name: 'noreferrer',
            type: 'checkbox',
            label: 'Set to noreferrer',
            defaultValue: false,

            admin: {
              description:
                'Prevents the referring page URL from being sent to the destination.',
            },
          },
        ],
      }),

      UploadFeature({
        collections: {
          media: {
            fields: [],
          },
        },
      }),

      BlocksFeature({
        blocks: [
          CodeBlockWithPreview,

          {
            slug: 'videoEmbed',

            labels: {
              singular: 'Video / Embed',
              plural: 'Videos / Embeds',
            },

            fields: [
              {
                name: 'url',
                type: 'text',
                required: true,
                label: 'Video / Embed URL',
              },

              {
                name: 'provider',
                type: 'select',
                defaultValue: 'youtube',

                options: [
                  {
                    label: 'YouTube',
                    value: 'youtube',
                  },
                  {
                    label: 'Vimeo',
                    value: 'vimeo',
                  },
                  {
                    label: 'Other',
                    value: 'other',
                  },
                ],
              },

              {
                name: 'caption',
                type: 'text',
                label: 'Caption',
              },
            ],
          },

          {
            slug: 'videoFile',

            labels: {
              singular: 'Video File',
              plural: 'Video Files',
            },

            fields: [
              {
                name: 'video',
                type: 'upload',
                relationTo: 'media',
                required: true,

                label: 'Video File',

                admin: {
                  description:
                    'Select a self-hosted video file from the Media library.',
                },
              },

              {
                name: 'caption',
                type: 'text',
                label: 'Caption',
              },
            ],
          },

          {
            slug: 'audio',

            labels: {
              singular: 'Audio',
              plural: 'Audio',
            },

            fields: [
              {
                name: 'audio',
                type: 'upload',
                relationTo: 'media',
                required: true,

                label: 'Audio File',

                admin: {
                  description:
                    'Select an audio file from the Media library.',
                },
              },

              {
                name: 'title',
                type: 'text',
                label: 'Audio Title',

                admin: {
                  description:
                    'Optional title displayed above the audio player.',
                },
              },

              {
                name: 'caption',
                type: 'text',
                label: 'Caption',

                admin: {
                  description:
                    'Optional caption displayed below the audio player.',
                },
              },
            ],
          },

          {
            slug: 'styledBox',

            labels: {
              singular: 'Styled Box',
              plural: 'Styled Boxes',
            },

            fields: [
              {
                name: 'heading',
                type: 'text',
                label: 'Heading',
              },

              {
                name: 'text',
                type: 'textarea',
                label: 'Body Text',
              },

              {
                name: 'backgroundColor',
                type: 'select',
                label: 'Background Color',

                options: [
                  { label: 'Green', value: 'green' },
                  { label: 'Yellow', value: 'yellow' },
                  { label: 'Blue', value: 'blue' },
                  { label: 'Red', value: 'red' },
                  { label: 'Gray', value: 'gray' },
                ],

                admin: {
                  description:
                    'Matches the swatch names produced by the WordPress migration background-color snapping.',
                },
              },

              {
                name: 'borderColor',
                type: 'select',
                label: 'Border Color',

                options: [
                  { label: 'Green', value: 'green' },
                  { label: 'Yellow', value: 'yellow' },
                  { label: 'Blue', value: 'blue' },
                  { label: 'Red', value: 'red' },
                  { label: 'Gray', value: 'gray' },
                  { label: 'Brand Green', value: 'brand-green' },
                ],

                admin: {
                  description:
                    'Matches the swatch names produced by the WordPress migration border-color snapping (includes brand-green for #1DBA6E).',
                },
              },

              {
                name: 'borderWidth',
                type: 'text',
                label: 'Border Width',

                admin: {
                  description:
                    'e.g. "1.5px". Taken from the original inline border-width style when present.',
                },
              },
            ],
          },

          {
            slug: 'htmlContent',

            labels: {
              singular: 'HTML Content',
              plural: 'HTML Content Blocks',
            },

            fields: [
              {
                name: 'html',
                type: 'code',
                required: true,
                label: 'HTML',

                admin: {
                  description:
                    'Use for migrated or complex article HTML such as comparison tables, custom layouts, buttons, and other supported HTML content.',

                  components: {
                    Field:
                      '/components/admin/HTMLPreviewField#HTMLPreviewField',
                  },
                },
              },
            ],
          },

          {
            slug: 'ctaButton',
            labels: {
              singular: 'CTA Button',
              plural: 'CTA Buttons',
            },
            fields: [
              // ---------- Writers use panra main fields ----------
              {
                type: 'row',
                fields: [
                  {
                    name: 'label',
                    type: 'text',
                    required: true,
                    label: 'Button Label',
                    admin: { width: '50%' },
                  },
                  {
                    name: 'url',
                    type: 'text',
                    required: true,
                    label: 'Button URL',
                    admin: { width: '50%' },
                  },
                ],
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'alignment',
                    type: 'select',
                    label: 'Alignment',
                    defaultValue: 'center',
                    options: [
                      { label: 'Left', value: 'left' },
                      { label: 'Center', value: 'center' },
                      { label: 'Right', value: 'right' },
                    ],
                    admin: { width: '50%' },
                  },
                  {
                    name: 'openInNewTab',
                    type: 'checkbox',
                    label: 'Open in New Tab',
                    defaultValue: false,
                    admin: { width: '50%' },
                  },
                ],
              },

              // ---------- Advanced: default-a mudi irukkum ----------
              {
                type: 'collapsible',
                label: 'Advanced styling (optional)',
                admin: { initCollapsed: true },
                fields: [
                  // ---- Colors ----
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'backgroundColor',
                        type: 'text',
                        label: 'Background Color',
                        defaultValue: '#16a34a',
                        admin: { width: '50%', components: { Field: '/components/admin/CTAColorField#CTAColorField' } },
                      },
                      {
                        name: 'textColor',
                        type: 'text',
                        label: 'Text Color',
                        defaultValue: '#ffffff',
                        admin: { width: '50%', components: { Field: '/components/admin/CTAColorField#CTAColorField' } },
                      },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'hoverBackgroundColor',
                        type: 'text',
                        label: 'Hover Background',
                        defaultValue: '#15803d',
                        admin: { width: '50%', components: { Field: '/components/admin/CTAColorField#CTAColorField' } },
                      },
                      {
                        name: 'hoverTextColor',
                        type: 'text',
                        label: 'Hover Text Color',
                        defaultValue: '#ffffff',
                        admin: { width: '50%', components: { Field: '/components/admin/CTAColorField#CTAColorField' } },
                      },
                    ],
                  },

                  // ---- Border ----
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'borderColor',
                        type: 'text',
                        label: 'Border Color',
                        defaultValue: '#16a34a',
                        admin: { width: '50%', components: { Field: '/components/admin/CTAColorField#CTAColorField' } },
                      },
                      {
                        name: 'borderStyle',
                        type: 'select',
                        label: 'Border Style',
                        defaultValue: 'solid',
                        options: [
                          { label: 'None', value: 'none' },
                          { label: 'Solid', value: 'solid' },
                          { label: 'Dashed', value: 'dashed' },
                          { label: 'Dotted', value: 'dotted' },
                        ],
                        admin: { width: '50%' },
                      },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'borderWidth',
                        type: 'text',
                        label: 'Border Width',
                        defaultValue: '1px',
                        admin: { width: '50%' },
                      },
                      {
                        name: 'borderRadius',
                        type: 'text',
                        label: 'Border Radius',
                        defaultValue: '8px',
                        admin: { width: '50%' },
                      },
                    ],
                  },

                  // ---- Typography ----
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'fontSize',
                        type: 'text',
                        label: 'Font Size',
                        defaultValue: '16px',
                        admin: { width: '50%' },
                      },
                      {
                        name: 'fontWeight',
                        type: 'select',
                        label: 'Font Weight',
                        defaultValue: '700',
                        options: [
                          { label: 'Normal', value: '400' },
                          { label: 'Medium', value: '500' },
                          { label: 'Semibold', value: '600' },
                          { label: 'Bold', value: '700' },
                          { label: 'Extra Bold', value: '800' },
                        ],
                        admin: { width: '50%' },
                      },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'textTransform',
                        type: 'select',
                        label: 'Text Transform',
                        defaultValue: 'none',
                        options: [
                          { label: 'Normal', value: 'none' },
                          { label: 'Uppercase', value: 'uppercase' },
                          { label: 'Lowercase', value: 'lowercase' },
                          { label: 'Capitalize', value: 'capitalize' },
                        ],
                        admin: { width: '50%' },
                      },
                      {
                        name: 'letterSpacing',
                        type: 'text',
                        label: 'Letter Spacing',
                        defaultValue: '0',
                        admin: { width: '50%' },
                      },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'italic',
                        type: 'checkbox',
                        label: 'Italic',
                        defaultValue: false,
                        admin: { width: '50%' },
                      },
                      {
                        name: 'underline',
                        type: 'checkbox',
                        label: 'Underline',
                        defaultValue: false,
                        admin: { width: '50%' },
                      },
                    ],
                  },

                  // ---- Size, shadow & icon ----
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'padding',
                        type: 'text',
                        label: 'Padding',
                        defaultValue: '12px 20px',
                        admin: { width: '50%' },
                      },
                      {
                        name: 'minWidth',
                        type: 'text',
                        label: 'Minimum Width',
                        defaultValue: 'auto',
                        admin: { width: '50%' },
                      },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'shadow',
                        type: 'select',
                        label: 'Shadow',
                        defaultValue: 'small',
                        options: [
                          { label: 'None', value: 'none' },
                          { label: 'Small', value: 'small' },
                          { label: 'Medium', value: 'medium' },
                          { label: 'Large', value: 'large' },
                        ],
                        admin: { width: '33%' },
                      },
                      {
                        name: 'icon',
                        type: 'select',
                        label: 'Icon',
                        defaultValue: 'none',
                        options: [
                          { label: 'None', value: 'none' },
                          { label: 'Arrow →', value: 'arrow' },
                          { label: 'External ↗', value: 'external' },
                          { label: 'Download ↓', value: 'download' },
                        ],
                        admin: { width: '33%' },
                      },
                      {
                        name: 'iconPosition',
                        type: 'select',
                        label: 'Icon Position',
                        defaultValue: 'right',
                        options: [
                          { label: 'Left', value: 'left' },
                          { label: 'Right', value: 'right' },
                        ],
                        admin: { width: '33%' },
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            slug: 'faq',

            labels: {
              singular: 'FAQ',
              plural: 'FAQs',
            },

            fields: [
              {
                name: 'items',
                type: 'array',
                label: 'Questions',
                minRows: 1,
                required: true,

                admin: {
                  description:
                    'Add only ONE FAQ block per post. Answers are plain text.',
                },

                fields: [
                  {
                    name: 'question',
                    type: 'text',
                    required: true,
                    label: 'Question',
                  },
                  {
                    name: 'answer',
                    type: 'textarea',
                    required: true,
                    label: 'Answer',
                  },
                ],
              },
            ],
          },
        ],
      }),

      EXPERIMENTAL_TableFeature(),
    ],
  }),

  admin: {
    description:
      'Main article content. Add formatted text, links, images, videos, audio, styled boxes, buttons, code and tables.',
  },
}

export const Posts: CollectionConfig = {
  slug: 'posts',

  access: {
    read: ({ req }) => {
      if (req.user) {
        return true
      }

      return {
        workflowStatus: {
          equals: 'published',
        },
      }
    },

    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: isAdmin,
  },

  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (data._status === 'published') {
          if (!data.publishedAt) {
            data.publishedAt = new Date().toISOString()
          }

          data.workflowStatus = 'published'
        }

        return data
      },
    ],

    afterChange: [
      async ({ doc, req }) => {
        if (doc._status !== 'published' || !doc.slug) {
          return
        }

        const webUrl = process.env.WEB_REVALIDATION_URL
        const secret = process.env.REVALIDATION_SECRET

        if (!webUrl || !secret) {
          req.payload.logger.warn(
            'Revalidation skipped: WEB_REVALIDATION_URL or REVALIDATION_SECRET is missing.',
          )
          return
        }

        try {
          let categorySlug: string | undefined

          if (doc.category) {
            const categoryId =
              typeof doc.category === 'object' && doc.category !== null
                ? doc.category.id
                : doc.category

            const category = (await req.payload.findByID({
              collection: 'categories',
              id: categoryId,
              depth: 0,
            })) as { slug?: unknown } | null

            if (typeof category?.slug === 'string') {
              categorySlug = category.slug
            }
          }

          const authorSlug = 'alloypress-team'

          const response = await fetch(webUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-revalidate-secret': secret,
            },
            body: JSON.stringify({
              slug: doc.slug,
              categorySlug,
              authorSlug,
            }),
          })

          if (!response.ok) {
            const responseText = await response.text().catch(() => '')

            req.payload.logger.error(
              `Web revalidation returned ${response.status}: ${responseText || response.statusText}`,
            )
          }
        } catch (error) {
          req.payload.logger.error(
            `Failed to trigger web revalidation for post: ${doc.slug} - ${error instanceof Error ? error.message : String(error)
            }`,
          )
        }
      },
    ],
  },

  endpoints: [
    {
      path: '/search',
      method: 'get',

      handler: async (req) => {
        if (!req.url) {
          return Response.json({
            docs: [],
            totalDocs: 0,
          })
        }

        const url = new URL(req.url)
        const query = url.searchParams.get('q')?.trim() || ''
        const requestedLimit = Number(url.searchParams.get('limit') || '20')

        if (!query) {
          return Response.json({
            docs: [],
            totalDocs: 0,
          })
        }

        try {
          const docs = await searchPostsWithSimilarity(
            req,
            query,
            requestedLimit,
          )

          return Response.json({
            docs,
            totalDocs: docs.length,
          })
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : String(error)

          console.error('[SEARCH ERROR]', error)

          return Response.json(
            {
              docs: [],
              totalDocs: 0,
              error: message,
            },
            { status: 500 },
          )
        }
      },
    },

    {
      // Used ONLY by the frontend preview page (server-to-server).
      // The public REST API hides drafts from anonymous requests, so the
      // preview page could never load an unpublished post. This endpoint
      // returns the latest draft, but only when the shared secret matches.
      path: '/preview-doc',
      method: 'get',

      handler: async (req) => {
        const expectedSecret = process.env.PREVIEW_SECRET

        const url = new URL(req.url || '')
        const providedSecret =
          req.headers.get('x-preview-secret') ||
          url.searchParams.get('secret')

        if (!expectedSecret || providedSecret !== expectedSecret) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const id = url.searchParams.get('id')

        if (!id) {
          return Response.json({ error: 'Missing id' }, { status: 400 })
        }

        try {
          const doc = await req.payload.findByID({
            collection: 'posts',
            id,
            draft: true,
            depth: 1,
            overrideAccess: true,
          })

          return Response.json(doc)
        } catch {
          return Response.json({ error: 'Not found' }, { status: 404 })
        }
      },
    },

    {
      path: '/sitemap-posts',
      method: 'get',

      handler: async (req) => {
        const posts = await req.payload.find({
          collection: 'posts',

          where: {
            and: [
              {
                includeInSitemap: {
                  equals: true,
                },
              },
              {
                _status: {
                  equals: 'published',
                },
              },
            ],
          },

          limit: 1000,
          depth: 1,

          select: {
            title: true,
            slug: true,
            publishedAt: true,
            updatedAt: true,
            includeInSitemap: true,
          },
        })

        return Response.json({
          posts: posts.docs,
        })
      },
    },

    {
      path: '/news-sitemap-posts',
      method: 'get',

      handler: async (req) => {
        const posts = await req.payload.find({
          collection: 'posts',

          where: {
            and: [
              {
                includeInSitemap: {
                  equals: true,
                },
              },
              {
                _status: {
                  equals: 'published',
                },
              },
              {
                publishedAt: {
                  greater_than_equal: new Date(
                    Date.now() - 2 * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                },
              },
            ],
          },

          limit: 1000,
          depth: 1,

          select: {
            title: true,
            slug: true,
            publishedAt: true,
          },
        })

        return Response.json({
          posts: posts.docs,
        })
      },
    },
  ],

  admin: {
    useAsTitle: 'title',

    description:
      'Create, edit and manage AlloyPress blog posts.',

    components: {
      edit: {
        beforeDocumentControls: [
          '/components/DocumentUndoRedo#DocumentUndoRedo',
        ],
      },
    },

    defaultColumns: [
      'title',
      'category',
      'author',
      'publishedAt',
      'updatedAt',
      '_status',
    ],

    livePreview: {
      url: ({ data }) => {
        // Base URL of the frontend that renders /preview/blogs/[slug].
        // Set LIVE_PREVIEW_BASE_URL in .env (e.g. http://localhost:3000 for dev,
        // or your live Cloudflare/Vercel URL) so you are not tied to one host.
        const baseUrl = (
          process.env.LIVE_PREVIEW_BASE_URL ||
          'https://alloypress.abhub-net.workers.dev'
        ).replace(/\/$/, '')

        const slug =
          typeof data?.slug === "string" && data.slug.trim()
            ? data.slug.trim()
            : "__preview__";

        const id =
          data?.id !== undefined && data?.id !== null
            ? String(data.id)
            : "";

        const query = new URLSearchParams()

        if (id) {
          query.set('id', id)
        }

        // same value must exist in the frontend env as PREVIEW_SECRET
        if (process.env.PREVIEW_SECRET) {
          query.set('secret', process.env.PREVIEW_SECRET)
        }

        const qs = query.toString()

        return `${baseUrl}/preview/blogs/${slug}${qs ? `?${qs}` : ''}`;
      },
    },
  },

  versions: {
    maxPerDoc: 20,

    drafts: {
      autosave: {
        interval: 1500,
        showSaveDraftButton: true,
      },
      schedulePublish: true,
    },
  },

  fields: [
    // =====================================================================
    // RIGHT SIDEBAR (WordPress-style panels)
    // Top-level collapsible + admin.position 'sidebar' => renders in sidebar.
    // (A `tabs` field cannot be used here: seoPlugin tabbedUI rebuilds it and
    //  drops admin.position.) Unnamed collapsible => database does not change.
    // The SEO panel is moved into the sidebar from payload.config.ts.
    // =====================================================================
    {
      type: 'collapsible',
      label: 'Publishing',
      admin: {
        position: 'sidebar',
        initCollapsed: false,
      },
      fields: [
      {
        name: 'featuredImage',
        type: 'upload',
        relationTo: 'media',
        label: 'Featured Image',
      },

      {
        name: 'imagePosition',
        type: 'select',
        label: 'Image Position',
        defaultValue: 'full',

        options: [
          {
            label: 'Left',
            value: 'left',
          },
          {
            label: 'Right',
            value: 'right',
          },
          {
            label: 'Full Width',
            value: 'full',
          },
        ],
      },

      {
        name: 'category',
        type: 'relationship',
        relationTo: 'categories',
        required: true,
        hasMany: false,
        label: 'Category',
      },

      {
        name: 'tags',
        type: 'relationship',
        relationTo: 'tags',
        hasMany: true,
        label: 'Tags',
      },

      {
        name: 'author',
        type: 'relationship',
        relationTo: 'users',
        required: true,
        hasMany: false,
        label: 'Author',
      },

      {
        name: 'publishedAt',
        type: 'date',
        index: true,
        label: 'Published Date',

        admin: {
          date: {
            pickerAppearance: 'dayAndTime',
          },
        },
      },

      {
        name: 'workflowStatus',
        type: 'select',
        index: true,
        label: 'Workflow Status',
        defaultValue: 'draft',

        options: [
          {
            label: 'Draft',
            value: 'draft',
          },
          {
            label: 'Review',
            value: 'review',
          },
          {
            label: 'Published',
            value: 'published',
          },
        ],

        admin: {
          description:
            'Editorial workflow: Draft → Review → Published.',
        },
      },

      {
        name: 'cornerstone',
        type: 'checkbox',
        defaultValue: false,
        label: 'Cornerstone / Pillar Content',

        admin: {
          description:
            'Marks this article as important pillar content for internal linking priority.',
        },
      },

      {
        name: 'includeInSitemap',
        type: 'checkbox',
        defaultValue: true,
        label: 'Include in Sitemap',

        admin: {
          description:
            'Controls whether this published post should appear in the sitemap.',
        },
      },

      {
        name: 'redirectFrom',
        type: 'text',
        label: 'Previous URL',

        admin: {
          description:
            'Optional previous URL/slug that should redirect to this post after a URL change.',
        },
      },
      ],
    },

    // =====================================================================
    // MAIN COLUMN (left): Title, Slug, Content, Excerpt
    // =====================================================================
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Title',

      admin: {
        description:
          'The main title of the blog post.',
      },
    },

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',

      admin: {
        description:
          'The URL-friendly identifier used for the post URL.',
      },
    },

    contentField,

    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Excerpt',

      admin: {
        description:
          'Short summary used in blog listings and RSS-style outputs.',
      },
    },

    // =====================================================================
    // MIGRATION / INTERNAL — collapsed panel in the sidebar
    // (field name stays `legacy`, so existing data is untouched)
    // =====================================================================
    {
      type: 'collapsible',
      label: 'Migration / Internal',
      admin: {
        position: 'sidebar',
        initCollapsed: true,
        description:
          'Original WordPress information used only during migration.',
      },
      fields: [
        {
          name: 'legacy',
          type: 'group',
          label: false,
          fields: [
            {
              name: 'wordpressId',
              type: 'number',
              unique: true,
              index: true,
              label: 'WordPress ID',
            },

            {
              name: 'wordpressModifiedAt',
              type: 'date',
              label: 'WordPress Modified Date',
              index: true,

              admin: {
                description:
                  'Historical WordPress "modified" date, preserved from migration. Empty for posts created directly in Payload.',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}