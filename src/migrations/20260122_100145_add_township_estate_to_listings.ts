import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
   BEGIN
     -- Drop index if exists
     IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'cities_name_idx') THEN
       DROP INDEX "cities_name_idx";
     END IF;

     -- Alter column if not already nullable
     ALTER TABLE "listings" ALTER COLUMN "created_by_id" DROP NOT NULL;

     -- Add columns if they don't exist
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'township_id') THEN
       ALTER TABLE "listings" ADD COLUMN "township_id" integer;
     END IF;

     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'estate_id') THEN
       ALTER TABLE "listings" ADD COLUMN "estate_id" integer;
     END IF;

     -- Add constraints if they don't exist
     IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'listings_township_id_townships_id_fk') THEN
       ALTER TABLE "listings" ADD CONSTRAINT "listings_township_id_townships_id_fk" FOREIGN KEY ("township_id") REFERENCES "public"."townships"("id") ON DELETE set null ON UPDATE no action;
     END IF;

     IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'listings_estate_id_estates_id_fk') THEN
       ALTER TABLE "listings" ADD CONSTRAINT "listings_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE set null ON UPDATE no action;
     END IF;

     -- Add indexes if they don't exist
     IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'listings_township_idx') THEN
       CREATE INDEX "listings_township_idx" ON "listings" USING btree ("township_id");
     END IF;

     IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'listings_estate_idx') THEN
       CREATE INDEX "listings_estate_idx" ON "listings" USING btree ("estate_id");
     END IF;

   END $$;
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "listings" DROP CONSTRAINT "listings_township_id_townships_id_fk";

  ALTER TABLE "listings" DROP CONSTRAINT "listings_estate_id_estates_id_fk";

  DROP INDEX "listings_township_idx";
  DROP INDEX "listings_estate_idx";
  ALTER TABLE "listings" ALTER COLUMN "created_by_id" SET NOT NULL;
  CREATE UNIQUE INDEX "cities_name_idx" ON "cities" USING btree ("name");
  ALTER TABLE "listings" DROP COLUMN "township_id";
  ALTER TABLE "listings" DROP COLUMN "estate_id";`)
}
