import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET() {
    const cookieStore = await cookies()

    // Force expire the payload-token cookie with explicit production flags
    cookieStore.set('payload-token', '', {
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })

    redirect('/')
}
