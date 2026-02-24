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

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine((v) => v.startsWith('postgresql://') || v.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a PostgreSQL connection string (postgresql:// or postgres://)',
    }),

  PAYLOAD_SECRET: z
    .string()
    .min(32, 'PAYLOAD_SECRET must be at least 32 characters for security'),

  S3_ENDPOINT: z.string().min(1, 'S3_ENDPOINT is required'),
  S3_REGION: z.string().min(1, 'S3_REGION is required'),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
  S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
  S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required'),
})

if (!isTest) {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((e) => `  • ${e.path.map(String).join('.')}: ${e.message}`)
      .join('\n')

    throw new Error(
      `\n\n❌ Invalid environment configuration — server cannot start:\n${errors}\n\nCheck your .env file against .env.example\n`,
    )
  }
}
