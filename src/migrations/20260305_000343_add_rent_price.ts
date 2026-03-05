import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "rent_price" numeric;
  CREATE INDEX IF NOT EXISTS "rentPrice_idx" ON "listings" USING btree ("rent_price");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "rentPrice_idx";
  ALTER TABLE "listings" DROP COLUMN IF EXISTS "rent_price";`)
}
