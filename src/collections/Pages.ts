import type { Access, CollectionConfig } from 'payload'

// ==========================================================
// ACCESS CONTROL
// ==========================================================

const isAdmin: Access = ({ req }) => {
  return req.user?.role === 'admin'
}

const isEditorOrAdmin: Access = ({ req }) => {
  return (
    req.user?.role === 'admin' ||
    req.user?.role === 'editor'
  )
}

const canRead: Access = ({ req }) => {
  const role = req.user?.role



  // Logged-in admin/editor/viewer users can see everything,
  // including drafts (e.g. for the admin UI / live preview).
  if (role === 'admin' || role === 'editor' || role === 'viewer') {
    return true
  }

  // Public / unauthenticated requests (the Next.js frontend,
  // generateMetadata, sitemap, etc.) can only read PUBLISHED
  // pages. Without this, every public read gets a 403.
  return {
    status: {
      equals: 'published',
    },
  }
}

// ==========================================================
// PAGES COLLECTION
// ==========================================================

export const Pages: CollectionConfig = {
  slug: 'pages',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    description: 'Static pages for AlloyPress.',
  },

  access: {
  read: canRead,
  create: isEditorOrAdmin,
  update: isEditorOrAdmin,
  delete: isAdmin,
},

  fields: [
    // ========================================================
    // TITLE
    // ========================================================

    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      label: 'Page Title',
    },

    // ========================================================
    // SLUG
    // ========================================================

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: {
        description: 'URL slug for this page.',
        placeholder: 'privacy-policy',
      },
    },

    // ========================================================
    // CONTENT
    // ========================================================

    {
      name: 'content',
      type: 'richText',
      label: 'Page Content',

      admin: {
        description: 'Main content of the page.',
      },
    },

    // ========================================================
    // EXCERPT
    // ========================================================

    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Excerpt',

      admin: {
        description: 'Short description or summary of the page.',
      },
    },

    // ========================================================
    // FEATURED IMAGE
    // ========================================================

    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured Image',
    },

    // ========================================================
    // STATUS
    // ========================================================

    {
      name: 'status',
      type: 'select',
      required: true,

      defaultValue: 'draft',

      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],

      admin: {
        position: 'sidebar',
      },
    },

    // ========================================================
    // SEO
    // ========================================================

    {
      name: 'seo',
      type: 'group',
      label: 'SEO',

      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'SEO Title',
        },

        {
          name: 'description',
          type: 'textarea',
          label: 'Meta Description',
        },

        {
          name: 'canonicalURL',
          type: 'text',
          label: 'Canonical URL',
        },

        {
          name: 'openGraphImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Open Graph Image',
        },
      ],
    },

    // ========================================================
    // WORDPRESS MIGRATION
    // ========================================================

    {
      name: 'legacy',
      type: 'group',

      label: 'Migration / Internal',

      admin: {
        description:
          'Original WordPress page information preserved during migration.',
      },

      fields: [
        {
          name: 'wordpressId',
          type: 'number',
          unique: true,
          index: true,
          label: 'WordPress Page ID',
        },

        {
          name: 'wordpressSlug',
          type: 'text',
          label: 'WordPress Slug',
        },

        {
          name: 'wordpressAuthorId',
          type: 'number',
          label: 'WordPress Author ID',
        },
      ],
    },
  ],
}