import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "developments" DROP CONSTRAINT IF EXISTS "developments_barangay_id_barangays_id_fk";
  
  DROP INDEX IF EXISTS "developments_barangay_idx";
  DROP INDEX IF EXISTS "barangay_name_idx";
  ALTER TABLE "developments" ADD COLUMN IF NOT EXISTS "city" varchar;
  ALTER TABLE "developments" ADD COLUMN IF NOT EXISTS "barangay" varchar;
  UPDATE "developments" SET "city" = '', "barangay" = '' WHERE "city" IS NULL OR "barangay" IS NULL;
  ALTER TABLE "developments" ALTER COLUMN "city" SET NOT NULL;
  ALTER TABLE "developments" ALTER COLUMN "barangay" SET NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS "barangay_name_idx" ON "developments" USING btree ("barangay","name");
  ALTER TABLE "developments" DROP COLUMN IF EXISTS "barangay_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "barangay_name_idx";
  ALTER TABLE "developments" ADD COLUMN "barangay_id" integer NOT NULL;
  ALTER TABLE "developments" ADD CONSTRAINT "developments_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "developments_barangay_idx" ON "developments" USING btree ("barangay_id");
  CREATE UNIQUE INDEX "barangay_name_idx" ON "developments" USING btree ("barangay_id","name");
  ALTER TABLE "developments" DROP COLUMN "city";
  ALTER TABLE "developments" DROP COLUMN "barangay";`)
}
