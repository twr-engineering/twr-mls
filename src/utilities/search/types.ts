import type { Listing, City, Barangay, Development } from '@/payload-types'

/**
 * Search filter parameters for MLS listing search
 */
export type ListingSearchFilters = {
  // Basic filters
  listingType?: 'resale' | 'preselling'
  transactionType?: 'sale' | 'rent'

  // Location filters (direct)
  cityId?: number
  barangayId?: number
  developmentId?: number

  // Location filters (inferred)
  townshipId?: number // Expands to barangays in township
  estateId?: number // Expands to developments in estate

  // Price filters
  priceMin?: number
  priceMax?: number

  // Spec filters
  bedroomsMin?: number
  bathroomsMin?: number
  floorAreaMin?: number
  lotAreaMin?: number

  // Pagination
  page?: number
  limit?: number
}

/**
 * Listing search result with populated location data
 */
export type ListingSearchResult = Listing & {
  city: City
  barangay: Barangay
  development?: Development | null
}

/**
 * Paginated search response
 */
export type SearchResponse = {
  docs: ListingSearchResult[]
  totalDocs: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage: number | null
  prevPage: number | null
}
