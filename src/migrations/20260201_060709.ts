import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add column as nullable first
  await db.execute(sql`
    ALTER TABLE "listings" ADD COLUMN "filter_province_id" integer;
  `)

  // Backfill existing listings with province from their city relationship
  await db.execute(sql`
    UPDATE "listings" l
    SET "filter_province_id" = c."province_id"
    FROM "cities" c
    WHERE l."city_id" = c."id" AND l."filter_province_id" IS NULL;
  `)

  // Now make it NOT NULL
  await db.execute(sql`
    ALTER TABLE "listings" ALTER COLUMN "filter_province_id" SET NOT NULL;
  `)

  // Add constraint and index
  await db.execute(sql`
    ALTER TABLE "listings" ADD CONSTRAINT "listings_filter_province_id_provinces_id_fk"
    FOREIGN KEY ("filter_province_id") REFERENCES "public"."provinces"("id")
    ON DELETE set null ON UPDATE no action;

    CREATE INDEX "listings_filter_province_idx" ON "listings" USING btree ("filter_province_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "listings" DROP CONSTRAINT "listings_filter_province_id_provinces_id_fk";
    DROP INDEX "listings_filter_province_idx";
    ALTER TABLE "listings" DROP COLUMN "filter_province_id";
  `)
}
