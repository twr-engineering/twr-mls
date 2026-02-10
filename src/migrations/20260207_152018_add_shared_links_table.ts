import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "shared_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"filters" jsonb NOT NULL,
  	"created_by_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "shared_links_id" integer;
  ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX IF NOT EXISTS "shared_links_slug_idx" ON "shared_links" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "shared_links_created_by_idx" ON "shared_links" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "shared_links_updated_at_idx" ON "shared_links" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "shared_links_created_at_idx" ON "shared_links" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shared_links_fk" FOREIGN KEY ("shared_links_id") REFERENCES "public"."shared_links"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_shared_links_id_idx" ON "payload_locked_documents_rels" USING btree ("shared_links_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "shared_links" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "shared_links" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_shared_links_fk";
  
  DROP INDEX "payload_locked_documents_rels_shared_links_id_idx";
  ALTER TABLE "developments" DROP COLUMN "province";
  ALTER TABLE "developments" DROP COLUMN "province_name";
  ALTER TABLE "townships" DROP COLUMN "province";
  ALTER TABLE "townships" DROP COLUMN "province_name";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "shared_links_id";`)
}
