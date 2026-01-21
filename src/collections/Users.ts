import type { CollectionConfig, Access, Where } from 'payload'
import { adminOnly, adminOnlyField } from '@/access'

export const UserRoles = ['agent', 'approver', 'admin'] as const
export type UserRole = (typeof UserRoles)[number]

/**
 * Access Control for Users Collection
 */

// Read: Users see own profile, Approvers see agents/approvers, Admin sees all
const canReadUser: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admin can see all users
  if (user.role === 'admin') return true

  // Approvers can see agents and other approvers (for assignment purposes)
  if (user.role === 'approver') {
    const query: Where = {
      or: [
        { role: { in: ['agent', 'approver'] } },
        { id: { equals: user.id } },
      ],
    }
    return query
  }

  // Agents can only see themselves
  const query: Where = { id: { equals: user.id } }
  return query
}

// Update: Users can update own profile (except role), Admin can update all
const canUpdateUser: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admin can update all users
  if (user.role === 'admin') return true

  // Users can update their own profile
  const query: Where = { id: { equals: user.id } }
  return query
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'createdAt'],
    group: 'System',
  },
  auth: true,
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
