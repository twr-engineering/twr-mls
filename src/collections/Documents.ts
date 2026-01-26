import type { CollectionConfig, Access, FieldAccess } from 'payload'
import { approverOrAdmin } from '@/access'

export const DocumentTypes = [
  'title',
  'tax_declaration',
  'contract',
  'floor_plan',
  'site_plan',
  'photo_id',
  'proof_of_billing',
  'other',
] as const
export type DocumentType = (typeof DocumentTypes)[number]

export const VisibilityOptions = ['private', 'internal'] as const
export type VisibilityOption = (typeof VisibilityOptions)[number]

const canDeleteDocument: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin'
}

const verificationFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin' || user.role === 'approver'
}

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'listing', 'visibility', 'verified', 'uploadedBy', 'createdAt'],
    group: 'Listings',
    description: 'Documents attached to listings (titles, contracts, etc.)',
  },
  access: {
    read: approverOrAdmin,
    create: approverOrAdmin,
    update: approverOrAdmin,
    delete: canDeleteDocument,
  },
  hooks: {
    beforeChange: [

      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.id
          data.uploadedAt = new Date().toISOString()
        }
        return data
      },

      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user?.role === 'agent' && data.listing) {
          const listing = await req.payload.findByID({
            collection: 'listings',
            id: data.listing,
            depth: 0,
            req,
          })

          if (listing && listing.createdBy !== req.user.id) {
            throw new Error('You can only upload documents to your own listings')
          }
        }
        return data
      },

      async ({ data, req, operation, originalDoc }) => {
        if (
          (operation === 'create' || operation === 'update') &&
          data.verified === true &&
          originalDoc?.verified !== true &&
          req.user
        ) {
          data.verifiedBy = req.user.id
          data.verifiedAt = new Date().toISOString()
        }

        if (data.verified === false && originalDoc?.verified === true) {
          data.verifiedBy = null
          data.verifiedAt = null
        }
        return data
      },
    ],
  },
  fields: [

    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Title', value: 'title' },
        { label: 'Tax Declaration', value: 'tax_declaration' },
        { label: 'Contract', value: 'contract' },
        { label: 'Floor Plan', value: 'floor_plan' },
        { label: 'Site Plan', value: 'site_plan' },
        { label: 'Photo ID', value: 'photo_id' },
        { label: 'Proof of Billing', value: 'proof_of_billing' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Type of document',
      },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'The document file',
      },
    },
    {
      name: 'listing',
      type: 'relationship',
      relationTo: 'listings',
      required: true,
      hasMany: false,
      admin: {
        description: 'The listing this document belongs to',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        placeholder: 'Optional notes about this document',
      },
    },

    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'private',
      options: [
        { label: 'Private (Owner + Approvers only)', value: 'private' },
        { label: 'Internal (All agents)', value: 'internal' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Who can see this document',
      },
    },

    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Automatically set to current user',
      },
    },
    {
      name: 'uploadedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },

    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      access: {
        update: verificationFieldAccess,
      },
      admin: {
        position: 'sidebar',
        description: 'Mark document as verified',
      },
    },
    {
      name: 'verifiedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      access: {
        update: verificationFieldAccess,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'User who verified this document',
        condition: (data) => data?.verified === true,
      },
    },
    {
      name: 'verifiedAt',
      type: 'date',
      access: {
        update: verificationFieldAccess,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
        condition: (data) => data?.verified === true,
      },
    },
  ],
  indexes: [
    {
      fields: ['listing'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['visibility'],
    },
    {
      fields: ['verified'],
    },
  ],
}
