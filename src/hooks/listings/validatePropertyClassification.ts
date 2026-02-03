import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Validates property classification hierarchy
 * Ensures PropertyType belongs to PropertyCategory
 * Ensures PropertySubtype belongs to PropertyType
 */
export const validatePropertyClassification: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (!data || (operation !== 'create' && operation !== 'update')) {
    return data
  }

  // ========================================
  // VALIDATE PROPERTY TYPE BELONGS TO CATEGORY
  // ========================================
  if (data.propertyCategory && data.propertyType) {
    const propertyType = await req.payload.findByID({
      collection: 'property-types',
      id: data.propertyType,
      depth: 1, // Include category relationship
      req,
    })

    if (!propertyType) {
      throw new Error('Invalid Property Type selected')
    }

    // Check if the type's category matches the selected category
    const typeCategoryId =
      typeof propertyType.category === 'object'
        ? propertyType.category.id
        : propertyType.category

    if (typeCategoryId !== data.propertyCategory) {
      // Fetch category names for better error message
      const selectedCategory = await req.payload.findByID({
        collection: 'property-categories',
        id: data.propertyCategory,
        depth: 0,
        req,
      })

      const typeCategory = await req.payload.findByID({
        collection: 'property-categories',
        id: typeCategoryId,
        depth: 0,
        req,
      })

      throw new Error(
        `Property Type "${propertyType.name}" belongs to category "${typeCategory?.name}", but you selected category "${selectedCategory?.name}". Please select a Property Type that matches your chosen category.`,
      )
    }
  }

  // ========================================
  // VALIDATE PROPERTY SUBTYPE BELONGS TO TYPE
  // ========================================
  if (data.propertyType && data.propertySubtype) {
    const propertySubtype = await req.payload.findByID({
      collection: 'property-subtypes',
      id: data.propertySubtype,
      depth: 1, // Include propertyType relationship
      req,
    })

    if (!propertySubtype) {
      throw new Error('Invalid Property Subtype selected')
    }

    // Check if the subtype's type matches the selected type
    const subtypeTypeId =
      typeof propertySubtype.propertyType === 'object'
        ? propertySubtype.propertyType.id
        : propertySubtype.propertyType

    if (subtypeTypeId !== data.propertyType) {
      // Fetch type names for better error message
      const selectedType = await req.payload.findByID({
        collection: 'property-types',
        id: data.propertyType,
        depth: 0,
        req,
      })

      const subtypeType = await req.payload.findByID({
        collection: 'property-types',
        id: subtypeTypeId,
        depth: 0,
        req,
      })

      throw new Error(
        `Property Subtype "${propertySubtype.name}" belongs to type "${subtypeType?.name}", but you selected type "${selectedType?.name}". Please select a Property Subtype that matches your chosen type.`,
      )
    }
  }

  return data
}
