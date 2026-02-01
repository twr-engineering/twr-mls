'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, Share2 } from 'lucide-react'

type ShareLinkFormProps = {
  listingId: string
}

export function ShareLinkForm({ listingId }: ShareLinkFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [setExpiry, setSetExpiry] = useState(false)
  const [expiryDays, setExpiryDays] = useState('30')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const expiresAt = setExpiry
        ? new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString()
        : undefined

      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          expiresAt,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create share link')
      }

      const _result = await response.json()

      toast.success('Share link created successfully!')
      router.push('/shared-links')
      router.refresh()
    } catch (error) {
      console.error('Error creating share link:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create share link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Settings</CardTitle>
        <CardDescription>Configure expiry settings for this share link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="setExpiry"
              checked={setExpiry}
              onCheckedChange={(checked) => setSetExpiry(checked as boolean)}
            />
            <Label htmlFor="setExpiry" className="text-sm font-normal">
              Set expiry date
            </Label>
          </div>

          {setExpiry && (
            <div className="space-y-2">
              <Label htmlFor="expiryDays">Expires in (days)</Label>
              <Input
                id="expiryDays"
                type="number"
                min="1"
                max="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                Link will expire in {expiryDays} days
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isLoading && <Share2 className="mr-2 h-4 w-4" />}
              Generate Share Link
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
