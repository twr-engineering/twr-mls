import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, isAgent, isAdmin, isApproverOrAdmin } from '@/access'

export const PropertyTypes: CollectionConfig = {
  slug: 'property-types',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'propertyCategory', 'slug', 'isActive', 'updatedAt'],
    group: 'Listing Master Data',
    description: 'Property types that belong to a category (e.g., Condo, House & Lot)',
    hidden: ({ user }) => !isApproverOrAdmin(user),
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
        placeholder: 'e.g., Condo',
      },
    },
    {
      name: 'propertyCategory',
      type: 'relationship',
      relationTo: 'property-categories',
      required: true,
      hasMany: false,
      admin: {
        description: 'Category this type belongs to',
      },
      filterOptions: {
        isActive: { equals: true },
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        placeholder: 'e.g., condo',
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
        position: 'sidebar',
        description: 'Inactive types will not appear in dropdowns',
      },
    },
  ],
  indexes: [
    {
      fields: ['propertyCategory', 'name'],
      unique: true,
    },
  ],
}
