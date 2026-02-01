import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

const toSlug = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

type PSGCProvince = {
    code: string
    name: string
    region: string
}

type PSGCCity = {
    code: string
    name: string
    province: string
    region: string
    type?: string
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
    console.log('--- Seeding Users ---')
    const users = await payload.find({
        collection: 'users',
        where: {
            email: { equals: 'admin@twr.com' },
        },
        limit: 1,
    })

    if (users.totalDocs === 0) {
        console.log('Creating Admin User: admin@twr.com')
        await payload.create({
            collection: 'users',
            data: {
                email: 'admin@twr.com',
                password: 'password123',
                role: 'admin',
                firstName: 'System',
                lastName: 'Admin',
                isActive: true,
            },
        })
    } else {
        console.log('Admin User already exists.')
    }

    console.log('--- Seeding Philippine Provinces ---')
    console.log('Fetching provinces from PSGC Cloud API...')

    const provincesResponse = await fetch('https://psgc.cloud/api/v2/provinces')
    if (!provincesResponse.ok) {
        throw new Error(`Failed to fetch provinces: ${provincesResponse.status}`)
    }

    const provincesJson = await provincesResponse.json()
    const psgcProvinces: PSGCProvince[] = provincesJson.data || []

    console.log(`Fetched ${psgcProvinces.length} provinces`)

    const provinceIdMap = new Map<string, number>() // provinceName -> provinceId

    for (const prov of psgcProvinces) {
        const existingProvince = await payload.find({
            collection: 'provinces',
            where: { psgcCode: { equals: prov.code } },
            limit: 1,
        })

        if (existingProvince.totalDocs === 0) {
            const created = await payload.create({
                collection: 'provinces',
                data: {
                    name: prov.name,
                    slug: toSlug(prov.name),
                    psgcCode: prov.code,
                    region: prov.region,
                    isActive: true,
                },
                draft: false,
            })
            provinceIdMap.set(prov.name.toLowerCase().trim(), created.id)
            console.log(`  ✓ Created province: ${prov.name}`)
        } else {
            provinceIdMap.set(prov.name.toLowerCase().trim(), existingProvince.docs[0].id)
            console.log(`  ⏭️  Province already exists: ${prov.name}`)
        }
    }

    console.log(`\n--- Seeding Philippine Cities ---`)
    console.log('Fetching cities from PSGC Cloud API...')
    console.log('NOTE: Barangays will be fetched on-demand from PSGC Cloud API (not seeded)')

    const citiesResponse = await fetch('https://psgc.cloud/api/v2/cities-municipalities')
    if (!citiesResponse.ok) {
        throw new Error(`Failed to fetch cities: ${citiesResponse.status}`)
    }

    const citiesJson = await citiesResponse.json()
    const psgcCities: PSGCCity[] = citiesJson.data || []

    console.log(`Fetched ${psgcCities.length} cities (with province data included)`)
    console.log(`Ready to seed cities with province relationships (no additional API calls needed!)`)

    const usedSlugs = new Set<string>()
    let citiesCreated = 0
    let citiesSkipped = 0

    for (let i = 0; i < psgcCities.length; i++) {
        const cityData = psgcCities[i]

        try {
            // Check if city already exists
            const existingCity = await payload.find({
                collection: 'cities',
                where: { psgcCode: { equals: cityData.code } },
                limit: 1,
            })

            if (existingCity.totalDocs > 0) {
                console.log(`  ⏭️  City already exists: ${cityData.name}`)
                citiesSkipped++
                continue
            }

            // Province name is already in the API response!
            if (!cityData.province) {
                console.warn(`  ⚠ No province data for ${cityData.name}`)
                citiesSkipped++
                continue
            }

            const provinceName = cityData.province.toLowerCase().trim()
            const provinceId = provinceIdMap.get(provinceName)

            if (!provinceId) {
                console.warn(`  ⚠ Province not found for ${cityData.name}: "${cityData.province}"`)
                citiesSkipped++
                continue
            }

            // Generate unique slug
            let slug = toSlug(cityData.name)
            if (usedSlugs.has(slug)) {
                const provSlug = toSlug(cityData.province)
                slug = `${slug}-${provSlug}`

                let counter = 1
                const baseSlug = slug
                while (usedSlugs.has(slug)) {
                    slug = `${baseSlug}-${counter}`
                    counter++
                }
            }
            usedSlugs.add(slug)

            // Create city with province relationship
            await payload.create({
                collection: 'cities',
                data: {
                    name: cityData.name,
                    slug: slug,
                    psgcCode: cityData.code,
                    province: provinceId,
                    isActive: true,
                },
                draft: false,
            })

            citiesCreated++
            console.log(`  ✓ [${i + 1}/${psgcCities.length}] ${cityData.name} → ${cityData.province}`)

        } catch (error) {
            console.error(`  ❌ Error creating ${cityData.name}:`, error instanceof Error ? error.message : error)
            citiesSkipped++
        }

        // Progress update every 100 cities (faster now!)
        if ((i + 1) % 100 === 0) {
            console.log(`  📊 Progress: ${i + 1}/${psgcCities.length} cities processed`)
        }
    }

    console.log(`\n--- Seeding Summary ---`)
    console.log(`  ✅ Provinces created: ${provinceIdMap.size}`)
    console.log(`  ✅ Cities created: ${citiesCreated}`)
    console.log(`  ⚠️  Cities skipped: ${citiesSkipped}`)
    console.log(`  📊 Total: ${psgcCities.length} cities`)
    console.log('--- Seeding Complete ---')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
    console.log('--- Reverting Seeds ---')

    await payload.delete({
        collection: 'users',
        where: {
            email: { equals: 'admin@twr.com' },
        },
    })

    // Delete in reverse order due to foreign key constraints
    // Delete any barangays (API-cached or otherwise)
    await payload.delete({
        collection: 'barangays',
        where: {
            id: { exists: true },
        },
    })

    // Delete cities (must be before provinces due to FK constraint)
    await payload.delete({
        collection: 'cities',
        where: {
            id: { exists: true },
        },
    })

    // Delete provinces
    await payload.delete({
        collection: 'provinces',
        where: {
            id: { exists: true },
        },
    })

    console.log('--- Revert Complete ---')
}
