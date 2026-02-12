import { getListingById } from '@/lib/payload/api'
import { CreateListingForm } from '@/components/CreateListingForm'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

/**
 * Agent-facing page for editing an existing property listing.
 * Fetches the listing by ID and populates the CreateListingForm with initial data.
 */
export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing) {
    notFound()
  }

  const canEdit = listing.status === 'draft' || listing.status === 'needs_revision'

  if (!canEdit) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cannot Edit Listing</h1>
          <p className="text-muted-foreground">
            This listing cannot be edited in its current status
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Only draft and needs revision listings can be edited.</p>
                <p className="text-sm text-muted-foreground">
                  Current status:{' '}
                  <span className="font-medium">{listing.status.replace('_', ' ')}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Published and submitted listings cannot be modified. If you need to make changes,
                  please contact an administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Extract location and classification IDs using proper type checks
  // Note: province, city, and barangay are string (PSGC codes) in the schema
  const cityId = listing.city
  const barangayId = listing.barangay
  const developmentId = typeof listing.development === 'object' ? listing.development?.id : listing.development

  // Related collections
  const propertyCategoryId = typeof listing.propertyCategory === 'object' ? listing.propertyCategory.id : listing.propertyCategory
  const propertyTypeId = typeof listing.propertyType === 'object' ? listing.propertyType.id : listing.propertyType
  const propertySubtypeId = typeof listing.propertySubtype === 'object' ? listing.propertySubtype?.id : listing.propertySubtype

  // Extract full image objects for preview with proper typing
  const images = Array.isArray(listing.images)
    ? listing.images.map((img) => {
      if (typeof img === 'object' && img !== null) {
        return {
          id: img.id,
          url: img.url || '',
          alt: img.alt || '',
        }
      }
      return { id: img as number }
    })
    : []

  const initialData = {
    // Basic fields
    title: listing.title,
    description: (listing.description as any) || undefined,
    listingType: listing.listingType,

    // Property classification
    propertyCategoryId: propertyCategoryId || 0,
    propertyTypeId: propertyTypeId || 0,
    propertySubtypeId: propertySubtypeId || undefined,

    // Transaction
    transactionType: listing.transactionType,

    // Common fields
    bedrooms: listing.bedrooms || undefined,
    bathrooms: listing.bathrooms || undefined,
    parkingSlots: listing.parkingSlots || undefined,

    // Resale-specific fields
    price: listing.price || undefined,
    pricePerSqm: listing.pricePerSqm || undefined,
    floorAreaSqm: listing.floorAreaSqm || undefined,
    lotAreaSqm: listing.lotAreaSqm || undefined,
    furnishing: listing.furnishing || undefined,
    constructionYear: listing.constructionYear || undefined,
    tenure: listing.tenure || undefined,
    titleStatus: listing.titleStatus || undefined,

    // Preselling-specific fields
    modelName: listing.modelName || undefined,
    indicativePriceMin: listing.indicativePriceMin || undefined,
    indicativePriceMax: listing.indicativePriceMax || undefined,
    minLotAreaSqm: listing.minLotAreaSqm || undefined,
    minFloorAreaSqm: listing.minFloorAreaSqm || undefined,
    standardInclusions: listing.standardInclusions || undefined,
    presellingNotes: listing.presellingNotes || undefined,

    // Location
    provinceId: listing.province,
    cityId,
    barangayId,
    developmentId: developmentId || undefined,
    fullAddress: listing.fullAddress,

    // Images (pass full objects)
    images,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Listing</h1>
        <p className="text-muted-foreground">Update your property listing details</p>
      </div>

      <CreateListingForm initialData={initialData} listingId={id} />
    </div>
  )
}
