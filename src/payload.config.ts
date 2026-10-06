import { postgresAdapter } from '@payloadcms/db-postgres'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import path from 'path'

import { buildConfig } from 'payload'
import type { Field, Plugin } from 'payload'

import { fileURLToPath } from 'url'

import sharp from 'sharp'

import { seoPlugin } from '@payloadcms/plugin-seo'

import { redirectsPlugin } from '@payloadcms/plugin-redirects'

import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './collections/Users'

import { Media } from './collections/Media'

import { Categories } from './collections/Categories'

import { Tags } from './collections/Tags'

import { Posts } from './collections/Posts'

import { NotFoundLogs } from './collections/NotFoundLogs'

import { Pages } from './collections/Pages'

import { HomepageSettings } from './collections/HomepageSettings'

const filename = fileURLToPath(import.meta.url)

const dirname = path.dirname(filename)


// =========================================================
// Move the SEO group into a collapsed sidebar panel (WordPress-style).
// Runs right after seoPlugin (tabbedUI: false -> plugin appends a `meta` group).
// Sidebar order: Publishing -> SEO -> Migration / Internal.
// The group keeps its name `meta`, so database columns stay the same.
// =========================================================
const moveSeoToSidebar: Plugin = (incomingConfig) => ({
  ...incomingConfig,
  collections: (incomingConfig.collections || []).map((collection) => {
    if (collection.slug !== 'posts') {
      return collection
    }

    const seoPanels: Field[] = []
    const otherFields: Field[] = []

    for (const field of collection.fields) {
      if (field.type === 'group' && 'name' in field && field.name === 'meta') {
        seoPanels.push({
          type: 'collapsible',
          label: 'SEO',
          admin: {
            position: 'sidebar',
            initCollapsed: true,
          },
          fields: [{ ...field, label: false }],
        })
      } else {
        otherFields.push(field)
      }
    }

    if (seoPanels.length === 0) {
      return collection
    }

    // insert the SEO panel just above the Migration / Internal panel
    const migrationIndex = otherFields.findIndex(
      (field) =>
        field.type === 'collapsible' &&
        typeof field.label === 'string' &&
        field.label === 'Migration / Internal',
    )
    const insertAt = migrationIndex === -1 ? otherFields.length : migrationIndex

    return {
      ...collection,
      fields: [
        ...otherFields.slice(0, insertAt),
        ...seoPanels,
        ...otherFields.slice(insertAt),
      ],
    }
  }),
})

