
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({
    path: path.resolve(dirname, '../../.env'),
})

import { getPayload } from 'payload'
import { seedLocations } from './locations'
import { seedUsers } from './users'

const seed = async () => {
    const { default: configPromise } = await import('@payload-config')
    const payload = await getPayload({ config: configPromise })

    // eslint-disable-next-line no-console
    console.log('--- Seeding Database ---')

    try {
        await seedUsers(payload)
        await seedLocations(payload)
        // Add other seeders here (e.g. users, listings)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }

    // eslint-disable-next-line no-console
    console.log('--- Seeding Complete ---')
    process.exit(0)
}

seed()
