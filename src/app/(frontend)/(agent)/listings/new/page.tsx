import { getCities } from '@/lib/payload/api'
import { ListingForm } from '@/components/listing-form'

export const dynamic = 'force-dynamic'

export default async function NewListingPage() {
  const cities = await getCities()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Resale Listing</h1>
        <p className="text-muted-foreground">
          Fill in the details below to create a new resale property listing
        </p>
      </div>

      <ListingForm cities={cities} />
    </div>
  )
}
