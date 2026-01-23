import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { listMuncities, listBarangays, listProvinces } from '@jobuntux/psgc'

const toSlug = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

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

    console.log('--- Seeding All Philippines Locations ---')
    console.log('Preparing data...')

    const cities = listMuncities()
    const barangays = listBarangays()
    const provinces = listProvinces()

    const barangaysByCity = new Map<string, typeof barangays>()
    for (const brgy of barangays) {
        const list = barangaysByCity.get(brgy.munCityCode) || []
        list.push(brgy)
        barangaysByCity.set(brgy.munCityCode, list)
    }

    const provinceMap = new Map<string, string>()
    for (const prov of provinces) {
        if (prov.provCode) {
            provinceMap.set(prov.provCode, prov.provName)
        }
    }

    console.log(`Ready to seed ${cities.length} cities and ${barangays.length} barangays.`)

    const usedSlugs = new Set<string>()
    const BATCH_SIZE = 1

    for (let i = 0; i < cities.length; i += BATCH_SIZE) {
        const batch = cities.slice(i, i + BATCH_SIZE)

        await Promise.all(batch.map(async (cityData) => {
            let slug = toSlug(cityData.munCityName)

            if (usedSlugs.has(slug)) {
                const provName = provinceMap.get(cityData.provCode) || cityData.provCode || 'prov'
                const provSlug = toSlug(provName)
                slug = `${slug}-${provSlug}`

                let counter = 1
                const baseSlug = slug
                while (usedSlugs.has(slug)) {
                    slug = `${baseSlug}-${counter}`
                    counter++
                }
            }

            usedSlugs.add(slug)

            let cityID: string | number
            try {
                const existingCity = await payload.find({
                    collection: 'cities',
                    where: { slug: { equals: slug } },
                    limit: 1,
                })

                if (existingCity.totalDocs > 0) {
                    cityID = existingCity.docs[0].id
                } else {
                    const newCity = await payload.create({
                        collection: 'cities',
                        data: {
                            name: cityData.munCityName,
                            slug: slug,
                            isActive: true,
                        }
                    })
                    cityID = newCity.id
                }
            } catch (e: any) {
                console.warn(`City creation failed for ${cityData.munCityName} (${slug}):`, e.message)
                return
            }

            const cityBarangays = barangaysByCity.get(cityData.munCityCode) || []
            const BRGY_BATCH = 20
            for (let j = 0; j < cityBarangays.length; j += BRGY_BATCH) {
                const brgyBatch = cityBarangays.slice(j, j + BRGY_BATCH)
                await Promise.all(brgyBatch.map(async (brgy) => {
                    const brgySlug = toSlug(brgy.brgyName)
                    try {
                        await payload.create({
                            collection: 'barangays',
                            data: {
                                name: brgy.brgyName,
                                slug: brgySlug,
                                city: cityID,
                                isActive: true
                            }
                        })
                    } catch (err) {
                    }
                }))
            }
        }))

        if ((i + BATCH_SIZE) % 50 === 0 || i + BATCH_SIZE >= cities.length) {
            console.log(`Processed ${i + BATCH_SIZE} / ${cities.length} cities...`)
        }
    }
    console.log('--- Seeding Locations Complete ---')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
    console.log('--- Reverting Seeds ---')
    await payload.delete({
        collection: 'users',
        where: {
            email: { equals: 'admin@twr.com' },
        },
    })

    await payload.delete({
        collection: 'barangays',
        where: {
            id: { exists: true },
        },
    })

    await payload.delete({
        collection: 'cities',
        where: {
            id: { exists: true },
        },
    })
    console.log('--- Revert Complete ---')
}
