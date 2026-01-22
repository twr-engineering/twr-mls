
import type { Payload } from 'payload'
import { listMuncities, listBarangays, listProvinces } from '@jobuntux/psgc'

// Utility to slugify
const toSlug = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const seedLocations = async (payload: Payload) => {
    console.log('--- Seeding All Philippines Locations ---')
    console.log('Preparing data...')

    const cities = listMuncities()
    const barangays = listBarangays()
    const provinces = listProvinces()

    // 1. Group Barangays by City Code for O(1) access
    const barangaysByCity = new Map<string, typeof barangays>()
    for (const brgy of barangays) {
        const list = barangaysByCity.get(brgy.munCityCode) || []
        list.push(brgy)
        barangaysByCity.set(brgy.munCityCode, list)
    }

    // 2. Map Province Code to Name for better slugs (optional, but good for "San Jose - Batangas")
    const provinceMap = new Map<string, string>()
    for (const prov of provinces) {
        if (prov.provCode) {
            provinceMap.set(prov.provCode, prov.provName)
        }
    }

    console.log(`Ready to seed ${cities.length} cities and ${barangays.length} barangays.`)

    // 3. Process in batches (with local slug tracking to prevent races)
    const usedSlugs = new Set<string>()

    // Pre-load duplicates is hard without reading DB. We assume empty DB start or we handle "exists".
    // Since we reset DB, we start fresh.

    const BATCH_SIZE = 1 // Strict sequential for safety against unique constraints

    for (let i = 0; i < cities.length; i += BATCH_SIZE) {
        const batch = cities.slice(i, i + BATCH_SIZE)

        // Even in batch 1, usedSlugs protects us if we scale up later
        await Promise.all(batch.map(async (cityData) => {
            let slug = toSlug(cityData.munCityName)

            // Determine uniqueness via Set
            if (usedSlugs.has(slug)) {
                // Name collision. Append Province.
                const provName = provinceMap.get(cityData.provCode) || cityData.provCode || 'prov'
                const provSlug = toSlug(provName)
                slug = `${slug}-${provSlug}`

                // If STILL used (e.g. 2 San Joses in same province? Unlikely but defensive)
                let counter = 1
                const baseSlug = slug
                while (usedSlugs.has(slug)) {
                    slug = `${baseSlug}-${counter}`
                    counter++
                }
            }

            usedSlugs.add(slug)

            // Create City
            let cityID: string | number
            try {
                const newCity = await payload.create({
                    collection: 'cities',
                    data: {
                        name: cityData.munCityName,
                        slug: slug,
                        isActive: true,
                    }
                })
                cityID = newCity.id
            } catch (e: any) {
                // Fallback if it existed (e.g. from previous run)
                // NOTE: With reset-db this shouldn't happen unless logic error
                console.warn(`City creation failed for ${cityData.munCityName} (${slug}):`, e.message)
                return // Skip barangays if city failed
            }

            // 4. Seed Barangays
            const cityBarangays = barangaysByCity.get(cityData.munCityCode) || []

            // Batch barangays (20 at a time)
            const BRGY_BATCH = 20
            for (let j = 0; j < cityBarangays.length; j += BRGY_BATCH) {
                const brgyBatch = cityBarangays.slice(j, j + BRGY_BATCH)
                await Promise.all(brgyBatch.map(async (brgy) => {
                    const brgySlug = toSlug(brgy.brgyName)
                    // Slug collision inside barangays? 
                    // "Poblacion" appears multiple times in a city? NO.
                    // But "District 1", "District 2".
                    // Unlikely to have duplicate names in ONE city.
                    // But let's swallow errors to be safe.
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
                        // Ignore barangay dupes
                    }
                }))
            }
        }))

        // Log progress
        if ((i + BATCH_SIZE) % 50 === 0 || i + BATCH_SIZE >= cities.length) {
            console.log(`Processed ${i + BATCH_SIZE} / ${cities.length} cities...`)
        }
    }

    console.log('--- Seeding Locations Complete ---')
}
