/**
 * Barangay Caching Service
 * Fetches barangays from PSGC Cloud API and caches them in the database
 */

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Barangay } from '@/payload-types'
import type { GetBarangaysOptions } from './types'
import { psgcClient } from './client'

/**
 * Get Payload instance
 */
async function getPayloadInstance() {
  return await getPayload({ config })
}

/**
 * Fetch barangays for a city with caching
 * Location data is public - no authentication required
 */
export async function getBarangaysByCityId(
  cityId: number,
  options?: GetBarangaysOptions,
): Promise<Barangay[]> {
  const payload = await getPayloadInstance()

  const forceRefresh = options?.forceRefresh || false
  const maxAge = options?.maxAge || 90 // days

  console.log(`[Barangay Service] Fetching barangays for city ${cityId}`)

  // Fetch city with psgcCode (location data is public, no auth required)
  const city = await payload.findByID({
    collection: 'cities',
    id: cityId,
    overrideAccess: true,
  })

  if (!city) {
    throw new Error(`City with ID ${cityId} not found`)
  }

  const psgcCode = city.psgcCode

  if (!psgcCode) {
    throw new Error(
      `City "${city.name}" (ID: ${cityId}) does not have a PSGC code. Please run migrations to populate PSGC codes.`,
    )
  }

  // Check for cached barangays
  if (!forceRefresh) {
    const cached = await getCachedBarangays(cityId, maxAge)
    if (cached.length > 0) {
      console.log(`[Barangay Service] Cache hit: ${cached.length} barangays from database`)
      return cached
    }
  }

  // Cache miss or force refresh - fetch from API
  console.log(`[Barangay Service] Cache miss - fetching from PSGC API`)

  try {
    const apiBarangays = await psgcClient.fetchBarangaysByCity(psgcCode)
    console.log(`[Barangay Service] API returned ${apiBarangays.length} barangays`)

    // Upsert barangays to database in batches
    const upsertedBarangays = await upsertBarangays(cityId, apiBarangays)

    console.log(`[Barangay Service] Cached ${upsertedBarangays.length} barangays to database`)

    return upsertedBarangays
  } catch (error) {
    // API failed - try to return any cached data as fallback (ignore maxAge)
    console.error('[Barangay Service] API fetch failed, trying fallback cache:', error)

    const fallbackCached = await getCachedBarangays(cityId, Infinity)
    if (fallbackCached.length > 0) {
      console.warn(
        `[Barangay Service] Using stale cached data (${fallbackCached.length} barangays)`,
      )
      return fallbackCached
    }

    // No cache available - throw error
    throw new Error(
      `Failed to fetch barangays from PSGC API and no cached data available: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

/**
 * Get cached barangays from database
 * @private
 */
async function getCachedBarangays(cityId: number, maxAge: number): Promise<Barangay[]> {
  const payload = await getPayloadInstance()

  // Calculate cutoff date for cache freshness
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - maxAge)

  // Location data is public, no auth required
  const result = await payload.find({
    collection: 'barangays',
    where: {
      city: { equals: cityId },
      sourceType: { equals: 'api_cached' },
      ...(maxAge !== Infinity && {
        lastSyncedAt: { greater_than_equal: cutoffDate.toISOString() },
      }),
    },
    limit: 1000,
    sort: 'name',
    overrideAccess: true,
  })

  return result.docs as Barangay[]
}

/**
 * Upsert barangays to database in batches
 * @private
 */
async function upsertBarangays(
  cityId: number,
  apiBarangays: Array<{ code: string; name: string }>,
): Promise<Barangay[]> {
  const payload = await getPayloadInstance()
  const upserted: Barangay[] = []
  const BATCH_SIZE = 50
  const now = new Date().toISOString()

  for (let i = 0; i < apiBarangays.length; i += BATCH_SIZE) {
    const batch = apiBarangays.slice(i, i + BATCH_SIZE)

    for (const apiBarangay of batch) {
      try {
        // Try to find existing barangay by psgcCode or (city, name)
        const existing = await payload.find({
          collection: 'barangays',
          where: {
            or: [
              { psgcCode: { equals: apiBarangay.code } },
              {
                and: [{ city: { equals: cityId } }, { name: { equals: apiBarangay.name } }],
              },
            ],
          },
          limit: 1,
        })

        let barangay: Barangay

        if (existing.docs.length > 0) {
          // Update existing barangay
          barangay = (await payload.update({
            collection: 'barangays',
            id: existing.docs[0].id,
            data: {
              name: apiBarangay.name,
              city: cityId,
              psgcCode: apiBarangay.code,
              sourceType: 'api_cached',
              lastSyncedAt: now,
            },
          })) as Barangay
        } else {
          // Create new barangay (slug auto-generated by hook)
          barangay = (await payload.create({
            collection: 'barangays',
            data: {
              name: apiBarangay.name,
              city: cityId,
              slug: '', // Auto-generated by hook
              isActive: true,
              psgcCode: apiBarangay.code,
              sourceType: 'api_cached',
              lastSyncedAt: now,
            },
            draft: false,
          })) as Barangay
        }

        upserted.push(barangay)
      } catch (error) {
        // Log error but continue with other barangays
        console.error(
          `[Barangay Service] Failed to upsert barangay "${apiBarangay.name}":`,
          error,
        )
      }
    }
  }

  return upserted.sort((a, b) => (a.name as string).localeCompare(b.name as string))
}
