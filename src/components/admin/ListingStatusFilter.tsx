'use client'

import React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

const tabs = [
    { label: 'All', value: '' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Published', value: 'published' },
    { label: 'Needs Revision', value: 'needs_revision' },
    { label: 'Rejected', value: 'rejected' },
]

export const ListingStatusFilter: React.FC = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Read current filter from URL
    const currentWhere = searchParams.get('where[status][equals]') || ''

    const handleFilter = (statusValue: string) => {
        const params = new URLSearchParams(searchParams.toString())

        // Clear any existing status filters
        const keysToDelete: string[] = []
        params.forEach((_val, key) => {
            if (key.startsWith('where[status]')) {
                keysToDelete.push(key)
            }
        })
        keysToDelete.forEach((k) => params.delete(k))

        // Reset to page 1
        params.set('page', '1')

        if (statusValue) {
            params.set('where[status][equals]', statusValue)
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div style={{
            display: 'flex',
            gap: '6px',
            padding: '12px 0 8px',
            borderBottom: '1px solid var(--theme-elevation-100)',
            marginBottom: '8px',
        }}>
            {tabs.map((tab) => {
                const isActive = currentWhere === tab.value
                return (
                    <button
                        key={tab.value}
                        onClick={() => handleFilter(tab.value)}
                        type="button"
                        style={{
                            padding: '6px 16px',
                            borderRadius: '20px',
                            border: isActive ? '2px solid var(--theme-elevation-800)' : '1px solid var(--theme-elevation-150)',
                            background: isActive ? 'var(--theme-elevation-100)' : 'transparent',
                            color: isActive ? 'var(--theme-elevation-900)' : 'var(--theme-elevation-500)',
                            fontSize: '13px',
                            fontWeight: isActive ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}

export default ListingStatusFilter
