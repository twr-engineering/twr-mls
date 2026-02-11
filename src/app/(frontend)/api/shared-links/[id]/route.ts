import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders, cookies } from 'next/headers'

/**
 * DELETE /api/shared-links/[id]
 * Delete a curated search link
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })

        const headersList = await getHeaders()
        const cookieStore = await cookies()
        const token = cookieStore.get('payload-token')?.value

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { user } = await payload.auth({ headers: headersList })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid authentication' },
                { status: 401 }
            )
        }

        // Check if the link exists and belongs to the user
        const link = await payload.findByID({
            collection: 'shared-links',
            id,
        })

        if (!link) {
            return NextResponse.json(
                { error: 'Link not found' },
                { status: 404 }
            )
        }

        // Check ownership (unless admin)
        const createdById = typeof link.createdBy === 'object' ? link.createdBy.id : link.createdBy
        if (user.role !== 'admin' && createdById !== user.id) {
            return NextResponse.json(
                { error: 'Not authorized to delete this link' },
                { status: 403 }
            )
        }

        // Delete the link
        await payload.delete({
            collection: 'shared-links',
            id,
        })

        return NextResponse.json({
            success: true,
            message: 'Link deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting shared link:', error)
        return NextResponse.json(
            { error: 'Failed to delete shared link' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/shared-links/[id]
 * Get a specific curated search link by ID
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })

        const link = await payload.findByID({
            collection: 'shared-links',
            id,
        })

        if (!link) {
            return NextResponse.json(
                { error: 'Link not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            link,
        })
    } catch (error) {
        console.error('Error fetching shared link:', error)
        return NextResponse.json(
            { error: 'Failed to fetch shared link' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/shared-links/[id]
 * Update a curated search link
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })

        const headersList = await getHeaders()
        const cookieStore = await cookies()
        const token = cookieStore.get('payload-token')?.value

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { user } = await payload.auth({ headers: headersList })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid authentication' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { title } = body

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            )
        }

        // Check if the link exists and belongs to the user
        const link = await payload.findByID({
            collection: 'shared-links',
            id,
        })

        if (!link) {
            return NextResponse.json(
                { error: 'Link not found' },
                { status: 404 }
            )
        }

        // Check ownership (unless admin)
        const createdById = typeof link.createdBy === 'object' ? link.createdBy.id : link.createdBy
        if (user.role !== 'admin' && createdById !== user.id) {
            return NextResponse.json(
                { error: 'Not authorized to update this link' },
                { status: 403 }
            )
        }

        // Update the link
        const updatedLink = await payload.update({
            collection: 'shared-links',
            id,
            data: {
                title,
            },
        })

        return NextResponse.json(updatedLink)
    } catch (error) {
        console.error('Error updating shared link:', error)
        return NextResponse.json(
            { error: 'Failed to update shared link' },
            { status: 500 }
        )
    }
}
