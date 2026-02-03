import { buildConfig } from 'payload'
import { config } from './payload.config.base'
import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Test config: same as base config but with database creation disabled
export default buildConfig({
  ...config,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: false,
    disableCreateDatabase: true,
    // Don't try to create database in tests - it should already exist
  }),
})
