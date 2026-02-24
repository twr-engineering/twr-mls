/**
 * Environment variable validation — runs at server startup.
 * Throws immediately if required variables are missing so misconfigured
 * deployments fail loudly at boot rather than silently at the first request.
 *
 * Skipped in test environments (VITEST=true) so the test suite can run
 * with minimal env configuration.
 */
import { z } from 'zod'

const isTest = process.env.VITEST === 'true'

const coreSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine((v) => v.startsWith('postgresql://') || v.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a PostgreSQL connection string (postgresql:// or postgres://)',
    }),

  PAYLOAD_SECRET: z
    .string()
    .min(32, 'PAYLOAD_SECRET must be at least 32 characters for security'),
})

// S3 vars are required together when S3_ACCESS_KEY_ID is present.
// Mirrors the plugin's own `enabled: !!process.env.S3_ACCESS_KEY_ID` logic —
// if you configure S3 at all, every var must be set.
const s3Schema = z.object({
  S3_ENDPOINT: z.string().min(1, 'S3_ENDPOINT is required when S3 is enabled'),
  S3_REGION: z.string().min(1, 'S3_REGION is required when S3 is enabled'),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required when S3 is enabled'),
  S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
  S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required when S3 is enabled'),
})

if (!isTest) {
  const errors: string[] = []

  const core = coreSchema.safeParse(process.env)
  if (!core.success) {
    core.error.issues.forEach((e) => errors.push(`  • ${e.path.map(String).join('.')}: ${e.message}`))
  }

  // Only validate S3 group when at least one S3 var is present
  const s3Enabled = !!process.env.S3_ACCESS_KEY_ID
  if (s3Enabled) {
    const s3 = s3Schema.safeParse(process.env)
    if (!s3.success) {
      s3.error.issues.forEach((e) => errors.push(`  • ${e.path.map(String).join('.')}: ${e.message}`))
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `\n\n❌ Invalid environment configuration — server cannot start:\n${errors.join('\n')}\n\nCheck your .env file against .env.example\n`,
    )
  }
}
