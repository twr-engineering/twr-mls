import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { searchListings, parseSearchParams } from '@/utilities/search'

/**
 * GET /api/listings/search
 *
 * Search published listings with filters.
 *
 * Query Parameters:
 * - listingType: 'resale' | 'preselling'
 * - transactionType: 'sale' | 'rent'
 * - cityId: number
 * - barangayId: number
 * - developmentId: number
 * - townshipId: number (expands to covered barangays)
 * - estateId: number (expands to included developments)
 * - priceMin: number
 * - priceMax: number
 * - bedroomsMin: number
 * - bathroomsMin: number
 * - floorAreaMin: number
 * - lotAreaMin: number
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 *
 * @example GET /api/listings/search?listingType=resale&cityId=1&priceMin=1000000
 */
export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)

    // Parse query parameters into filters
    const filters = parseSearchParams(searchParams)

    // Execute search
    const results = await searchListings(payload, filters)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
