import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, isAdmin, isApproverOrAdmin } from '@/access'

export const PropertySubtypes: CollectionConfig = {
  slug: 'property-subtypes',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'propertyType', 'slug', 'isActive', 'updatedAt'],
    group: 'Listing Master Data',
    description: 'More specific subtypes that belong to a property type',
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
        placeholder: 'e.g., 1BR Condo, Commercial Lot',
      },
    },
    {
      name: 'propertyType',
      type: 'relationship',
      relationTo: 'property-types',
      required: true,
      hasMany: false,
      admin: {
        description: 'Property type this subtype belongs to',
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
        placeholder: 'e.g., 1br-condo',
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
        description: 'Optional description of this subtype',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive subtypes will not appear in dropdowns',
      },
    },
  ],
  indexes: [
    {
      fields: ['propertyType', 'name'],
      unique: true,
    },
  ],
}
