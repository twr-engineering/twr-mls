import type { CollectionBeforeChangeHook } from 'payload'

export const populateLocationRelations: CollectionBeforeChangeHook = async ({
    data,
    req,
    operation,
}) => {
    if (operation === 'create' || operation === 'update') {

        if (data.barangay) {

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

                data.township = null
            }
        } else {
            data.township = null
        }

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
