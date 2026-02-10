import { requireAuth } from '@/lib/auth/actions'
import { CreateListingForm } from '@/components/CreateListingForm'

export const dynamic = 'force-dynamic'

export default async function AgentCreateListingPage() {
  await requireAuth(['agent'])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Resale Listing</h1>
        <p className="text-muted-foreground text-sm">
          Fill out the details below to create a new listing. This will be saved as a draft and can
          be submitted for approval from the admin panel.
        </p>
      </div>
      <CreateListingForm />
    </div>
  )
}

