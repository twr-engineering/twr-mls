import { NextRequest, NextResponse } from 'next/server'
import { getBarangaysByCity } from '@/lib/payload/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cityId = searchParams.get('cityId')

    if (!cityId) {
      return NextResponse.json({ error: 'City ID is required' }, { status: 400 })
    }

    const barangays = await getBarangaysByCity(parseInt(cityId))
    return NextResponse.json(barangays)
  } catch (error) {
    console.error('Error fetching barangays:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch barangays' },
      { status: 500 },
    )
  }
}
