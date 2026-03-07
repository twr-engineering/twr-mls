'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

type ListingStatus = 'draft' | 'submitted' | 'published' | 'rejected' | 'archived'

type Listing = {
    id: string
    title: string
    listingType: string
    status: ListingStatus
    price?: number
    rentPrice?: number
    indicativePrice?: number
    createdAt: string
    updatedAt: string
    cityName?: { name: string } | null
    propertySubtype?: { title: string } | null
    images?: Array<{ url: string } | { id: string }> | null
    createdBy?: { email: string, firstName?: string, lastName?: string }
}

type PaginatedResponse = {
    docs: Listing[]
    totalDocs: number
    limit: number
    totalPages: number
    page: number
    pagingCounter: number
    hasPrevPage: boolean
    hasNextPage: boolean
    prevPage: number | null
    nextPage: number | null
}

export const ListingsManager: React.FC = () => {
    const [data, setData] = useState<PaginatedResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all')

    const fetchListings = useCallback(async () => {
        setIsLoading(true)
        try {
            // Build dynamic robust fetch URL
            // Cache control 'no-store' is absolute critical for production Vercel
            let url = `/api/listings?limit=12&page=${page}&depth=2`

            if (statusFilter !== 'all') {
                url += `&where[status][equals]=${statusFilter}`
            }

            const response = await fetch(url, {
                credentials: 'include',
                cache: 'no-store'
            })

            if (response.ok) {
                const result = await response.json()
                setData(result)
            }
        } catch (error) {
            console.error('Failed to fetch listings:', error)
        } finally {
            setIsLoading(false)
        }
    }, [page, statusFilter])

    useEffect(() => {
        fetchListings()
    }, [fetchListings])

    const formatPrice = (listing: Listing) => {
        const p = listing.price || listing.rentPrice || listing.indicativePrice
        if (!p) return 'Price on Request'
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(p)
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'published': return { bg: 'var(--theme-success-100)', text: 'var(--theme-success-800)', border: 'var(--theme-success-200)' }
            case 'submitted': return { bg: 'var(--theme-warning-100)', text: 'var(--theme-warning-800)', border: 'var(--theme-warning-200)' }
            case 'rejected': return { bg: 'var(--theme-error-100)', text: 'var(--theme-error-800)', border: 'var(--theme-error-200)' }
            case 'draft': return { bg: 'var(--theme-elevation-150)', text: 'var(--theme-elevation-800)', border: 'var(--theme-elevation-200)' }
            default: return { bg: 'var(--theme-elevation-50)', text: 'var(--theme-elevation-600)', border: 'var(--theme-elevation-150)' }
        }
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '32px auto', padding: '0 24px', paddingBottom: '60px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', fontWeight: 700 }}>Listings Manager</h1>
                    <p style={{ color: 'var(--theme-elevation-500)', margin: 0, fontSize: '15px' }}>
                        Browse, manage, and review all system property listings.
                    </p>
                </div>

                <Link
                    href="/admin/collections/listings/create"
                    style={{
                        background: 'var(--theme-primary)',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '14px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'opacity 0.2s'
                    }}
                >
                    + Create New Listing
                </Link>
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--theme-elevation-150)',
                overflowX: 'auto'
            }}>
                {(['all', 'published', 'submitted', 'draft', 'rejected', 'archived'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => {
                            setStatusFilter(filter)
                            setPage(1) // Reset page on filter change
                        }}
                        style={{
                            padding: '8px 16px',
                            background: statusFilter === filter ? 'var(--theme-elevation-800)' : 'transparent',
                            color: statusFilter === filter ? 'white' : 'var(--theme-elevation-600)',
                            border: `1px solid ${statusFilter === filter ? 'var(--theme-elevation-800)' : 'var(--theme-elevation-200)'}`,
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: statusFilter === filter ? 600 : 500,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {filter === 'submitted' ? 'Pending Approval' : filter}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div style={{ padding: '80px', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
                    Loading listings...
                </div>
            ) : !data || data.totalDocs === 0 ? (
                <div style={{
                    padding: '80px 20px',
                    textAlign: 'center',
                    background: 'var(--theme-elevation-50)',
                    border: '1px dashed var(--theme-elevation-200)',
                    borderRadius: '8px'
                }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>No listings found</h3>
                    <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>
                        {statusFilter !== 'all' ? `There are no listings matching the status "${statusFilter}".` : 'Get started by creating your first listing!'}
                    </p>
                </div>
            ) : (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '24px',
                        marginBottom: '32px'
                    }}>
                        {data.docs.map((listing) => {
                            const statusStyle = getStatusStyle(listing.status)

                            // Highly safe thumbnail extraction
                            let thumbUrl = null
                            if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
                                const firstImg = listing.images[0] as any
                                if (firstImg?.url) thumbUrl = firstImg.url
                            }

                            return (
                                <Link
                                    key={listing.id}
                                    href={`/admin/collections/listings/${listing.id}`}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        background: 'var(--theme-bg)',
                                        border: '1px solid var(--theme-elevation-200)',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none'
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'
                                    }}
                                >
                                    {/* Image Container */}
                                    <div style={{ position: 'relative', width: '100%', height: '220px', background: 'var(--theme-elevation-100)' }}>
                                        {thumbUrl ? (
                                            <Image
                                                src={thumbUrl}
                                                alt={listing.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, 300px"
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-elevation-400)', fontSize: '13px', background: 'var(--theme-elevation-100)' }}>
                                                No Media
                                            </div>
                                        )}

                                        {/* Status Badge overlaying image */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            left: '12px',
                                            background: statusStyle.bg,
                                            color: statusStyle.text,
                                            border: `1px solid ${statusStyle.border}`,
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {listing.status === 'submitted' ? 'Pending' : listing.status}
                                        </div>
                                    </div>

                                    {/* Text Body */}
                                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <h3 style={{
                                            margin: '0 0 8px 0',
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            lineHeight: 1.4,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {listing.title}
                                        </h3>

                                        <div style={{ color: 'var(--theme-elevation-900)', fontWeight: 800, fontSize: '20px', marginBottom: '16px' }}>
                                            {formatPrice(listing)}
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', background: 'var(--theme-elevation-50)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--theme-elevation-150)' }}>
                                                {listing.propertySubtype?.title || 'Property'}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', background: 'var(--theme-elevation-50)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--theme-elevation-150)', textTransform: 'capitalize' }}>
                                                {listing.listingType}
                                            </span>
                                            {listing.cityName?.name && (
                                                <span style={{ fontSize: '12px', color: 'var(--theme-elevation-600)', padding: '2px 8px' }}>
                                                    📍 {listing.cityName.name}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ width: '100%', height: '1px', background: 'var(--theme-elevation-150)', margin: '16px 0 12px 0' }} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--theme-elevation-400)' }}>
                                            <span>
                                                Updated {formatDistanceToNow(new Date(listing.updatedAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 24px',
                            background: 'var(--theme-elevation-50)',
                            borderRadius: '8px',
                            border: '1px solid var(--theme-elevation-200)'
                        }}>
                            <div style={{ fontSize: '14px', color: 'var(--theme-elevation-600)' }}>
                                Showing <strong>{(data.page - 1) * data.limit + 1}</strong> to <strong>{Math.min(data.page * data.limit, data.totalDocs)}</strong> of <strong>{data.totalDocs}</strong>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    disabled={!data.hasPrevPage}
                                    onClick={() => setPage(p => p - 1)}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid var(--theme-elevation-200)',
                                        background: data.hasPrevPage ? 'white' : 'transparent',
                                        color: data.hasPrevPage ? 'var(--theme-elevation-800)' : 'var(--theme-elevation-400)',
                                        borderRadius: '4px',
                                        cursor: data.hasPrevPage ? 'pointer' : 'not-allowed',
                                        fontSize: '14px'
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={!data.hasNextPage}
                                    onClick={() => setPage(p => p + 1)}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid var(--theme-elevation-200)',
                                        background: data.hasNextPage ? 'white' : 'transparent',
                                        color: data.hasNextPage ? 'var(--theme-elevation-800)' : 'var(--theme-elevation-400)',
                                        borderRadius: '4px',
                                        cursor: data.hasNextPage ? 'pointer' : 'not-allowed',
                                        fontSize: '14px'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default ListingsManager
