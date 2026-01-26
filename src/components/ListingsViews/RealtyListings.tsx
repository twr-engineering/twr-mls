'use client'

import { useAuth } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RealtyListings() {
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (user?.role === 'agent') {
            router.push('/admin/collections/listings?where[status][equals]=published')
        }
    }, [user?.role, router])

    return null
}
