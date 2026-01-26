import { NextRequest, NextResponse } from 'next/server'
import { getDevelopmentsByBarangay } from '@/lib/payload/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const barangayId = searchParams.get('barangayId')

    if (!barangayId) {
      return NextResponse.json({ error: 'Barangay ID is required' }, { status: 400 })
    }

    const developments = await getDevelopmentsByBarangay(parseInt(barangayId))
    return NextResponse.json(developments)
  } catch (error) {
    console.error('Error fetching developments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch developments' },
      { status: 500 },
    )
  }
}
