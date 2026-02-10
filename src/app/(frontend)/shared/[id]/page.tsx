import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { ListingGridCard } from '@/components/listing-grid-card'
import type { Listing } from '@/payload-types'

interface SharedPageProps {
    params: Promise<{ id: string }>
}

export default async function SharedListingsPage({ params }: SharedPageProps) {
    const { id } = await params
    const payload = await getPayload({ config })

    // Find the shared link by slug
    const sharedLinks = await payload.find({
        collection: 'shared-links',
        where: {
            slug: { equals: id },
        },
        limit: 1,
    })

    if (!sharedLinks.docs || sharedLinks.docs.length === 0) {
        notFound()
    }

    const sharedLink = sharedLinks.docs[0]
    const filters = sharedLink.filters as Record<string, any>

    // Build query from saved filters
    const where: Record<string, any> = {
        status: { equals: 'published' },
    }

    if (filters.provinceId) {
        where.province = { equals: filters.provinceId }
    }
    if (filters.cityId) {
        where.city = { equals: filters.cityId }
    }
    if (filters.barangayId) {
        where.barangay = { equals: filters.barangayId }
    }
    if (filters.developmentId) {
        where.development = { equals: Number(filters.developmentId) }
    }
    if (filters.listingType && filters.listingType !== 'both') {
        where.listingType = { equals: filters.listingType }
    }
    if (filters.transactionType) {
        where.transactionType = { equals: filters.transactionType }
    }
    if (filters.minPrice) {
        where.price = { ...where.price, greater_than_equal: Number(filters.minPrice) }
    }
    if (filters.maxPrice) {
        where.price = { ...where.price, less_than_equal: Number(filters.maxPrice) }
    }
    if (filters.bedrooms) {
        where.bedrooms = { equals: Number(filters.bedrooms) }
    }
    if (filters.bathrooms) {
        where.bathrooms = { equals: Number(filters.bathrooms) }
    }

    // Fetch listings based on filters
    const listings = await payload.find({
        collection: 'listings',
        where,
        limit: 100,
        depth: 2,
    })

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 py-8">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-bold text-white">{sharedLink.title}</h1>
                    <p className="text-zinc-400 mt-2">
                        {listings.docs.length} propert{listings.docs.length === 1 ? 'y' : 'ies'} found
                    </p>
                </div>
            </div>

            {/* Listings Grid */}
            <div className="container mx-auto px-4 py-8">
                {listings.docs.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {listings.docs.map((listing) => (
                            <ListingGridCard
                                key={listing.id}
                                listing={listing as Listing}
                                readOnly={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No properties found for this search.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-zinc-950 border-t border-zinc-800 py-6 text-center">
                <p className="text-zinc-500 text-sm">
                    Powered by TWR MLS • Contact the agent for more information
                </p>
            </div>
        </div>
    )
}
