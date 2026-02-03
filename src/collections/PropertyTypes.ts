import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access'

export const PropertyTypes: CollectionConfig = {
  slug: 'property-types',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'isActive'],
    group: 'Master Data',
    description: 'Property types within categories (e.g., House, Condo)',
  },
  access: {
    read: authenticated,
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Type name (e.g., House & Lot, Condominium)',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'property-categories',
      required: true,
      hasMany: false,
      filterOptions: {
        isActive: { equals: true },
      },
      admin: {
        description: 'Parent category this type belongs to',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'URL-friendly identifier',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description of this type',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Inactive types are hidden from selection',
      },
    },
  ],
  indexes: [
    {
      fields: ['category'],
    },
  ],
}
