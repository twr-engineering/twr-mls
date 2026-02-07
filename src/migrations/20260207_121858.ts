import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "listings" ADD COLUMN "province" varchar;
  ALTER TABLE "listings" ADD COLUMN "province_name" varchar;
  CREATE INDEX "province_idx" ON "listings" USING btree ("province");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "province_idx";
  ALTER TABLE "listings" DROP COLUMN "province";
  ALTER TABLE "listings" DROP COLUMN "province_name";`)
}
