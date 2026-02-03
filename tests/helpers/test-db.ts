import { getPayload, Payload } from 'payload'
// Use test-specific config that doesn't try to create the database
import config from '@/payload.config.test'

let payloadInstance: Payload | null = null

/**
 * Get or create a Payload instance for tests
 * Uses the test database configured in test.env
 */
export async function getTestPayload(): Promise<Payload> {
  if (payloadInstance) {
    return payloadInstance
  }

  // Verify we're using the test database BEFORE initializing
  const dbUrl = process.env.DATABASE_URL || ''
  if (!dbUrl.includes('twr-mls-test')) {
    throw new Error(
      `CRITICAL: Tests are not using test database! Current DB: ${dbUrl.split('@')[1] || 'unknown'}`,
    )
  }

  const payloadConfig = await config
  payloadInstance = await getPayload({ config: payloadConfig })

  return payloadInstance
}

/**
 * Clean up test data after tests
 * WARNING: This will delete ALL data in the collections
 */
export async function cleanupTestData(payload: Payload, collections: string[]) {
  // Safety check: ensure we're in test environment
  if (!process.env.VITEST || !process.env.DATABASE_URL?.includes('twr-mls-test')) {
    throw new Error('cleanupTestData can only be called in test environment!')
  }

  for (const collection of collections) {
    try {
      const items = await payload.find({
        collection: collection as any,
        limit: 1000,
      })

      for (const item of items.docs) {
        await payload.delete({
          collection: collection as any,
          id: item.id,
        })
      }
    } catch (error) {
      // Collection might not exist or be empty, that's ok
      console.warn(`Could not clean collection ${collection}:`, error)
    }
  }
}

/**
 * Reset test database to a clean state
 * Deletes all data from main collections
 */
export async function resetTestDatabase(payload: Payload) {
  await cleanupTestData(payload, [
    'listings',
    'documents',
    'users',
    'external-share-links',
    'notifications',
  ])
}
