import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "provinces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"psgc_code" varchar NOT NULL,
  	"region" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "cities" ADD COLUMN "province_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "provinces_id" integer;
  CREATE UNIQUE INDEX "provinces_name_idx" ON "provinces" USING btree ("name");
  CREATE UNIQUE INDEX "provinces_psgc_code_idx" ON "provinces" USING btree ("psgc_code");
  CREATE UNIQUE INDEX "provinces_slug_idx" ON "provinces" USING btree ("slug");
  CREATE INDEX "provinces_updated_at_idx" ON "provinces" USING btree ("updated_at");
  CREATE INDEX "provinces_created_at_idx" ON "provinces" USING btree ("created_at");
  ALTER TABLE "cities" ADD CONSTRAINT "cities_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_provinces_fk" FOREIGN KEY ("provinces_id") REFERENCES "public"."provinces"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cities_province_idx" ON "cities" USING btree ("province_id");
  CREATE INDEX "payload_locked_documents_rels_provinces_id_idx" ON "payload_locked_documents_rels" USING btree ("provinces_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "provinces" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "provinces" CASCADE;
  ALTER TABLE "cities" DROP CONSTRAINT "cities_province_id_provinces_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_provinces_fk";
  
  DROP INDEX "cities_province_idx";
  DROP INDEX "payload_locked_documents_rels_provinces_id_idx";
  ALTER TABLE "cities" DROP COLUMN "province_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "provinces_id";`)
}
