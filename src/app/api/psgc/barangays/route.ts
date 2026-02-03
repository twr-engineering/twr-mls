import { NextRequest, NextResponse } from 'next/server'
import { getBarangaysByCityId } from '@/lib/psgc/barangay-service'

/**
 * Fetch barangays from PSGC Cloud API and cache them
 * This endpoint triggers on-demand fetching from the PSGC API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cityId = searchParams.get('cityId')
    const forceRefresh = searchParams.get('refresh') === 'true'

    if (!cityId) {
      return NextResponse.json({ error: 'City ID is required' }, { status: 400 })
    }

    const barangays = await getBarangaysByCityId(parseInt(cityId), { forceRefresh })
    return NextResponse.json(barangays)
  } catch (error) {
    console.error('[PSGC API] Error fetching barangays:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch barangays' },
      { status: 500 },
    )
  }
}
