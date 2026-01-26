import type { CollectionConfig, Access, Where } from 'payload'
import { adminOnly } from '@/access'

export const NotificationTypes = [
  'listing_published',
  'listing_needs_revision',
  'listing_rejected',
  'listing_submitted',
] as const
export type NotificationType = (typeof NotificationTypes)[number]

const canReadNotification: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  const query: Where = {
    recipient: { equals: user.id },
  }
  return query
}

const canCreateNotification: Access = ({ req: { user } }) => {

  if (!user) return false
  return user.role === 'admin'
}

const canUpdateNotification: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  const query: Where = {
    recipient: { equals: user.id },
  }
  return query
}

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['type', 'recipient', 'message', 'read', 'createdAt'],
    group: 'System',
    description: 'System notifications for users',
    hidden: true,
  },
  access: {
    read: canReadNotification,
    create: canCreateNotification,
    update: canUpdateNotification,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [

      async ({ data, originalDoc }) => {
        if (data.read === true && originalDoc?.read !== true) {
          data.readAt = new Date().toISOString()
        }

        if (data.read === false && originalDoc?.read === true) {
          data.readAt = null
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
        { label: 'Listing Published', value: 'listing_published' },
        { label: 'Listing Needs Revision', value: 'listing_needs_revision' },
        { label: 'Listing Rejected', value: 'listing_rejected' },
        { label: 'Listing Submitted', value: 'listing_submitted' },
      ],
      admin: {
        description: 'Type of notification',
      },
    },
    {
      name: 'message',
      type: 'text',
      required: true,
      admin: {
        description: 'Notification message',
      },
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        description: 'User who receives this notification',
      },
    },
    {
      name: 'listing',
      type: 'relationship',
      relationTo: 'listings',
      hasMany: false,
      admin: {
        description: 'Related listing (if applicable)',
      },
    },

    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Has the user read this notification?',
      },
    },
    {
      name: 'readAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When the notification was read',
        condition: (data) => data?.read === true,
      },
    },
  ],
  indexes: [
    {
      fields: ['recipient'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['read'],
    },
    {
      fields: ['listing'],
    },
  ],
}
