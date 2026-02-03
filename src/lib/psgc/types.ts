/**
 * TypeScript type definitions for PSGC Cloud API v2
 * API Documentation: https://psgc.cloud/api-docs/v2
 */

/**
 * Barangay response from PSGC Cloud API
 */
export type PSGCBarangay = {
  code: string
  name: string
  status?: string
  region?: string
  province?: string
  city_municipality?: string
}

/**
 * City/Municipality response from PSGC Cloud API
 */
export type PSGCCity = {
  code: string
  name: string
  type: string
  region?: string
  province?: string
}

/**
 * Options for fetching barangays with caching control
 */
export type GetBarangaysOptions = {
  /**
   * Bypass cache and force fresh API fetch
   * @default false
   */
  forceRefresh?: boolean

  /**
   * Maximum age of cached data in days before refresh
   * @default 90
   */
  maxAge?: number
}

/**
 * Source type for barangay records
 */
export type BarangaySourceType = 'seeded' | 'api_cached'
