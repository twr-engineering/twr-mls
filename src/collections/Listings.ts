import type { CollectionConfig, Access, FieldAccess, Where } from 'payload'
import { authenticated } from '@/access'
import { validateStatusTransition } from '@/hooks/listings/validateStatusTransition'
import { notifyStatusChange } from '@/hooks/listings/notifyStatusChange'
import { populateLocationRelations } from '@/hooks/listings/populateLocationRelations'


/**
 * Listings Collection
 *
 * Core business entity for the MLS system.
 * Reference: core-collection.md
 */

// Listing status values
export const ListingStatuses = [
  'draft',
  'submitted',
  'needs_revision',
  'published',
  'rejected',
] as const
export type ListingStatus = (typeof ListingStatuses)[number]

// Listing type values
export const ListingTypes = ['resale', 'preselling'] as const
export type ListingType = (typeof ListingTypes)[number]

// Transaction type values
export const TransactionTypes = ['sale', 'rent'] as const
export type TransactionType = (typeof TransactionTypes)[number]

// Furnishing options
export const FurnishingOptions = ['unfurnished', 'semi_furnished', 'fully_furnished'] as const
export type FurnishingOption = (typeof FurnishingOptions)[number]

// Tenure options
export const TenureOptions = ['freehold', 'leasehold'] as const
export type TenureOption = (typeof TenureOptions)[number]

// Title status options
export const TitleStatusOptions = ['clean', 'mortgaged'] as const
export type TitleStatusOption = (typeof TitleStatusOptions)[number]

// Payment terms options
export const PaymentTermsOptions = ['cash', 'bank', 'pagibig', 'deferred'] as const
export type PaymentTermsOption = (typeof PaymentTermsOptions)[number]

/**
 * Access Control Functions
 */

// Read: Agents see own + published, Approvers/Admin see all
const canReadListing: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admin and Approvers can see all listings
  if (user.role === 'admin' || user.role === 'approver') {
    return true
  }

  // Agents can see their own listings OR published listings
  const query: Where = {
    or: [
      { createdBy: { equals: user.id } },
      { status: { equals: 'published' } },
    ],
  }
  return query
}

// Create: All authenticated users can create (listingType restriction handled in field access)
const canCreateListing: Access = authenticated

// Update: Agents can update own RESALE draft/needs_revision, Approvers/Admin can update all
const canUpdateListing: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admin can update all
  if (user.role === 'admin') {
    return true
  }

  // Approvers can update all (for status changes)
  if (user.role === 'approver') {
    return true
  }

  // Agents can only update their own RESALE listings that are draft or needs_revision
  // Preselling listings are read-only for agents (per core-collection.md)
  const query: Where = {
    and: [
      { createdBy: { equals: user.id } },
      { listingType: { equals: 'resale' } }, // Agents cannot update preselling
      {
        or: [
          { status: { equals: 'draft' } },
          { status: { equals: 'needs_revision' } },
        ],
      },
    ],
  }
  return query
}

// Delete: Agents can delete own drafts, Admin can delete any
const canDeleteListing: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admin can delete all
  if (user.role === 'admin') {
    return true
  }

  // Agents can only delete their own draft listings
  if (user.role === 'agent') {
    const query: Where = {
      and: [
        { createdBy: { equals: user.id } },
        { status: { equals: 'draft' } },
      ],
    }
    return query
  }

  return false
}

// Field access: listingType - Agents cannot modify (enforced in hooks)
const listingTypeFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) return false

  // Admin can always set listingType
  if (user.role === 'admin') return true

  // Agents cannot modify listingType (enforced via beforeChange hook on create)
  // On update, they won't have access to modify based on update access control
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
      // Auto-set createdBy on create
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user) {
          data.createdBy = req.user.id
        }
        return data
      },
      // Enforce listingType restriction for agents
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user?.role === 'agent') {
          // Force resale for agents
          data.listingType = 'resale'
        }
        return data
      },
      // Validate location hierarchy
      async ({ data, req, operation }) => {
        if (operation === 'create' || operation === 'update') {
          // Validate barangay belongs to city
          if (data.city && data.barangay) {
            const barangay = await req.payload.findByID({
              collection: 'barangays',
              id: data.barangay,
              depth: 0,
              req, // Pass req for transaction safety
            })

            if (barangay && barangay.city !== data.city) {
              throw new Error('Selected barangay does not belong to the selected city')
            }
          }

          // Validate development belongs to barangay
          if (data.barangay && data.development) {
            const development = await req.payload.findByID({
              collection: 'developments',
              id: data.development,
              depth: 0,
              req, // Pass req for transaction safety
            })

            if (development && development.barangay !== data.barangay) {
              throw new Error('Selected development does not belong to the selected barangay')
            }
          }
        }
        return data
      },
      // Validate status transitions
      validateStatusTransition,
    ],
    afterChange: [
      // Send notifications on status changes
      notifyStatusChange,
    ],
  },
  fields: [
    // ==========================================
    // A. Core Details
    // ==========================================
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

    // ==========================================
    // B. Listing Type & Governance
    // ==========================================
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

    // ==========================================
    // C. Transaction & Pricing
    // ==========================================
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

    // ==========================================
    // D. Area & Specifications
    // ==========================================
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

    // ==========================================
    // E. Attributes
    // ==========================================
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

    // ==========================================
    // F. Legal & Payment
    // ==========================================
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

    // ==========================================
    // G. Address & Location (CRITICAL)
    // ==========================================
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

    // ==========================================
    // Images (relationship to Media)
    // ==========================================
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Upload listing photos',
      },
    },

    // ==========================================
    // Preselling-Specific Fields (Admin Only)
    // ==========================================
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
    // Compound index for MLS search (published listings by type)
    {
      fields: ['status', 'listingType'],
    },
  ],
}
