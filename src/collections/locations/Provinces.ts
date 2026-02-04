import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, isAdmin, isApproverOrAdmin } from '@/access'

/**
 * Provinces Collection
 * Administrative divisions containing cities/municipalities
 * Sourced from PSGC (Philippine Standard Geographic Code) API
 */
export const Provinces: CollectionConfig = {
  slug: 'provinces',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'region', 'psgcCode', 'isActive'],
    group: 'Location Master Data',
    description: 'Provinces are administrative divisions containing cities/municipalities',
    hidden: ({ user }) => !isApproverOrAdmin(user),
  },
  access: {
    read: authenticated,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  versions: {
    drafts: false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Province name from PSGC API',
      },
    },
    {
      name: 'psgcCode',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: '10-digit PSGC province code',
        readOnly: true,
        placeholder: 'e.g., 1004300000',
      },
    },
    {
      name: 'region',
      type: 'text',
      required: true,
      admin: {
        description: 'Administrative region (e.g., Region X - Northern Mindanao)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier',
        placeholder: 'e.g., misamis-oriental',
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
        description: 'Inactive provinces will not appear in dropdowns',
      },
    },
  ],
}
