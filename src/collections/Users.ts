import type {
  Access,
  CollectionConfig,
  FieldAccess,
  PayloadRequest,
} from 'payload'

// Admin only
const isAdmin = ({ req }: { req: PayloadRequest }): boolean => {
  return req.user?.role === 'admin'
}

// Admin panel-ku varra roles (viewer venaam na idhula serkaadha)
const canAccessAdmin = ({ req }: { req: PayloadRequest }): boolean => {
  return ['admin', 'editor'].includes(req.user?.role as string)
}

// Admin: ellaa users. Matha roles: tan own record mattum
const selfOrAdmin: Access = ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  return { id: { equals: req.user.id } }
}

// Role field: admin mattum maatha mudiyum
const isAdminField: FieldAccess = ({ req }) => {
  return req.user?.role === 'admin'
}

export const Users: CollectionConfig = {
  slug: 'users',

  auth: true,

  admin: {
    useAsTitle: 'displayName',

    defaultColumns: ['email', 'displayName', 'role', 'createdAt', 'updatedAt'],

    description: 'Manage AlloyPress users and access roles.',

    // Editor-ku Users menu theriya vendaam
    hidden: ({ user }) => user?.role !== 'admin',
  },

  access: {
    admin: canAccessAdmin,                          // admin + editor panel ulla varalam
    read: ({ req }) => Boolean(req.user),           // Author dropdown ku venum
    create: isAdmin,
    update: selfOrAdmin,                            // editor tan profile mattum
    delete: isAdmin,
    unlock: isAdmin,
  },

  fields: [
    {
      name: 'displayName',
      type: 'text',
      label: 'Display Name',
      admin: {
        description: 'Display name shown across the AlloyPress system.',
      },
    },

    {
      name: 'username',
      type: 'text',
      unique: true,
      index: true,
      label: 'Username',
      admin: {
        description: 'Unique username for the user.',
      },
    },

    {
      name: 'website',
      type: 'text',
      label: 'Website',
      admin: {
        description: 'Optional website URL associated with the user.',
      },
    },

    {
      name: 'bio',
      type: 'textarea',
      label: 'Bio / Description',
      admin: {
        description: 'Short description or biography of the user.',
      },
    },

    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'viewer',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' },
      ],
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        position: 'sidebar',
        description:
          'Admin: full access. Editor: content management. Viewer: read-only access.',
      },
    },

    {
      name: 'legacy',
      type: 'group',
      label: 'Migration / Internal',
      admin: {
        description: 'Original WordPress information preserved for migration.',
      },
      fields: [
        {
          name: 'wordpressId',
          type: 'number',
          unique: true,
          index: true,
          label: 'WordPress User ID',
        },
        {
          name: 'wordpressUsername',
          type: 'text',
          label: 'WordPress Username',
        },
        {
          name: 'wordpressRole',
          type: 'text',
          label: 'WordPress Role',
        },
      ],
    },
  ],
}