import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

async function verifySchema() {
    console.log('Connecting to database via Payload...')
    const payload = await getPayload({ config })

    try {
        console.log('Checking developments table...')

        // Check if table exists
        const tableRes = await payload.db.drizzle.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'developments'
      );
    `)
        const tableExists = tableRes.rows[0].exists
        console.log(`Table 'developments' exists: ${tableExists}`)

        if (tableExists) {
            // Check columns
            const columnsRes = await payload.db.drizzle.execute(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'developments';
        `)
            console.log('Columns in developments table:')
            console.table(columnsRes.rows)

            const hasCity = columnsRes.rows.some(row => row.column_name === 'city')
            console.log(`Column 'city' exists: ${hasCity}`)
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        process.exit(0)
    }
}

verifySchema()
