import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, isAgent } from '@/access'

export const Townships: CollectionConfig = {
  slug: 'townships',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'coveredBarangays', 'isActive', 'updatedAt'],
    group: 'Location Master Data',
    description: 'Townships are market-recognized geographic areas spanning multiple barangays',
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
      unique: true,
      admin: {
        placeholder: 'e.g., Uptown CDO',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        placeholder: 'e.g., uptown-cdo',
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
      name: 'coveredBarangays',
      type: 'relationship',
      relationTo: 'barangays',
      hasMany: true,
      required: true,
      admin: {
        description: 'Barangays covered by this township (source of truth for township membership)',
      },
      filterOptions: {
        isActive: { equals: true },
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive townships will not appear in search filters',
      },
    },
  ],
}
