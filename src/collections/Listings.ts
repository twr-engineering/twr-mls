import type { CollectionConfig, Access, FieldAccess, Where } from 'payload'
import { authenticated } from '@/access'
import { validateStatusTransition } from '@/hooks/listings/validateStatusTransition'
import { notifyStatusChange } from '@/hooks/listings/notifyStatusChange'
import { populateLocationRelations } from '@/hooks/listings/populateLocationRelations'

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

  if (user.role === 'admin' || user.role === 'approver') {
    return true
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
        or: [{ status: { equals: 'draft' } }, { status: { equals: 'needs_revision' } }],
      },
    ],
  }
  return query
}

const canDeleteListing: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') {
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

const propertyOwnerFieldAccess: FieldAccess = ({ req: { user }, doc }) => {
  if (!user) return false

  if (user.role === 'admin' || user.role === 'approver') {
    return true
  }

  if (user.role === 'agent' && doc?.createdBy === user.id) {
    return true
  }

  return false
}

export const Listings: CollectionConfig = {
  slug: 'listings',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'listingType', 'status', 'city', 'price', 'createdBy', 'updatedAt'],
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

      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'create' || operation === 'update') {
          // Validate location hierarchy
          if (data.city && data.barangay) {
            const barangay = await req.payload.findByID({
              collection: 'barangays',
              id: data.barangay,
              depth: 0,
              req,
            })

            if (barangay && barangay.city !== data.city) {
              throw new Error('Selected barangay does not belong to the selected city')
            }
          }

          if (data.barangay && data.development) {
            const development = await req.payload.findByID({
              collection: 'developments',
              id: data.development,
              depth: 0,
              req,
            })

            if (development && development.barangay !== data.barangay) {
              throw new Error('Selected development does not belong to the selected barangay')
            }
          }

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

      validateStatusTransition,
    ],
    afterChange: [notifyStatusChange],
  },
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
            description: 'Select category first (e.g., Residential)',
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
              query.category = { equals: data.propertyCategory }
            }
            return query
          },
          admin: {
            width: '33%',
            description: 'Filtered by category (e.g., House & Lot)',
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
            description: 'Filtered by type (optional)',
          },
        },
      ],
    },

    {
      type: 'collapsible',
      label: 'Property Owner Information',
      admin: {
        description: 'Sensitive information - visible only to listing owner, approvers, and admin',
        condition: (data) => data?.listingType === 'resale',
      },
      fields: [
        {
          name: 'propertyOwnerName',
          type: 'text',
          access: {
            read: propertyOwnerFieldAccess,
          },
          admin: {
            placeholder: 'Full name of property owner',
          },
        },
        {
          name: 'propertyOwnerContact',
          type: 'text',
          access: {
            read: propertyOwnerFieldAccess,
          },
          admin: {
            placeholder: 'Contact number or email',
          },
        },
        {
          name: 'propertyOwnerNotes',
          type: 'textarea',
          access: {
            read: propertyOwnerFieldAccess,
          },
          admin: {
            placeholder: 'Internal notes about the property owner',
            description: 'For agent reference only',
          },
        },
      ],
    },

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

    {
      type: 'row',
      fields: [
        {
          name: 'transactionType',
          type: 'select',
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
      type: 'row',
      fields: [
        {
          name: 'city',
          type: 'relationship',
          relationTo: 'cities',
          required: true,
          hasMany: false,
          filterOptions: {
            isActive: { equals: true },
          },
          admin: {
            width: '33%',
            description: 'Select city first',
          },
        },
        {
          name: 'barangay',
          type: 'relationship',
          relationTo: 'barangays',
          required: true,
          hasMany: false,
          filterOptions: ({ data }) => {
            const query: Where = {
              isActive: { equals: true },
            }
            if (data?.city) {
              query.city = { equals: data.city }
            }
            return query
          },
          admin: {
            width: '33%',
            description: 'Filtered by selected city',
          },
        },
        {
          name: 'development',
          type: 'relationship',
          relationTo: 'developments',
          hasMany: false,
          filterOptions: ({ data }) => {
            const query: Where = {
              isActive: { equals: true },
            }
            if (data?.barangay) {
              query.barangay = { equals: data.barangay }
            }
            return query
          },
          admin: {
            width: '33%',
            description: 'Filtered by selected barangay (optional)',
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

    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Upload listing photos',
      },
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
  ],
  indexes: [
    {
      fields: ['status'],
    },
    {
      fields: ['listingType'],
    },
    {
      fields: ['transactionType'],
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
