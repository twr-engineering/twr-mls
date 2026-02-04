
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.seed.config'

async function checkTables() {
    const payload = await getPayload({ config })

    try {
        const result = await payload.db.drizzle.execute('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'')
        console.log('Tables found:', result.rows.map((r: any) => r.table_name).sort())
    } catch (e) {
        console.error('Error fetching tables:', e)
    }
    process.exit(0)
}

checkTables()
