import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access'

export const PropertySubtypes: CollectionConfig = {
  slug: 'property-subtypes',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'propertyType', 'isActive'],
    group: 'Master Data',
    description: 'Property subtypes (e.g., Studio, 2BR)',
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
        description: 'Subtype name (e.g., Studio, 1BR, 2BR)',
      },
    },
    {
      name: 'propertyType',
      type: 'relationship',
      relationTo: 'property-types',
      required: true,
      hasMany: false,
      filterOptions: {
        isActive: { equals: true },
      },
      admin: {
        description: 'Parent type this subtype belongs to',
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
        description: 'Optional description of this subtype',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Inactive subtypes are hidden from selection',
      },
    },
  ],
  indexes: [
    {
      fields: ['propertyType'],
    },
  ],
}
