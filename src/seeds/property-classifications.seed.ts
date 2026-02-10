import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

const toSlug = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

type CategoryData = {
  name: string
  description: string
  types: TypeData[]
}

type TypeData = {
  name: string
  description: string
  subtypes?: string[]
}

const propertyClassifications: CategoryData[] = [
  {
    name: 'Residential',
    description: 'Properties designed for people to live in',
    types: [
      {
        name: 'House & Lot',
        description: 'Detached single-family homes with land',
        subtypes: ['Studio', '1BR', '2BR', '3BR', '4BR', '5BR+'],
      },
      {
        name: 'Condominium',
        description: 'Multi-unit residential buildings with shared amenities',
        subtypes: ['Studio', '1BR', '2BR', '3BR', '4BR', '5BR+'],
      },
      {
        name: 'Townhouse',
        description: 'Multi-story homes sharing one or more walls with adjacent properties',
      },
      {
        name: 'Apartment',
        description: 'Rental units in multi-unit residential buildings',
      },
      {
        name: 'Lot',
        description: 'Residential land parcels for development',
      },
    ],
  },
  {
    name: 'Commercial',
    description: 'Properties used for business purposes',
    types: [
      {
        name: 'Office Space',
        description: 'Buildings or spaces designed for business operations',
      },
      {
        name: 'Retail Space',
        description: 'Properties for selling goods and services',
      },
      {
        name: 'Warehouse',
        description: 'Large buildings for storage and distribution',
      },
      {
        name: 'Commercial Lot',
        description: 'Land zoned for commercial development',
      },
    ],
  },
  {
    name: 'Agricultural',
    description: 'Properties used for farming and agriculture',
    types: [
      {
        name: 'Farm Lot',
        description: 'Land suitable for general farming',
      },
      {
        name: 'Rice Field',
        description: 'Land specifically for rice cultivation',
      },
      {
        name: 'Fishpond',
        description: 'Water-based properties for aquaculture',
      },
    ],
  },
  {
    name: 'Industrial',
    description: 'Properties used for manufacturing and heavy industry',
    types: [
      {
        name: 'Factory',
        description: 'Buildings for manufacturing and production',
      },
      {
        name: 'Industrial Lot',
        description: 'Land zoned for industrial development',
      },
      {
        name: 'Manufacturing Facility',
        description: 'Specialized buildings for large-scale production',
      },
    ],
  },
]

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('--- Seeding Property Classifications ---')

  const categoryIdMap = new Map<string, number>()
  const typeIdMap = new Map<string, number>()

  // Seed PropertyCategories
  console.log('\n📦 Seeding PropertyCategories...')
  for (const category of propertyClassifications) {
    const existing = await payload.find({
      collection: 'property-categories',
      where: { name: { equals: category.name } },
      limit: 1,
    })

    let categoryId: number

    if (existing.totalDocs === 0) {
      const created = await payload.create({
        collection: 'property-categories',
        data: {
          name: category.name,
          slug: toSlug(category.name),
          description: category.description,
          isActive: true,
        },
        draft: false,
      })
      categoryId = created.id
      console.log(`  ✓ Created category: ${category.name}`)
    } else {
      categoryId = existing.docs[0].id
      console.log(`  ⏭️  Category already exists: ${category.name}`)
    }

    categoryIdMap.set(category.name, categoryId)
  }

  // Seed PropertyTypes
  console.log('\n🏗️  Seeding PropertyTypes...')
  for (const category of propertyClassifications) {
    const categoryId = categoryIdMap.get(category.name)
    if (!categoryId) {
      console.warn(`  ⚠️  Category not found: ${category.name}`)
      continue
    }

    for (const type of category.types) {
      const existing = await payload.find({
        collection: 'property-types',
        where: {
          and: [
            { name: { equals: type.name } },
            { propertyCategory: { equals: categoryId } },
          ],
        },
        limit: 1,
      })

      let typeId: number

      if (existing.totalDocs === 0) {
        const created = await payload.create({
          collection: 'property-types',
          data: {
            name: type.name,
            slug: toSlug(type.name),
            description: type.description,
            propertyCategory: categoryId,
            isActive: true,
          },
          draft: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        typeId = created.id
        console.log(`  ✓ Created type: ${type.name} → ${category.name}`)
      } else {
        typeId = existing.docs[0].id
        console.log(`  ⏭️  Type already exists: ${type.name}`)
      }

      typeIdMap.set(`${category.name}:${type.name}`, typeId)
    }
  }

  // Seed PropertySubtypes
  console.log('\n🏘️  Seeding PropertySubtypes...')
  let subtypesCreated = 0
  let subtypesSkipped = 0

  for (const category of propertyClassifications) {
    for (const type of category.types) {
      if (!type.subtypes || type.subtypes.length === 0) {
        continue
      }

      const typeId = typeIdMap.get(`${category.name}:${type.name}`)
      if (!typeId) {
        console.warn(`  ⚠️  Type not found: ${type.name}`)
        continue
      }

      for (const subtypeName of type.subtypes) {
        const existing = await payload.find({
          collection: 'property-subtypes',
          where: {
            and: [
              { name: { equals: subtypeName } },
              { propertyType: { equals: typeId } },
            ],
          },
          limit: 1,
        })

        if (existing.totalDocs === 0) {
          await payload.create({
            collection: 'property-subtypes',
            data: {
              name: subtypeName,
              slug: toSlug(`${type.name}-${subtypeName}`),
              description: `${subtypeName} unit`,
              propertyType: typeId,
              isActive: true,
            },
            draft: false,
          })
          subtypesCreated++
          console.log(`  ✓ Created subtype: ${subtypeName} → ${type.name}`)
        } else {
          subtypesSkipped++
          console.log(`  ⏭️  Subtype already exists: ${subtypeName}`)
        }
      }
    }
  }

  console.log('\n--- Seeding Summary ---')
  console.log(`  ✅ Categories: ${categoryIdMap.size}`)
  console.log(`  ✅ Types: ${typeIdMap.size}`)
  console.log(`  ✅ Subtypes created: ${subtypesCreated}`)
  console.log(`  ⚠️  Subtypes skipped: ${subtypesSkipped}`)
  console.log('--- Property Classifications Seeding Complete ---')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  console.log('--- Reverting Property Classifications ---')

  // Delete in reverse order due to foreign key constraints
  await payload.delete({
    collection: 'property-subtypes',
    where: {
      id: { exists: true },
    },
  })
  console.log('  ✓ Deleted all property subtypes')

  await payload.delete({
    collection: 'property-types',
    where: {
      id: { exists: true },
    },
  })
  console.log('  ✓ Deleted all property types')

  await payload.delete({
    collection: 'property-categories',
    where: {
      id: { exists: true },
    },
  })
  console.log('  ✓ Deleted all property categories')

  console.log('--- Property Classifications Revert Complete ---')
}
