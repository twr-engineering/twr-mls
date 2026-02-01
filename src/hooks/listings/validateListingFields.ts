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

  const listingType = data.listingType || originalDoc?.listingType

  // ========================================
  // PRESELLING LISTING VALIDATIONS
  // ========================================
  if (listingType === 'preselling') {
    // Required fields for preselling
    if (!data.development) {
      throw new Error('Preselling listings must have a Development selected')
    }

    if (!data.modelName) {
      throw new Error('Preselling listings must have a Model Name')
    }

    // Validate pricing: must have indicativePrice OR (min AND max)
    const hasIndicativePrice = data.indicativePrice && data.indicativePrice > 0
    const hasPriceRange =
      data.indicativePriceMin &&
      data.indicativePriceMax &&
      data.indicativePriceMin > 0 &&
      data.indicativePriceMax > 0

    if (!hasIndicativePrice && !hasPriceRange) {
      throw new Error(
        'Preselling listings must have either an Indicative Price or a Price Range (Min and Max)',
      )
    }

    // Validate price range if both are provided
    if (hasPriceRange && data.indicativePriceMin! > data.indicativePriceMax!) {
      throw new Error('Indicative Price Min cannot be greater than Indicative Price Max')
    }

    // Validate minimum size: must have minLotArea OR minFloorArea
    const hasMinLotArea = data.minLotArea && data.minLotArea > 0
    const hasMinFloorArea = data.minFloorArea && data.minFloorArea > 0

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
      const value = data[field]
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
    if (!data.price || data.price <= 0) {
      throw new Error('Resale listings must have a valid Price')
    }

    // Validate lot area requirement for lot properties
    if (data.propertyType) {
      const propertyType = await req.payload.findByID({
        collection: 'property-types',
        id: data.propertyType,
        depth: 0,
        req,
      })

      // Check if this is a lot-type property (case-insensitive)
      const isLotType =
        propertyType?.name &&
        (propertyType.name.toLowerCase().includes('lot') ||
          propertyType.name.toLowerCase().includes('land'))

      if (isLotType && (!data.lotAreaSqm || data.lotAreaSqm <= 0)) {
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
      'minLotArea',
      'minFloorArea',
      'standardInclusions',
      'presellingNotes',
    ]

    const invalidFields = presellingOnlyFields.filter((field) => {
      const value = data[field]
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
