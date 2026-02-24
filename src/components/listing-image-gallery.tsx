'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type GalleryImage = { url: string; alt: string }

export function ListingImageGallery({ images }: { images: GalleryImage[] }) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) return null

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length)
  const next = () => setCurrent((i) => (i + 1) % images.length)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Main image */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-muted">
          <img
            src={images[current].url}
            alt={images[current].alt}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3">
                <Badge variant="secondary" className="bg-black/60 text-white border-0 text-xs">
                  {current + 1} / {images.length}
                </Badge>
              </div>
            </>
          )}
        </div>
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-1 p-2 overflow-x-auto bg-muted/30">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-colors ${
                  i === current ? 'border-primary' : 'border-transparent hover:border-primary/50'
                }`}
              >
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
