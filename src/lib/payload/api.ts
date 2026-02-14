'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import type { Where } from 'payload'
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
  search?: string
}) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const where: Where = {
    createdBy: { equals: user.id },
    ...(filters?.status && filters.status !== 'all' && { status: { equals: filters.status } }),
    ...(filters?.listingType && { listingType: { equals: filters.listingType } }),
  }

  if (filters?.search) {
    where.or = [
      { title: { like: filters.search } },
      { fullAddress: { like: filters.search } },
    ]
  }

  const result = await payload.find({
    collection: 'listings',
    where,
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

/**
 * Search published listings (MLS)
 * IMPORTANT: Always uses overrideAccess: false to enforce access control
 */
export async function searchListings(filters?: {
  listingType?: 'resale' | 'preselling' | 'both'
  transactionType?: 'sale' | 'rent'
  cityId?: string
  barangayId?: string
  developmentId?: number
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  limit?: number
  page?: number
}) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const where: Where = {
    status: { equals: 'published' },
  }

  // Listing type filter
  if (filters?.listingType && filters.listingType !== 'both') {
    where.listingType = { equals: filters.listingType }
  }

  // Transaction type filter
  if (filters?.transactionType) {
    where.transactionType = { equals: filters.transactionType }
  }

  // Location filters
  if (filters?.cityId) {
    where.city = { equals: filters.cityId.toString() }
  }
  if (filters?.barangayId) {
    where.barangay = { equals: filters.barangayId.toString() }
  }
  if (filters?.developmentId) {
    where.development = { equals: filters.developmentId }
  }

  // Price range
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    where.price = {}
    if (filters.minPrice !== undefined) {
      where.price.greater_than_equal = filters.minPrice
    }
    if (filters.maxPrice !== undefined) {
      where.price.less_than_equal = filters.maxPrice
    }
  }

  // Bedrooms
  if (filters?.bedrooms) {
    where.bedrooms = { equals: filters.bedrooms }
  }

  // Bathrooms
  if (filters?.bathrooms) {
    where.bathrooms = { equals: filters.bathrooms }
  }

  const result = await payload.find({
    collection: 'listings',
    where,
    limit: filters?.limit || 20,
    page: filters?.page || 1,
    sort: '-createdAt',
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Get all cities for dropdown
 */
export async function getCities() {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.find({
    collection: 'cities',
    limit: 10000,
    sort: 'name',
    depth: 1, // Populate province relationship
    overrideAccess: false,
    user,
  })

  return result.docs
}

/**
 * Get barangays filtered by city
 * Now uses PSGC API-based caching service
 */
export async function getBarangaysByCity(cityId: number) {
  // Delegate to new PSGC barangay service which handles caching
  const { getBarangaysByCityId } = await import('@/lib/psgc/barangay-service')
  return await getBarangaysByCityId(cityId)
}

/**
 * Get developments filtered by barangay
 */
export async function getDevelopmentsByBarangay(barangayId: number) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.find({
    collection: 'developments',
    where: {
      barangay: { equals: barangayId },
      isActive: { equals: true },
    },
    limit: 1000,
    sort: 'name',
    overrideAccess: false,
    user,
  })

  return result.docs
}

/**
 * Create a new external share link for a published listing
 */
export async function createShareLink(listingId: string, expiresAt?: Date) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Verify listing is published and user has access
  const listing = await getListingById(listingId)
  if (!listing || listing.status !== 'published') {
    throw new Error('Can only create share links for published listings')
  }

  // @ts-expect-error token field is auto-generated by beforeChange hook
  const result = await payload.create({
    collection: 'external-share-links',
    data: {
      listing: parseInt(listingId),
      createdBy: user.id,
      expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
      isActive: true,
    },
    draft: false,
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Get all share links created by the current user
 */
export async function getUserShareLinks() {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.find({
    collection: 'external-share-links',
    where: {
      createdBy: { equals: user.id },
    },
    limit: 100,
    sort: '-createdAt',
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Revoke (deactivate) a share link
 */
export async function revokeShareLink(id: string) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.update({
    collection: 'external-share-links',
    id,
    data: {
      isActive: false,
    },
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Get property categories
 */
export async function getPropertyCategories() {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.find({
    collection: 'property-categories',
    where: {
      isActive: { equals: true },
    },
    limit: 100,
    sort: 'name',
    overrideAccess: false,
    user,
  })

  return result.docs
}

/**
 * Get property types filtered by category
 */
export async function getPropertyTypesByCategory(categoryId: number) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.find({
    collection: 'property-types',
    where: {
      category: { equals: categoryId },
      isActive: { equals: true },
    },
    limit: 100,
    sort: 'name',
    overrideAccess: false,
    user,
  })

  return result.docs
}

/**
 * Get property subtypes filtered by type
 */
export async function getPropertySubtypesByType(typeId: number) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.find({
    collection: 'property-subtypes',
    where: {
      propertyType: { equals: typeId },
      isActive: { equals: true },
    },
    limit: 100,
    sort: 'name',
    overrideAccess: false,
    user,
  })

  return result.docs
}

/**
 * Get documents for a listing
 * Access control enforced: only owner, approvers, and admin see private docs
 */
export async function getListingDocuments(listingId: string) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.find({
    collection: 'documents',
    where: {
      listing: { equals: listingId },
    },
    limit: 100,
    sort: '-createdAt',
    overrideAccess: false,
    user,
  })

  return result.docs
}

/**
 * Upload a document to a listing
 */
export async function uploadDocument(data: {
  listingId: string
  type: string
  fileId: string
  notes?: string
  visibility?: 'private' | 'internal'
}) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.create({
    collection: 'documents',
    data: {
      type: data.type as 'title' | 'tax_declaration' | 'contract' | 'floor_plan' | 'site_plan' | 'photo_id' | 'proof_of_billing' | 'other',
      file: parseInt(data.fileId),
      listing: parseInt(data.listingId),
      notes: data.notes,
      visibility: data.visibility || 'private',
      uploadedBy: user.id,
    },
    draft: false,
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Update document visibility (only by owner)
 */
export async function updateDocumentVisibility(
  documentId: string,
  visibility: 'private' | 'internal',
) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.update({
    collection: 'documents',
    id: documentId,
    data: {
      visibility,
    },
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.delete({
    collection: 'documents',
    id: documentId,
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Get available locations (provinces, cities, barangays) that have published listings
 * Returns a hierarchical tree structure
 */
export async function getAvailableLocations() {
  const payload = await getPayloadInstance()

  // Use raw SQL for efficient aggregation of distinct locations
  // payload.db.drizzle is available in the postgres adapter
  const { sql } = await import('@payloadcms/db-postgres')

  try {
    // db.drizzle is available in postgres adapter
    const result = await payload.db.drizzle.execute(sql`
      SELECT DISTINCT
        province,
        province_name,
        city,
        city_name,
        barangay,
        barangay_name
      FROM listings
      WHERE status = 'published'
      AND province IS NOT NULL
      ORDER BY province_name, city_name, barangay_name
    `)

    // Transform flat rows into a tree structure
    type LocationTree = Record<
      string,
      {
        id: string
        name: string
        cities: Record<
          string,
          {
            id: string
            name: string
            barangays: { id: string; name: string }[]
          }
        >
      }
    >

    const tree: LocationTree = {}

    for (const row of result.rows) {
      const r = row as {
        province: string
        province_name: string
        city: string
        city_name: string
        barangay: string
        barangay_name: string
      }
      const province = r.province
      const province_name = r.province_name
      const city = r.city
      const city_name = r.city_name
      const barangay = r.barangay
      const barangay_name = r.barangay_name

      if (!province) continue

      if (!tree[province]) {
        tree[province] = {
          id: province,
          name: province_name || province, // Fallback to ID if name missing
          cities: {}
        }
      }

      if (city) {
        if (!tree[province].cities[city]) {
          tree[province].cities[city] = {
            id: city,
            name: city_name || city,
            barangays: []
          }
        }

        if (barangay) {
          tree[province].cities[city].barangays.push({
            id: barangay,
            name: barangay_name || barangay
          })
        }
      }
    }

    return tree
  } catch (error) {
    console.error('Error fetching available locations:', error)
    return {}
  }
}

/**
 * Get all curated search links created by the current user
 */
export async function getUserCuratedLinks() {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.find({
    collection: 'shared-links',
    where: {
      createdBy: { equals: user.id },
    },
    limit: 100,
    sort: '-createdAt',
    overrideAccess: false,
    user,
  })

  return result
}

/**
 * Delete a curated search link
 */
export async function deleteCuratedLink(id: string) {
  const payload = await getPayloadInstance()
  const user = await getAuthUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await payload.delete({
    collection: 'shared-links',
    id,
    overrideAccess: false,
    user,
  })

  return result
}
