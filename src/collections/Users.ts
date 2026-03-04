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
    // 30-day sliding expiration: SessionGuard refreshes on every page mount,
    // so visiting any page within 30 days extends the session by another 30 days.
    // This eliminates the forced 1-hour hard logout while keeping the token
    // bounded — a token genuinely unused for 30 days expires naturally.
    tokenExpiration: 2592000, // 30 days in seconds
    // Disable Payload's built-in session tracking — SessionGuard handles token
    // refresh client-side and requireAuth() handles expiry server-side.
    useSessions: false,
    // Disable login-attempt lockout entirely — agents can log out and
    // immediately log back in without restriction. Setting to 0 bypasses
    // Payload's default (5 attempts → 10-minute lock).
    maxLoginAttempts: 0,
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
    admin: ({ req: { user } }) => {
      if (!user) return false
      return ['admin', 'approver'].includes(user.role as UserRole)
    },
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
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'Profile picture',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      access: {
        update: adminOnlyField,
      },
      admin: {
        position: 'sidebar',
        description: 'Inactive users cannot log in',
      },
    },
  ],
}
