import type { CollectionAfterChangeHook } from 'payload'
import type { Listing } from '@/payload-types'

/**
 * Notification hook for listing status changes
 *
 * Triggers:
 * - → published: Notify listing owner
 * - → needs_revision: Notify listing owner
 * - → rejected: Notify listing owner
 * - → submitted: Notify all approvers
 */
export const notifyStatusChange: CollectionAfterChangeHook<Listing> = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only trigger on updates with a previous document
  if (operation !== 'update' || !previousDoc) return doc

  const oldStatus = previousDoc.status
  const newStatus = doc.status

  // No status change, nothing to do
  if (oldStatus === newStatus) return doc

  const title = doc.title
  const ownerId = typeof doc.createdBy === 'object' ? doc.createdBy.id : doc.createdBy

  // Notify owner on status changes that affect them
  if (['published', 'needs_revision', 'rejected'].includes(newStatus)) {
    const messages: Record<string, string> = {
      published: `Your listing "${title}" has been published`,
      needs_revision: `Your listing "${title}" needs revision`,
      rejected: `Your listing "${title}" has been rejected`,
    }

    await req.payload.create({
      collection: 'notifications',
      data: {
        type: `listing_${newStatus}` as
          | 'listing_published'
          | 'listing_needs_revision'
          | 'listing_rejected',
        recipient: ownerId,
        listing: doc.id,
        message: messages[newStatus],
        read: false,
      },
      req, // Maintain transaction context
    })
  }

  // Notify approvers when listing is submitted for review
  if (newStatus === 'submitted') {
    const approvers = await req.payload.find({
      collection: 'users',
      where: {
        role: { in: ['approver', 'admin'] },
        isActive: { equals: true },
      },
      req, // Maintain transaction context
    })

    // Create notification for each approver
    for (const approver of approvers.docs) {
      // Don't notify the submitter if they happen to be an approver/admin
      if (approver.id === req.user?.id) continue

      await req.payload.create({
        collection: 'notifications',
        data: {
          type: 'listing_submitted',
          recipient: approver.id,
          listing: doc.id,
          message: `New listing "${title}" submitted for review`,
          read: false,
        },
        req, // Maintain transaction context
      })
    }
  }

  return doc
}
