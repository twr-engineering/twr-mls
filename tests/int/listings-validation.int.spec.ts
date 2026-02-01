import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest'
import type { User, PropertyCategory, PropertyType, Province, City, Barangay, Development } from '@/payload-types'

let payload: Payload
let testAdmin: User
let testAgent: User
let testCategory: PropertyCategory
let testType: PropertyType
let testLotType: PropertyType
let testProvince: Province
let testCity: City
let testBarangay: Barangay
let testDevelopment: Development

// Shared setup for all tests
beforeAll(async () => {
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })

    const timestamp = Date.now()

    // Create test users
    testAdmin = await payload.create({
      collection: 'users',
      data: {
        email: `test-admin-validation-${timestamp}@test.com`,
        password: 'password123',
        role: 'admin',
        firstName: 'Test',
        lastName: 'Admin',
      },
    })

    testAgent = await payload.create({
      collection: 'users',
      data: {
        email: `test-agent-validation-${timestamp}@test.com`,
        password: 'password123',
        role: 'agent',
        firstName: 'Test',
        lastName: 'Agent',
      },
    })

    // Create test property classification
    testCategory = await payload.create({
      collection: 'property-categories',
      data: {
        name: `Test Residential ${timestamp}`,
        slug: `test-residential-${timestamp}`,
        isActive: true,
      },
    })

    testType = await payload.create({
      collection: 'property-types',
      data: {
        name: `Test Condominium ${timestamp}`,
        slug: `test-condominium-${timestamp}`,
        category: testCategory.id,
        isActive: true,
      },
    })

    testLotType = await payload.create({
      collection: 'property-types',
      data: {
        name: `Test Residential Lot ${timestamp}`,
        slug: `test-residential-lot-${timestamp}`,
        category: testCategory.id,
        isActive: true,
      },
    })

    // Create test location data
    testProvince = await payload.create({
      collection: 'provinces',
      data: {
        name: `Test Province ${timestamp}`,
        slug: `test-province-${timestamp}`,
        psgcCode: `51${String(timestamp).slice(-8)}`,
        region: 'Test Region',
        isActive: true,
      },
    })

    testCity = await payload.create({
      collection: 'cities',
      data: {
        name: `Test City ${timestamp}`,
        slug: `test-city-${timestamp}`,
        province: testProvince.id,
        psgcCode: `52${String(timestamp).slice(-8)}`,
        isActive: true,
      },
    })

    testBarangay = await payload.create({
      collection: 'barangays',
      data: {
        name: `Test Barangay ${timestamp}`,
        slug: `test-barangay-${timestamp}`,
        filterProvince: testProvince.id,
        city: testCity.id,
        psgcCode: `53${String(timestamp).slice(-8)}`,
        isActive: true,
      },
    })

    testDevelopment = await payload.create({
      collection: 'developments',
      data: {
        name: `Test Development ${timestamp}`,
        slug: `test-development-${timestamp}`,
        barangay: testBarangay.id,
        isActive: true,
      },
    })
})

afterAll(async () => {
  // Clean up test data
  try {
    await payload.delete({ collection: 'users', where: { email: { contains: 'test-' } } })
    await payload.delete({ collection: 'listings', where: { title: { contains: 'Test Listing' } } })
    await payload.delete({ collection: 'property-types', where: { slug: { contains: 'test-' } } })
    await payload.delete({ collection: 'property-categories', where: { slug: { contains: 'test-' } } })
    await payload.delete({ collection: 'developments', where: { slug: { contains: 'test-' } } })
    await payload.delete({ collection: 'barangays', where: { slug: { contains: 'test-' } } })
    await payload.delete({ collection: 'cities', where: { slug: { contains: 'test-' } } })
    await payload.delete({ collection: 'provinces', where: { slug: { contains: 'test-province' } } })
  } catch (error) {
    console.error('Cleanup error:', error)
  }
})

