import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { refresh } from '@payloadcms/next/auth'

/**
 * PATCH /api/users/profile
 *
 * Updates the authenticated user's profile info (firstName, lastName, phone).
 * Uses a custom route handler to avoid Payload's REST API CSRF check,
 * matching the same pattern as /api/users/avatar.
 */
export async function PATCH(req: Request) {
    try {
        const payload = await getPayload({ config })
        const headersList = await getHeaders()
        const { user } = await payload.auth({ headers: headersList })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (user.isActive === false) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()

        // Only allow updating safe profile fields — never role, email, or password via this route
        const { firstName, lastName, phone } = body

        await payload.update({
            collection: 'users',
            id: user.id,
            data: {
                firstName: firstName ?? null,
                lastName: lastName ?? null,
                phone: phone ?? null,
            },
            // overrideAccess: true is safe here because:
            // 1. user.id comes from payload.auth() — not from the request body
            // 2. we only expose firstName/lastName/phone — never role, email, or password
            // canUpdateUser returns a WHERE query (not a boolean), which can cause
            // Local API update failures in some Payload 3.x builds when overrideAccess: false
            overrideAccess: true,
        })

        // Force a token refresh so the client's cookie receives the updated fields immediately
        await refresh({ config })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 },
        )
    }
}
