import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, isApproverOrAdmin } from '@/access'

export const Townships: CollectionConfig = {
  slug: 'townships',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'city', 'isActive', 'updatedAt'],
    group: 'Market Areas',
    description: 'Townships are market-recognized geographic areas spanning multiple barangays',
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
      name: 'province',
      type: 'text',
      required: true,
      admin: {
        description: 'Select province from PSGC database',
        components: {
          Field: '@/components/fields/ProvinceSelectField',
        },
      },
    },
    {
      name: 'provinceName',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      admin: {
        description: 'Select city from PSGC database',
        components: {
          Field: '@/components/fields/TownshipCitySelectField',
        },
      },
    },
    {
      name: 'coveredBarangays',
      type: 'json',
      required: true,
      admin: {
        description: 'Barangays covered by this township',
        components: {
          Field: '@/components/fields/TownshipBarangaySelectField',
        },
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
