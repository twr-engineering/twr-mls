import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/listings/[id]
 *
 * Fetches a single listing by ID. Used by:
 *  - ListingPreviewTab (Payload admin preview)
 *  - Any client-side fetch that needs listing data
 *
 * Access control enforced by canReadListing.
 */
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: req.headers })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const depthParam = new URL(req.url).searchParams.get('depth')
        const depth = depthParam ? parseInt(depthParam, 10) : 2

        const listing = await payload.findByID({
            collection: 'listings',
            id,
            depth,
            user,
            overrideAccess: false,
        })

        return NextResponse.json(listing, { status: 200 })
    } catch (error) {
        console.error('Error fetching listing:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch listing' },
            { status: 404 },
        )
    }
}

/**
 * DELETE /api/listings/[id]
 *
 * Deletes a listing. Uses Local API to bypass Payload's REST CSRF check.
 * Access control enforced by canDeleteListing:
 *   - admin: any listing
 *   - approver: any non-published listing
 *   - agent: own draft listings only
 */
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: req.headers })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await payload.delete({
            collection: 'listings',
            id,
            user,
            overrideAccess: false,
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Error deleting listing:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete listing' },
            { status: 500 },
        )
    }
}

/**
 * PATCH /api/listings/[id]
 *
 * Updates a listing. Used by:
 *  - CreateListingForm (full field update when editing)
 *  - ListingPreviewDialog (status-only change, e.g. submit for review)
 *
 * Uses Local API to bypass Payload's REST CSRF check.
 * Access control enforced by canUpdateListing.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: req.headers })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()

        const updated = await payload.update({
            collection: 'listings',
            id,
            data: body,
            user,
            overrideAccess: false,
        })

        return NextResponse.json(updated, { status: 200 })
    } catch (error) {
        console.error('Error updating listing:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update listing' },
            { status: 500 },
        )
    }
}
