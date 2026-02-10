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
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- TWR MLS',
    },
    /*
    components: {
      graphics: {
        Logo: BrandLogo as any,
        Icon: BrandIcon as any,
      },
    },
    */
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
    }),
  ],
}