describe('Listings Validation - Preselling', () => {
  it('should reject preselling listing without development', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Listing - No Development',
          listingType: 'preselling',
          modelName: 'Model A',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: 'sale',
          indicativePrice: 5000000,
          minFloorArea: 50,
          filterProvince: testProvince.id,
          city: testCity.id,
          barangay: testBarangay.id,
          fullAddress: '123 Test St',
          status: 'draft',
        },
        user: testAdmin,
      }),
    ).rejects.toThrow('Preselling listings must have a Development selected')
  })

  it('should reject preselling listing without modelName', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Listing - No Model Name',
          listingType: 'preselling',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: 'sale',
          development: testDevelopment.id,
          indicativePrice: 5000000,
          minFloorArea: 50,
          filterProvince: testProvince.id,
          city: testCity.id,
          barangay: testBarangay.id,
          fullAddress: '123 Test St',
          status: 'draft',
        },
        user: testAdmin,
      }),
    ).rejects.toThrow('Preselling listings must have a Model Name')
  })

  it('should reject preselling without pricing', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Listing - No Pricing',
          listingType: 'preselling',
          modelName: 'Model A',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: 'sale',
          development: testDevelopment.id,
          minFloorArea: 50,
          filterProvince: testProvince.id,
          city: testCity.id,
          barangay: testBarangay.id,
          fullAddress: '123 Test St',
          status: 'draft',
        },
        user: testAdmin,
      }),
    ).rejects.toThrow(/Indicative Price or a Price Range/)
  })

  it('should reject preselling with invalid price range', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Listing - Invalid Price Range',
          listingType: 'preselling',
          modelName: 'Model A',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: 'sale',
          development: testDevelopment.id,
          indicativePriceMin: 10000000,
          indicativePriceMax: 5000000, // Max less than min
          minFloorArea: 50,
          filterProvince: testProvince.id,
          city: testCity.id,
          barangay: testBarangay.id,
          fullAddress: '123 Test St',
          status: 'draft',
        },
        user: testAdmin,
      }),
    ).rejects.toThrow(/Min cannot be greater than/)
  })

  it('should reject preselling without minimum size', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Listing - No Min Size',
          listingType: 'preselling',
          modelName: 'Model A',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: 'sale',
          development: testDevelopment.id,
          indicativePrice: 5000000,
          filterProvince: testProvince.id,
          city: testCity.id,
          barangay: testBarangay.id,
          fullAddress: '123 Test St',
          status: 'draft',
        },
        user: testAdmin,
      }),
    ).rejects.toThrow(/Minimum Lot Area or Minimum Floor Area/)
  })

  it('should reject preselling with resale-only fields', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Listing - Has Resale Fields',
          listingType: 'preselling',
          modelName: 'Model A',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: 'sale',
          development: testDevelopment.id,
          indicativePrice: 5000000,
          minFloorArea: 50,
          price: 5000000, // Resale-only field
          filterProvince: testProvince.id,
          city: testCity.id,
          barangay: testBarangay.id,
          fullAddress: '123 Test St',
          status: 'draft',
        },
        user: testAdmin,
      }),
    ).rejects.toThrow(/resale-only fields/)
  })

  it('should accept valid preselling listing', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Test Listing - Valid Preselling',
        listingType: 'preselling',
        modelName: 'Model A',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: 'sale',
        development: testDevelopment.id,
        indicativePrice: 5000000,
        minFloorArea: 50,
        filterProvince: testProvince.id,
        city: testCity.id,
        barangay: testBarangay.id,
        fullAddress: '123 Test St',
        status: 'draft',
      },
      user: testAdmin,
    })

    expect(listing).toBeDefined()
    expect(listing.listingType).toBe('preselling')
    expect(listing.modelName).toBe('Model A')
  })
})

describe('Listings Validation - Resale', () => {
  it('should reject resale listing without price', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Listing - No Price',
          listingType: 'resale',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: 'sale',
          filterProvince: testProvince.id,
          city: testCity.id,
          barangay: testBarangay.id,
          fullAddress: '123 Test St',
          status: 'draft',
        },
        user: testAgent,
      }),
    ).rejects.toThrow(/must have a valid Price/)
  })

  it('should reject resale lot without lotAreaSqm', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Listing - Lot No Area',
          listingType: 'resale',
          propertyCategory: testCategory.id,
          propertyType: testLotType.id, // Lot type
          transactionType: 'sale',
          price: 5000000,
          filterProvince: testProvince.id,
          city: testCity.id,
          barangay: testBarangay.id,
          fullAddress: '123 Test St',
          status: 'draft',
        },
        user: testAgent,
      }),
    ).rejects.toThrow(/must have a valid Lot Area/)
  })

  it('should reject resale with preselling-only fields', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Listing - Has Preselling Fields',
          listingType: 'resale',
          propertyCategory: testCategory.id,
          propertyType: testType.id,
          transactionType: 'sale',
          price: 5000000,
          modelName: 'Model A', // Preselling-only field
          filterProvince: testProvince.id,
          city: testCity.id,
          barangay: testBarangay.id,
          fullAddress: '123 Test St',
          status: 'draft',
        },
        user: testAgent,
      }),
    ).rejects.toThrow(/preselling-only fields/)
  })

  it('should accept valid resale listing', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Test Listing - Valid Resale',
        listingType: 'resale',
        propertyCategory: testCategory.id,
        propertyType: testType.id,
        transactionType: 'sale',
        price: 5000000,
        filterProvince: testProvince.id,
        city: testCity.id,
        barangay: testBarangay.id,
        fullAddress: '123 Test St',
        status: 'draft',
      },
      user: testAgent,
    })

    expect(listing).toBeDefined()
    expect(listing.listingType).toBe('resale')
    expect(listing.price).toBe(5000000)
  })
})
