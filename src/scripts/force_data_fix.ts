
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
process.env.PAYLOAD_SECRET = '28358c48afffe6026b4525347f56c3abb6e5660a2775cd49341348350f487696'
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/twr_mls'

import { getPayload } from 'payload'

const CITY_MAP: Record<string, string> = {
    '1380500000': 'Mandaluyong City',
    '0330100000': 'Angeles City',
    '0403428000': 'Santa Rosa City',
    '1030500000': 'Cagayan de Oro City',
    '0000000000': 'Unknown City'
}

async function forceUpdate() {
    // Dynamically import config
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })

    console.log('Force updating specific listings...')

    const listings = await payload.find({
        collection: 'listings',
        limit: 100,
        overrideAccess: true,
    })

    for (const doc of listings.docs) {
        if (!doc.cityName && doc.city && typeof doc.city === 'string' && CITY_MAP[doc.city]) {
            console.log(`[${doc.id}] Updating city ${doc.city} -> ${CITY_MAP[doc.city]}`)
            await payload.update({
                collection: 'listings',
                id: doc.id,
                data: {
                    city: doc.city,
                    cityName: CITY_MAP[doc.city]
                },
                overrideAccess: true,
            })
        }
    }
    console.log('Done.')
    process.exit(0)
}

forceUpdate()
