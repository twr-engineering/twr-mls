import { NextRequest, NextResponse } from 'next/server'
import { getListingDocuments } from '@/lib/payload/api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const documents = await getListingDocuments(id)
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching listing documents:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch documents' },
      { status: 500 },
    )
  }
}
