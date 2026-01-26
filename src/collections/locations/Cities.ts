import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, isAgent } from '@/access'

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isActive', 'updatedAt'],
    group: 'Location Master Data',
    description: 'Cities are the top level of the location hierarchy',
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
        placeholder: 'e.g., Cagayan de Oro',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        placeholder: 'e.g., cagayan-de-oro',
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
        description: 'Inactive cities will not appear in dropdowns',
      },
    },
  ],
}
