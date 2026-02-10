import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import type {
  User,
  Listing,
  PropertyCategory,
  PropertyType,
  City,
  Barangay,
  Province,
} from '@/payload-types'

let payload: Payload
let agent: User
let approver: User
let admin: User
let testCategory: PropertyCategory
let testType: PropertyType
let testCity: City
let testBarangay: Barangay
let testProvince: Province

describe('Status Transition Validation', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const timestamp = Date.now()

    // Clean up any leftover test data from previous runs
    try {
      await payload.delete({ collection: 'users', where: { email: { in: [`agent-status-${timestamp}@test.com`, `approver-status-${timestamp}@test.com`, `admin-status-${timestamp}@test.com`] } } })
      await payload.delete({ collection: 'listings', where: { title: { contains: 'Status Test' } } })
      await payload.delete({ collection: 'property-types', where: { slug: { contains: 'status-test' } } })
      await payload.delete({ collection: 'property-categories', where: { slug: { contains: 'status-test' } } })
      await payload.delete({ collection: 'barangays', where: { slug: { contains: 'status-test' } } })
      await payload.delete({ collection: 'cities', where: { slug: { contains: 'status-test' } } })
      await payload.delete({ collection: 'provinces', where: { slug: { contains: 'status-test' } } })
    } catch (error) {
      // Ignore cleanup errors
    }

    // Create test users
    agent = await payload.create({
      collection: 'users',
      data: {
        email: `agent-status-${timestamp}@test.com`,
        password: 'password123',
        role: 'agent',
        firstName: 'Test',
        lastName: 'Agent',
      },
      draft: true,
    })

    approver = await payload.create({
      collection: 'users',
      data: {
        email: `approver-status-${timestamp}@test.com`,
        password: 'password123',
        role: 'approver',
        firstName: 'Test',
        lastName: 'Approver',
      },
      draft: true,
    })

    admin = await payload.create({
      collection: 'users',
      data: {
        email: `admin-status-${timestamp}@test.com`,
        password: 'password123',
        role: 'admin',
        firstName: 'Test',
        lastName: 'Admin',
      },
      draft: true,
    })

    // Create test data
    testCategory = await payload.create({
      collection: 'property-categories',
      data: {
        name: `Status Test Category ${timestamp}`,
        slug: `status-test-category-${timestamp}`,
        isActive: true,
      },
      draft: true,
    })

    testType = await payload.create({
      collection: 'property-types',
      data: {
        name: `Status Test Type ${timestamp}`,
        slug: `status-test-type-${timestamp}`,
        propertyCategory: testCategory.id,
        isActive: true,
      },
      draft: true,
    })

    testProvince = await payload.create({
      collection: 'provinces',
      data: {
        name: `Status Test Province ${timestamp}`,
        slug: `status-test-province-${timestamp}`,
        psgcCode: `31${String(timestamp).slice(-8)}`,
        region: 'Test Region',
        isActive: true,
      },
      draft: true,
    })

    testCity = await payload.create({
      collection: 'cities',
      data: {
        name: `Status Test City ${timestamp}`,
        slug: `status-test-city-${timestamp}`,
        psgcCode: `32${String(timestamp).slice(-8)}`,
        isActive: true,
      },
      draft: true,
    })

    testBarangay = await payload.create({
      collection: 'barangays',
      data: {
        name: `Status Test Barangay ${timestamp}`,
        slug: `status-test-barangay-${timestamp}`,


        city: testCity.id,
        psgcCode: `33${String(timestamp).slice(-8)}`,
        isActive: true,
      },
      draft: true,
    })
  })

  afterAll(async () => {
    try {
      await payload.delete({ collection: 'listings', where: { title: { contains: 'Status Test' } } })
      await payload.delete({ collection: 'users', where: { email: { contains: '-status@' } } })
      await payload.delete({ collection: 'property-types', where: { slug: { contains: 'status-test' } } })
      await payload.delete({ collection: 'property-categories', where: { slug: { contains: 'status-test' } } })
      await payload.delete({ collection: 'barangays', where: { slug: { contains: 'status-test' } } })
      await payload.delete({ collection: 'cities', where: { slug: { contains: 'status-test' } } })
      await payload.delete({ collection: 'provinces', where: { slug: { contains: 'status-test' } } })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  it('agent can transition from draft to submitted', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Status Test - Draft to Submitted',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 5000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 Test St',
        status: 'draft',
      },
      draft: true,
      user: agent,
    })

    const updated = await payload.update({
      collection: 'listings',
      id: listing.id,
      data: {
        status: 'submitted',
      },
      draft: true,
      user: agent,
      overrideAccess: false,
    })

    expect(updated.status).toBe('submitted')
  })

  it('agent cannot transition to published', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Status Test - Agent to Published',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 5000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 Test St',
        status: 'submitted',
      },
      draft: true,
      user: agent,
    })

    await expect(
      payload.update({
        collection: 'listings',
        id: listing.id,
        data: {
          status: 'published',
        },
        draft: true,
        user: agent,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('approver can transition submitted to published', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Status Test - Approver Publish',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 5000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 Test St',
        status: 'submitted',
      },
      draft: true,
      user: agent,
    })

    const updated = await payload.update({
      collection: 'listings',
      id: listing.id,
      data: {
        status: 'published',
      },
      user: approver,
      overrideAccess: false,
    })

    expect(updated.status).toBe('published')
  })

  it('approver can transition submitted to needs_revision', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Status Test - Needs Revision',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 5000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 Test St',
        status: 'submitted',
      },
      draft: true,
      user: agent,
    })

    const updated = await payload.update({
      collection: 'listings',
      id: listing.id,
      data: {
        status: 'needs_revision',
      },
      user: approver,
      overrideAccess: false,
    })

    expect(updated.status).toBe('needs_revision')
  })

  it('agent can resubmit from needs_revision', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Status Test - Resubmit',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 5000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 Test St',
        status: 'needs_revision',
      },
      draft: true,
      user: agent,
    })

    const updated = await payload.update({
      collection: 'listings',
      id: listing.id,
      data: {
        status: 'submitted',
      },
      draft: true,
      user: agent,
      overrideAccess: false,
    })

    expect(updated.status).toBe('submitted')
  })

  it('admin can perform any transition', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Status Test - Admin Power',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 5000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 Test St',
        status: 'draft',
      },
      draft: true,
      user: agent,
    })

    // Admin can jump directly to published
    const updated = await payload.update({
      collection: 'listings',
      id: listing.id,
      data: {
        status: 'published',
      },
      user: admin,
      overrideAccess: false,
    })

    expect(updated.status).toBe('published')
  })

  it('should reject invalid transition', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Status Test - Invalid Transition',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 5000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 Test St',
        status: 'draft',
      },
      draft: true,
      user: agent,
    })

    // Cannot go from draft to needs_revision
    await expect(
      payload.update({
        collection: 'listings',
        id: listing.id,
        data: {
          status: 'needs_revision',
        },
        user: approver,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/Invalid status transition/)
  })
})
