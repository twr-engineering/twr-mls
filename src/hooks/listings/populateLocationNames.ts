import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Payload BeforeChange Hook: Auto-populates city and barangay names.
 *
 * Listings store 'city' and 'barangay' as PSGC codes (strings).
 * This hook looks up the corresponding human-readable names from the
 * 'cities' and 'barangays' collections and stores them in
 * 'cityName' and 'barangayName' fields for easier display on the frontend.
 *
 * @param args - The hook arguments containing data, req, and operation
 * @returns The modified data object with populated names
 */
export const populateLocationNames: CollectionBeforeChangeHook = async ({
    data,
    req,
    operation,
}) => {
    if (operation === 'create' || operation === 'update') {
        // 1. Populate City Name
        if (data.city) {
            try {
                const cityQuery = await req.payload.find({
                    collection: 'cities',
                    where: {
                        // Check both psgcCode (standard) and potentially id if strictly numeric match intended,
                        // but Listing schema says 'city' is text PSGC code.
                        psgcCode: { equals: data.city },
                    },
                    limit: 1,
                    req,
                })

                if (cityQuery.docs.length > 0) {
                    data.cityName = cityQuery.docs[0].name
                } else {
                    // If not found by code, maybe it IS the ID? (Legacy support or fallback)
                    // But strictly speaking, it should be the code.
                    // Leaving it as-is or null if not found.
                    console.warn(`[PopulateNames] City with PSGC code ${data.city} not found.`)
                }
            } catch (error) {
                console.error(`[PopulateNames] Error looking up city:`, error)
            }
        } else {
            data.cityName = null
        }

        // 2. Populate Barangay Name
        if (data.barangay) {
            try {
                const barangayQuery = await req.payload.find({
                    collection: 'barangays',
                    where: {
                        psgcCode: { equals: data.barangay },
                    },
                    limit: 1,
                    req,
                })

                if (barangayQuery.docs.length > 0) {
                    data.barangayName = barangayQuery.docs[0].name
                } else {
                    console.warn(`[PopulateNames] Barangay with PSGC code ${data.barangay} not found.`)
                }
            } catch (error) {
                console.error(`[PopulateNames] Error looking up barangay:`, error)
            }
        } else {
            data.barangayName = null
        }
    }

    return data
}
