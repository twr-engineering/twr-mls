
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
process.env.PAYLOAD_SECRET = '28358c48afffe6026b4525347f56c3abb6e5660a2775cd49341348350f487696'
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/twr_mls'

import { getPayload } from 'payload'
// We need the PSGC service to look up names
import { psgcClient } from '../lib/psgc/client'

async function migrateLocationNames() {
    // Dynamically import config
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })

    console.log('Starting migration of location names...')

    // optimize: fetch only needed fields
    const listings = await payload.find({
        collection: 'listings',
        limit: 1000,
        overrideAccess: true,
    })

    console.log(`Found ${listings.totalDocs} listings to check.`)

    for (const doc of listings.docs) {
        const updates: any = {}

        // Check if we need to populate cityName
        if (!doc.cityName && doc.city && typeof doc.city === 'string') {
            try {
                // Fetch all cities is expensive, maybe we can fetch just one? 
                // The psgcClient doesn't seem to have getCityByCode easily exposed without fetching list
                // Let's use the public API directly if needed, or rely on the collection
                // Actually, we can just find it in the 'cities' collection if we have it synced
                // Or re-use the logic from populateLocationNames hook? 
                // Best approach: re-save the document? No, that triggers validations.
                // Let's manually lookup.

                // Lookup City Name
                // We know doc.city is the PSGC code.
                // Let's fetch the city from our Cities collection first
                const cityDocs = await payload.find({
                    collection: 'cities',
                    where: { psgcCode: { equals: doc.city } },
                    limit: 1,
                })

                if (cityDocs.docs.length > 0) {
                    updates.cityName = cityDocs.docs[0].name
                    console.log(`[${doc.id}] Found City in DB: ${updates.cityName}`)
                } else {
                    console.log(`[${doc.id}] City code ${doc.city} not found in DB. Trying API...`)
                    try {
                        let res = await fetch(`https://psgc.gitlab.io/api/cities/${doc.city}`)
                        if (res.ok) {
                            const data = await res.json()
                            updates.cityName = data.name
                            console.log(`[${doc.id}] Found City via API: ${updates.cityName}`)
                        } else {
                            // Try municipalities
                            res = await fetch(`https://psgc.gitlab.io/api/municipalities/${doc.city}`)
                            if (res.ok) {
                                const data = await res.json()
                                updates.cityName = data.name
                                console.log(`[${doc.id}] Found Municipality via API: ${updates.cityName}`)
                            } else {
                                console.error(`[${doc.id}] Failed to find city/municipality via API for code ${doc.city}`)
                            }
                        }
                    } catch (err) {
                        console.error(`[${doc.id}] API lookup failed: ${err}`)
                    }
                }

            } catch (e) {
                console.error(`[${doc.id}] Error fetching city: ${e}`)
            }
        }

        // Check if we need to populate barangayName
        if (!doc.barangayName && doc.barangay && typeof doc.barangay === 'string') {
            try {
                // Determine parent city code for context if needed, but usually lookup is by code
                // Our barangay-service fetches by city.
                // Let's try to find in 'barangays' collection if we have one? 
                // We do import 'src/collections/locations/Barangays.ts'? No, typically we might cache them.
                // Let's use standard psgcClient.fetchBarangaysByCity(doc.city) and find the match.

                if (doc.city && typeof doc.city === 'string') {
                    const barangays = await psgcClient.fetchBarangaysByCity(doc.city)
                    const match = barangays.find(b => b.code === doc.barangay)
                    if (match) {
                        updates.barangayName = match.name
                        console.log(`[${doc.id}] Found Barangay: ${updates.barangayName}`)
                    }
                }
            } catch (e) {
                console.error(`[${doc.id}] Error fetching barangay: ${e}`)
            }
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
            await payload.update({
                collection: 'listings',
                id: doc.id,
                data: updates,
                overrideAccess: true,
            })
            console.log(`[${doc.id}] Updated.`)
        } else {
            console.log(`[${doc.id}] No updates needed.`)
        }
    }

    console.log('Migration complete.')
    process.exit(0)
}

migrateLocationNames()
