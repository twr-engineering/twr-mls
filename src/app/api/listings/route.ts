import { NextRequest, NextResponse } from 'next/server'
import { createListing } from '@/lib/payload/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const listing = await createListing(body)
    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create listing' },
      { status: 500 },
    )
  }
}
