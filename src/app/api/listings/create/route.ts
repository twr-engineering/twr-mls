import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    try {
        const payload = await getPayload({ config })

        // Parse body handling both JSON and Multipart/Form-Data
        let body
        const contentType = req.headers.get('content-type') || ''

        try {
            if (contentType.includes('multipart/form-data')) {
                const formData = await req.formData()
                const payloadString = formData.get('_payload') as string
                // If we have _payload, parse it. Otherwise convert all formData to object
                if (payloadString) {
                    body = JSON.parse(payloadString)
                } else {
                    body = Object.fromEntries(formData.entries())
                }
            } else {
                body = await req.json()
            }
        } catch (parseError) {
            console.error('Body Parse Error:', parseError)
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            )
        }

        // Get the current user from the session
        const cookieStore = await cookies()
        const token = cookieStore.get('payload-token')

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            )
        }

        // Verify user and get user data
        const { user } = await payload.auth({ headers: req.headers })

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid session' },
                { status: 401 }
            )
        }

        // Create the listing
        const listing = await payload.create({
            collection: 'listings',
            data: {
                ...body,
                createdBy: user.id,
                status: 'draft', // Always start as draft for agent submissions
            },
            user, // Pass user for access control
        })

        return NextResponse.json(listing, { status: 201 })
    } catch (error) {
        console.error('Error creating listing:', error)
        return NextResponse.json(
            {
                error: 'Failed to create listing',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
