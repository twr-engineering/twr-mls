import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS indicative_turnover text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE listings
    DROP COLUMN IF EXISTS indicative_turnover;
  `)
}
