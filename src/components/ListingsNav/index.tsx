'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@payloadcms/ui'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ListingsNav = (_props: any) => {
    const { user } = useAuth()

    // Only show for agents
    if (!user || user.role !== 'agent') {
        return null
    }

    return (
        <div className="nav-group" style={{ paddingLeft: '20px', marginTop: '4px' }}>
            <Link
                href={`/admin/collections/listings?where[createdBy][equals]=${user.id}`}
                className="nav__link"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    color: 'var(--theme-text)',
                    fontWeight: 400,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                    marginBottom: '2px',
                    fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-elevation-100)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '8px' }}
                >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
                My Listings
            </Link>
            <Link
                href="/admin/collections/listings?where[status][equals]=published"
                className="nav__link"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    color: 'var(--theme-text)',
                    fontWeight: 400,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                    fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-elevation-100)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '8px' }}
                >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Realty Listings
            </Link>
        </div>
    )
}
