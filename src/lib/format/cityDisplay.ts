import type { City, Province } from '@/payload-types'

/**
 * Format city name with province for display
 * Examples:
 *   - "Cagayan de Oro (Misamis Oriental)"
 *   - "Victoria (Tarlac)"
 *   - "Manila" (if no province)
 */
export function formatCityWithProvince(
  city: string | City,
  province?: string | Province | null,
): string {
  const cityName = typeof city === 'string' ? city : city.name

  if (!province) {
    return cityName
  }

  const provinceName = typeof province === 'string' ? province : province.name

  return `${cityName} (${provinceName})`
}

/**
 * Get city display name from a relationship field
 * Handles both populated and unpopulated relationships
 */
export function getCityDisplayName(cityValue: string | number | City): string {
  if (typeof cityValue === 'string' || typeof cityValue === 'number') {
    return String(cityValue)
  }

  if (!cityValue) {
    return ''
  }

  const province = typeof cityValue.province === 'object' ? cityValue.province : null

  return formatCityWithProvince(cityValue, province)
}
