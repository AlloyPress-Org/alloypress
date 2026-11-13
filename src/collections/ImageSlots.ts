import type { CollectionConfig } from 'payload'

import { internalOrUser } from '@/access/internalKey'
import { imageSlotAfterChange, imageSlotAfterDelete } from '@/hooks/revalidateWeb'

const isAdmin = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin'

/**
 * Image Slots = own posters shown on EVERY blog post.
 * The frontend places them automatically (fixed positions):
 *   Desktop -> below the TOC | Tablet -> right sidebar | Mobile -> above the badge
 *
 * - 1 enabled slot   -> one static poster.
 * - 2+ enabled slots -> a swipe / auto-scrolling carousel (max 8), oldest first.
 * To remove a poster from the carousel: untick "Enabled" (or delete it).
 */
export const ImageSlots: CollectionConfig = {
  slug: 'image-slots',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'enabled', 'updatedAt'],
    description:
      'Own posters shown on all blog posts (below TOC on desktop, above the badge on mobile). One enabled slot = static poster, several enabled slots = scrolling carousel (oldest first).',
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
      admin: {
        position: 'sidebar',
        description: 'Untick to hide without deleting. All enabled slots scroll as a carousel.',
      },
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