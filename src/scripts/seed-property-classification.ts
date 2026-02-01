/**
 * Seed script for property classification master data
 *
 * Usage:
 *   ts-node --project tsconfig.json src/scripts/seed-property-classification.ts
 */

import { getPayload } from 'payload'
import config from '@payload-config'

async function seed() {
  console.log('🌱 Starting property classification seed...')

  const payload = await getPayload({ config })

  try {
    console.log('Creating property categories...')

    // 1. Create Property Categories
    const residentialCategory = await payload.create({
      collection: 'property-categories',
      data: {
        name: 'Residential',
        slug: 'residential',
        description: 'Residential properties for living purposes',
        isActive: true,
      },
    })
    console.log('✅ Created: Residential category')

    const commercialCategory = await payload.create({
      collection: 'property-categories',
      data: {
        name: 'Commercial',
        slug: 'commercial',
        description: 'Commercial properties for business purposes',
        isActive: true,
      },
    })
    console.log('✅ Created: Commercial category')

    const industrialCategory = await payload.create({
      collection: 'property-categories',
      data: {
        name: 'Industrial',
        slug: 'industrial',
        description: 'Industrial properties for manufacturing and warehousing',
        isActive: true,
      },
    })
    console.log('✅ Created: Industrial category')

    // 2. Create Property Types - Residential
    console.log('\nCreating residential property types...')

    const _houseType = await payload.create({
      collection: 'property-types',
      data: {
        name: 'House & Lot',
        slug: 'house-lot',
        category: residentialCategory.id,
        description: 'Single-family house with land',
        isActive: true,
      },
    })
    console.log('✅ Created: House & Lot type')

    const condoType = await payload.create({
      collection: 'property-types',
      data: {
        name: 'Condominium',
        slug: 'condominium',
        category: residentialCategory.id,
        description: 'Condominium unit',
        isActive: true,
      },
    })
    console.log('✅ Created: Condominium type')

    const _townhouseType = await payload.create({
      collection: 'property-types',
      data: {
        name: 'Townhouse',
        slug: 'townhouse',
        category: residentialCategory.id,
        description: 'Townhouse or row house',
        isActive: true,
      },
    })
    console.log('✅ Created: Townhouse type')

    const _lotType = await payload.create({
      collection: 'property-types',
      data: {
        name: 'Residential Lot',
        slug: 'residential-lot',
        category: residentialCategory.id,
        description: 'Vacant residential lot',
        isActive: true,
      },
    })
    console.log('✅ Created: Residential Lot type')

    // 3. Create Property Subtypes - Condominium
    console.log('\nCreating condominium subtypes...')

    await payload.create({
      collection: 'property-subtypes',
      data: {
        name: 'Studio',
        slug: 'studio',
        propertyType: condoType.id,
        description: 'Studio unit',
        isActive: true,
      },
    })
    console.log('✅ Created: Studio subtype')

    await payload.create({
      collection: 'property-subtypes',
      data: {
        name: '1 Bedroom',
        slug: '1-bedroom',
        propertyType: condoType.id,
        description: '1 bedroom unit',
        isActive: true,
      },
    })
    console.log('✅ Created: 1 Bedroom subtype')

    await payload.create({
      collection: 'property-subtypes',
      data: {
        name: '2 Bedroom',
        slug: '2-bedroom',
        propertyType: condoType.id,
        description: '2 bedroom unit',
        isActive: true,
      },
    })
    console.log('✅ Created: 2 Bedroom subtype')

    await payload.create({
      collection: 'property-subtypes',
      data: {
        name: '3 Bedroom',
        slug: '3-bedroom',
        propertyType: condoType.id,
        description: '3 bedroom unit',
        isActive: true,
      },
    })
    console.log('✅ Created: 3 Bedroom subtype')

    await payload.create({
      collection: 'property-subtypes',
      data: {
        name: 'Penthouse',
        slug: 'penthouse',
        propertyType: condoType.id,
        description: 'Penthouse unit',
        isActive: true,
      },
    })
    console.log('✅ Created: Penthouse subtype')

    // 4. Create Property Types - Commercial
    console.log('\nCreating commercial property types...')

    await payload.create({
      collection: 'property-types',
      data: {
        name: 'Office Space',
        slug: 'office-space',
        category: commercialCategory.id,
        description: 'Office building or space',
        isActive: true,
      },
    })
    console.log('✅ Created: Office Space type')

    await payload.create({
      collection: 'property-types',
      data: {
        name: 'Retail Space',
        slug: 'retail-space',
        category: commercialCategory.id,
        description: 'Retail shop or mall space',
        isActive: true,
      },
    })
    console.log('✅ Created: Retail Space type')

    await payload.create({
      collection: 'property-types',
      data: {
        name: 'Commercial Lot',
        slug: 'commercial-lot',
        category: commercialCategory.id,
        description: 'Vacant commercial lot',
        isActive: true,
      },
    })
    console.log('✅ Created: Commercial Lot type')

    // 5. Create Property Types - Industrial
    console.log('\nCreating industrial property types...')

    await payload.create({
      collection: 'property-types',
      data: {
        name: 'Warehouse',
        slug: 'warehouse',
        category: industrialCategory.id,
        description: 'Warehouse or storage facility',
        isActive: true,
      },
    })
    console.log('✅ Created: Warehouse type')

    await payload.create({
      collection: 'property-types',
      data: {
        name: 'Industrial Lot',
        slug: 'industrial-lot',
        category: industrialCategory.id,
        description: 'Vacant industrial lot',
        isActive: true,
      },
    })
    console.log('✅ Created: Industrial Lot type')

    console.log('\n✅ Property classification seeding complete!')
    console.log(`
📊 Summary:
- 3 Categories created
- 9 Property Types created
- 5 Condominium Subtypes created

You can now view these in Payload Admin at /admin
    `)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding property classification:')
    console.error(error)
    process.exit(1)
  }
}

seed()
