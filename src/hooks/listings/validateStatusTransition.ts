import type { CollectionBeforeChangeHook } from 'payload'
import type { Listing } from '@/payload-types'

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['published', 'needs_revision', 'rejected'],
  needs_revision: ['submitted'],
  published: ['draft'], 
  rejected: ['draft'], 
}

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
