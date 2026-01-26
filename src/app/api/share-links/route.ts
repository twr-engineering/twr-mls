import { NextRequest, NextResponse } from 'next/server'
import { createShareLink } from '@/lib/payload/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, expiresAt } = body

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    const shareLink = await createShareLink(
      listingId,
      expiresAt ? new Date(expiresAt) : undefined,
    )
    return NextResponse.json(shareLink, { status: 201 })
  } catch (error) {
    console.error('Error creating share link:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create share link' },
      { status: 500 },
    )
  }
}
