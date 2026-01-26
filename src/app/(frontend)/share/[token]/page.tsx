import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Listing, City, Barangay, Development, Media } from '@/payload-types'

type Props = {
  params: Promise<{
    token: string
  }>
}

export default async function SharePage({ params }: Props) {
  const { token } = await params
  const payload = await getPayload({ config: configPromise })

  const shareLinks = await payload.find({
    collection: 'external-share-links',
    where: {
      token: { equals: token },
    },
    depth: 2, 
  })

  if (shareLinks.docs.length === 0) {
    notFound()
  }

  const shareLink = shareLinks.docs[0]

  if (!shareLink.isActive) {
    return (
      <div className="share-container">
        <div className="share-error">
          <h1>Link Revoked</h1>
          <p>This share link has been revoked and is no longer valid.</p>
        </div>
      </div>
    )
  }

  if (shareLink.expiresAt) {
    const expiryDate = new Date(shareLink.expiresAt)
    if (expiryDate < new Date()) {
      return (
        <div className="share-container">
          <div className="share-error">
            <h1>Link Expired</h1>
            <p>This share link has expired and is no longer valid.</p>
          </div>
        </div>
      )
    }
  }

  await payload.update({
    collection: 'external-share-links',
    id: shareLink.id,
    data: {
      viewCount: (shareLink.viewCount || 0) + 1,
      lastViewedAt: new Date().toISOString(),
    },
  })

  const listing = shareLink.listing as Listing
  if (!listing || typeof listing === 'number') {
    notFound()
  }

  const city = listing.city as City | null
  const barangay = listing.barangay as Barangay | null
  const development = listing.development as Development | null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const images = (listing.images || []) as Media[]

  return (
    <div className="share-container">
      <header className="share-header">
        <span className={`listing-badge ${listing.listingType}`}>
          {listing.listingType === 'preselling' ? 'Pre-Selling' : 'Resale'}
        </span>
        <span className={`transaction-badge ${listing.transactionType}`}>
          For {listing.transactionType === 'sale' ? 'Sale' : 'Rent'}
        </span>
      </header>

      <main className="share-content">
        <h1 className="listing-title">{listing.title}</h1>

        {}
        <div className="price-section">
          <span className="price">{formatPrice(listing.price)}</span>
          {listing.pricePerSqm && (
            <span className="price-per-sqm">
              ({formatPrice(listing.pricePerSqm)}/sqm)
            </span>
          )}
        </div>

        {}
        <div className="location-section">
          <p className="location">
            {development && typeof development === 'object' && development.name && `${development.name}, `}
            {barangay && typeof barangay === 'object' && barangay.name && `${barangay.name}, `}
            {city && typeof city === 'object' && city.name}
          </p>
          {listing.fullAddress && (
            <p className="full-address">{listing.fullAddress}</p>
          )}
        </div>

        {}
        {images.length > 0 && (
          <div className="images-section">
            {images.slice(0, 5).map((image, index) => (
              image && typeof image === 'object' && image.url && (
                <div key={image.id || index} className="image-wrapper">
                  <Image
                    src={image.url}
                    alt={image.alt || `Listing image ${index + 1}`}
                    width={400}
                    height={300}
                    style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                  />
                </div>
              )
            ))}
          </div>
        )}

        {}
        <div className="specs-section">
          <h2>Property Details</h2>
          <div className="specs-grid">
            {listing.floorAreaSqm && (
              <div className="spec-item">
                <span className="spec-label">Floor Area</span>
                <span className="spec-value">{listing.floorAreaSqm} sqm</span>
              </div>
            )}
            {listing.lotAreaSqm && (
              <div className="spec-item">
                <span className="spec-label">Lot Area</span>
                <span className="spec-value">{listing.lotAreaSqm} sqm</span>
              </div>
            )}
            {listing.bedrooms !== undefined && listing.bedrooms !== null && (
              <div className="spec-item">
                <span className="spec-label">Bedrooms</span>
                <span className="spec-value">{listing.bedrooms}</span>
              </div>
            )}
            {listing.bathrooms !== undefined && listing.bathrooms !== null && (
              <div className="spec-item">
                <span className="spec-label">Bathrooms</span>
                <span className="spec-value">{listing.bathrooms}</span>
              </div>
            )}
            {listing.parkingSlots !== undefined && listing.parkingSlots !== null && (
              <div className="spec-item">
                <span className="spec-label">Parking</span>
                <span className="spec-value">{listing.parkingSlots} slot(s)</span>
              </div>
            )}
            {listing.furnishing && (
              <div className="spec-item">
                <span className="spec-label">Furnishing</span>
                <span className="spec-value">
                  {listing.furnishing.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            )}
            {listing.tenure && (
              <div className="spec-item">
                <span className="spec-label">Tenure</span>
                <span className="spec-value">
                  {listing.tenure.charAt(0).toUpperCase() + listing.tenure.slice(1)}
                </span>
              </div>
            )}
            {listing.titleStatus && (
              <div className="spec-item">
                <span className="spec-label">Title Status</span>
                <span className="spec-value">
                  {listing.titleStatus === 'clean' ? 'Clean Title' : 'Mortgaged'}
                </span>
              </div>
            )}
          </div>
        </div>

        {}
        {listing.description && (
          <div className="description-section">
            <h2>Description</h2>
            <div className="description-content">
              {}
              <p>Contact the agent for more details about this property.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="share-footer">
        <p>Shared via TWR-MLS</p>
        <p className="disclaimer">
          This listing information is provided for reference only.
          Please contact the listing agent for verification.
        </p>
      </footer>

      <style>{`
        .share-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .share-error {
          text-align: center;
          padding: 60px 20px;
        }

        .share-error h1 {
          color: #dc2626;
          margin-bottom: 10px;
        }

        .share-header {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .listing-badge, .transaction-badge {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .listing-badge.preselling {
          background: #fef3c7;
          color: #92400e;
        }

        .listing-badge.resale {
          background: #dbeafe;
          color: #1e40af;
        }

        .transaction-badge.sale {
          background: #dcfce7;
          color: #166534;
        }

        .transaction-badge.rent {
          background: #f3e8ff;
          color: #7e22ce;
        }

        .listing-title {
          font-size: 28px;
          margin-bottom: 15px;
          color: #1f2937;
        }

        .price-section {
          margin-bottom: 15px;
        }

        .price {
          font-size: 32px;
          font-weight: 700;
          color: #059669;
        }

        .price-per-sqm {
          font-size: 14px;
          color: #6b7280;
          margin-left: 10px;
        }

        .location-section {
          margin-bottom: 25px;
          color: #4b5563;
        }

        .location {
          font-size: 16px;
          margin-bottom: 5px;
        }

        .full-address {
          font-size: 14px;
          color: #6b7280;
        }

        .images-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 30px;
        }

        .image-wrapper img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
        }

        .specs-section {
          margin-bottom: 30px;
        }

        .specs-section h2, .description-section h2 {
          font-size: 20px;
          margin-bottom: 15px;
          color: #1f2937;
        }

        .specs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }

        .spec-item {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
        }

        .spec-label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 5px;
        }

        .spec-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .description-section {
          margin-bottom: 30px;
        }

        .description-content {
          color: #4b5563;
          line-height: 1.6;
        }

        .share-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }

        .disclaimer {
          font-size: 12px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  const payload = await getPayload({ config: configPromise })

  const shareLinks = await payload.find({
    collection: 'external-share-links',
    where: {
      token: { equals: token },
    },
    depth: 1,
  })

  if (shareLinks.docs.length === 0) {
    return {
      title: 'Listing Not Found',
    }
  }

  const shareLink = shareLinks.docs[0]
  const listing = shareLink.listing as Listing

  if (!listing || typeof listing === 'number') {
    return {
      title: 'Listing Not Found',
    }
  }

  return {
    title: listing.title,
    description: `Property listing: ${listing.title}`,
  }
}
