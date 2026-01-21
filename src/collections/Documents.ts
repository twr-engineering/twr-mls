import type { CollectionConfig, Access, FieldAccess, Where } from 'payload'
import { authenticated } from '@/access'

/**
 * Documents Collection
 *
 * Stores documents related to listings (title, tax declarations, etc.)
 * with visibility controls and verification workflow.
 */

// Document type options
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

// Visibility options
export const VisibilityOptions = ['private', 'internal'] as const
export type VisibilityOption = (typeof VisibilityOptions)[number]

/**
 * Access Control Functions
 */

// Read access: Based on visibility
// - private: Only listing owner + Approvers/Admin
// - internal: All authenticated users
const canReadDocument: Access = async ({ req: { user } }) => {
  if (!user) return false

  // Admin and Approvers can see all documents
  if (user.role === 'admin' || user.role === 'approver') {
    return true
  }

  // Agents can see:
  // 1. Internal documents (any)
  // 2. Private documents only if they own the listing
  const query: Where = {
    or: [
      // Internal documents - visible to all authenticated
      { visibility: { equals: 'internal' } },
      // Private documents - only if user owns the listing
      {
        and: [
          { visibility: { equals: 'private' } },
          { 'listing.createdBy': { equals: user.id } },
        ],
      },
    ],
  }
  return query
}

// Create: All authenticated users can upload documents to their own listings
const canCreateDocument: Access = authenticated

// Update: Only listing owner (for own listing docs) + Approvers/Admin
const canUpdateDocument: Access = async ({ req: { user } }) => {
  if (!user) return false

  // Admin and Approvers can update all documents
  if (user.role === 'admin' || user.role === 'approver') {
    return true
  }

  // Agents can only update documents for their own listings
  const query: Where = {
    'listing.createdBy': { equals: user.id },
  }
  return query
}

// Delete: Only Admin can delete documents
const canDeleteDocument: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin'
}

// Field access for verification fields - only Approvers/Admin
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
    read: canReadDocument,
    create: canCreateDocument,
    update: canUpdateDocument,
    delete: canDeleteDocument,
  },
  hooks: {
    beforeChange: [
      // Auto-set uploadedBy on create
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.id
          data.uploadedAt = new Date().toISOString()
        }
        return data
      },
      // Validate that user owns the listing (for agents)
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user?.role === 'agent' && data.listing) {
          const listing = await req.payload.findByID({
            collection: 'listings',
            id: data.listing,
            depth: 0,
            req, // Pass req for transaction safety
          })

          if (listing && listing.createdBy !== req.user.id) {
            throw new Error('You can only upload documents to your own listings')
          }
        }
        return data
      },
      // Auto-set verifiedBy and verifiedAt when verified changes to true
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
        // Clear verification fields if verified is set to false
        if (data.verified === false && originalDoc?.verified === true) {
          data.verifiedBy = null
          data.verifiedAt = null
        }
        return data
      },
    ],
  },
  fields: [
    // ==========================================
    // Document Information
    // ==========================================
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

    // ==========================================
    // Visibility
    // ==========================================
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

    // ==========================================
    // Upload Tracking
    // ==========================================
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

    // ==========================================
    // Verification (Approvers/Admin only)
    // ==========================================
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
