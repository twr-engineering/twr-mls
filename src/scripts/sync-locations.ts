/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.seed.config'

const PSGC_BASE_URL = 'https://psgc.cloud/api'

// Target: Cagayan de Oro City (Capital)
const TARGET_CITY_NAME = 'City of Cagayan De Oro'

async function syncLocations() {
    const payload = await getPayload({ config })

    console.log('Starting PSGC Sync...')

    try {
        // 1. Fetch Cities
        console.log(`Fetching cities... searching for ${TARGET_CITY_NAME}`)
        const citiesResp = await fetch(`${PSGC_BASE_URL}/cities-municipalities`)
        if (!citiesResp.ok) throw new Error(`Failed to fetch cities: ${citiesResp.statusText}`)

        const allCities = await citiesResp.json()
        // Helper to find loosely
        const targetCityData = allCities.find((c: any) => c.name.trim() === TARGET_CITY_NAME || c.name.toLowerCase().includes('cagayan de oro'))

        if (!targetCityData) {
            console.error(`City ${TARGET_CITY_NAME} not found in PSGC data.`)

            const similar = allCities.filter((c: any) => c.name.toLowerCase().includes('cagayan'))
            console.log('Did you mean:', similar.map((c: any) => `${c.name} (${c.code})`))

            process.exit(1)
        }

        console.log(`Found City: ${targetCityData.name} (Code: ${targetCityData.code})`)

        // 2. Sync City
        const citySlug = targetCityData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

        console.log(`Syncing City: ${targetCityData.name}...`)

        const existingCities = await payload.find({
            collection: 'cities',
            where: {
                name: { equals: targetCityData.name },
            },
        })

        let cityId
        if (existingCities.totalDocs > 0) {
            cityId = existingCities.docs[0].id
            console.log(`City already exists (ID: ${cityId}). Updating...`)
            await payload.update({
                collection: 'cities',
                id: cityId,
                data: {
                    name: targetCityData.name,
                    slug: citySlug,
                    psgcCode: targetCityData.code,
                    isActive: true,
                },
            })
        } else {
            const newCity = await payload.create({
                collection: 'cities',
                data: {
                    name: targetCityData.name,
                    slug: citySlug,
                    psgcCode: targetCityData.code,
                    isActive: true,
                    province: 1, // Placeholder to satisfy type requirement
                },
                draft: false,
            })
            cityId = newCity.id
            console.log(`City created (ID: ${cityId}).`)
        }

        // 3. Fetch Barangays
        console.log(`Fetching barangays for city code ${targetCityData.code}...`)
        const barangaysResp = await fetch(`${PSGC_BASE_URL}/cities-municipalities/${targetCityData.code}/barangays`)
        if (!barangaysResp.ok) throw new Error(`Failed to fetch barangays: ${barangaysResp.statusText}`)

        const barangays = await barangaysResp.json()
        console.log(`Found ${barangays.length} barangays.`)

        // 4. Sync Barangays
        for (const bgy of barangays) {
            const bgySlug = bgy.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

            const existingBgy = await payload.find({
                collection: 'barangays',
                where: {
                    and: [
                        { name: { equals: bgy.name } },
                        { city: { equals: cityId } }
                    ]
                },
            })

            if (existingBgy.totalDocs > 0) {
                // console.log(`  Barangay ${bgy.name} exists. Updating...`) // Reduce log spam
                await payload.update({
                    collection: 'barangays',
                    id: existingBgy.docs[0].id,
                    data: {
                        name: bgy.name,
                        slug: bgySlug,
                        city: cityId,
                        psgcCode: bgy.code,
                        isActive: true,
                    },
                })
            } else {
                console.log(`  Creating Barangay ${bgy.name}...`)
                await payload.create({
                    collection: 'barangays',
                    data: {
                        name: bgy.name,
                        slug: bgySlug,
                        city: cityId,
                        psgcCode: bgy.code,
                        isActive: true,
                    },
                })
            }
        }

        console.log('Sync completed successfully.')

    } catch (error) {
        console.error('Sync failed:', error)
    }
    process.exit(0)
}

syncLocations()
