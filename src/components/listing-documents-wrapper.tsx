'use client'

import { ListingDocuments } from './listing-documents'

type ListingDocumentsWrapperProps = {
  listingId: string
  isOwner: boolean
  userRole: 'agent' | 'approver' | 'admin'
}

export function ListingDocumentsWrapper({
  listingId,
  isOwner,
  userRole,
}: ListingDocumentsWrapperProps) {
  return <ListingDocuments listingId={listingId} isOwner={isOwner} userRole={userRole} />
}
