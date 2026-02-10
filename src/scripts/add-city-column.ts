import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

async function addCityColumn() {
    console.log('Connecting to database via Payload...')

    const payload = await getPayload({ config })

    try {
        console.log('Adding city column to developments table...')

        // Use Payload's db adapter to run raw SQL
        await payload.db.drizzle.execute(`
      ALTER TABLE developments ADD COLUMN IF NOT EXISTS city varchar;
      UPDATE developments SET city = '' WHERE city IS NULL;
      ALTER TABLE developments ALTER COLUMN city SET NOT NULL;
    `)

        console.log('✅ City column added successfully!')
    } catch (error) {
        console.error('Error:', error)
    } finally {
        process.exit(0)
    }
}

addCityColumn()
