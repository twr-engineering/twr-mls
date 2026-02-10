import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

export const validateLocationHierarchy: CollectionBeforeChangeHook = async ({
    data,
    req,
    operation,
    originalDoc,
}) => {
    // Resolve final values (incoming data takes precedence, fallback to originalDoc for updates)
    const cityCode = data?.city !== undefined ? data.city : originalDoc?.city
    const barangayCode = data?.barangay !== undefined ? data.barangay : originalDoc?.barangay
    const developmentId =
        data?.development !== undefined ? data.development : originalDoc?.development

    // Skip validation if critical fields are missing (e.g. draft with partial data? 
    // But strict enforcement says "Invalid combinations rejected", so even partials should be valid relative to each other if present)

    // 1. Validate Development belongs to Barangay
    // Note: We skip City -> Barangay validation because we rely on external PSGC API 
    // and do not sync all Barangays to the local DB. The frontend enforces this hierarchy.

    if (barangayCode && developmentId) {
        try {
            const development = await req.payload.findByID({
                collection: 'developments',
                id: developmentId,
            })

            if (development && development.barangay !== barangayCode) {
                throw new APIError(
                    `Invalid location: Development '${development.name}' does not belong to the selected barangay.`,
                    400,
                )
            }
        } catch (error) {
            // If development ID is invalid/not found, payload throws.
            throw new APIError('Invalid development ID selected.', 400)
        }
    }

    return data
}
