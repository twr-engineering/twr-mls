import type { CollectionConfig } from 'payload'
import { authenticated, isAdmin } from '@/access'

/**
 * SharedLinks Collection
 * Stores curated search links that can be shared with non-authenticated users.
 *
 * Read access: restricted to the creator and admins.
 * The public-facing /shared/[id] page uses overrideAccess: true, so it is
 * NOT affected by this access rule — unauthenticated visitors can still view
 * shared listing pages normally.
 */
export const SharedLinks: CollectionConfig = {
    slug: 'shared-links',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'createdBy', 'createdAt'],
        group: 'Agent Tools',
        description: 'Curated search links that can be shared with clients',
        hidden: true, // Hidden from nav - managed via MLS Search share button
    },
    access: {
        // Restricted: only the creator and admins can read via the Payload REST API.
        // The public /shared/[id] page bypasses this with overrideAccess: true.
        read: ({ req: { user } }) => {
            if (!user) return false
            if (isAdmin(user)) return true
            return { createdBy: { equals: user.id } }
        },
        // Only authenticated users can create shared links
        create: authenticated,
        // Users can update/delete their own links, admins can do all
        update: ({ req: { user } }) => {
            if (!user) return false
            if (isAdmin(user)) return true
            return { createdBy: { equals: user.id } }
        },
        delete: ({ req: { user } }) => {
            if (!user) return false
            if (isAdmin(user)) return true
            return { createdBy: { equals: user.id } }
        },
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                placeholder: 'e.g., Properties for John - Cagayan de Oro',
                description: 'A descriptive title for this shared link',
            },
        },
        {
            name: 'slug',
            type: 'text',
            unique: true,
            required: true,
            admin: {
                readOnly: true,
                description: 'Unique identifier for this shared link',
            },
        },
        {
            name: 'filters',
            type: 'json',
            required: true,
            admin: {
                description: 'Search filters stored as JSON',
            },
        },
        {
            name: 'createdBy',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            admin: {
                readOnly: true,
                position: 'sidebar',
            },
            hooks: {
                beforeChange: [
                    ({ req, value }) => {
                        if (!value && req.user) {
                            return req.user.id
                        }
                        return value
                    },
                ],
            },
        },
    ],
    hooks: {
        beforeChange: [
            async ({ data, operation }) => {
                // Generate a unique slug on create
                if (operation === 'create' && !data.slug) {
                    const randomPart = Math.random().toString(36).substring(2, 10)
                    const timestamp = Date.now().toString(36)
                    data.slug = `${timestamp}-${randomPart}`
                }
                return data
            },
        ],
    },
}
