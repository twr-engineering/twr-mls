import { NextRequest, NextResponse } from 'next/server'
import { getDevelopmentsByBarangay } from '@/lib/payload/api'

/**
 * Fetch developments filtered by barangay
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    // Accept either 'barangayCode' (PSGC code string, preferred) or legacy 'barangayId'
    const barangayCode = searchParams.get('barangayCode') || searchParams.get('barangayId')

    if (!barangayCode) {
      return NextResponse.json({ error: 'Barangay code is required' }, { status: 400 })
    }

    const developments = await getDevelopmentsByBarangay(barangayCode)
    return NextResponse.json(developments)
  } catch (error) {
    console.error('[PSGC API] Error fetching developments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch developments' },
      { status: 500 },
    )
  }
}
