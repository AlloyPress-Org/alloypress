import type { Access, CollectionConfig } from 'payload'

// Only admins can see / clean up the Activity Log.
// Nobody can create or edit entries from the admin UI or REST API:
// entries are written only by the audit hooks (Local API, overrideAccess).
const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

const readOnly = { readOnly: true }

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',

  labels: {
    singular: 'Activity',
    plural: 'Activity Log',
  },

  admin: {
    useAsTitle: 'summary',
    description:
      'Who changed what, and when. Read-only. Filter by Target Collection or Doc ID to see one post\'s history.',
    defaultColumns: [
      'createdAt',
      'userEmail',
      'action',
      'targetCollection',
      'docTitle',
      'changedFields',
    ],
    listSearchableFields: ['userEmail', 'docTitle', 'changedFields', 'summary'],
    hidden: ({ user }) =>
      (user as { role?: string } | null | undefined)?.role !== 'admin',
  },

  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },

  timestamps: true,

  fields: [
    {
      name: 'summary',
      type: 'text',
      label: 'Summary',
      admin: readOnly,
    },

    {
      name: 'action',
      type: 'select',
      label: 'Action',
      index: true,
      options: [
        { label: 'Created', value: 'create' },
        { label: 'Updated', value: 'update' },
        { label: 'Saved draft', value: 'draft' },
        { label: 'Published', value: 'publish' },
        { label: 'Deleted', value: 'delete' },
        { label: 'Login', value: 'login' },
      ],
      admin: readOnly,
    },

    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'User',
      index: true,
      admin: readOnly,
    },

    // Stored separately so the history stays readable even if the user is deleted.
    {
      name: 'userEmail',
      type: 'text',
      label: 'User Email',
      admin: readOnly,
    },

    {
      name: 'targetCollection',
      type: 'text',
      label: 'Target Collection',
      index: true,
      admin: readOnly,
    },

    {
      name: 'docId',
      type: 'text',
      label: 'Doc ID',
      index: true,
      admin: readOnly,
    },

    {
      name: 'docTitle',
      type: 'text',
      label: 'Title',
      admin: readOnly,
    },

    {
      name: 'changedFields',
      type: 'text',
      label: 'Changed Fields',
      admin: readOnly,
    },

    {
      name: 'changes',
      type: 'json',
      label: 'Details (before / after)',
      admin: {
        readOnly: true,
        description:
          'Short values show before/after. Long or rich-text fields (like the article content) only show the field name.',
      },
    },
  ],
}