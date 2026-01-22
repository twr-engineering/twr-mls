import type { CollectionBeforeChangeHook } from 'payload'

export const populateLocationRelations: CollectionBeforeChangeHook = async ({
    data,
    req,
    operation,
}) => {
    if (operation === 'create' || operation === 'update') {
        // 1. Populate Township from Barangay
        if (data.barangay) {
            // Find a township that covers this barangay
            const townshipQuery = await req.payload.find({
                collection: 'townships',
                where: {
                    coveredBarangays: {
                        equals: data.barangay,
                    },
                },
                limit: 1,
                req,
            })

            if (townshipQuery.totalDocs > 0) {
                data.township = townshipQuery.docs[0].id
            } else {
                // If no township found (or barangay changed to one without township), clear it
                data.township = null
            }
        } else {
            data.township = null
        }

        // 2. Populate Estate from Development
        if (data.development) {
            // Find an estate that includes this development
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
