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
 * Checks if a user has one of the specified roles.
 * @param user - The user object to check
 * @param roles - Array of roles to check against
 * @returns True if the user has one of the roles, false otherwise
 */
export const hasRole = (user: User | null | undefined, roles: UserRole[]): boolean => {
  if (!user || !user.role) return false
  if (!roles || !Array.isArray(roles)) return false
  return roles.includes(user.role as UserRole)
}

/**
 * Checks if the user has the 'admin' role.
 * @param user - The user object to check
 * @returns True if the user is an admin
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  return hasRole(user, ['admin'])
}

/**
 * Checks if the user has either 'approver' or 'admin' role.
 * @param user - The user object to check
 * @returns True if the user is an approver or admin
 */
export const isApproverOrAdmin = (user: User | null | undefined): boolean => {
  return hasRole(user, ['approver', 'admin'])
}

/**
 * Checks if the user has the 'agent' role.
 * @param user - The user object to check
 * @returns True if the user is an agent
 */
export const isAgent = (user: User | null | undefined): boolean => {
  return hasRole(user, ['agent'])
}

/**
 * Payload Access Control: Allows access only to authenticated users.
 */
export const authenticated: Access = ({ req }: AccessArgs) => {
  return Boolean(req.user)
}

/**
 * Payload Access Control: Allows access only to users with 'admin' role.
 */
export const adminOnly: Access = ({ req }: AccessArgs) => {
  return isAdmin(req.user)
}

/**
 * Payload Access Control: Allows access only to users with 'approver' or 'admin' role.
 */
export const approverOrAdmin: Access = ({ req }: AccessArgs) => {
  return isApproverOrAdmin(req.user)
}

/**
 * Payload Access Control: Allows public access.
 */
export const anyone: Access = () => true

/**
 * Payload Field Access Control: Allows field update only by admins.
 */
export const adminOnlyField: FieldAccess = ({ req }) => {
  return isAdmin(req.user)
}

/**
 * Payload Field Access Control: Allows field update only by approvers or admins.
 */
export const approverOrAdminField: FieldAccess = ({ req }) => {
  return isApproverOrAdmin(req.user)
}
