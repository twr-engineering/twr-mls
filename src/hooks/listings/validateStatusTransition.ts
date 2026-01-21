import type { CollectionBeforeChangeHook } from 'payload'
import type { Listing } from '@/payload-types'

/**
 * Valid status transitions for listings
 *
 * draft → submitted (agent submits for review)
 * submitted → published (approver approves)
 * submitted → needs_revision (approver requests changes)
 * submitted → rejected (approver rejects)
 * needs_revision → submitted (agent resubmits)
 * published → draft (admin unpublishes for editing)
 * rejected → draft (admin allows re-editing)
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['published', 'needs_revision', 'rejected'],
  needs_revision: ['submitted'],
  published: ['draft'], // Admin can unpublish
  rejected: ['draft'], // Admin can allow re-edit
}

export const validateStatusTransition: CollectionBeforeChangeHook<Listing> = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Only validate on update operations
  if (operation !== 'update' || !originalDoc || !data.status) return data

  const oldStatus = originalDoc.status
  const newStatus = data.status

  // No change in status, nothing to validate
  if (oldStatus === newStatus) return data

  // Admin can bypass transition rules
  if (req.user?.role === 'admin') return data

  const allowedTransitions = VALID_TRANSITIONS[oldStatus] || []

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Invalid status transition: ${oldStatus} → ${newStatus}`)
  }

  // Agents can only submit (draft/needs_revision → submitted)
  if (req.user?.role === 'agent') {
    if (newStatus !== 'submitted') {
      throw new Error('Agents can only submit listings for review')
    }
  }

  return data
}
