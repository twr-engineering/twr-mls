'use client'

import { useAuth } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MyListings() {
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (user?.id && user?.role === 'agent') {
            router.push(`/admin/collections/listings?where[createdBy][equals]=${user.id}`)
        }
    }, [user?.id, user?.role, router])

    return null
}
