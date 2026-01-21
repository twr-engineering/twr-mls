import type { CollectionConfig } from 'payload'

export const UserRoles = ['agent', 'approver', 'admin'] as const
export type UserRole = (typeof UserRoles)[number]

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'createdAt'],
    group: 'System',
  },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'agent',
      options: [
        { label: 'Agent', value: 'agent' },
        { label: 'Approver', value: 'approver' },
        { label: 'Admin', value: 'admin' },
      ],
      saveToJWT: true,
      admin: {
        position: 'sidebar',
        description: 'User role determines access permissions',
      },
    },
    {
      name: 'firstName',
      type: 'text',
      admin: {
        placeholder: 'First name',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      admin: {
        placeholder: 'Last name',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        placeholder: 'Phone number',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive users cannot log in',
      },
    },
  ],
}
