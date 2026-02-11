
import { getUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const user = await getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-muted-foreground">
                    Manage your account information
                </p>
            </div>

            <ProfileForm user={user} />
        </div>
    )
}
