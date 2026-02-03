/**
 * Update all cities with correct 10-digit PSGC codes from PSGC Cloud API
 * Run with: pnpm tsx scripts/update-psgc-codes.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@/payload.config'

type PSGCCity = {
  code: string
  name: string
  oldName?: string
  isCapital?: string
}

async function updatePSGCCodes() {
  console.log('🔄 Fetching cities from PSGC Cloud API...')

  // Fetch all cities/municipalities from PSGC API
  const response = await fetch('https://psgc.cloud/api/v2/cities-municipalities')
  if (!response.ok) {
    throw new Error(`Failed to fetch PSGC data: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()
  const psgcCities: PSGCCity[] = json.data || []

  console.log(`✅ Fetched ${psgcCities.length} cities from PSGC API`)

  // Create mapping: normalized name -> PSGC code
  const psgcCodeMap = new Map<string, string>()

  for (const city of psgcCities) {
    const normalizedName = city.name.toLowerCase().trim()
    psgcCodeMap.set(normalizedName, city.code)

    // Also map without "City of" prefix
    const nameWithoutPrefix = normalizedName
      .replace(/^city of\s+/i, '')
      .replace(/^municipality of\s+/i, '')
    if (nameWithoutPrefix !== normalizedName) {
      psgcCodeMap.set(nameWithoutPrefix, city.code)
    }
  }

  console.log('🔄 Connecting to database...')
  const payload = await getPayload({ config })

  // Fetch all cities from database
  const { docs: dbCities } = await payload.find({
    collection: 'cities',
    limit: 10000,
    overrideAccess: true,
  })

  console.log(`📊 Found ${dbCities.length} cities in database`)

  let updated = 0
  let skipped = 0
  let notFound = 0
  let errors = 0
  const notFoundList: string[] = []
  const usedCodes = new Set<string>()

  for (const city of dbCities) {
    const cityName = city.name.toLowerCase().trim()
    const cityNameWithoutPrefix = cityName
      .replace(/^city of\s+/i, '')
      .replace(/^municipality of\s+/i, '')

    const psgcCode =
      psgcCodeMap.get(cityName) ||
      psgcCodeMap.get(cityNameWithoutPrefix) ||
      psgcCodeMap.get(cityNameWithoutPrefix.replace(/\s+/g, ''))

    if (psgcCode) {
      // Skip if already has correct code
      if (city.psgcCode === psgcCode) {
        skipped++
        continue
      }

      // Skip if this code was already used (handles duplicate city names)
      if (usedCodes.has(psgcCode)) {
        console.warn(
          `  ⚠ Skipping "${city.name}" (ID: ${city.id}) - code ${psgcCode} already assigned to another city`,
        )
        notFound++
        notFoundList.push(`${city.name} (ID: ${city.id}) - duplicate name`)
        continue
      }

      try {
        await payload.update({
          collection: 'cities',
          id: city.id,
          data: { psgcCode: psgcCode },
          overrideAccess: true,
        })
        console.log(`  ✓ Updated "${city.name}" (ID: ${city.id}) → ${psgcCode}`)
        usedCodes.add(psgcCode)
        updated++
      } catch (error) {
        console.error(
          `  ❌ Error updating "${city.name}" (ID: ${city.id}):`,
          error instanceof Error ? error.message : error,
        )
        errors++
      }
    } else {
      notFound++
      notFoundList.push(city.name)
      console.warn(`  ⚠ No PSGC code found for: "${city.name}"`)
    }
  }

  console.log('\n📈 Summary:')
  console.log(`  ✅ Updated: ${updated} cities`)
  console.log(`  ⏭️  Skipped (already correct): ${skipped} cities`)
  console.log(`  ⚠️  Not found/duplicates: ${notFound}`)
  console.log(`  ❌ Errors: ${errors}`)
  console.log(`  📊 Total: ${dbCities.length} cities`)

  if (notFoundList.length > 0 && notFoundList.length <= 30) {
    console.log('\n⚠️  Cities not found or skipped:')
    notFoundList.forEach((name) => console.log(`    - ${name}`))
  }

  if (errors === 0) {
    console.log('\n✅ All cities processed successfully!')
  }

  process.exit(errors > 0 ? 1 : 0)
}

updatePSGCCodes().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
