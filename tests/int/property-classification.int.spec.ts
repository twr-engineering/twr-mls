import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import type { User, PropertyCategory, PropertyType, PropertySubtype, Province, City, Barangay } from '@/payload-types'

let payload: Payload
let testAgent: User
let category1: PropertyCategory
let category2: PropertyCategory
let typeInCat1: PropertyType
let typeInCat2: PropertyType
let subtypeInType1: PropertySubtype
let subtypeInType2: PropertySubtype
let testProvince: Province
let testCity: City
let testBarangay: Barangay

describe('Property Classification Validation', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const timestamp = Date.now()

    // Create test user
    testAgent = await payload.create({
      collection: 'users',
      data: {
        email: `test-classification-${timestamp}@test.com`,
        password: 'password123',
        role: 'agent',
        firstName: 'Test',
        lastName: 'Agent',
      },
      draft: true,
    })

    // Create test categories
    category1 = await payload.create({
      collection: 'property-categories',
      data: {
        name: `Test Category 1 ${timestamp}`,
        slug: `test-category-1-${timestamp}`,
        isActive: true,
      },
      draft: true,
    })

    category2 = await payload.create({
      collection: 'property-categories',
      data: {
        name: `Test Category 2 ${timestamp}`,
        slug: `test-category-2-${timestamp}`,
        isActive: true,
      },
      draft: true,
    })

    // Create types in different categories
    typeInCat1 = await payload.create({
      collection: 'property-types',
      data: {
        name: `Type in Cat 1 ${timestamp}`,
        slug: `type-in-cat-1-${timestamp}`,
        propertyCategory: category1.id,
        isActive: true,
      },
      draft: true,
    })

    typeInCat2 = await payload.create({
      collection: 'property-types',
      data: {
        name: `Type in Cat 2 ${timestamp}`,
        slug: `type-in-cat-2-${timestamp}`,
        propertyCategory: category2.id,
        isActive: true,
      },
      draft: true,
    })

    // Create subtypes
    subtypeInType1 = await payload.create({
      collection: 'property-subtypes',
      data: {
        name: `Subtype in Type 1 ${timestamp}`,
        slug: `subtype-in-type-1-${timestamp}`,
        propertyType: typeInCat1.id,
        isActive: true,
      },
      draft: true,
    })

    subtypeInType2 = await payload.create({
      collection: 'property-subtypes',
      data: {
        name: `Subtype in Type 2 ${timestamp}`,
        slug: `subtype-in-type-2-${timestamp}`,
        propertyType: typeInCat2.id,
        isActive: true,
      },
      draft: true,
    })

    // Create location data
    testProvince = await payload.create({
      collection: 'provinces',
      data: {
        name: `Test Province Class ${timestamp}`,
        slug: `test-province-class-${timestamp}`,
        psgcCode: `41${String(timestamp).slice(-8)}`,
        region: 'Test Region',
        isActive: true,
      },
      draft: true,
    })

    testCity = await payload.create({
      collection: 'cities',
      data: {
        name: `Test City Class ${timestamp}`,
        slug: `test-city-class-${timestamp}`,
        province: testProvince.id,
        psgcCode: `42${String(timestamp).slice(-8)}`,
        isActive: true,
      },
      draft: true,
    })

    testBarangay = await payload.create({
      collection: 'barangays',
      data: {
        name: `Test Barangay Class ${timestamp}`,
        slug: `test-barangay-class-${timestamp}`,

        city: testCity.id,
        psgcCode: `43${String(timestamp).slice(-8)}`,
        isActive: true,
      },
      draft: true,
    })
  })

  afterAll(async () => {
    try {
      await payload.delete({ collection: 'users', where: { email: { contains: 'test-classification' } } })
      await payload.delete({ collection: 'listings', where: { title: { contains: 'Test Class' } } })
      await payload.delete({ collection: 'property-subtypes', where: { slug: { contains: 'subtype-in-type' } } })
      await payload.delete({ collection: 'property-types', where: { slug: { contains: 'type-in-cat' } } })
      await payload.delete({ collection: 'property-categories', where: { slug: { contains: 'test-category' } } })
      await payload.delete({ collection: 'barangays', where: { slug: { contains: 'test-barangay-class' } } })
      await payload.delete({ collection: 'cities', where: { slug: { contains: 'test-city-class' } } })
      await payload.delete({ collection: 'provinces', where: { slug: { contains: 'test-province-class' } } })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  it('should reject listing with type from wrong category', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Class - Wrong Type',
          listingType: 'resale',
          propertyCategory: category1.id,
          propertyType: typeInCat2.id, // Type belongs to category2
          transactionType: ['sale'],
          price: 5000000,

          city: 'Test City',
          barangay: 'Test Barangay',
          fullAddress: '123 Test St',
          status: 'draft',
        },
        draft: true,
        user: testAgent,
      }),
    ).rejects.toThrow(/belongs to category/)
  })

  it('should reject listing with subtype from wrong type', async () => {
    await expect(
      payload.create({
        collection: 'listings',
        data: {
          title: 'Test Class - Wrong Subtype',
          listingType: 'resale',
          propertyCategory: category1.id,
          propertyType: typeInCat1.id,
          propertySubtype: subtypeInType2.id, // Subtype belongs to typeInCat2
          transactionType: ['sale'],
          price: 5000000,

          city: 'Test City',
          barangay: 'Test Barangay',
          fullAddress: '123 Test St',
          status: 'draft',
        },
        draft: true,
        user: testAgent,
      }),
    ).rejects.toThrow(/belongs to type/)
  })

  it('should accept listing with correct hierarchy', async () => {
    const listing = await payload.create({
      collection: 'listings',
      data: {
        title: 'Test Class - Correct Hierarchy',
        listingType: 'resale',
        propertyCategory: category1.id,
        propertyType: typeInCat1.id,
        propertySubtype: subtypeInType1.id,
        transactionType: ['sale'],
        price: 5000000,
        city: 'Test City',
        barangay: 'Test Barangay',
        fullAddress: '123 Test St',
        status: 'draft',
      },
      draft: true,
      user: testAgent,
    })

    expect(listing).toBeDefined()
    // Payload may return populated relationships, so check both ID and object
    const catId = typeof listing.propertyCategory === 'object' ? listing.propertyCategory.id : listing.propertyCategory
    const typeId = typeof listing.propertyType === 'object' ? listing.propertyType.id : listing.propertyType
    const subtypeId = typeof listing.propertySubtype === 'object' ? listing.propertySubtype?.id : listing.propertySubtype
    expect(catId).toBe(category1.id)
    expect(typeId).toBe(typeInCat1.id)
    expect(subtypeId).toBe(subtypeInType1.id)
  })
})
