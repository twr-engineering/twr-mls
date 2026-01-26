import { getListingById, getCities } from '@/lib/payload/api'
import { ListingForm } from '@/components/listing-form'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

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

  const cities = await getCities()

  const cityId = typeof listing.city === 'object' ? listing.city.id : listing.city
  const barangayId = typeof listing.barangay === 'object' ? listing.barangay.id : listing.barangay
  const developmentId =
    typeof listing.development === 'object' ? listing.development?.id : listing.development

  const imageIds = Array.isArray(listing.images)
    ? listing.images.map((img) => (typeof img === 'object' ? img.id : img)).filter(Boolean)
    : []

  const initialData = {
    title: listing.title,
    description: listing.description || undefined,
    transactionType: listing.transactionType,
    price: listing.price,
    pricePerSqm: listing.pricePerSqm || undefined,
    floorAreaSqm: listing.floorAreaSqm || undefined,
    lotAreaSqm: listing.lotAreaSqm || undefined,
    bedrooms: listing.bedrooms || undefined,
    bathrooms: listing.bathrooms || undefined,
    parkingSlots: listing.parkingSlots || undefined,
    furnishing: listing.furnishing || undefined,
    constructionYear: listing.constructionYear || undefined,
    tenure: listing.tenure || undefined,
    titleStatus: listing.titleStatus || undefined,
    cityId,
    barangayId,
    developmentId: developmentId || undefined,
    fullAddress: listing.fullAddress,
    images: imageIds,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Listing</h1>
        <p className="text-muted-foreground">Update your property listing details</p>
      </div>

      <ListingForm cities={cities} initialData={initialData} listingId={id} />
    </div>
  )
}
