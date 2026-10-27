import type { CollectionConfig } from 'payload'

import { internalOrUser } from '@/access/internalKey'
import { imageSlotAfterChange, imageSlotAfterDelete } from '@/hooks/revalidateWeb'

const isAdmin = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin'

/**
 * Image Slots = own poster shown on EVERY blog post.
 * The frontend places it automatically (fixed positions):
 *   Desktop -> below the TOC | Tablet -> right sidebar | Mobile -> above the badge
 * If several slots are enabled, the most recently updated one is shown.
 * To switch the poster: create a new slot and untick "Enabled" on the old one.
 */
export const ImageSlots: CollectionConfig = {
  slug: 'image-slots',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'enabled', 'updatedAt'],
    description:
      'Own poster images shown on all blog posts (below TOC on desktop, above the badge on mobile).',
  },

  hooks: {
    afterChange: [imageSlotAfterChange],
    afterDelete: [imageSlotAfterDelete],
  },

  access: {
    read: internalOrUser,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Image name. Also used as alt text.' },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: { position: 'sidebar', description: 'Untick to hide without deleting.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'linkUrl',
          type: 'text',
          admin: { width: '65%', description: 'Optional. Click opens this URL in a new tab.' },
          validate: (v: unknown) => {
            if (!v) return true
            return /^(https?:\/\/|\/)/i.test(String(v)) || 'Must start with https://, http:// or /'
          },
        },
        {
          name: 'followMode',
          type: 'select',
          defaultValue: 'nofollow',
          options: [
            { label: 'nofollow', value: 'nofollow' },
            { label: 'dofollow', value: 'dofollow' },
          ],
          admin: { width: '35%' },
        },
      ],
    },
    {
      name: 'sponsored',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Adds rel="sponsored" to the link (use for paid / partner posters).' },
    },
  ],
}