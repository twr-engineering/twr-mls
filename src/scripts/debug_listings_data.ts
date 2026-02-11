process.env.PAYLOAD_SECRET = '28358c48afffe6026b4525347f56c3abb6e5660a2775cd49341348350f487696'
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/twr_mls'

import { getPayload } from 'payload'

async function debugListings() {
    // Dynamically import config to ensure env vars are set first
    const { default: config } = await import('@payload-config')

    console.log('Fetching listings...')
    const payload = await getPayload({ config })

    const listings = await payload.find({
        collection: 'listings',
        limit: 10,
        overrideAccess: true,
    })

    const cities = await payload.find({
        collection: 'cities',
        limit: 10,
    })
    console.log(`Found ${cities.totalDocs} cities.`)
    cities.docs.forEach(c => {
        console.log(`City: ${c.name}, PSGC: ${c.psgcCode} (Type: ${typeof c.psgcCode})`)
    })
    console.log('--- Checking Listings ---')
    listings.docs.forEach(doc => {
        console.log(`Listing ID: ${doc.id}`)
        console.log(`  Title: ${doc.title}`)
        console.log(`  City: ${doc.city} (Type: ${typeof doc.city})`)
        console.log(`  City Name: ${doc.cityName}`)
        console.log(`  Barangay: ${doc.barangay} (Type: ${typeof doc.barangay})`)
        console.log(`  Barangay Name: ${doc.barangayName}`)
        console.log('---')
    })

    process.exit(0)
}

debugListings()
