/**
 * Script to update existing listings with proper barangay names
 * Run with: npx tsx scripts/update-barangay-names.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const PSGC_API_BASE = 'https://psgc.cloud/api/v2'

interface Listing {
    id: string | number
    barangay: string
    barangayName?: string
    city?: string
}

async function fetchBarangayName(barangayCode: string): Promise<string | null> {
    try {
        // Try to fetch barangay directly by code
        const response = await fetch(`${PSGC_API_BASE}/barangays/${barangayCode}`)
        if (response.ok) {
            const data = await response.json()
            return data.name || null
        }
        return null
    } catch (error) {
        console.error(`Failed to fetch barangay ${barangayCode}:`, error)
        return null
    }
}

async function main() {
    console.log('Starting barangay name update script...')

    const payload = await getPayload({ config })

    // Find all listings with barangay code but no name
    const listings = await payload.find({
        collection: 'listings',
        where: {
            barangay: { exists: true },
            or: [
                { barangayName: { exists: false } },
                { barangayName: { equals: '' } },
                { barangayName: { equals: null } },
            ],
        },
        limit: 1000,
        depth: 0,
    })

    console.log(`Found ${listings.docs.length} listings needing barangay name updates`)

    let updated = 0
    let failed = 0

    for (const listing of listings.docs as Listing[]) {
        const barangayCode = listing.barangay

        if (!barangayCode || !/^\d+$/.test(barangayCode)) {
            console.log(`Skipping listing ${listing.id}: invalid barangay code "${barangayCode}"`)
            continue
        }

        const barangayName = await fetchBarangayName(barangayCode)

        if (barangayName) {
            try {
                await payload.update({
                    collection: 'listings',
                    id: listing.id,
                    data: {
                        barangayName: barangayName,
                    },
                })
                console.log(`✓ Updated listing ${listing.id}: ${barangayCode} -> ${barangayName}`)
                updated++
            } catch (err) {
                console.error(`✗ Failed to update listing ${listing.id}:`, err)
                failed++
            }
        } else {
            console.log(`✗ Could not find name for barangay code ${barangayCode} (listing ${listing.id})`)
            failed++
        }

        // Rate limiting - wait 100ms between API calls
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log(`
Update complete!
- Updated: ${updated}
- Failed: ${failed}
- Total processed: ${listings.docs.length}
`)

    process.exit(0)
}

main().catch((err) => {
    console.error('Script failed:', err)
    process.exit(1)
})
