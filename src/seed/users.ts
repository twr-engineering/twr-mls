
import type { Payload } from 'payload'

export const seedUsers = async (payload: Payload) => {
    console.log('Seeding Users...')

    const users = await payload.find({
        collection: 'users',
        where: {
            email: { equals: 'admin@twr.com' },
        },
        limit: 1,
    })

    if (users.totalDocs === 0) {
        console.log('Creating Admin User: admin@twr.com')
        await payload.create({
            collection: 'users',
            data: {
                email: 'admin@twr.com',
                password: 'password123',
                role: 'admin',
                firstName: 'System',
                lastName: 'Admin',
                isActive: true,
            },
        })
    } else {
        console.log('Admin User already exists.')
    }
}
