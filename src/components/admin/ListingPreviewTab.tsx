'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

interface MediaObj {
    id: number | string
    url?: string
    filename?: string
    alt?: string
}

interface ListingData {
    id: number | string
    title: string
    status: string
    listingType: string
    transactionType: string | string[]
    price?: number
    pricePerSqm?: number
    fullAddress?: string
    provinceName?: string
    cityName?: string
    barangayName?: string
    bedrooms?: number
    bathrooms?: number
    floorAreaSqm?: number
    lotAreaSqm?: number
    parkingSlots?: number
    constructionYear?: number
    furnishing?: string
    tenure?: string
    titleStatus?: string
    paymentTerms?: string[]
    description?: any
    images?: (MediaObj | number | string)[]
    propertyCategory?: { name: string } | number
    propertyType?: { name: string } | number
    propertySubtype?: { name: string } | number
    development?: { name: string } | number
    createdBy?: { email?: string; firstName?: string; lastName?: string } | number
    createdAt?: string
    updatedAt?: string
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: '#f1f5f9', text: '#475569', label: 'Draft' },
    submitted: { bg: '#dbeafe', text: '#1d4ed8', label: 'Submitted' },
    published: { bg: '#dcfce7', text: '#15803d', label: 'Published' },
    needs_revision: { bg: '#fef9c3', text: '#a16207', label: 'Needs Revision' },
    rejected: { bg: '#fee2e2', text: '#b91c1c', label: 'Rejected' },
}

function getImageUrl(img: MediaObj | number | string): string | null {
    if (typeof img === 'number' || typeof img === 'string') return null
    if (img.url && img.url.startsWith('http')) return img.url
    if (img.filename) {
        const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
        if (!projectId) return null
        return `https://${projectId}.supabase.co/storage/v1/object/public/media/${img.filename}`
    }
    return img.url || null
}

