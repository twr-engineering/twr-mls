import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

async function checkTables() {
    console.log('Connecting to database via Payload...')

    const payload = await getPayload({ config })

    try {
        console.log('Checking existing tables...')

        // Query to list all tables
        const result = await payload.db.drizzle.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)

        console.log('Tables in database:')
        console.log(result.rows)
    } catch (error) {
        console.error('Error:', error)
    } finally {
        process.exit(0)
    }
}

checkTables()
