import { NextRequest, NextResponse } from 'next/server'
import { deleteDocument } from '@/lib/payload/api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await deleteDocument(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 },
    )
  }
}
