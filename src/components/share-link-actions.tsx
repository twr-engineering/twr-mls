'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Copy, ExternalLink, XCircle, Loader2 } from 'lucide-react'

type ShareLinkActionsProps = {
  linkId: string
  token: string
  isActive: boolean
}

export function ShareLinkActions({ linkId, token, isActive }: ShareLinkActionsProps) {
  const router = useRouter()
  const [isRevoking, setIsRevoking] = useState(false)

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/share/${token}` : `/share/${token}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard')
  }

  const handleOpenLink = () => {
    window.open(shareUrl, '_blank')
  }

  const handleRevoke = async () => {
    setIsRevoking(true)
    try {
      const response = await fetch(`/api/share-links/${linkId}/revoke`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke share link')
      }

      toast.success('Share link revoked successfully')
      router.refresh()
    } catch (error) {
      console.error('Error revoking share link:', error)
      toast.error('Failed to revoke share link')
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleCopyLink}>
        <Copy className="h-4 w-4 mr-2" />
        Copy Link
      </Button>
      <Button variant="outline" size="sm" onClick={handleOpenLink}>
        <ExternalLink className="h-4 w-4 mr-2" />
        Open
      </Button>
      {isActive && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isRevoking} className="ml-auto">
              {isRevoking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Revoke
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Share Link?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate the share link and clients will no longer be able to access the
                listing through this link.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevoke}
                className="bg-destructive text-destructive-foreground"
              >
                Revoke Link
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
