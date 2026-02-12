import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { type Config } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import {
  Provinces,
  Cities,
  Barangays,
  Developments,
  Estates,
  Townships,
} from './collections/locations'
import { Listings } from './collections/Listings'
import { Documents } from './collections/Documents'
import { Notifications } from './collections/Notifications'
import { ExternalShareLinks } from './collections/ExternalShareLinks'
import { SharedLinks } from './collections/SharedLinks'
import { PropertyCategories } from './collections/PropertyCategories'
import { PropertyTypes } from './collections/PropertyTypes'
import { PropertySubtypes } from './collections/PropertySubtypes'

import { s3Storage } from '@payloadcms/storage-s3'

// Uncomment when ready to use custom branding
// import { BrandLogo } from './components/BrandLogo'
// import { BrandIcon } from './components/BrandIcon'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const config: Config = {
  admin: {
    user: Users.slug,
    routes: {
      logout: '/',
    },
    components: {
      logout: {
        Button: '/components/LogoutButton#LogoutButton',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- TWR MLS',
    },

  },
  collections: [
    Users,
    Media,
    Provinces,
    Cities,
    Barangays,
    Developments,
    Estates,
    Townships,
    PropertyCategories,
    PropertyTypes,
    PropertySubtypes,
    Listings,
    Documents,
    Notifications,
    ExternalShareLinks,
    SharedLinks,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || '', 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean),
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || '', 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      max: 10,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: false, // Temporarily enabled to sync schema changes
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: {
          disableLocalStorage: !!process.env.S3_ACCESS_KEY_ID,
        },
      },
      enabled: !!process.env.S3_ACCESS_KEY_ID,
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT || '',
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        forcePathStyle: true,
      },
      // @ts-expect-error - generateFileURL might not be in the current plugin types but is valid in runtime
      generateFileURL: (args: { bucket: string; filename: string }) => {
        // Strict Supabase Public URL Generation
        // Endpoint in .env: https://[project-ref].storage.supabase.co/storage/v1/s3
        // Target URL: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[filename]

        const endpoint = process.env.S3_ENDPOINT || ''

        // Extract project ref from environment if available, otherwise extract from endpoint
        let projectRef = process.env.SUPABASE_PROJECT_ID

        if (!projectRef) {
          const matches = endpoint.match(/https:\/\/([^.]+)\.storage\.supabase\.co/)
          if (matches && matches[1]) {
            projectRef = matches[1]
          }
        }

        // Fallback to documented default if still not found
        projectRef = projectRef || 'mxjqvqqtjjvfcimfzoxs'

        // Use standard supabase.co domain for storage delivery
        return `https://${projectRef}.supabase.co/storage/v1/object/public/${args.bucket}/${args.filename}`
      },
    }),
  ],
}
