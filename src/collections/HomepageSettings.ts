import type { CollectionConfig } from "payload";

export const HomepageSettings: CollectionConfig = {
  slug: "homepage-settings",

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

      minRows: 3,
      maxRows: 3,

      admin: {
        description:
          "Select exactly 3 posts to display in the Featured section. Order determines the display order.",
      },
    },
  ],
};