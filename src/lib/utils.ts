import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(media: any): string {
  if (!media) return 'https://placehold.co/600x400?text=No+Image'

  // If it's just a string URL
  if (typeof media === 'string') {
    if (media.startsWith('http')) return media
    if (media.startsWith('/api/media/file/')) {
      // Convert local proxy URL to Supabase URL if needed, or return relative path
      // For consistent behavior with current manual fix, we can try to extract filename or just return it
      // But the robust fix seen in ListingGridCard is to use the Supabase URL
      // Let's try to extract uuid-filename pattern if possible, or just standard filename
      const filename = media.split('/').pop()
      if (filename) return `https://mxjqvqqtjjvfcimfzoxs.supabase.co/storage/v1/object/public/media/${filename}`
      return media
    }
    if (media.startsWith('/media/')) {
      const filename = media.replace('/media/', '')
      return `https://mxjqvqqtjjvfcimfzoxs.supabase.co/storage/v1/object/public/media/${filename}`
    }
    // Assume filename if no path
    return `https://mxjqvqqtjjvfcimfzoxs.supabase.co/storage/v1/object/public/media/${media}`
  }

  // If it's a Media object
  if (typeof media === 'object') {
    if (media.url) {
      return getMediaUrl(media.url)
    }
    if (media.filename) {
      return `https://mxjqvqqtjjvfcimfzoxs.supabase.co/storage/v1/object/public/media/${media.filename}`
    }
  }

  return 'https://placehold.co/600x400?text=No+Image'
}
