import type { CollectionConfig, Access, FieldAccess, Where } from 'payload'
import { authenticated } from '@/access'
import { validateStatusTransition } from '@/hooks/listings/validateStatusTransition'
import { notifyStatusChange } from '@/hooks/listings/notifyStatusChange'
import { populateLocationRelations } from '@/hooks/listings/populateLocationRelations'
import { populateLocationNames } from '@/hooks/listings/populateLocationNames'
import { validateListingFields } from '@/hooks/listings/validateListingFields'
import { validatePropertyClassification } from '@/hooks/listings/validatePropertyClassification'
import { validateLocationHierarchy } from '@/hooks/listings/validateLocationHierarchy'

export const ListingStatuses = [
  'draft',
  'submitted',
  'needs_revision',
  'published',
  'rejected',
] as const
export type ListingStatus = (typeof ListingStatuses)[number]

export const ListingTypes = ['resale', 'preselling'] as const
export type ListingType = (typeof ListingTypes)[number]

export const TransactionTypes = ['sale', 'rent'] as const
export type TransactionType = (typeof TransactionTypes)[number]

export const FurnishingOptions = ['unfurnished', 'semi_furnished', 'fully_furnished'] as const
export type FurnishingOption = (typeof FurnishingOptions)[number]

export const TenureOptions = ['freehold', 'leasehold'] as const
export type TenureOption = (typeof TenureOptions)[number]

export const TitleStatusOptions = ['clean', 'mortgaged'] as const
export type TitleStatusOption = (typeof TitleStatusOptions)[number]

export const PaymentTermsOptions = ['cash', 'bank', 'pagibig', 'deferred'] as const
export type PaymentTermsOption = (typeof PaymentTermsOptions)[number]

const canReadListing: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') {
    return true
  }

  if (user.role === 'approver') {
    return {
      or: [
        {
          status: {
            not_equals: 'draft',
          },
        },
        {
          createdBy: {
            equals: user.id,
          },
        },
      ],
    }
  }

  const query: Where = {
    or: [{ createdBy: { equals: user.id } }, { status: { equals: 'published' } }],
  }
  return query
}

const canCreateListing: Access = authenticated

const canUpdateListing: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') {
    return true
  }

  if (user.role === 'approver') {
    return true
  }

  const query: Where = {
    and: [
      { createdBy: { equals: user.id } },
      { listingType: { equals: 'resale' } },
      {
        status: {
          not_equals: 'submitted',
        },
      },
      {
        status: {
          not_equals: 'published',
        },
      },
    ],
  }
  return query
}

const canDeleteListing: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin' || user.role === 'approver') {
    return true
  }

  if (user.role === 'agent') {
    const query: Where = {
      and: [{ createdBy: { equals: user.id } }, { status: { equals: 'draft' } }],
    }
    return query
  }

  return false
}

const listingTypeFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  return false
}



