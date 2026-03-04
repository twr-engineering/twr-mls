import React from 'react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { PayloadRequest } from 'payload'

export const ReviewPendingButton: React.FC = async () => {
    try {
        const payload = await getPayload({ config })
        const headersList = await headers()

        // Construct a mock request object with headers to pass to auth fetching
        const req = {
            headers: headersList,
            payload,
        } as unknown as PayloadRequest

        // Fetch current authenticated user
        const { user } = await payload.auth(req)

        // Only show for approvers and admins
        const isApproverOrAdmin = user?.role === 'approver' || user?.role === 'admin'

        if (!isApproverOrAdmin) {
            return null
        }

        // Count listings that are in the "submitted" state
        const { totalDocs } = await payload.find({
            collection: 'listings',
            where: {
                status: {
                    equals: 'submitted',
                },
            },
            limit: 0, // We only need the count
        })

        if (totalDocs === 0) {
            return null
        }

        return (
            <div style={{ marginBottom: '24px' }}>
                <Link
                    href="/admin/collections/listings?where[or][0][and][0][status][equals]=submitted"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#3b82f6', // blue-500
                        color: 'white',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="m9 15 2 2 4-4" />
                    </svg>
                    Review {totalDocs} Pending Listing{totalDocs === 1 ? '' : 's'}
                </Link>
            </div>
        )
    } catch (error) {
        console.error('Error fetching pending listings count:', error)
        return null
    }
}

export default ReviewPendingButton
