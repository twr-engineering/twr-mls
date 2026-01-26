import { NextRequest, NextResponse } from 'next/server'
import { updateListing, getListingById, deleteListing } from '@/lib/payload/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const listing = await getListingById(id)

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch listing' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const listing = await updateListing(id, body)
    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update listing' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await deleteListing(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete listing' },
      { status: 500 },
    )
  }
}
