import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'System',
    description: 'Uploaded media files (images, documents)',
  },
  access: {

    read: () => true,

    create: authenticated,

    update: adminOnly,

    delete: adminOnly,
  },
  hooks: {
    beforeChange: [

      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      // required: true, // Removed to allow server-side autofill
      admin: {
        description: 'Alternative text for accessibility',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value) {
              return 'Property Image' // Fallback
            }
            return value
          }
        ]
      }
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'User who uploaded this file',
      },
    },
  ],
  upload: {
    staticDir: 'public/media',
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
}
