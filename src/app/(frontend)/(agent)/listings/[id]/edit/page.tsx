import { getListingById, getCities } from '@/lib/payload/api'
import { ListingForm } from '@/components/listing-form'
import { notFound } from 'next/navigation'

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

  // Fetch all cities
  const cities = await getCities()

  // Fetch barangays for the selected city
  const cityId = typeof listing.city === 'object' ? listing.city.id : listing.city
  const barangayId = typeof listing.barangay === 'object' ? listing.barangay.id : listing.barangay
  const developmentId =
    typeof listing.development === 'object' ? listing.development?.id : listing.development

  // Prepare initial data for form
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
