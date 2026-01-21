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

/**
 * Check if user has one of the specified roles
 */
export const hasRole = (user: User | null | undefined, roles: UserRole[]): boolean => {
  if (!user) return false
  return roles.includes(user.role as UserRole)
}

/**
 * Check if user is an admin
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  return hasRole(user, ['admin'])
}

/**
 * Check if user is an approver (or admin)
 */
export const isApproverOrAdmin = (user: User | null | undefined): boolean => {
  return hasRole(user, ['approver', 'admin'])
}

/**
 * Check if user is an agent
 */
export const isAgent = (user: User | null | undefined): boolean => {
  return hasRole(user, ['agent'])
}

/**
 * Access control: Only authenticated users
 */
export const authenticated: Access = ({ req }: AccessArgs) => {
  return Boolean(req.user)
}

/**
 * Access control: Only admins
 */
export const adminOnly: Access = ({ req }: AccessArgs) => {
  return isAdmin(req.user)
}

/**
 * Access control: Approvers and admins
 */
export const approverOrAdmin: Access = ({ req }: AccessArgs) => {
  return isApproverOrAdmin(req.user)
}

/**
 * Access control: Anyone (public)
 */
export const anyone: Access = () => true

/**
 * Field access: Only admins can modify
 */
export const adminOnlyField: FieldAccess = ({ req }) => {
  return isAdmin(req.user)
}

/**
 * Field access: Approvers and admins can modify
 */
export const approverOrAdminField: FieldAccess = ({ req }) => {
  return isApproverOrAdmin(req.user)
}
