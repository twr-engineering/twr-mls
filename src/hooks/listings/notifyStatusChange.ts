import type { CollectionAfterChangeHook } from 'payload'
import type { Listing } from '@/payload-types'

/**
 * Payload AfterChange Hook: Sends notifications when a listing status changes.
 *
 * Triggers on:
 * - 'published': Notifies the creator
 * - 'needs_revision': Notifies the creator
 * - 'rejected': Notifies the creator
 * - 'submitted': Notifies all admins and approvers
 *
 * @param args - The hook arguments containing doc, previousDoc, and operation
 * @returns The original document without modification
 */
export const notifyStatusChange: CollectionAfterChangeHook<Listing> = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Skip notifications in test environment
  if (process.env.VITEST === 'true') {
    return doc
  }

  if (operation !== 'update' || !previousDoc) return doc

  const oldStatus = previousDoc.status
  const newStatus = doc.status

  if (oldStatus === newStatus) return doc

  const title = doc.title
  const ownerId = doc.createdBy && typeof doc.createdBy === 'object' ? doc.createdBy.id : doc.createdBy

  if (newStatus && ['published', 'needs_revision', 'rejected'].includes(newStatus) && ownerId) {
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
      req,
      overrideAccess: true,
    })
  }

  if (newStatus === 'submitted') {
    const approvers = await req.payload.find({
      collection: 'users',
      where: {
        role: { in: ['approver', 'admin'] },
        isActive: { equals: true },
      },
      req,
    })

    for (const approver of approvers.docs) {

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
        req,
        overrideAccess: true,
      })
    }
  }

  return doc
}
