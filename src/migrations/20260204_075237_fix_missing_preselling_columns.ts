
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
    ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "min_lot_area" numeric;
    ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "min_floor_area" numeric;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
    ALTER TABLE "listings" DROP COLUMN IF EXISTS "min_lot_area";
    ALTER TABLE "listings" DROP COLUMN IF EXISTS "min_floor_area";
  `)
}
