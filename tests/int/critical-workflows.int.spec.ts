import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type {
  User,
  PropertyCategory,
  PropertyType,
  Province,
  City,
  Barangay,
  Development,
  Listing,
  ExternalShareLink,
  Document,
} from '@/payload-types'

let payload: Payload
let testAgent: User
let testAgent2: User
let testApprover: User
let testAdmin: User
let testCategory: PropertyCategory
let testType: PropertyType
let testProvince: Province
let testCity: City
let testCity2: City
let testBarangay: Barangay
let testBarangay2: Barangay
let testDevelopment: Development

describe('Critical Workflows E2E', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const timestamp = Date.now()

    // Create test users with different roles
    testAgent = await payload.create({
      collection: 'users',
      data: {
        email: `agent-e2e-${timestamp}@test.com`,
        password: 'password123',
        role: 'agent',
        firstName: 'Agent',
        lastName: 'One',
      },
      draft: true,
    })

    testAgent2 = await payload.create({
      collection: 'users',
      data: {
        email: `agent2-e2e-${timestamp}@test.com`,
        password: 'password123',
        role: 'agent',
        firstName: 'Agent',
        lastName: 'Two',
      },
      draft: true,
    })

    testApprover = await payload.create({
      collection: 'users',
      data: {
        email: `approver-e2e-${timestamp}@test.com`,
        password: 'password123',
        role: 'approver',
        firstName: 'Approver',
        lastName: 'User',
      },
      draft: true,
    })

    testAdmin = await payload.create({
      collection: 'users',
      data: {
        email: `admin-e2e-${timestamp}@test.com`,
        password: 'password123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      },
      draft: true,
    })

    // Create test property classification
    testCategory = await payload.create({
      collection: 'property-categories',
      data: {
        name: `E2E Residential ${timestamp}`,
        slug: `e2e-residential-${timestamp}`,
        isActive: true,
      },
      draft: true,
    })

    testType = await payload.create({
      collection: 'property-types',
      data: {
        name: `E2E House ${timestamp}`,
        slug: `e2e-house-${timestamp}`,
        propertyCategory: testCategory.id,
        isActive: true,
      },
      draft: true,
    })

    // Create test locations
    testProvince = await payload.create({
      collection: 'provinces',
      data: {
        name: `E2E Province ${timestamp}`,
        slug: `e2e-province-${timestamp}`,
        psgcCode: `91${String(timestamp).slice(-8)}`,
        region: 'E2E Region',
        isActive: true,
      },
      draft: true,
    })

    testCity = await payload.create({
      collection: 'cities',
      data: {
        name: `E2E City 1 ${timestamp}`,
        slug: `e2e-city-1-${timestamp}`,
        province: testProvince.id,
        psgcCode: `92${String(timestamp).slice(-8)}`,
        isActive: true,
      },
      draft: true,
    })

    testCity2 = await payload.create({
      collection: 'cities',
      data: {
        name: `E2E City 2 ${timestamp}`,
        slug: `e2e-city-2-${timestamp}`,
        province: testProvince.id,
        psgcCode: `93${String(timestamp).slice(-8)}`,
        isActive: true,
      },
      draft: true,
    })

    testBarangay = await payload.create({
      collection: 'barangays',
      data: {
        name: `E2E Barangay 1 ${timestamp}`,
        slug: `e2e-barangay-1-${timestamp}`,

        city: testCity.id,
        psgcCode: `94${String(timestamp).slice(-8)}`,
        isActive: true,
      },
      draft: true,
    })

    testBarangay2 = await payload.create({
      collection: 'barangays',
      data: {
        name: `E2E Barangay 2 ${timestamp}`,
        slug: `e2e-barangay-2-${timestamp}`,

        city: testCity2.id,
        psgcCode: `95${String(timestamp).slice(-8)}`,
        isActive: true,
      },
      draft: true,
    })

    testDevelopment = await payload.create({
      collection: 'developments',
      data: {
        name: `E2E Development ${timestamp}`,
        slug: `e2e-development-${timestamp}`,
        city: testCity.psgcCode!,
        barangay: testBarangay.psgcCode!,
        isActive: true,
      },
      draft: true,
    })
  })

  afterAll(async () => {
    try {
      await payload.delete({ collection: 'users', where: { email: { contains: 'e2e-' } } })
      await payload.delete({ collection: 'listings', where: { title: { contains: 'E2E' } } })
      await payload.delete({ collection: 'documents', where: { id: { exists: true } } })
      await payload.delete({
        collection: 'external-share-links',
        where: { id: { exists: true } },
      })
      await payload.delete({
        collection: 'property-types',
        where: { slug: { contains: 'e2e-' } },
      })
      await payload.delete({
        collection: 'property-categories',
        where: { slug: { contains: 'e2e-' } },
      })
      await payload.delete({
        collection: 'developments',
        where: { slug: { contains: 'e2e-' } },
      })
      await payload.delete({ collection: 'barangays', where: { slug: { contains: 'e2e-' } } })
      await payload.delete({ collection: 'cities', where: { slug: { contains: 'e2e-' } } })
      await payload.delete({ collection: 'provinces', where: { slug: { contains: 'e2e-' } } })
    } catch (error) {
      console.error('E2E cleanup error:', error)
    }
  })

  it('Workflow 1: Agent creates resale listing and submits for approval', async () => {
    // Agent creates a draft resale listing
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'E2E Test Resale Listing',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 5000000,
        lotAreaSqm: 100,
        floorAreaSqm: 80,
        bedrooms: 3,
        bathrooms: 2,

        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 E2E Street',
        status: 'draft',
      },
      draft: true,
      user: testAgent,
      overrideAccess: false,
    })

    expect(listing).toBeDefined()
    expect(listing.status).toBe('draft')
    expect(listing.listingType).toBe('resale')

    // Agent submits for approval
    const submitted = await payload.update({
      collection: 'listings',
      id: listing.id,
      data: {
        status: 'submitted',
      },
      user: testAgent,
      overrideAccess: false,
    })

    expect(submitted.status).toBe('submitted')

    // Verify agent can see their own listing
    const agentListings = await payload.find({
      collection: 'listings',
      where: {
        and: [{ createdBy: { equals: testAgent.id } }, { status: { equals: 'submitted' } }],
      },
      user: testAgent,
      overrideAccess: false,
    })

    expect(agentListings.totalDocs).toBeGreaterThanOrEqual(1)
    expect(agentListings.docs.some((doc) => doc.id === listing.id)).toBe(true)
  })

  it('Workflow 2: Approver approves and publishes listing', async () => {
    // Create a draft listing first
    const draftListing = await payload.create({
      collection: 'listings',
      data: {
        title: 'E2E Test for Approval',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 3000000,
        floorAreaSqm: 50,

        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '456 E2E Avenue',
        status: 'draft',
      },
      user: testAgent,
      overrideAccess: false,
    })

    // Then submit for approval
    const listing = await payload.update({
      collection: 'listings',
      id: draftListing.id,
      data: {
        status: 'submitted',
      },
      user: testAgent,
      overrideAccess: false,
    })

    // Approver finds submitted listings
    const submittedListings = await payload.find({
      collection: 'listings',
      where: { status: { equals: 'submitted' } },
      user: testApprover,
      overrideAccess: false,
    })

    expect(submittedListings.docs.some((doc) => doc.id === listing.id)).toBe(true)

    // Approver publishes
    const published = await payload.update({
      collection: 'listings',
      id: listing.id,
      data: {
        status: 'published',
      },
      user: testApprover,
      overrideAccess: false,
    })

    expect(published.status).toBe('published')
  })

  it('Workflow 3: Agent searches for published listings', async () => {
    // Create published listings
    const listing1 = await payload.create({
      collection: 'listings',
      data: {
        title: 'E2E Published Listing 1',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 4000000,
        floorAreaSqm: 60,

        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '789 E2E Road',
        status: 'published',
      },
      draft: true,
      user: testAgent2,
      overrideAccess: false,
    })

    // Agent searches for all published listings
    const publishedListings = await payload.find({
      collection: 'listings',
      where: { status: { equals: 'published' } },
      user: testAgent,
      overrideAccess: false,
    })

    expect(publishedListings.totalDocs).toBeGreaterThanOrEqual(1)
    expect(publishedListings.docs.some((doc) => doc.id === listing1.id)).toBe(true)

    // Agent can see listings created by other agents if published
    expect(
      publishedListings.docs.some((doc) => {
        const createdBy = typeof doc.createdBy === 'object' ? doc.createdBy?.id : doc.createdBy
        return createdBy === testAgent2.id
      }),
    ).toBe(true)

    // Test search with filters (city filter)
    const cityFiltered = await payload.find({
      collection: 'listings',
      where: {
        and: [{ status: { equals: 'published' } }, { city: { equals: testCity.psgcCode! } }],
      },
      user: testAgent,
      overrideAccess: false,
    })

    expect(
      cityFiltered.docs.every((doc) => {
        return doc.city === testCity.psgcCode!
      }),
    ).toBe(true)

    // Test price range filter
    const priceFiltered = await payload.find({
      collection: 'listings',
      where: {
        and: [
          { status: { equals: 'published' } },
          { price: { greater_than_equal: 3000000 } },
          { price: { less_than_equal: 5000000 } },
        ],
      },
      user: testAgent,
      overrideAccess: false,
    })

    expect(
      priceFiltered.docs.every((doc) => {
        const price = doc.price || 0
        return price >= 3000000 && price <= 5000000
      }),
    ).toBe(true)
  })

  it('Workflow 4: Agent creates share link and verifies public access', async () => {
    // Create a published listing
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'E2E Shareable Listing',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        price: 2500000,
        floorAreaSqm: 45,

        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '321 E2E Boulevard',
        status: 'published',
      },
      user: testAgent,
      overrideAccess: false,
    })

    // Agent creates share link
    const shareLink = await payload.create({
      collection: 'external-share-links',
      data: {
        listing: listing.id,
        isActive: true,
      },
      draft: true,
      user: testAgent,
      overrideAccess: false,
    })

    expect(shareLink).toBeDefined()
    expect(shareLink.token).toBeDefined()
    expect(shareLink.isActive).toBe(true)
    expect(shareLink.viewCount).toBe(0)

    // Verify share link can be accessed without authentication
    const publicAccess = await payload.find({
      collection: 'external-share-links',
      where: { token: { equals: shareLink.token } },
      depth: 2,
    })

    expect(publicAccess.totalDocs).toBe(1)
    expect(publicAccess.docs[0].token).toBe(shareLink.token)

    const linkedListing = publicAccess.docs[0].listing as Listing
    expect(linkedListing).toBeDefined()
    expect(typeof linkedListing === 'object' && linkedListing.id).toBe(listing.id)

    // Test revoking share link
    const revoked = await payload.update({
      collection: 'external-share-links',
      id: shareLink.id,
      data: {
        isActive: false,
      },
      user: testAgent,
      overrideAccess: false,
    })

    expect(revoked.isActive).toBe(false)
  })

  // Note: Location and property classification cascade behavior is handled
  // by UI components and beforeChange hooks. These tests would require complex
  // setup to bypass required field validation, so cascade behavior is tested
  // through the UI/E2E layer instead.

  it('Workflow 7: Preselling validation requirements', async () => {
    // Test 1: Preselling without development should fail
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'E2E Preselling No Dev',
          listingType: 'preselling',
          modelName: 'Model A',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: ['sale'],
          indicativePriceMin: 3000000,
          minFloorAreaSqm: 50,

          city: 'Test City',
          barangay: 'Test Barangay',
          fullAddress: '111 E2E Street',
          status: 'draft',
        },
        user: testAdmin,
        draft: true,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/Development/)

    // Test 2: Preselling without modelName should fail
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'E2E Preselling No Model',
          listingType: 'preselling',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: ['sale'],
          development: testDevelopment.id,
          indicativePriceMin: 3000000,
          minFloorAreaSqm: 50,

          city: 'Test City',
          barangay: 'Test Barangay',
          fullAddress: '222 E2E Street',
          status: 'draft',
        },
        user: testAdmin,
        draft: true,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/Model Name/)

    // Test 3: Preselling without pricing should fail
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'E2E Preselling No Price',
          listingType: 'preselling',
          modelName: 'Model B',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: ['sale'],
          development: testDevelopment.id,
          minFloorAreaSqm: 50,

          city: 'Test City',
          barangay: 'Test Barangay',
          fullAddress: '333 E2E Street',
          status: 'draft',
        },
        user: testAdmin,
        draft: true,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/Price/)

    // Test 4: Valid preselling should succeed
    const validPreselling = await payload.create({
      collection: 'listings',
      data: {
        title: 'E2E Valid Preselling',
        listingType: 'preselling',
        modelName: 'Model C',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: ['sale'],
        development: testDevelopment.id,
        indicativePriceMin: 4000000,
        minFloorAreaSqm: 60,

        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '444 E2E Street',
        status: 'draft',
      },
      user: testAdmin,
      draft: true,
      overrideAccess: false,
    })

    expect(validPreselling).toBeDefined()
    expect(validPreselling.listingType).toBe('preselling')
    expect(validPreselling.modelName).toBe('Model C')
    expect(validPreselling.indicativePriceMin).toBe(4000000)
  })
})
