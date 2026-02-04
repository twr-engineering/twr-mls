import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, isAdmin, isApproverOrAdmin } from '@/access'

export const Developments: CollectionConfig = {
  slug: 'developments',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'cityName', 'barangayName', 'isActive', 'updatedAt'],
    group: 'Location Master Data',
    hidden: ({ user }) => !isApproverOrAdmin(user),
    description: 'Developments (subdivisions) belong to a Barangay',
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
        placeholder: 'e.g., Ignatius Enclave',
      },
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      admin: {
        description: 'Select city from PSGC database',
        components: {
          Field: '@/components/fields/DevelopmentCitySelectField',
        },
      },
    },
    {
      name: 'cityName',
      type: 'text',
      admin: {
        hidden: true, // Used for display
      },
    },
    {
      name: 'barangay',
      type: 'text',
      required: true,
      admin: {
        description: 'Select barangay from PSGC database (filtered by city)',
        components: {
          Field: '@/components/fields/DevelopmentBarangaySelectField',
        },
      },
    },
    {
      name: 'barangayName',
      type: 'text',
      admin: {
        hidden: true, // Used for display
      },
    },
    {
      name: 'primaryEstate',
      type: 'relationship',
      relationTo: 'estates',
      hasMany: false,
      admin: {
        description: 'Optional: Primary estate for admin clarity only (does NOT affect search logic)',
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
        placeholder: 'e.g., ignatius-enclave',
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
        description: 'Inactive developments will not appear in dropdowns',
      },
    },
  ],
  indexes: [
    {
      fields: ['barangay', 'name'],
      unique: true,
    },
  ],
}
