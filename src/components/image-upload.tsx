'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

type ImageUploadProps = {
  value?: number[]
  onChange: (mediaIds: number[]) => void
  maxImages?: number
}

type UploadedImage = {
  id: number
  url: string
  alt: string
}

export function ImageUpload({ value = [], onChange, maxImages = 10 }: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchExistingImages = async () => {
      if (!value || value.length === 0) {
        setImages([])
        return
      }

      setIsLoading(true)
      try {
        const imagePromises = value.map(async (id) => {
          const response = await fetch(`/api/media/${id}`)
          if (!response.ok) throw new Error(`Failed to fetch image ${id}`)
          const data = await response.json()
          return {
            id: data.id,
            url: data.url,
            alt: data.alt || data.filename || 'Property image',
          }
        })

        const fetchedImages = await Promise.all(imagePromises)
        setImages(fetchedImages)
      } catch (error) {
        console.error('Error fetching existing images:', error)
        toast.error('Failed to load existing images')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExistingImages()
  }, [value])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const currentTotal = images.length
    if (currentTotal + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    setIsUploading(true)

    try {
      const uploadedImages: UploadedImage[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('alt', file.name)

        const response = await fetch('/api/agent/media', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to upload ${file.name}`)
        }

        const result = await response.json()

        const imageUrl = result.doc.url || `/api/media/file/${result.doc.filename}`

        uploadedImages.push({
          id: result.doc.id,
          url: imageUrl,
          alt: result.doc.alt || file.name,
        })
      }

      const newImages = [...images, ...uploadedImages]
      setImages(newImages)

      const allMediaIds = newImages.map((img) => img.id)
      onChange(allMediaIds)

      toast.success(`${uploadedImages.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload images')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleRemove = (imageId: number) => {
    const updatedImages = images.filter((img) => img.id !== imageId)
    setImages(updatedImages)

    const allMediaIds = updatedImages.map((img) => img.id)
    onChange(allMediaIds)

    toast.success('Image removed')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading images...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Listing Photos</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Upload up to {maxImages} images ({images.length}/{maxImages})
        </p>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <Image src={image.url} alt={image.alt} fill className="object-cover rounded" />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(image.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <div>
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={isUploading || images.length >= maxImages}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={isUploading || images.length >= maxImages}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Images ({images.length}/{maxImages})
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
