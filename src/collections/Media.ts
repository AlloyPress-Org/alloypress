import type { Access, CollectionConfig, Endpoint } from 'payload'

const isAdmin: Access = ({ req }) => {
  return req.user?.role === 'admin'
}

const isEditorOrAdmin: Access = ({ req }) => {
  return req.user?.role === 'admin' || req.user?.role === 'editor'
}

const isAuthenticated: Access = ({ req }) => {
  return Boolean(req.user)
}

/* -------------------------------------------------------------------------- */
/* FILENAME SLUGIFY                                                           */
/* Removes % # ? & ' " : ; ( ) , and spaces so R2 / Cloudflare URLs never 400 */
/* -------------------------------------------------------------------------- */

const slugifyBase = (text: string): string => {
  return (
    text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/%/g, ' percent')
      .replace(/&/g, ' and ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'media'
  )
}

const slugifyFilename = (original: string): string => {
  const dot = original.lastIndexOf('.')
  const hasExt = dot > 0 && dot < original.length - 1
  const base = hasExt ? original.slice(0, dot) : original
  const ext = hasExt ? original.slice(dot + 1).toLowerCase() : ''

  const slug = slugifyBase(base)

  return ext ? `${slug}.${ext}` : slug
}

/* -------------------------------------------------------------------------- */
/* IMPORT IMAGE FROM URL (used when pasting from Google Docs)                 */
/* POST /api/media/import-from-url  { url, alt }  ->  { id }                  */
/* -------------------------------------------------------------------------- */

// Server will only download from these hosts (SSRF protection).
// Add more domains here if you paste from other sources.
const ALLOWED_HOST_SUFFIXES = [
  'googleusercontent.com',
  'google.com',
  'gstatic.com',
  'googleapis.com',
]

const isAllowedHost = (host: string) =>
  ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  )

const MAX_IMPORT_BYTES = 15 * 1024 * 1024

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

const importFromUrl: Endpoint = {
  path: '/import-from-url',
  method: 'post',

  handler: async (req) => {
    const role = req.user?.role

    if (role !== 'admin' && role !== 'editor') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: { url?: string; alt?: string } = {}

    try {
      body = (await req.json?.()) ?? {}
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const src = body.url?.trim()

    if (!src) {
      return Response.json({ error: 'url is required' }, { status: 400 })
    }

    let buffer: Buffer
    let mimetype: string

    try {
      if (src.startsWith('data:image/')) {
        const match = src.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i)

        if (!match) throw new Error('Invalid data URL')

        mimetype = match[1].toLowerCase()
        buffer = Buffer.from(match[2], 'base64')
      } else {
        const url = new URL(src)

        if (
          !['http:', 'https:'].includes(url.protocol) ||
          !isAllowedHost(url.hostname)
        ) {
          return Response.json({ error: 'Host not allowed' }, { status: 400 })
        }

        const res = await fetch(url, {
          signal: AbortSignal.timeout(20000),
          headers: { 'User-Agent': 'Mozilla/5.0 (AlloyPress importer)' },
        })

        if (!res.ok) throw new Error(`Source responded with ${res.status}`)

        if (!isAllowedHost(new URL(res.url).hostname)) {
          throw new Error('Redirect target not allowed')
        }

        mimetype = (res.headers.get('content-type') || '')
          .split(';')[0]
          .trim()
          .toLowerCase()

        if (!mimetype.startsWith('image/')) throw new Error('Not an image')

        buffer = Buffer.from(await res.arrayBuffer())
      }

      if (buffer.length > MAX_IMPORT_BYTES) {
        throw new Error('Image is too large')
      }
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Download failed' },
        { status: 422 },
      )
    }

    const alt = body.alt?.trim() || 'Image'
    const ext = EXT_BY_MIME[mimetype] ?? 'png'
    const name = `${slugifyBase(alt)}-${Date.now()}.${ext}`

    try {
      const doc = await req.payload.create({
        collection: 'media',
        data: { alt },
        file: {
          data: buffer,
          mimetype,
          name,
          size: buffer.length,
        },
        user: req.user,
        overrideAccess: false,
      })

      return Response.json({ id: doc.id })
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Upload failed' },
        { status: 500 },
      )
    }
  },
}

/* -------------------------------------------------------------------------- */
/* COLLECTION                                                                 */
/* -------------------------------------------------------------------------- */

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: () => true,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: isEditorOrAdmin,
  },

  endpoints: [importFromUrl],

  hooks: {
    // Clean the filename before it is stored in R2, so the URL is always safe.
    beforeOperation: [
      ({ args, operation }) => {
        if (operation === 'create' || operation === 'update') {
          const file = (args as { req?: { file?: { name?: string } } }).req
            ?.file

          if (file?.name) {
            file.name = slugifyFilename(file.name)
          }
        }

        return args
      },
    ],
  },

  admin: {
    useAsTitle: 'filename',

    defaultColumns: [
      'filename',
      'mimeType',
      'alt',
      'title',
      'updatedAt',
    ],
  },

  upload: {
    disableLocalStorage: true,

    mimeTypes: [
      'image/*',
      'application/pdf',
      'audio/*',
    ],

    adminThumbnail: ({ doc }) => {
      const publicURL = process.env.R2_PUBLIC_URL

      if (!publicURL) {
        return ''
      }

      const media = doc as {
        filename?: string
        sizes?: {
          thumbnail?: {
            filename?: string
          }
        }
      }

      const thumbnailFilename =
        media.sizes?.thumbnail?.filename || media.filename

      if (!thumbnailFilename) {
        return ''
      }

      return `${publicURL.replace(/\/$/, '')}/${thumbnailFilename}`
    },

    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
    ],

    formatOptions: {
      format: 'webp',
    },
  },

  fields: [
    {
      name: 'wordpressId',
      type: 'number',
      unique: true,

      admin: {
        description:
          'Original WordPress media ID used for migration mapping.',
      },
    },

    {
      name: 'originalUrl',
      type: 'text',

      admin: {
        description:
          'Original WordPress media URL used during migration.',
      },
    },

    {
      // Not required any more: drag & drop / paste works without typing alt.
      // If left empty it is auto-filled from the filename. Edit it later for SEO.
      name: 'alt',
      type: 'text',
      label: 'Alt Text',

      admin: {
        description:
          'Alternative text for accessibility and image SEO. If left empty, it is auto-filled from the filename. Edit it later for better SEO. For audio files, use a short descriptive text.',
      },

      hooks: {
        beforeValidate: [
          ({ value, originalDoc, req }) => {
            if (typeof value === 'string' && value.trim()) {
              return value
            }

            const raw =
              req?.file?.name || originalDoc?.filename || 'media'

            return (
              raw
                .replace(/\.[^.]+$/, '')
                .replace(/[-_]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim() || 'Image'
            )
          },
        ],
      },
    },

    {
      name: 'title',
      type: 'text',
      label: 'Media Title',

      admin: {
        description:
          'Title used for identifying and managing the media.',
      },
    },

    {
      name: 'caption',
      type: 'textarea',
      label: 'Caption',

      admin: {
        description:
          'Optional caption displayed with the media. Supports bold, italic, underline, links, and left/center/right alignment.',

        components: {
          Field:
            '/components/admin/MediaCaptionField#MediaCaptionField',
        },
      },
    },

    {
      name: 'description',
      type: 'textarea',
      label: 'Description',

      admin: {
        description:
          'Optional description containing additional information about the media.',
      },
    },
  ],
}