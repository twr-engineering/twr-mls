'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Listing, User } from '@/payload-types'

export type { Listing, User }

/**
 * Get Payload instance with proper configuration
 */
async function getPayloadInstance() {
  return await getPayload({ config })
}

/**
 * Get authenticated user from request headers
 */
async function getAuthUser() {
  const payload = await getPayloadInstance()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  return user as User | null
}

/**
 * Get listings for the current user (agent)
 * IMPORTANT: Always uses overrideAccess: false to enforce access control
 */
export async function getUserListings(filters?: {
  status?: string
  listingType?: string
  limit?: number
}) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.find({
    collection: 'listings',
    where: {
      createdBy: { equals: user.id },
      ...(filters?.status && { status: { equals: filters.status } }),
      ...(filters?.listingType && { listingType: { equals: filters.listingType } }),
    },
    limit: filters?.limit || 50,
    sort: '-createdAt',
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Get a single listing by ID
 * IMPORTANT: Always uses overrideAccess: false to enforce access control
 */
export async function getListingById(id: string) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    const listing = await payload.findByID({
      collection: 'listings',
      id,
      overrideAccess: false,
      user,
    })

    return listing
  } catch (error) {
    console.error('Error fetching listing:', error)
    return null
  }
}

/**
 * Create a new resale listing
 * IMPORTANT: Always uses overrideAccess: false to enforce access control
 */
export async function createListing(data: Partial<Listing>) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  if (user.role !== 'agent' && user.role !== 'admin') {
    throw new Error('Only agents and admins can create listings')
  }

  // Ensure agent can only create resale listings
  if (user.role === 'agent') {
    data.listingType = 'resale'
  }

  const result = await payload.create({
    collection: 'listings',
    data: {
      ...data,
      createdBy: user.id,
      status: 'draft',
    } as Listing,
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Update a listing
 * IMPORTANT: Always uses overrideAccess: false to enforce access control
 */
export async function updateListing(id: string, data: Partial<Listing>) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.update({
    collection: 'listings',
    id,
    data: data as Listing,
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Delete a listing
 * IMPORTANT: Always uses overrideAccess: false to enforce access control
 */
export async function deleteListing(id: string) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.delete({
    collection: 'listings',
    id,
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Get user profile information
 */
export async function getUserProfile() {
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
  }
}

/**
 * Get listing statistics for the current user
 */
export async function getUserListingStats() {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const [draft, submitted, published, needsRevision] = await Promise.all([
    payload.count({
      collection: 'listings',
      where: { createdBy: { equals: user.id }, status: { equals: 'draft' } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'listings',
      where: { createdBy: { equals: user.id }, status: { equals: 'submitted' } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'listings',
      where: { createdBy: { equals: user.id }, status: { equals: 'published' } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'listings',
      where: { createdBy: { equals: user.id }, status: { equals: 'needs_revision' } },
      overrideAccess: false,
      user,
    }),
  ])

  return {
    draft: draft.totalDocs,
    submitted: submitted.totalDocs,
    published: published.totalDocs,
    needsRevision: needsRevision.totalDocs,
    total: draft.totalDocs + submitted.totalDocs + published.totalDocs + needsRevision.totalDocs,
  }
}
