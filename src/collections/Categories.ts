import { slugField } from 'payload'
import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => {
  return req.user?.role === 'admin'
}

const isEditorOrAdmin: Access = ({ req }) => {
  return (
    req.user?.role === 'admin' ||
    req.user?.role === 'editor'
  )
}

const canRead: Access = () => true

export const Categories: CollectionConfig = {
  slug: 'categories',
  // ==========================================================
  // ADMIN
  // ==========================================================

  admin: {
    useAsTitle: 'name',

    defaultColumns: [
      'name',
      'slug',
      'parent',
    ],

    description:
      'Content categories for AlloyPress posts.',
  },

  // ==========================================================
  // ACCESS
  // ==========================================================

  access: {
    // Writers and admins can view/select categories
    read: canRead,

    // Only admins can manage categories
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: isAdmin,
  },

  // ==========================================================
  // FIELDS
  // ==========================================================

  fields: [
    // ========================================================
    // NAME
    // ========================================================

    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,

      admin: {
        description:
          'Category name displayed on the website.',
      },
    },

    // ========================================================
    // SLUG
    // ========================================================

    slugField({
      useAsSlug: 'name',
      required: true,
    }),

    // ========================================================
    // DESCRIPTION
    // ========================================================

    {
      name: 'description',
      type: 'textarea',

      admin: {
        description:
          'Optional description for the category.',
      },
    },

    // ========================================================
    // PARENT CATEGORY
    // ========================================================

    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,

      admin: {
        description:
          'Optional parent category for hierarchical categories.',
      },
    },

    // ========================================================
    // LEGACY / WORDPRESS MIGRATION
    // ========================================================

    {
      name: 'legacy',
      type: 'group',

      admin: {
        description:
          'Original WordPress identifiers preserved for migration and data mapping.',
      },

      fields: [
        // ------------------------------------------------------
        // WORDPRESS CATEGORY ID
        // ------------------------------------------------------

        {
          name: 'wordpressId',
          type: 'number',
          unique: true,
          index: true,

          admin: {
            description:
              'Original WordPress category ID.',
          },
        },

        // ------------------------------------------------------
        // WORDPRESS CATEGORY SLUG
        // ------------------------------------------------------

        {
          name: 'wordpressSlug',
          type: 'text',
          index: true,

          admin: {
            description:
              'Original WordPress category slug.',
          },
        },
      ],
    },
  ],
}