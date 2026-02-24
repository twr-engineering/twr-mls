import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
    try {
        // 1. Authenticate via Payload Local API (same auth source as the rest of the app)
        const payload = await getPayload({ config })
        const headersList = await getHeaders()
        const { user } = await payload.auth({ headers: headersList })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (user.isActive === false) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse FormData
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const alt = formData.get('alt') as string | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Convert Web File to Node Buffer for Payload Local API
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 3. Create Media Document — passes user so the uploadedBy hook fires correctly
        const mediaDoc = await payload.create({
            collection: 'media',
            data: {
                alt: alt || `${user.email} avatar`,
            },
            file: {
                data: buffer,
                name: file.name,
                mimetype: file.type,
                size: file.size,
            },
            overrideAccess: true,
            user,
        })

        // 4. Link the new media record to the authenticated user's avatar field
        await payload.update({
            collection: 'users',
            id: user.id,
            data: {
                avatar: mediaDoc.id,
            },
            overrideAccess: true,
            user,
        })

        return NextResponse.json({ success: true, avatarId: mediaDoc.id, avatarUrl: mediaDoc.url || null }, { status: 200 })
    } catch (error) {
        console.error('Avatar upload error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
