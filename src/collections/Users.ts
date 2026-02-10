import type { CollectionConfig, Access, Where } from 'payload'
import { adminOnly, adminOnlyField, isAdmin } from '@/access'

export const UserRoles = ['agent', 'approver', 'admin'] as const
export type UserRole = (typeof UserRoles)[number]

const canReadUser: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  if (user.role === 'approver') {
    const query: Where = {
      or: [
        { role: { in: ['agent', 'approver'] } },
        { id: { equals: user.id } },
      ],
    }
    return query
  }

  const query: Where = { id: { equals: user.id } }
  return query
}

const canUpdateUser: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  const query: Where = { id: { equals: user.id } }
  return query
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'createdAt'],
    group: 'System',
    hidden: ({ user }) => !isAdmin(user),
  },
  auth: {
    // Token expires after 1 hour of inactivity
    tokenExpiration: 3600,
    cookies: {
      // Ensure secure cookies in production
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  access: {
    read: canReadUser,
    create: adminOnly,
    update: canUpdateUser,
    delete: adminOnly,
  },
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
      access: {
        update: adminOnlyField,
      },
      admin: {
        position: 'sidebar',
        description: 'User role determines access permissions (Admin only can modify)',
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
