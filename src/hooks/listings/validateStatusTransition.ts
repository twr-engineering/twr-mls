import type { CollectionBeforeChangeHook } from 'payload'
import type { Listing } from '@/payload-types'

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['published', 'needs_revision', 'rejected'],
  needs_revision: ['submitted'],
  published: ['draft'],
  rejected: ['draft'],
}

/**
 * Payload BeforeChange Hook: Validates status transitions and enforces role-based rules.
 *
 * Rules:
 * - Administrators can perform any transition.
 * - Agents can only submit listings (cannot publish or reject).
 * - Status transitions must follow the defined flow (e.g., draft -> submitted -> published).
 * - Prevents agents from changing status to anything other than 'submitted'.
 *
 * @param args - The hook arguments containing data, originalDoc, req, and operation
 * @returns The data if valid, throws an error if invalid
 */
export const validateStatusTransition: CollectionBeforeChangeHook<Listing> = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {

  if (operation !== 'update' || !originalDoc || !data.status) return data

  const oldStatus = originalDoc.status
  const newStatus = data.status

  if (oldStatus === newStatus) return data

  if (req.user?.role === 'admin') return data

  const allowedTransitions = VALID_TRANSITIONS[oldStatus]

  if (!allowedTransitions || !Array.isArray(allowedTransitions)) {
    throw new Error(`Invalid status transition: ${oldStatus} → ${newStatus}`)
  }

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Invalid status transition: ${oldStatus} → ${newStatus}`)
  }

  if (req.user?.role === 'agent') {
    if (newStatus !== 'submitted') {
      throw new Error('Agents can only submit listings for review')
    }
  }

  return data
}
