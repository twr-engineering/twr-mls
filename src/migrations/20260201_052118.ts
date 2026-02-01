import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "_provinces_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar NOT NULL,
  	"version_psgc_code" varchar NOT NULL,
  	"version_region" varchar NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_is_active" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "_provinces_v" ADD CONSTRAINT "_provinces_v_parent_id_provinces_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_provinces_v_parent_idx" ON "_provinces_v" USING btree ("parent_id");
  CREATE INDEX "_provinces_v_version_version_name_idx" ON "_provinces_v" USING btree ("version_name");
  CREATE INDEX "_provinces_v_version_version_psgc_code_idx" ON "_provinces_v" USING btree ("version_psgc_code");
  CREATE INDEX "_provinces_v_version_version_slug_idx" ON "_provinces_v" USING btree ("version_slug");
  CREATE INDEX "_provinces_v_version_version_updated_at_idx" ON "_provinces_v" USING btree ("version_updated_at");
  CREATE INDEX "_provinces_v_version_version_created_at_idx" ON "_provinces_v" USING btree ("version_created_at");
  CREATE INDEX "_provinces_v_created_at_idx" ON "_provinces_v" USING btree ("created_at");
  CREATE INDEX "_provinces_v_updated_at_idx" ON "_provinces_v" USING btree ("updated_at");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "_provinces_v" CASCADE;`)
}
