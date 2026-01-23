import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { searchListings, parseSearchParams } from '@/utilities/search'

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)

    const filters = parseSearchParams(searchParams)

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
