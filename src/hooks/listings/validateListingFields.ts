import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Validates listing fields based on listingType (resale vs preselling)
 * Ensures data integrity and prevents invalid field combinations
 */
export const validateListingFields: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data || (operation !== 'create' && operation !== 'update')) {
    return data
  }

  // Merge original document with incoming data to validate the full picture
  const mergedDoc = { ...originalDoc, ...data }
  const listingType = mergedDoc.listingType

  // ========================================
  // PRESELLING LISTING VALIDATIONS
  // ========================================
  if (listingType === 'preselling') {
    // Required fields for preselling
    if (!mergedDoc.development) {
      throw new Error('Preselling listings must have a Development selected')
    }

    if (!mergedDoc.modelName) {
      throw new Error('Preselling listings must have a Model Name')
    }

    // Validate pricing: must have indicativePrice OR (min AND max)
    const hasIndicativePrice = mergedDoc.indicativePrice && mergedDoc.indicativePrice > 0
    const hasPriceRange =
      mergedDoc.indicativePriceMin &&
      mergedDoc.indicativePriceMax &&
      mergedDoc.indicativePriceMin > 0 &&
      mergedDoc.indicativePriceMax > 0

    if (!hasIndicativePrice && !hasPriceRange) {
      throw new Error(
        'Preselling listings must have either an Indicative Price or a Price Range (Min and Max)',
      )
    }

    // Validate price range if both are provided
    if (hasPriceRange && mergedDoc.indicativePriceMin! > mergedDoc.indicativePriceMax!) {
      throw new Error('Indicative Price Min cannot be greater than Indicative Price Max')
    }

    // Validate minimum size: must have minLotAreaSqm OR minFloorAreaSqm
    const hasMinLotArea = mergedDoc.minLotAreaSqm && mergedDoc.minLotAreaSqm > 0
    const hasMinFloorArea = mergedDoc.minFloorAreaSqm && mergedDoc.minFloorAreaSqm > 0

    if (!hasMinLotArea && !hasMinFloorArea) {
      throw new Error(
        'Preselling listings must have either Minimum Lot Area or Minimum Floor Area',
      )
    }

    // Preselling listings CANNOT have resale-only fields
    const resaleOnlyFields = [
      'price',
      'pricePerSqm',
      'floorAreaSqm',
      'lotAreaSqm',
      'furnishing',
      'constructionYear',
      'titleStatus',
      'propertyOwnerName',
      'propertyOwnerContact',
      'propertyOwnerNotes',
    ]

    const invalidFields = resaleOnlyFields.filter((field) => {
      const value = data[field] // We only care if they are TRVING to set these fields in this request
      return value !== undefined && value !== null && value !== ''
    })

    if (invalidFields.length > 0) {
      throw new Error(
        `Preselling listings cannot have these resale-only fields: ${invalidFields.join(', ')}`,
      )
    }
  }

  // ========================================
  // RESALE LISTING VALIDATIONS
  // ========================================
  if (listingType === 'resale') {
    // Required fields for resale
    // During an update, price might not be in the incoming data, but must exist in mergedDoc
    if (!mergedDoc.price || mergedDoc.price <= 0) {
      throw new Error('Resale listings must have a valid Price')
    }

    // Validate lot area requirement for lot properties
    if (mergedDoc.propertyType) {
      const propertyType = await req.payload.findByID({
        collection: 'property-types',
        id: typeof mergedDoc.propertyType === 'object' ? mergedDoc.propertyType.id : mergedDoc.propertyType,
        depth: 0,
        req,
      })

      // Check if this is a lot-type property (case-insensitive)
      const isLotType =
        propertyType?.name &&
        (propertyType.name.toLowerCase().includes('lot') ||
          propertyType.name.toLowerCase().includes('land'))

      if (isLotType && (!mergedDoc.lotAreaSqm || mergedDoc.lotAreaSqm <= 0)) {
        throw new Error(
          `Lot/Land properties must have a valid Lot Area (sqm) for price per sqm calculation`,
        )
      }
    }

    // Resale listings CANNOT have preselling-only fields
    const presellingOnlyFields = [
      'modelName',
      'indicativePrice',
      'indicativePriceMin',
      'indicativePriceMax',
      'minLotAreaSqm',
      'minFloorAreaSqm',
      'standardInclusions',
      'presellingNotes',
    ]

    const invalidFields = presellingOnlyFields.filter((field) => {
      const value = data[field] // Only check if they are explicitly trying to set them
      return value !== undefined && value !== null && value !== ''
    })

    if (invalidFields.length > 0) {
      throw new Error(
        `Resale listings cannot have these preselling-only fields: ${invalidFields.join(', ')}`,
      )
    }
  }

  return data
}
