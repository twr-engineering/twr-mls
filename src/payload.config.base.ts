import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { type Config } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Cities, Barangays, Developments, Estates, Townships } from './collections/locations'
import { Listings } from './collections/Listings'
import { Documents } from './collections/Documents'
import { Notifications } from './collections/Notifications'
import { ExternalShareLinks } from './collections/ExternalShareLinks'

import { s3Storage } from '@payloadcms/storage-s3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const config: Config = {
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['@/components/LogoutButton'],
    },
  },
  collections: [
    Users,
    Media,
    Cities,
    Barangays,
    Developments,
    Estates,
    Townships,
    Listings,
    Documents,
    Notifications,
    ExternalShareLinks,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: false,
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: true, // replace 'media' with your upload collection slug
      },
      bucket: process.env.S3_BUCKET!,
      config: {
        endpoint: process.env.S3_ENDPOINT!,
        region: process.env.S3_REGION!,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
      },
    }),
  ],
}
