import type {
  CollectionConfig,
  FieldAccess,
  PayloadRequest,
} from 'payload'

const isAdmin = ({ req }: { req: PayloadRequest }): boolean => {
  return req.user?.role === 'admin'
}

const isAdminField: FieldAccess = ({ req }) => {
  return req.user?.role === 'admin'
}

export const Users: CollectionConfig = {
  slug: 'users',

  auth: true,

  admin: {
    useAsTitle: 'displayName',

    defaultColumns: [
      'email',
      'displayName',
      'role',
      'createdAt',
      'updatedAt',
    ],

    description:
      'Manage AlloyPress users and access roles.',
  },

  access: {
    admin: isAdmin,

    read: isAdmin,

    create: isAdmin,

    update: isAdmin,

    delete: isAdmin,

    unlock: isAdmin,
  },

  fields: [
    {
      name: 'displayName',
      type: 'text',
      label: 'Display Name',

      admin: {
        description:
          'Display name shown across the AlloyPress system.',
      },
    },

    {
      name: 'username',
      type: 'text',
      unique: true,
      index: true,
      label: 'Username',

      admin: {
        description:
          'Unique username for the user.',
      },
    },

    {
      name: 'website',
      type: 'text',
      label: 'Website',

      admin: {
        description:
          'Optional website URL associated with the user.',
      },
    },

    {
      name: 'bio',
      type: 'textarea',
      label: 'Bio / Description',

      admin: {
        description:
          'Short description or biography of the user.',
      },
    },

    {
      name: 'role',
      type: 'select',
      required: true,

      defaultValue: 'viewer',

      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'Viewer',
          value: 'viewer',
        },
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
        description:
          'Original WordPress information preserved for migration.',
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