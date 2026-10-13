import type { CollectionConfig } from "payload";
import { homepageAfterChange, homepageAfterDelete } from "@/hooks/revalidateWeb";

export const HomepageSettings: CollectionConfig = {
  slug: "homepage-settings",

  hooks: {
    afterChange: [homepageAfterChange],
    afterDelete: [homepageAfterDelete],
  },

  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "updatedAt"],
  },

  access: {
    // Public website can READ homepage configuration.
    read: () => true,

    // Only authenticated Payload admins can modify it.
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },

  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      defaultValue: "Homepage Settings",
      admin: {
        hidden: true,
      },
    },

    {
      name: "featuredPosts",
      type: "relationship",
      relationTo: "posts",
      hasMany: true,
      required: true,

      minRows: 1,
      maxRows: 5,

      admin: {
        description:
          "Select 1 to 5 posts for the Featured carousel. Order determines the display order.",
      },
    },
  ],
};