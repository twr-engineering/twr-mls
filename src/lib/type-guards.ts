import type {
    Media,
    City,
    Barangay,
    User,
    Development,
    PropertyCategory,
    PropertyType,
    PropertySubtype,
    Township,
    Estate
} from '@/payload-types'

/**
 * Type guard to check if a value is a Media object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMedia = (doc: any): doc is Media => {
    return doc && typeof doc === 'object' && 'url' in doc
}

/**
 * Type guard to check if a value is a City object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCity = (doc: any): doc is City => {
    return doc && typeof doc === 'object' && 'name' in doc && 'province' in doc
}

/**
 * Type guard to check if a value is a Barangay object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isBarangay = (doc: any): doc is Barangay => {
    return doc && typeof doc === 'object' && 'name' in doc
}

/**
 * Type guard to check if a value is a User object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isUser = (doc: any): doc is User => {
    return doc && typeof doc === 'object' && 'email' in doc
}

/**
 * Type guard to check if a value is a Development object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isDevelopment = (doc: any): doc is Development => {
    return doc && typeof doc === 'object' && 'name' in doc
}

/**
 * Type guard to check if a value is a PropertyCategory object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPropertyCategory = (doc: any): doc is PropertyCategory => {
    return doc && typeof doc === 'object' && 'title' in doc
}

/**
 * Type guard to check if a value is a PropertyType object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPropertyType = (doc: any): doc is PropertyType => {
    return doc && typeof doc === 'object' && 'title' in doc
}

/**
 * Type guard to check if a value is a PropertySubtype object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPropertySubtype = (doc: any): doc is PropertySubtype => {
    return doc && typeof doc === 'object' && 'title' in doc
}

/**
 * Type guard to check if a value is a Township object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isTownship = (doc: any): doc is Township => {
    return doc && typeof doc === 'object' && 'name' in doc
}

/**
 * Type guard to check if a value is an Estate object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEstate = (doc: any): doc is Estate => {
    return doc && typeof doc === 'object' && 'name' in doc
}
