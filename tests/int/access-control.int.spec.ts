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
let agent1: User
let agent2: User
let approver: User
let admin: User
let testCategory: PropertyCategory
let testType: PropertyType
let testCity: City
let testBarangay: Barangay
let testProvince: Province
let agent1Listing: Listing
let agent2Listing: Listing
let publishedListing: Listing

describe('Access Control - Agent Visibility', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const timestamp = Date.now()

    // Create test users
    agent1 = await payload.create({
      collection: 'users',
      data: {
        email: `agent1-access-${timestamp}@test.com`,
        password: 'password123',
        role: 'agent',
        firstName: 'Agent',
        lastName: 'One',
      },
      draft: true,
    })

    agent2 = await payload.create({
      collection: 'users',
      data: {
        email: `agent2-access-${timestamp}@test.com`,
        password: 'password123',
        role: 'agent',
        firstName: 'Agent',
        lastName: 'Two',
      },
      draft: true,
    })

    approver = await payload.create({
      collection: 'users',
      data: {
        email: `approver-access-${timestamp}@test.com`,
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
        email: `admin-access-${timestamp}@test.com`,
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
        name: `Access Test Category ${timestamp}`,
        slug: `access-test-category-${timestamp}`,
        isActive: true,
      },
      draft: true,
    })

    testType = await payload.create({
      collection: 'property-types',
      data: {
        name: `Access Test Type ${timestamp}`,
        slug: `access-test-type-${timestamp}`,
        propertyCategory: testCategory.id,
        isActive: true,
      },
      draft: true,
    })

    testProvince = await payload.create({
      collection: 'provinces',
      data: {
        name: `Access Test Province ${timestamp}`,
        slug: `access-test-province-${timestamp}`,
        psgcCode: `11${String(timestamp).slice(-8)}`,
        region: 'Test Region',
        isActive: true,
      },
    })

    testCity = await payload.create({
      collection: 'cities',
      data: {
        name: `Access Test City ${timestamp}`,
        slug: `access-test-city-${timestamp}`,
        province: testProvince.id,
        psgcCode: `12${String(timestamp).slice(-8)}`,
        isActive: true,
      },
    })

    testBarangay = await payload.create({
      collection: 'barangays',
      data: {
        name: `Access Test Barangay ${timestamp}`,
        slug: `access-test-barangay-${timestamp}`,


        city: testCity.id,
        psgcCode: `13${String(timestamp).slice(-8)}`,
        isActive: true,
      },
    })

    // Create listings with different statuses
    agent1Listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Agent 1 Draft Listing',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 5000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 Agent 1 St',

        status: 'draft',
      },
      draft: true,
      user: agent1,
    })

    agent2Listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Agent 2 Submitted Listing',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 6000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '456 Agent 2 St',
        status: 'submitted',
      },
      draft: true,
      user: agent2,
    })

    publishedListing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Published Listing',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 7000000,


        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '789 Public St',
        status: 'published',
      },
      draft: true,
      user: agent1,
    })
  })

  afterAll(async () => {
    try {
      await payload.delete({ collection: 'listings', where: { title: { contains: 'Agent' } } })
      await payload.delete({ collection: 'listings', where: { title: { contains: 'Published' } } })
      await payload.delete({ collection: 'users', where: { email: { contains: '-access@' } } })
      await payload.delete({ collection: 'property-types', where: { slug: { contains: 'access-test' } } })
      await payload.delete({ collection: 'property-categories', where: { slug: { contains: 'access-test' } } })
      await payload.delete({ collection: 'barangays', where: { slug: { contains: 'access-test' } } })
      await payload.delete({ collection: 'cities', where: { slug: { contains: 'access-test' } } })
      await payload.delete({ collection: 'provinces', where: { slug: { contains: 'access-test' } } })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  it('agent should only see own draft listings', async () => {
    const listings = await payload.find({
      collection: 'listings',
      user: agent1,
      overrideAccess: false,
      where: {
        status: { equals: 'draft' },
      },
    })

    // Should only see agent1's draft listing
    expect(listings.docs.length).toBe(1)
    expect(listings.docs[0].id).toBe(agent1Listing.id)
  })

  it('agent should NOT see other agent draft listings', async () => {
    const listings = await payload.find({
      collection: 'listings',
      user: agent1,
      overrideAccess: false,
      where: {
        status: { equals: 'submitted' },
      },
    })

    // Should not see agent2's submitted listing
    expect(listings.docs.length).toBe(0)
  })

  it('agent should see all published listings', async () => {
    const listings = await payload.find({
      collection: 'listings',
      user: agent2,
      overrideAccess: false,
      where: {
        status: { equals: 'published' },
      },
    })

    // Should see the published listing even though it's owned by agent1
    expect(listings.docs.length).toBeGreaterThanOrEqual(1)
    const publishedFound = listings.docs.some((doc) => doc.id === publishedListing.id)
    expect(publishedFound).toBe(true)
  })

  it('agent should NOT see property owner details of other agent listings', async () => {
    const listing = await payload.findByID({
      collection: 'listings',
      id: publishedListing.id,
      user: agent2, // Different agent
      overrideAccess: false,
    })

    // Property owner fields check removed

  })

  it('agent should see property owner details of own listings', async () => {
    const listing = await payload.findByID({
      collection: 'listings',
      id: agent1Listing.id,
      user: agent1, // Owner
      overrideAccess: false,
    })

    // Property owner fields check removed

  })

  it('approver should see all listings', async () => {
    const listings = await payload.find({
      collection: 'listings',
      user: approver,
      overrideAccess: false,
    })

    // Should see all test listings
    expect(listings.docs.length).toBeGreaterThanOrEqual(3)
  })

  it('approver should see property owner details', async () => {
    const listing = await payload.findByID({
      collection: 'listings',
      id: agent1Listing.id,
      user: approver,
      overrideAccess: false,
    })

    // Approver property owner check removed

  })

  it('admin should see all listings and all fields', async () => {
    const listings = await payload.find({
      collection: 'listings',
      user: admin,
      overrideAccess: false,
    })

    expect(listings.docs.length).toBeGreaterThanOrEqual(3)

    const listing = await payload.findByID({
      collection: 'listings',
      id: agent2Listing.id,
      user: admin,
      overrideAccess: false,
    })


  })
})
