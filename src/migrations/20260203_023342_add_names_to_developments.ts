import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "developments" ADD COLUMN "city_name" varchar;
  ALTER TABLE "developments" ADD COLUMN "barangay_name" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "developments" DROP COLUMN "city_name";
  ALTER TABLE "developments" DROP COLUMN "barangay_name";`)
}
