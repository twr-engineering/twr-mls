import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export async function GET() {
    const cookieStore = await cookies()

    // Force expire the payload-token cookie
    cookieStore.set('payload-token', '', { expires: new Date(0) })

    redirect('/')
}
