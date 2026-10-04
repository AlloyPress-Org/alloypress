import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => {
  return req.user?.role === 'admin'
}

const isEditorOrAdmin: Access = ({ req }) => {
  return req.user?.role === 'admin' || req.user?.role === 'editor'
}

const isAuthenticated: Access = ({ req }) => {
  return Boolean(req.user)
}

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: () => true,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: isAdmin,
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
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',

      admin: {
        description:
          'Alternative text for accessibility and image SEO. For audio files, use a short descriptive text.',
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