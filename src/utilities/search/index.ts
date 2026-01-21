import type { Payload, Where } from 'payload'
import type { ListingSearchFilters, SearchResponse } from './types'

export * from './types'

/**
 * Expand a township ID to its covered barangay IDs
 *
 * @param payload - Payload instance
 * @param townshipId - Township ID to expand
 * @returns Array of barangay IDs covered by the township
 */
export async function expandTownshipToBarangays(
  payload: Payload,
  townshipId: number,
): Promise<number[]> {
  const township = await payload.findByID({
    collection: 'townships',
    id: townshipId,
    depth: 0,
  })

  if (!township || !township.coveredBarangays) return []

  return township.coveredBarangays.map((b) => (typeof b === 'object' ? b.id : b))
}

/**
 * Expand an estate ID to its included development IDs
 *
 * @param payload - Payload instance
 * @param estateId - Estate ID to expand
 * @returns Array of development IDs included in the estate
 */
export async function expandEstateToDevelopments(
  payload: Payload,
  estateId: number,
): Promise<number[]> {
  const estate = await payload.findByID({
    collection: 'estates',
    id: estateId,
    depth: 0,
  })

  if (!estate || !estate.includedDevelopments) return []

  return estate.includedDevelopments.map((d) => (typeof d === 'object' ? d.id : d))
}

/**
 * Build a Payload Where query from search filters
 *
 * @param payload - Payload instance (needed for township/estate expansion)
 * @param filters - Search filters
 * @returns Payload Where query
 */
export async function buildSearchQuery(
  payload: Payload,
  filters: ListingSearchFilters,
): Promise<Where> {
  const conditions: Where[] = []

  // Always filter to published listings only
  conditions.push({ status: { equals: 'published' } })

  // Listing type filter
  if (filters.listingType) {
    conditions.push({ listingType: { equals: filters.listingType } })
  }

  // Transaction type filter
  if (filters.transactionType) {
    conditions.push({ transactionType: { equals: filters.transactionType } })
  }

  // Direct location filters
  if (filters.cityId) {
    conditions.push({ city: { equals: filters.cityId } })
  }

  if (filters.barangayId) {
    conditions.push({ barangay: { equals: filters.barangayId } })
  }

  if (filters.developmentId) {
    conditions.push({ development: { equals: filters.developmentId } })
  }

  // Township filter (expands to barangays)
  if (filters.townshipId) {
    const barangayIds = await expandTownshipToBarangays(payload, filters.townshipId)
    if (barangayIds.length > 0) {
      conditions.push({ barangay: { in: barangayIds } })
    } else {
      // No barangays found, return no results
      conditions.push({ id: { equals: -1 } })
    }
  }

  // Estate filter (expands to developments)
  if (filters.estateId) {
    const developmentIds = await expandEstateToDevelopments(payload, filters.estateId)
    if (developmentIds.length > 0) {
      conditions.push({ development: { in: developmentIds } })
    } else {
      // No developments found, return no results
      conditions.push({ id: { equals: -1 } })
    }
  }

  // Price filters
  if (filters.priceMin !== undefined) {
    conditions.push({ price: { greater_than_equal: filters.priceMin } })
  }

  if (filters.priceMax !== undefined) {
    conditions.push({ price: { less_than_equal: filters.priceMax } })
  }

  // Spec filters
  if (filters.bedroomsMin !== undefined) {
    conditions.push({ bedrooms: { greater_than_equal: filters.bedroomsMin } })
  }

  if (filters.bathroomsMin !== undefined) {
    conditions.push({ bathrooms: { greater_than_equal: filters.bathroomsMin } })
  }

  if (filters.floorAreaMin !== undefined) {
    conditions.push({ floorAreaSqm: { greater_than_equal: filters.floorAreaMin } })
  }

  if (filters.lotAreaMin !== undefined) {
    conditions.push({ lotAreaSqm: { greater_than_equal: filters.lotAreaMin } })
  }

  // Combine all conditions with AND
  if (conditions.length === 0) {
    return { status: { equals: 'published' } }
  }

  if (conditions.length === 1) {
    return conditions[0]
  }

  return { and: conditions }
}

/**
 * Search listings with filters
 *
 * @param payload - Payload instance
 * @param filters - Search filters
 * @returns Paginated search results
 */
export async function searchListings(
  payload: Payload,
  filters: ListingSearchFilters,
): Promise<SearchResponse> {
  const where = await buildSearchQuery(payload, filters)

  const page = filters.page || 1
  const limit = Math.min(filters.limit || 20, 100) // Max 100 per page

  const result = await payload.find({
    collection: 'listings',
    where,
    page,
    limit,
    depth: 2, // Populate city, barangay, development
    sort: '-createdAt', // Newest first
  })

  return {
    docs: result.docs as SearchResponse['docs'],
    totalDocs: result.totalDocs,
    page: result.page || 1,
    limit: result.limit,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    nextPage: result.nextPage || null,
    prevPage: result.prevPage || null,
  }
}

/**
 * Parse query parameters into search filters
 *
 * @param searchParams - URL search parameters
 * @returns Parsed search filters
 */
export function parseSearchParams(searchParams: URLSearchParams): ListingSearchFilters {
  const filters: ListingSearchFilters = {}

  // Basic filters
  const listingType = searchParams.get('listingType')
  if (listingType === 'resale' || listingType === 'preselling') {
    filters.listingType = listingType
  }

  const transactionType = searchParams.get('transactionType')
  if (transactionType === 'sale' || transactionType === 'rent') {
    filters.transactionType = transactionType
  }

  // Location filters
  const cityId = searchParams.get('cityId')
  if (cityId) filters.cityId = parseInt(cityId, 10)

  const barangayId = searchParams.get('barangayId')
  if (barangayId) filters.barangayId = parseInt(barangayId, 10)

  const developmentId = searchParams.get('developmentId')
  if (developmentId) filters.developmentId = parseInt(developmentId, 10)

  const townshipId = searchParams.get('townshipId')
  if (townshipId) filters.townshipId = parseInt(townshipId, 10)

  const estateId = searchParams.get('estateId')
  if (estateId) filters.estateId = parseInt(estateId, 10)

  // Price filters
  const priceMin = searchParams.get('priceMin')
  if (priceMin) filters.priceMin = parseInt(priceMin, 10)

  const priceMax = searchParams.get('priceMax')
  if (priceMax) filters.priceMax = parseInt(priceMax, 10)

  // Spec filters
  const bedroomsMin = searchParams.get('bedroomsMin')
  if (bedroomsMin) filters.bedroomsMin = parseInt(bedroomsMin, 10)

  const bathroomsMin = searchParams.get('bathroomsMin')
  if (bathroomsMin) filters.bathroomsMin = parseInt(bathroomsMin, 10)

  const floorAreaMin = searchParams.get('floorAreaMin')
  if (floorAreaMin) filters.floorAreaMin = parseInt(floorAreaMin, 10)

  const lotAreaMin = searchParams.get('lotAreaMin')
  if (lotAreaMin) filters.lotAreaMin = parseInt(lotAreaMin, 10)

  // Pagination
  const page = searchParams.get('page')
  if (page) filters.page = parseInt(page, 10)

  const limit = searchParams.get('limit')
  if (limit) filters.limit = parseInt(limit, 10)

  return filters
}
