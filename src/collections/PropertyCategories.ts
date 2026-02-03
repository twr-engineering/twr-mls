import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access'

export const PropertyCategories: CollectionConfig = {
  slug: 'property-categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isActive'],
    group: 'Master Data',
    description: 'Property categories (e.g., Residential, Commercial)',
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
      unique: true,
      admin: {
        description: 'Category name (e.g., Residential, Commercial)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
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
        description: 'Optional description of this category',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Inactive categories are hidden from selection',
      },
    },
  ],
}
