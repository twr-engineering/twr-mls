'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { FileText, Download, Eye, EyeOff, Trash2, Shield, ShieldCheck } from 'lucide-react'

type Document = {
  id: string
  type: string
  visibility: 'private' | 'internal'
  verified: boolean
  uploadedAt: string
  uploadedBy: {
    firstName?: string
    lastName?: string
    email: string
  }
  file: {
    filename: string
    url: string
  }
}

type ListingDocumentsProps = {
  listingId: string
  isOwner: boolean
  userRole: 'agent' | 'approver' | 'admin'
}

export function ListingDocuments({ listingId, isOwner, userRole }: ListingDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [listingId])

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/listings/${listingId}/documents`)
      if (!response.ok) throw new Error('Failed to load documents')
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVisibility = async (documentId: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'private' ? 'internal' : 'private'
    try {
      const response = await fetch(`/api/documents/${documentId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      })

      if (!response.ok) throw new Error('Failed to update visibility')

      toast.success(`Document is now ${newVisibility}`)
      loadDocuments()
    } catch (error) {
      console.error('Error updating visibility:', error)
      toast.error('Failed to update document visibility')
    }
  }

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete document')

      toast.success('Document deleted')
      loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Loading documents...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          {documents.length === 0
            ? 'No documents uploaded yet'
            : `${documents.length} document${documents.length > 1 ? 's' : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{doc.file.filename}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {doc.type.replace('_', ' ')}
                    </Badge>
                    {doc.visibility === 'private' ? (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Internal
                      </Badge>
                    )}
                    {doc.verified && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uploaded by {doc.uploadedBy.firstName || doc.uploadedBy.email} •{' '}
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={doc.file.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>

                  {isOwner && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(doc.id, doc.visibility)}
                        title={`Make ${doc.visibility === 'private' ? 'internal' : 'private'}`}
                      >
                        {doc.visibility === 'private' ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocument(doc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
