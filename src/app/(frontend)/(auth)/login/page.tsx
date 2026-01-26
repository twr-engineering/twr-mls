import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { LoginForm } from '@/components/LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const user = await getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">MLS System</h1>
          <p className="text-muted-foreground">Internal Listing Management</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
