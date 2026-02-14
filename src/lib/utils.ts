import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string, handling tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a full URL for a given media object or filename string.
 * Uses NEXT_PUBLIC_SUPABASE_PROJECT_ID for security.
 */
import type { Media } from '@/payload-types'

export function getMediaUrl(media: Media | string | number | null | undefined): string {
  if (!media) return 'https://placehold.co/600x400?text=No+Image'

  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
  if (!projectId) {
    console.error('NEXT_PUBLIC_SUPABASE_PROJECT_ID is not defined')
    return 'https://placehold.co/600x400?text=Missing+Project+ID'
  }

  const baseUrl = `https://${projectId}.supabase.co/storage/v1/object/public/media`

  // If it's a number (unpopulated ID), we can't easily resolve the URL without the filename
  if (typeof media === 'number') {
    return `https://placehold.co/600x400?text=Image+ID+${media}`
  }

  // If it's just a string URL
  if (typeof media === 'string') {
    if (media.startsWith('http')) return media
    if (media.startsWith('/api/media/file/')) {
      const filename = media.split('/').pop()
      if (filename) return `${baseUrl}/${filename}`
      return media
    }
    if (media.startsWith('/media/')) {
      const filename = media.replace('/media/', '')
      return `${baseUrl}/${filename}`
    }
    // Assume filename if no path
    return `${baseUrl}/${media}`
  }

  // If it's a Media object
  if (typeof media === 'object') {
    if (media.url) {
      return media.url.startsWith('http') ? media.url : getMediaUrl(media.url)
    }
    if (media.filename) {
      return `${baseUrl}/${media.filename}`
    }
  }

  return 'https://placehold.co/600x400?text=No+Image'
}
