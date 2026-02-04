import type { Listing, Development } from '@/payload-types'

export type ListingSearchFilters = {

  listingType?: 'resale' | 'preselling'
  transactionType?: 'sale' | 'rent'

  cityId?: string
  barangayId?: string
  developmentId?: number

  townshipId?: number
  estateId?: number

  priceMin?: number
  priceMax?: number

  bedroomsMin?: number
  bathroomsMin?: number
  floorAreaMin?: number
  lotAreaMin?: number

  page?: number
  limit?: number
}

export type ListingSearchResult = Listing & {
  city: string
  barangay: string
  development?: Development | null
}

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
