import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const alt = formData.get('alt') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await payload.create({
      collection: 'media',
      data: {
        alt: alt || file.name,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      overrideAccess: false,
      user,
    })

    return NextResponse.json({ success: true, doc: result }, { status: 201 })
  } catch (error) {
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload media' },
      { status: 500 },
    )
  }
}
