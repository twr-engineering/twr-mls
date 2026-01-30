import { NextRequest, NextResponse } from 'next/server'
import { updateDocumentVisibility } from '@/lib/payload/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { visibility } = body

    if (!visibility || !['private', 'internal'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 })
    }

    const result = await updateDocumentVisibility(id, visibility)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating document visibility:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update visibility' },
      { status: 500 },
    )
  }
}
