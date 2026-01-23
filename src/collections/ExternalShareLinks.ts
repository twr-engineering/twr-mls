import type { CollectionConfig, Access, Where } from 'payload'
import { authenticated, adminOnly } from '@/access'
import { generateSecureToken } from '@/utilities/generateToken'

const canReadShareLink: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  const query: Where = {
    createdBy: { equals: user.id },
  }
  return query
}

const canCreateShareLink: Access = authenticated

const canUpdateShareLink: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  const query: Where = {
    createdBy: { equals: user.id },
  }
  return query
}

export const ExternalShareLinks: CollectionConfig = {
  slug: 'external-share-links',
  admin: {
    useAsTitle: 'token',
    defaultColumns: ['listing', 'createdBy', 'isActive', 'expiresAt', 'viewCount', 'createdAt'],
    group: 'Listings',
    description: 'Share links for external clients to view published listings',
  },
  access: {
    read: canReadShareLink,
    create: canCreateShareLink,
    update: canUpdateShareLink,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [

      async ({ data, req, operation }) => {
        if (operation === 'create') {

          data.token = generateSecureToken()

          if (req.user) {
            data.createdBy = req.user.id
          }
        }
        return data
      },

      async ({ data, req, operation }) => {
        if ((operation === 'create' || operation === 'update') && data.listing) {
          const listing = await req.payload.findByID({
            collection: 'listings',
            id: data.listing,
            depth: 0,
            req,
          })

          if (listing && listing.status !== 'published') {
            throw new Error('Share links can only be created for published listings')
          }
        }
        return data
      },
    ],
  },
  fields: [

    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated secure token for the share URL',
      },
    },
    {
      name: 'listing',
      type: 'relationship',
      relationTo: 'listings',
      required: true,
      hasMany: false,
      filterOptions: {
        status: { equals: 'published' },
      },
      admin: {
        description: 'The listing to share (must be published)',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'User who created this share link',
      },
    },

    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Optional expiry date (leave empty for no expiry)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Set to false to revoke this share link',
      },
    },

    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Number of times this link has been accessed',
      },
    },
    {
      name: 'lastViewedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Last time this link was accessed',
      },
    },
  ],
  indexes: [
    {
      fields: ['token'],
      unique: true,
    },
    {
      fields: ['listing'],
    },
    {
      fields: ['createdBy'],
    },
    {
      fields: ['isActive'],
    },
  ],
}
