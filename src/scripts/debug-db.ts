import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.seed.config'

async function debug() {
    const payload = await getPayload({ config })

    console.log('--- Cities ---')
    const cities = await payload.find({
        collection: 'cities',
    })
    console.log(`Total Cities: ${cities.totalDocs}`)
    cities.docs.forEach(c => {
        console.log(`- ${c.name} (ID: ${c.id}, Code: ${c.psgcCode})`)
    })

    if (cities.docs.length > 0) {
        const cityId = cities.docs[0].id
        console.log(`\n--- Barangays for City ID: ${cityId} ---`)
        const barangays = await payload.find({
            collection: 'barangays',
            where: {
                city: { equals: cityId }
            },
            limit: 10
        })
        console.log(`Total Barangays found for this city: ${barangays.totalDocs}`)
        barangays.docs.forEach(b => {
            console.log(`- ${b.name} (ID: ${b.id}, Code: ${b.psgcCode})`)
        })
    }

    process.exit(0)
}

debug()
