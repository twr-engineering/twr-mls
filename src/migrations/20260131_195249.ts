import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: Create enum and add columns (psgc_code nullable initially for cities)
  await db.execute(sql`
   CREATE TYPE "public"."enum_barangays_source_type" AS ENUM('seeded', 'api_cached');
  ALTER TABLE "cities" ADD COLUMN "psgc_code" varchar;
  ALTER TABLE "barangays" ADD COLUMN "psgc_code" varchar;
  ALTER TABLE "barangays" ADD COLUMN "source_type" "enum_barangays_source_type" DEFAULT 'seeded';
  ALTER TABLE "barangays" ADD COLUMN "last_synced_at" timestamp(3) with time zone;`)

  // Step 2: Backfill PSGC codes for cities using PSGC Cloud API
  console.log('[Migration] Backfilling PSGC codes from PSGC Cloud API...')

  // Fetch cities from PSGC Cloud API
  const psgcApiResponse = await fetch('https://psgc.cloud/api/v2/cities-municipalities')
  const psgcApiData = await psgcApiResponse.json()
  const psgcCities = psgcApiData.data as Array<{ code: string; name: string }>

  // Create a mapping of city names to 10-digit PSGC codes
  const psgcCodeMap = new Map<string, string>()
  for (const city of psgcCities) {
    // Normalize name (remove "City of" prefix, lowercase, trim)
    const normalizedName = city.name
      .toLowerCase()
      .replace(/^city of\s+/i, '')
      .trim()
    psgcCodeMap.set(normalizedName, city.code)
    // Also store with "City of" prefix for exact matches
    psgcCodeMap.set(city.name.toLowerCase().trim(), city.code)
  }

  // Fetch all cities from database using SQL
  const result = await db.execute<{ id: string | number; name: string }>(
    sql`SELECT id, name FROM cities`,
  )

  let updated = 0
  let notFound = 0

  for (const city of result.rows) {
    // Try multiple name variations
    const cityName = city.name.toLowerCase().trim()
    const cityNameWithoutPrefix = cityName.replace(/^city of\s+/i, '').trim()

    const psgcCode =
      psgcCodeMap.get(cityName) || psgcCodeMap.get(cityNameWithoutPrefix) || psgcCodeMap.get(`city of ${cityNameWithoutPrefix}`)

    if (psgcCode) {
      await db.execute(sql`UPDATE cities SET psgc_code = ${psgcCode} WHERE id = ${city.id}`)
      updated++
    } else {
      console.warn(`[Migration] PSGC code not found for city: ${city.name}`)
      notFound++
    }
  }

  console.log(
    `[Migration] Backfilled ${updated} cities with 10-digit PSGC codes from API, ${notFound} not found`,
  )

  // Step 3: Mark existing barangays as 'seeded' source type (already set by DEFAULT)
  await db.execute(sql`
   UPDATE "barangays" SET "source_type" = 'seeded' WHERE "source_type" IS NULL;`)

  console.log('[Migration] Set existing barangays to sourceType = seeded')

  // Step 4: Make psgc_code NOT NULL for cities and add unique indexes
  await db.execute(sql`
   ALTER TABLE "cities" ALTER COLUMN "psgc_code" SET NOT NULL;
  CREATE UNIQUE INDEX "cities_psgc_code_idx" ON "cities" USING btree ("psgc_code");
  CREATE UNIQUE INDEX "barangays_psgc_code_idx" ON "barangays" USING btree ("psgc_code");`)

  console.log('[Migration] Added unique indexes and constraints')
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "cities_psgc_code_idx";
  DROP INDEX "barangays_psgc_code_idx";
  ALTER TABLE "cities" DROP COLUMN "psgc_code";
  ALTER TABLE "barangays" DROP COLUMN "psgc_code";
  ALTER TABLE "barangays" DROP COLUMN "source_type";
  ALTER TABLE "barangays" DROP COLUMN "last_synced_at";
  DROP TYPE "public"."enum_barangays_source_type";`)
}
