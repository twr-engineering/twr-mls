import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { LoginForm } from '@/components/LoginForm'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ reason?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getUser()

  if (user) {
    redirect('/dashboard')
  }

  const { reason } = await searchParams
  const sessionExpired = reason === 'session_expired'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">MLS System</h1>
          <p className="text-muted-foreground">Internal Listing Management</p>
        </div>
        {sessionExpired && (
          <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Your session expired. Please log in again to continue.
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  )
}
