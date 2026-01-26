import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, isAgent } from '@/access'

export const Barangays: CollectionConfig = {
  slug: 'barangays',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'isActive', 'updatedAt'],
    group: 'Location Master Data',
    description: 'Barangays belong to a City',
    hidden: ({ user }) => isAgent(user),
  },
  access: {
    read: authenticated,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'e.g., Lumbia',
      },
    },
    {
      name: 'city',
      type: 'relationship',
      relationTo: 'cities',
      required: true,
      hasMany: false,
      admin: {
        description: 'The city this barangay belongs to',
      },
      filterOptions: {
        isActive: { equals: true },
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'e.g., lumbia',
        description: 'URL-friendly identifier',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive barangays will not appear in dropdowns',
      },
    },
  ],
  indexes: [
    {
      fields: ['city', 'name'],
      unique: true,
    },
  ],
}
