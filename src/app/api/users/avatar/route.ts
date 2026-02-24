import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/actions'

export async function POST(req: Request) {
    try {
        // 1. Authenticate user from Next.js server context
        const user = await getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse FormData
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const alt = formData.get('alt') as string | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // 3. Initialize Payload Local API
        const payload = await getPayload({ config })

        // Convert Web File to Node Buffer for Payload Local API
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 4. Create Media Document using Local API
        // Local API bypasses external CSRF checks natively
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
            // Manually set uploadedBy since Local API doesn't have a req.user context implicitly
            overrideAccess: true,
        })

        // 5. Update the User's avatar reference locally
        await payload.update({
            collection: 'users',
            id: user.id,
            data: {
                avatar: mediaDoc.id,
            },
            overrideAccess: true,
        })

        return NextResponse.json({ success: true, avatarId: mediaDoc.id }, { status: 200 })
    } catch (error) {
        console.error('Avatar upload error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
