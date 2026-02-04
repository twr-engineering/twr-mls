import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "townships_rels" CASCADE;
  ALTER TABLE "townships" ADD COLUMN IF NOT EXISTS "city" varchar;
  ALTER TABLE "townships" ADD COLUMN IF NOT EXISTS "covered_barangays" jsonb;
  
  UPDATE "townships" SET "city" = '', "covered_barangays" = '[]'::jsonb WHERE "city" IS NULL OR "covered_barangays" IS NULL;
  
  ALTER TABLE "townships" ALTER COLUMN "city" SET NOT NULL;
  ALTER TABLE "townships" ALTER COLUMN "covered_barangays" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "townships_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"barangays_id" integer
  );
  
  ALTER TABLE "townships_rels" ADD CONSTRAINT "townships_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."townships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "townships_rels" ADD CONSTRAINT "townships_rels_barangays_fk" FOREIGN KEY ("barangays_id") REFERENCES "public"."barangays"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "townships_rels_order_idx" ON "townships_rels" USING btree ("order");
  CREATE INDEX "townships_rels_parent_idx" ON "townships_rels" USING btree ("parent_id");
  CREATE INDEX "townships_rels_path_idx" ON "townships_rels" USING btree ("path");
  CREATE INDEX "townships_rels_barangays_id_idx" ON "townships_rels" USING btree ("barangays_id");
  ALTER TABLE "townships" DROP COLUMN "city";
  ALTER TABLE "townships" DROP COLUMN "covered_barangays";`)
}
