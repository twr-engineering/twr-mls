import type { Access, FieldAccess } from 'payload'
import type { UserRole } from '@/collections/Users'

type User = {
  id: number
  email: string
  role?: UserRole
}

type AccessArgs = {
  req: {
    user?: User | null
  }
}

export const hasRole = (user: User | null | undefined, roles: UserRole[]): boolean => {
  if (!user || !user.role) return false
  if (!roles || !Array.isArray(roles)) return false
  return roles.includes(user.role as UserRole)
}

export const isAdmin = (user: User | null | undefined): boolean => {
  return hasRole(user, ['admin'])
}

export const isApproverOrAdmin = (user: User | null | undefined): boolean => {
  return hasRole(user, ['approver', 'admin'])
}

export const isAgent = (user: User | null | undefined): boolean => {
  return hasRole(user, ['agent'])
}

export const authenticated: Access = ({ req }: AccessArgs) => {
  return Boolean(req.user)
}

export const adminOnly: Access = ({ req }: AccessArgs) => {
  return isAdmin(req.user)
}

export const approverOrAdmin: Access = ({ req }: AccessArgs) => {
  return isApproverOrAdmin(req.user)
}

export const anyone: Access = () => true

export const adminOnlyField: FieldAccess = ({ req }) => {
  return isAdmin(req.user)
}

export const approverOrAdminField: FieldAccess = ({ req }) => {
  return isApproverOrAdmin(req.user)
}