export const Listings: CollectionConfig = {
  slug: 'listings',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'listingType', 'status', 'cityName', 'price', 'createdBy', 'updatedAt'],
    group: 'Listings',
    description: 'Property listings for the MLS system',
  },
  access: {
    read: canReadListing,
    create: canCreateListing,
    update: canUpdateListing,
    delete: canDeleteListing,
  },
  hooks: {
    beforeChange: [
      populateLocationRelations,
      populateLocationNames,

      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user) {
          data.createdBy = req.user.id
        }
        return data
      },

      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user?.role === 'agent') {
          data.listingType = 'resale'
        }
        return data
      },

      // Validate location hierarchy (City -> Barangay -> Development)
      validateLocationHierarchy,

      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'create' || operation === 'update') {
          // Reset property type and subtype when category changes
          if (operation === 'update' && originalDoc) {
            if (data.propertyCategory && originalDoc.propertyCategory !== data.propertyCategory) {
              data.propertyType = null
              data.propertySubtype = null
            }
            if (data.propertyType && originalDoc.propertyType !== data.propertyType) {
              data.propertySubtype = null
            }
          }
        }
        return data
      },

      // Validate property classification hierarchy
      validatePropertyClassification,

      // Validate listing fields based on listingType
      validateListingFields,

      // Validate status transitions
      validateStatusTransition,
    ],
    afterChange: [notifyStatusChange],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Location',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'province',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '33%',
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
                    width: '33%',
                    description: 'Select city from PSGC database',
                    components: {
                      Field: '@/components/fields/CitySelectField',
                    },
                  },
                },
                {
                  name: 'cityName',
                  type: 'text',
                  admin: {
                    hidden: true,
                  },
                },
                {
                  name: 'barangay',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '33%',
                    description: 'Select barangay from PSGC database',
                    components: {
                      Field: '@/components/fields/BarangaySelectField',
                    },
                  },
                },
                {
                  name: 'barangayName',
                  type: 'text',
                  admin: {
                    hidden: true,
                  },
                },
                {
                  name: 'development',
                  type: 'relationship',
                  relationTo: 'developments',
                  hasMany: false,
                  filterOptions: ({ siblingData }) => {
                    return {
                      isActive: { equals: true },
                      barangay: { equals: (siblingData as any)?.barangay || 'none' },
                    }
                  },
                  admin: {
                    width: '33%',
                    description: 'Subdivision/development (optional)',
                    components: {
                      Field: '@/components/fields/DevelopmentSelectField',
                    },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'township',
                  type: 'relationship',
                  relationTo: 'townships',
                  hasMany: false,
                  admin: {
                    hidden: true,
                    readOnly: true,
                    width: '50%',
                    description: 'Auto-populated based on Barangay',
                  },
                },
                {
                  name: 'estate',
                  type: 'relationship',
                  relationTo: 'estates',
                  hasMany: false,
                  admin: {
                    hidden: true,
                    readOnly: true,
                    width: '50%',
                    description: 'Auto-populated based on Development',
                  },
                },
              ],
            },
            {
              name: 'fullAddress',
              type: 'text',
              required: true,
              admin: {
                placeholder: 'Full address (street, building, unit number, etc.)',
                description: 'Complete address for internal reference',
              },
            },
          ],
        },
        {
          label: 'Basic Info',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 120,
              admin: {
                placeholder: 'Enter listing title (max 120 characters)',
              },
            },
            {
              name: 'description',
              type: 'richText',
              admin: {
                description: 'Detailed description for internal use and client sharing',
              },
            },
          ],
        },
        {
          label: 'Property Details',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'propertyCategory',
                  type: 'relationship',
                  relationTo: 'property-categories',
                  required: true,
                  hasMany: false,
                  filterOptions: {
                    isActive: { equals: true },
                  },
                  admin: {
                    width: '33%',
                    description: 'Top-level category (e.g., Residential, Commercial)',
                  },
                },
                {
                  name: 'propertyType',
                  type: 'relationship',
                  relationTo: 'property-types',
                  required: true,
                  hasMany: false,
                  filterOptions: ({ data }) => {
                    const query: Where = {
                      isActive: { equals: true },
                    }
                    if (data?.propertyCategory) {
                      query.propertyCategory = { equals: data.propertyCategory }
                    }
                    return query
                  },
                  admin: {
                    width: '33%',
                    description: 'Specific type within the selected category',
                  },
                },
                {
                  name: 'propertySubtype',
                  type: 'relationship',
                  relationTo: 'property-subtypes',
                  hasMany: false,
                  filterOptions: ({ data }) => {
                    const query: Where = {
                      isActive: { equals: true },
                    }
                    if (data?.propertyType) {
                      query.propertyType = { equals: data.propertyType }
                    }
                    return query
                  },
                  admin: {
                    width: '33%',
                    description: 'Optional subtype within the selected property type',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'floorAreaSqm',
                  type: 'number',
                  min: 0,
                  admin: {
                    placeholder: 'Floor area (sqm)',
                    width: '50%',
                    description: 'For condos, offices, buildings',
                  },
                },
                {
                  name: 'lotAreaSqm',
                  type: 'number',
                  min: 0,
                  admin: {
                    placeholder: 'Lot area (sqm)',
                    width: '50%',
                    description: 'For lots, house-and-lot',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'minFloorAreaSqm',
                  type: 'number',
                  min: 0,
                  admin: {
                    placeholder: 'Min Floor area (sqm)',
                    width: '50%',
                    description: 'Minimum floor area (for filtering)',
                  },
                },
                {
                  name: 'minLotAreaSqm',
                  type: 'number',
                  min: 0,
                  admin: {
                    placeholder: 'Min Lot area (sqm)',
                    width: '50%',
                    description: 'Minimum lot area (for filtering)',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'bedrooms',
                  type: 'number',
                  min: 0,
                  admin: {
                    placeholder: 'Bedrooms',
                    width: '33%',
                  },
                },
                {
                  name: 'bathrooms',
                  type: 'number',
                  min: 0,
                  admin: {
                    placeholder: 'Bathrooms',
                    width: '33%',
                  },
                },
                {
                  name: 'parkingSlots',
                  type: 'number',
                  min: 0,
                  admin: {
                    placeholder: 'Parking slots',
                    width: '33%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'furnishing',
                  type: 'select',
                  options: [
                    { label: 'Unfurnished', value: 'unfurnished' },
                    { label: 'Semi-Furnished', value: 'semi_furnished' },
                    { label: 'Fully Furnished', value: 'fully_furnished' },
                  ],
                  admin: {
                    width: '33%',
                  },
                },
                {
                  name: 'constructionYear',
                  type: 'number',
                  min: 1900,
                  max: 2100,
                  admin: {
                    placeholder: 'Year built (e.g., 2020)',
                    width: '33%',
                  },
                },
                {
                  name: 'tenure',
                  type: 'select',
                  options: [
                    { label: 'Freehold', value: 'freehold' },
                    { label: 'Leasehold', value: 'leasehold' },
                  ],
                  admin: {
                    width: '33%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'titleStatus',
                  type: 'select',
                  options: [
                    { label: 'Clean Title', value: 'clean' },
                    { label: 'Mortgaged', value: 'mortgaged' },
                  ],
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Pricing & Terms',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'transactionType',
                  type: 'select',
                  hasMany: true,
                  required: true,
                  options: [
                    { label: 'For Sale', value: 'sale' },
                    { label: 'For Rent', value: 'rent' },
                  ],
                  admin: {
                    width: '33%',
                  },
                },
                {
                  name: 'price',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: {
                    placeholder: 'Base price',
                    width: '33%',
                  },
                },
                {
                  name: 'pricePerSqm',
                  type: 'number',
                  min: 0,
                  admin: {
                    placeholder: 'Price per sqm (for lots)',
                    width: '33%',
                    description: 'Required for lot-type properties',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'paymentTerms',
                  type: 'select',
                  hasMany: true,
                  options: [
                    { label: 'Cash', value: 'cash' },
                    { label: 'Bank Financing', value: 'bank' },
                    { label: 'Pag-IBIG', value: 'pagibig' },
                    { label: 'Deferred Payment', value: 'deferred' },
                  ],
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Preselling Details',
              admin: {
                condition: (data) => data?.listingType === 'preselling',
                description: 'Additional fields for preselling listings (Admin only)',
              },
              fields: [
                {
                  name: 'modelName',
                  type: 'text',
                  admin: {
                    placeholder: 'e.g., 2BR Unit Type A',
                    description: 'Unit model or type name',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'indicativePriceMin',
                      type: 'number',
                      min: 0,
                      admin: {
                        placeholder: 'Minimum price',
                        width: '50%',
                        description: 'Starting price range',
                      },
                    },
                    {
                      name: 'indicativePriceMax',
                      type: 'number',
                      min: 0,
                      admin: {
                        placeholder: 'Maximum price',
                        width: '50%',
                        description: 'Upper price range',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'minLotArea',
                      type: 'number',
                      min: 0,
                      admin: {
                        placeholder: 'Min lot area (sqm)',
                        width: '50%',
                      },
                    },
                    {
                      name: 'minFloorArea',
                      type: 'number',
                      min: 0,
                      admin: {
                        placeholder: 'Min floor area (sqm)',
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  name: 'standardInclusions',
                  type: 'richText',
                  admin: {
                    description: 'Standard inclusions and features',
                  },
                },
                {
                  name: 'presellingNotes',
                  type: 'textarea',
                  admin: {
                    placeholder: 'Additional notes, disclaimers, or special conditions',
                    description: 'Internal notes about this preselling listing',
                  },
                },
              ],
            },
            {
              name: 'indicativeTurnover',
              type: 'text',
              admin: {
                placeholder: 'e.g., Q4 2026, 18-24 months, Ready for Occupancy',
                description: 'Estimated completion/turnover timeline (informational only)',
              },
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            {
              name: 'images',
              type: 'relationship',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description: 'Upload listing photos',
              },
            },
          ],
        },
        {
          label: 'Admin / Status',
          fields: [
            {
              name: 'listingType',
              type: 'select',
              required: true,
              defaultValue: 'resale',
              options: [
                { label: 'Resale', value: 'resale' },
                { label: 'Preselling', value: 'preselling' },
              ],
              access: {
                update: listingTypeFieldAccess,
              },
              admin: {
                position: 'sidebar',
                description: 'Agents can only create Resale listings',
              },
            },
            {
              name: 'createdBy',
              type: 'relationship',
              relationTo: 'users',
              hasMany: false,
              admin: {
                hidden: true,
                position: 'sidebar',
                readOnly: true,
                description: 'Automatically set to the current user',
              },
            },
            {
              name: 'status',
              type: 'select',
              required: true,
              defaultValue: 'draft',
              options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Submitted', value: 'submitted' },
                { label: 'Needs Revision', value: 'needs_revision' },
                { label: 'Published', value: 'published' },
                { label: 'Rejected', value: 'rejected' },
              ],
              admin: {
                position: 'sidebar',
              },
            },
          ],
        },

      ],
    },
  ],
  indexes: [
    {
      fields: ['status'],
    },
    {
      fields: ['listingType'],
    },
    {
      fields: ['province'],
    },
    {
      fields: ['city'],
    },
    {
      fields: ['barangay'],
    },
    {
      fields: ['development'],
    },
    {
      fields: ['price'],
    },
    {
      fields: ['createdBy'],
    },
    {
      fields: ['propertyCategory'],
    },
    {
      fields: ['propertyType'],
    },
    {
      fields: ['status', 'listingType'],
    },
  ],
}