export default buildConfig({

  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'https://api.alloypress.com',

  // =========================================================
  // PAYLOAD ADMIN
  // =========================================================

  admin: {

    user: Users.slug,

    importMap: {

      baseDir: path.resolve(dirname),

    },

    // =======================================================
    // CUSTOM ADMIN VIEWS
    // =======================================================

    components: {

      graphics: {
        Icon: '/components/AlloyPressIcon',
        Logo: '/components/AlloyPressLogo',
      },
      Nav: '/components/AlloyNav',

      views: {

        dashboard: {

          Component: '/components/AlloyDashboard',

        },

      },

    },

  },

  cors: [
    "https://api.alloypress.com",
    "https://alloypress.com",
    "https://www.alloypress.com",
    "https://web.sakthiparthibans.workers.dev",
    "https://alloypress.abhub-net.workers.dev",
    "https://alloypress-web.vercel.app",
    "http://localhost:3000",
  ],
  csrf: [
    "https://api.alloypress.com",
    "https://alloypress.com",
    "https://www.alloypress.com",
    "https://web.sakthiparthibans.workers.dev",
    "https://alloypress.abhub-net.workers.dev",
    "https://alloypress-web.vercel.app",
    "http://localhost:3000",
  ],


  // =========================================================
  // ROUTES
  // =========================================================

  routes: {

    admin: '/admin',

  },


  // =========================================================
  // COLLECTIONS
  // =========================================================

  collections: [

    Users,

    Media,

    Categories,

    Tags,

    Posts,

    Pages,

    NotFoundLogs,

    HomepageSettings,

  ],


  // =========================================================
  // EDITOR
  // =========================================================

  editor: lexicalEditor(),


  // =========================================================
  // SECURITY
  // =========================================================

  secret: process.env.PAYLOAD_SECRET || '',


  // =========================================================
  // TYPESCRIPT
  // =========================================================

  typescript: {

    outputFile: path.resolve(dirname, 'payload-types.ts'),

  },


  // =========================================================
  // DATABASE — NEON POSTGRESQL
  // =========================================================

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      max: 5,                       // serverless la connection explosion thavirkka
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    },
  }),

  jobs: {
    autoRun: [{ cron: '*/10 * * * *', limit: 10 }], // '* * * * *' = nodhikkum DB hit
  },


  // =========================================================
  // IMAGE PROCESSING
  // =========================================================

  sharp,


  // =========================================================
  // PLUGINS
  // =========================================================

  plugins: [

    // =======================================================
    // SEO
    // =======================================================

    seoPlugin({

      collections: ['posts'],

      uploadsCollection: 'media',

      tabbedUI: false, // SEO panel is placed in the sidebar by moveSeoToSidebar below

      fields: ({ defaultFields }) => [
        ...defaultFields.map((field) => {
          if ('name' in field && field.name === 'description') {
            return {
              ...field,
              required: true,
            }
          }

          return field
        }),


        // ----------------------------------------------------
        // FOCUS KEYWORD
        // ----------------------------------------------------

        {

          name: 'focusKeyword',

          type: 'text',

          label: 'Focus Keyword',

          admin: {

            description:
              'Primary keyword targeted for this post.',

          },

        },


        // ====================================================
        // CANONICAL URL
        // ====================================================

        {

          name: 'canonicalURL',

          type: 'text',

          label: 'Canonical URL',

        },


        // ====================================================
        // BREADCRUMB
        // ====================================================

        {

          name: 'breadcrumbTitle',

          type: 'text',

          label: 'Breadcrumb Title',

        },


        // ====================================================
        // ROBOTS META
        // ====================================================

        {

          name: 'robots',

          type: 'group',

          label: 'Robots Meta',

          fields: [

            {

              name: 'index',

              type: 'checkbox',

              defaultValue: true,

              label: 'Index',

            },

            {

              name: 'follow',

              type: 'checkbox',

              defaultValue: true,

              label: 'Follow',

            },

            {

              name: 'noArchive',

              type: 'checkbox',

              defaultValue: false,

              label: 'No Archive',

            },

            {

              name: 'noImageIndex',

              type: 'checkbox',

              defaultValue: false,

              label: 'No Image Index',

            },

            {

              name: 'noSnippet',

              type: 'checkbox',

              defaultValue: false,

              label: 'No Snippet',

            },

          ],

        },


        // ====================================================
        // ADVANCED ROBOTS
        // ====================================================

        {

          name: 'advancedRobots',

          type: 'group',

          label: 'Advanced Robots Meta',

          fields: [

            {

              name: 'maxSnippet',

              type: 'number',

              defaultValue: -1,

              label: 'Max Snippet',

            },

            {

              name: 'maxVideoPreview',

              type: 'number',

              defaultValue: -1,

              label: 'Max Video Preview',

            },

            {

              name: 'maxImagePreview',

              type: 'select',

              defaultValue: 'large',

              label: 'Max Image Preview',

              options: [

                {

                  label: 'None',

                  value: 'none',

                },

                {

                  label: 'Standard',

                  value: 'standard',

                },

                {

                  label: 'Large',

                  value: 'large',

                },

              ],

            },

          ],

        },


        // ====================================================
        // OPEN GRAPH
        // ====================================================

        {

          name: 'openGraph',

          type: 'group',

          label: 'Open Graph',

          fields: [

            {

              name: 'title',

              type: 'text',

              label: 'OG Title',

            },

            {

              name: 'description',

              type: 'textarea',

              label: 'OG Description',

            },

            {

              name: 'image',

              type: 'upload',

              relationTo: 'media',

              label: 'OG Image',

            },

          ],

        },


        // ====================================================
        // TWITTER / X
        // ====================================================

        {

          name: 'twitter',

          type: 'group',

          label: 'Twitter / X',

          fields: [

            {

              name: 'title',

              type: 'text',

              label: 'Twitter Title',

            },

            {

              name: 'description',

              type: 'textarea',

              label: 'Twitter Description',

            },

            {

              name: 'image',

              type: 'upload',

              relationTo: 'media',

              label: 'Twitter Image',

            },

          ],

        },

      ],

    }),


    moveSeoToSidebar,

    // =======================================================
    // 301 REDIRECTS
    // =======================================================

    redirectsPlugin({

      collections: ['posts', 'pages'],

      redirectTypes: ['301'],

    }),


    // =======================================================
    // CLOUDFLARE R2 STORAGE
    // =======================================================

    s3Storage({

      enabled: Boolean(process.env.R2_BUCKET),

      collections: {

        media: {

          disablePayloadAccessControl: true,

          generateFileURL: ({ filename, prefix }) => {

            const key = prefix
              ? `${prefix}/${filename}`
              : filename

            const publicURL = process.env.R2_PUBLIC_URL

            if (!publicURL) {

              return key

            }

            return `${publicURL.replace(/\/$/, '')}/${key}`

          },

        },

      },

      bucket:
        process.env.R2_BUCKET || 'default-bucket',

      config: {

        credentials: {

          accessKeyId:
            process.env.R2_ACCESS_KEY_ID || '',

          secretAccessKey:
            process.env.R2_SECRET_ACCESS_KEY || '',

        },

        region:
          process.env.R2_REGION || 'auto',

        endpoint:
          process.env.R2_ENDPOINT || '',

        forcePathStyle: true,

      },

    }),

  ],

})