export const ListingPreviewTab: React.FC = () => {
    const { id } = useDocumentInfo()
    const [listing, setListing] = useState<ListingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const handleStatusChange = async (newStatus: string) => {
        if (!id || !listing) return

        const labels: Record<string, string> = {
            published: 'Publish',
            needs_revision: 'Request Revision',
            rejected: 'Reject',
        }

        const confirmed = window.confirm(`Are you sure you want to ${labels[newStatus]?.toLowerCase() || 'update'} this listing?`)
        if (!confirmed) return

        setUpdating(true)
        setStatusMessage(null)
        try {
            const res = await fetch(`/api/listings/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            if (res.ok) {
                const updated = await res.json()
                setListing({ ...listing, status: updated.status || updated.doc?.status || newStatus })
                setStatusMessage({ type: 'success', text: `Listing ${labels[newStatus]?.toLowerCase() || 'updated'} successfully! Reloading...` })

                // Force reload to sync outer Payload Form State and prevent stale data override
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                const err = await res.json().catch(() => ({}))
                setStatusMessage({ type: 'error', text: err.errors?.[0]?.message || `Failed to update status.` })
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: 'Network error. Please try again.' })
        } finally {
            setUpdating(false)
        }
    }

    useEffect(() => {
        if (!id) return

        const fetchListing = async () => {
            try {
                const res = await fetch(`/api/listings/${id}?depth=2`, { credentials: 'include' })
                if (res.ok) {
                    const data = await res.json()
                    setListing(data)
                }
            } catch (err) {
                console.error('Failed to fetch listing:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchListing()
    }, [id])

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
                <div style={{ color: 'var(--theme-elevation-400)', fontSize: '14px' }}>Loading preview...</div>
            </div>
        )
    }

    if (!listing) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
                <div style={{ color: 'var(--theme-elevation-400)', fontSize: '14px' }}>Unable to load listing data.</div>
            </div>
        )
    }

    // Parse images
    const images = (listing.images || [])
        .map((img) => {
            const url = getImageUrl(img)
            if (!url) return null
            const alt = typeof img === 'object' ? img.alt || listing.title : listing.title
            return { url, alt }
        })
        .filter(Boolean) as { url: string; alt: string }[]

    const statusInfo = statusStyles[listing.status] || statusStyles.draft

    const categoryName = listing.propertyCategory && typeof listing.propertyCategory === 'object' ? listing.propertyCategory.name : null
    const typeName = listing.propertyType && typeof listing.propertyType === 'object' ? listing.propertyType.name : null
    const subtypeName = listing.propertySubtype && typeof listing.propertySubtype === 'object' ? (listing.propertySubtype as any).name : null
    const devName = listing.development && typeof listing.development === 'object' ? listing.development.name : null
    const agentName = listing.createdBy && typeof listing.createdBy === 'object'
        ? `${listing.createdBy.firstName || ''} ${listing.createdBy.lastName || ''}`.trim() || listing.createdBy.email
        : null

    const transactionDisplay = Array.isArray(listing.transactionType)
        ? listing.transactionType.join(', ')
        : listing.transactionType

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: statusInfo.bg,
                        color: statusInfo.text,
                    }}>
                        {statusInfo.label}
                    </span>
                    <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: '#f3f4f6',
                        color: '#374151',
                    }}>
                        {listing.listingType}
                    </span>
                    {categoryName && (
                        <span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)' }}>
                            {categoryName}{typeName ? ` › ${typeName}` : ''}{subtypeName ? ` › ${subtypeName}` : ''}
                        </span>
                    )}
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', lineHeight: 1.3 }}>
                    {listing.title}
                </h1>
                {agentName && (
                    <div style={{ fontSize: '13px', color: 'var(--theme-elevation-400)' }}>
                        Listed by: {agentName}
                    </div>
                )}
            </div>

            {/* Review Actions */}
            <div style={{
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid var(--theme-elevation-150)',
                background: 'var(--theme-elevation-0)',
                marginBottom: '24px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                            Review Actions
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--theme-elevation-400)' }}>
                            Current status: <strong style={{
                                color: statusInfo.text,
                            }}>{statusInfo.label}</strong>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => handleStatusChange('published')}
                            disabled={updating || listing.status === 'published'}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '6px',
                                border: 'none',
                                background: listing.status === 'published' ? '#d1d5db' : '#16a34a',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: updating || listing.status === 'published' ? 'not-allowed' : 'pointer',
                                opacity: updating ? 0.6 : 1,
                            }}
                        >
                            ✓ Publish
                        </button>
                        <button
                            onClick={() => handleStatusChange('needs_revision')}
                            disabled={updating || listing.status === 'needs_revision'}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '6px',
                                border: 'none',
                                background: listing.status === 'needs_revision' ? '#d1d5db' : '#d97706',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: updating || listing.status === 'needs_revision' ? 'not-allowed' : 'pointer',
                                opacity: updating ? 0.6 : 1,
                            }}
                        >
                            ↻ Needs Revision
                        </button>
                        <button
                            onClick={() => handleStatusChange('rejected')}
                            disabled={updating || listing.status === 'rejected'}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '6px',
                                border: 'none',
                                background: listing.status === 'rejected' ? '#d1d5db' : '#dc2626',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: updating || listing.status === 'rejected' ? 'not-allowed' : 'pointer',
                                opacity: updating ? 0.6 : 1,
                            }}
                        >
                            ✕ Reject
                        </button>
                    </div>
                </div>
                {statusMessage && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                        background: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                        color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
                    }}>
                        {statusMessage.text}
                    </div>
                )}
            </div>

            {/* Images Gallery */}
            {images.length > 0 && (
                <div style={{ marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--theme-elevation-100)' }}>
                    {/* Main image */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                        <img
                            src={images[currentImageIndex].url}
                            alt={images[currentImageIndex].alt}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                                    style={{
                                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
                                        width: '32px', height: '32px', color: '#fff', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                                    }}
                                >‹</button>
                                <button
                                    onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
                                        width: '32px', height: '32px', color: '#fff', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                                    }}
                                >›</button>
                                <div style={{
                                    position: 'absolute', bottom: '12px', right: '12px',
                                    background: 'rgba(0,0,0,0.65)', color: '#fff',
                                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                                    backdropFilter: 'blur(4px)',
                                }}>
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div style={{ display: 'flex', gap: '4px', padding: '6px', background: 'var(--theme-elevation-50)', overflowX: 'auto' }}>
                            {images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img.url}
                                    alt={img.alt}
                                    onClick={() => setCurrentImageIndex(i)}
                                    style={{
                                        width: '80px', height: '56px', objectFit: 'cover', borderRadius: '6px',
                                        border: i === currentImageIndex ? '2px solid var(--theme-elevation-800)' : '2px solid transparent',
                                        flexShrink: 0, cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Price + Key Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {/* Pricing Card */}
                <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid var(--theme-elevation-100)', background: 'var(--theme-elevation-0)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--theme-elevation-400)', marginBottom: '12px' }}>
                        Pricing
                    </div>
                    {listing.price && (
                        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
                            ₱{listing.price.toLocaleString()}
                        </div>
                    )}
                    {listing.pricePerSqm && (
                        <div style={{ fontSize: '14px', color: 'var(--theme-elevation-500)', marginBottom: '6px' }}>
                            ₱{listing.pricePerSqm.toLocaleString()} per sqm
                        </div>
                    )}
                    <div style={{ fontSize: '13px', color: 'var(--theme-elevation-400)', textTransform: 'capitalize' }}>
                        {transactionDisplay}
                    </div>
                    {listing.paymentTerms && listing.paymentTerms.length > 0 && (
                        <div style={{ fontSize: '13px', color: 'var(--theme-elevation-400)', marginTop: '4px', textTransform: 'capitalize' }}>
                            Terms: {listing.paymentTerms.join(', ')}
                        </div>
                    )}
                </div>

                {/* Property Details Card */}
                <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid var(--theme-elevation-100)', background: 'var(--theme-elevation-0)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--theme-elevation-400)', marginBottom: '12px' }}>
                        Property Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {listing.bedrooms != null && <DetailItem label="Bedrooms" value={String(listing.bedrooms)} />}
                        {listing.bathrooms != null && <DetailItem label="Bathrooms" value={String(listing.bathrooms)} />}
                        {listing.floorAreaSqm != null && <DetailItem label="Floor Area" value={`${listing.floorAreaSqm} sqm`} />}
                        {listing.lotAreaSqm != null && <DetailItem label="Lot Area" value={`${listing.lotAreaSqm} sqm`} />}
                        {listing.parkingSlots != null && <DetailItem label="Parking" value={String(listing.parkingSlots)} />}
                        {listing.constructionYear != null && <DetailItem label="Built" value={String(listing.constructionYear)} />}
                    </div>
                </div>
            </div>

            {/* Location Card */}
            <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid var(--theme-elevation-100)', background: 'var(--theme-elevation-0)', marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--theme-elevation-400)', marginBottom: '12px' }}>
                    📍 Location
                </div>
                {listing.fullAddress && (
                    <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '10px' }}>
                        {listing.fullAddress}
                    </div>
                )}
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
                    {listing.provinceName && (
                        <div><span style={{ color: 'var(--theme-elevation-400)' }}>Province:</span> <strong>{listing.provinceName}</strong></div>
                    )}
                    {listing.cityName && (
                        <div><span style={{ color: 'var(--theme-elevation-400)' }}>City:</span> <strong>{listing.cityName}</strong></div>
                    )}
                    {listing.barangayName && (
                        <div><span style={{ color: 'var(--theme-elevation-400)' }}>Barangay:</span> <strong>{listing.barangayName}</strong></div>
                    )}
                    {devName && (
                        <div><span style={{ color: 'var(--theme-elevation-400)' }}>Development:</span> <strong>{devName}</strong></div>
                    )}
                </div>
            </div>

            {/* Additional Info */}
            {(listing.furnishing || listing.tenure || listing.titleStatus) && (
                <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid var(--theme-elevation-100)', background: 'var(--theme-elevation-0)', marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--theme-elevation-400)', marginBottom: '12px' }}>
                        Additional Information
                    </div>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
                        {listing.furnishing && (
                            <div><span style={{ color: 'var(--theme-elevation-400)' }}>Furnishing:</span> <strong style={{ textTransform: 'capitalize' }}>{listing.furnishing.replace('_', ' ')}</strong></div>
                        )}
                        {listing.tenure && (
                            <div><span style={{ color: 'var(--theme-elevation-400)' }}>Tenure:</span> <strong style={{ textTransform: 'capitalize' }}>{listing.tenure}</strong></div>
                        )}
                        {listing.titleStatus && (
                            <div><span style={{ color: 'var(--theme-elevation-400)' }}>Title Status:</span> <strong style={{ textTransform: 'capitalize' }}>{listing.titleStatus}</strong></div>
                        )}
                    </div>
                </div>
            )}

            {/* Timestamps */}
            <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--theme-elevation-400)', borderTop: '1px solid var(--theme-elevation-100)', paddingTop: '16px' }}>
                {listing.createdAt && (
                    <div>Created: {new Date(listing.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                )}
                {listing.updatedAt && (
                    <div>Updated: {new Date(listing.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                )}
            </div>
        </div>
    )
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: '11px', color: 'var(--theme-elevation-400)', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{value}</div>
        </div>
    )
}

export default ListingPreviewTab
