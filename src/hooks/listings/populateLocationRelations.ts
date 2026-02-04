import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Payload BeforeChange Hook: Auto-populates estate relations.
 *
 * Note: Township auto-population is disabled because city/barangay now use
 * PSGC codes directly from the external API, not local database records.
 * We don't sync PSGC data to local barangays table.
 *
 * - Sets 'estate' based on the selected 'development'
 * - Township is set to null (manual assignment if needed)
 *
 * @param args - The hook arguments containing data, req, and operation
 * @returns The modified data object with populated relations
 */
export const populateLocationRelations: CollectionBeforeChangeHook = async ({
    data,
    req,
    operation,
}) => {
    if (operation === 'create' || operation === 'update') {
        // 1. Auto-populate Township based on Barangay
        if (data.barangay) {
            // Fetch all active townships
            // We filter in memory because 'coveredBarangays' is a JSON field and 
            // Payload's query operators for JSON containment can be tricky with Postgres adapters
            const townshipQuery = await req.payload.find({
                collection: 'townships',
                where: {
                    isActive: {
                        equals: true,
                    },
                },
                limit: 1000,
                req,
            })

            // Find the township that contains the current barangay code
            // coveredBarangays is stored as valid JSON array of strings ["code1", "code2"] based on our custom component
            const matchingTownship = townshipQuery.docs.find((township) => {
                const covered = township.coveredBarangays
                if (Array.isArray(covered)) {
                    return covered.includes(data.barangay)
                }
                return false
            })

            if (matchingTownship) {
                data.township = matchingTownship.id
            } else {
                data.township = null
            }
        } else {
            data.township = null
        }

        // 2. Auto-populate Estate based on Development
        if (data.development) {
            const estateQuery = await req.payload.find({
                collection: 'estates',
                where: {
                    includedDevelopments: {
                        equals: data.development,
                    },
                },
                limit: 1,
                req,
            })

            if (estateQuery.totalDocs > 0) {
                data.estate = estateQuery.docs[0].id
            } else {
                data.estate = null
            }
        } else {
            data.estate = null
        }
    }

    return data
}


