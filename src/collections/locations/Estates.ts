import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly } from '@/access'

/**
 * Estates Collection
 *
 * An Estate is a branded grouping of multiple Developments.
 * Examples: Xavier Estates, Pueblo de Oro
 *
 * Rule (from core-collection.md):
 * listing belongs to estate IF listing.development ∈ estate.includedDevelopments
 * Listings are NEVER manually tagged to Estates.
 */
export const Estates: CollectionConfig = {
  slug: 'estates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'includedDevelopments', 'isActive', 'updatedAt'],
    group: 'Location Master Data',
    description: 'Estates are branded groupings of multiple Developments',
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
        placeholder: 'e.g., Xavier Estates',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        placeholder: 'e.g., xavier-estates',
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
      name: 'includedDevelopments',
      type: 'relationship',
      relationTo: 'developments',
      hasMany: true,
      required: true,
      admin: {
        description: 'Developments that belong to this estate (source of truth for estate membership)',
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
        description: 'Inactive estates will not appear in search filters',
      },
    },
  ],
}
