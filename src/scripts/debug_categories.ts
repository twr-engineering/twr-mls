import path from 'path'
import dotenv from 'dotenv'
import { getPayload } from 'payload'
import config from '../payload.config'

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const debug = async () => {
    // Ensure Secret is present
    if (!process.env.PAYLOAD_SECRET) {
        console.log('PAYLOAD_SECRET is missing from env. Using default for dev script.')
        process.env.PAYLOAD_SECRET = 'YOUR_SECRET_here'
    }

    const payload = await getPayload({ config })

    console.log('--- Property Categories ---')
    const categories = await payload.find({
        collection: 'property-categories',
        limit: 100,
    })
    categories.docs.forEach((c) => {
        console.log(`[${c.id}] ${c.name} (Active: ${c.isActive})`)
    })

    console.log('\n--- Property Types ---')
    const types = await payload.find({
        collection: 'property-types',
        limit: 100,
        depth: 1,
    })
    types.docs.forEach((t) => {
        const cat = t.propertyCategory
        const catName = typeof cat === 'object' ? cat.name : String(cat)
        const catId = typeof cat === 'object' ? cat.id : cat
        console.log(`[${t.id}] ${t.name} -> Category: [${catId}] ${catName}`)
    })

    process.exit(0)
}

debug()
