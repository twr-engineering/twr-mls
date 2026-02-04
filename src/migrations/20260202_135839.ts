import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "listings_transaction_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_listings_transaction_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "property_types" DROP CONSTRAINT IF EXISTS "property_types_category_id_property_categories_id_fk";
  ALTER TABLE "listings" DROP CONSTRAINT IF EXISTS "listings_filter_province_id_provinces_id_fk";
  ALTER TABLE "listings" DROP CONSTRAINT IF EXISTS "listings_city_id_cities_id_fk";
  ALTER TABLE "listings" DROP CONSTRAINT IF EXISTS "listings_barangay_id_barangays_id_fk";
  
  DROP INDEX IF EXISTS "property_types_category_idx";
  DROP INDEX IF EXISTS "category_idx";
  DROP INDEX IF EXISTS "propertyType_idx";
  DROP INDEX IF EXISTS "listings_filter_province_idx";
  DROP INDEX IF EXISTS "listings_city_idx";
  DROP INDEX IF EXISTS "listings_barangay_idx";
  DROP INDEX IF EXISTS "transactionType_idx";
  DROP INDEX IF EXISTS "propertyType_1_idx";

  ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "min_floor_area_sqm" numeric;
  ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "min_lot_area_sqm" numeric;
  ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "indicative_turnover" varchar;
  
  ALTER TABLE "listings_transaction_type" DROP CONSTRAINT IF EXISTS "listings_transaction_type_parent_fk";
  ALTER TABLE "listings_transaction_type" ADD CONSTRAINT "listings_transaction_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
  
  CREATE INDEX IF NOT EXISTS "listings_transaction_type_order_idx" ON "listings_transaction_type" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "listings_transaction_type_parent_idx" ON "listings_transaction_type" USING btree ("parent_id");
  
  ALTER TABLE "property_types" DROP CONSTRAINT IF EXISTS "property_types_property_category_id_property_categories_id_fk";
  ALTER TABLE "property_types" ADD CONSTRAINT "property_types_property_category_id_property_categories_id_fk" FOREIGN KEY ("property_category_id") REFERENCES "public"."property_categories"("id") ON DELETE set null ON UPDATE no action;
  
  CREATE INDEX IF NOT EXISTS "property_types_property_category_idx" ON "property_types" USING btree ("property_category_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "property_types_slug_idx" ON "property_types" USING btree ("slug");
  CREATE UNIQUE INDEX IF NOT EXISTS "propertyCategory_name_idx" ON "property_types" USING btree ("property_category_id","name");
  CREATE UNIQUE INDEX IF NOT EXISTS "property_subtypes_slug_idx" ON "property_subtypes" USING btree ("slug");
  CREATE UNIQUE INDEX IF NOT EXISTS "propertyType_name_idx" ON "property_subtypes" USING btree ("property_type_id","name");
  CREATE INDEX IF NOT EXISTS "propertyType_idx" ON "listings" USING btree ("property_type_id");
  CREATE INDEX IF NOT EXISTS "city_idx" ON "listings" USING btree ("city");
  CREATE INDEX IF NOT EXISTS "barangay_idx" ON "listings" USING btree ("barangay");
  
  ALTER TABLE "listings" DROP COLUMN IF EXISTS "property_owner_name";
  ALTER TABLE "listings" DROP COLUMN IF EXISTS "property_owner_contact";
  ALTER TABLE "listings" DROP COLUMN IF EXISTS "property_owner_notes";
  ALTER TABLE "listings" DROP COLUMN IF EXISTS "transaction_type";
  ALTER TABLE "listings" DROP COLUMN IF EXISTS "filter_province_id";
  ALTER TABLE "listings" DROP COLUMN IF EXISTS "indicative_price";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "listings_transaction_type" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "listings_transaction_type" CASCADE;
  ALTER TABLE "property_types" RENAME COLUMN "property_category_id" TO "category_id";
  ALTER TABLE "property_types" DROP CONSTRAINT "property_types_property_category_id_property_categories_id_fk";
  
  DROP INDEX "property_types_property_category_idx";
  DROP INDEX "property_types_slug_idx";
  DROP INDEX "propertyCategory_name_idx";
  DROP INDEX "property_subtypes_slug_idx";
  DROP INDEX "propertyType_name_idx";
  DROP INDEX "propertyType_idx";
  DROP INDEX "city_idx";
  DROP INDEX "barangay_idx";
  ALTER TABLE "listings" ALTER COLUMN "price" DROP NOT NULL;
  ALTER TABLE "listings" ADD COLUMN "property_owner_name" varchar;
  ALTER TABLE "listings" ADD COLUMN "property_owner_contact" varchar;
  ALTER TABLE "listings" ADD COLUMN "property_owner_notes" varchar;
  ALTER TABLE "listings" ADD COLUMN "transaction_type" "enum_listings_transaction_type" NOT NULL;
  ALTER TABLE "listings" ADD COLUMN "filter_province_id" integer NOT NULL;
  ALTER TABLE "listings" ADD COLUMN "city_id" integer NOT NULL;
  ALTER TABLE "listings" ADD COLUMN "barangay_id" integer NOT NULL;
  ALTER TABLE "listings" ADD COLUMN "indicative_price" numeric;
  ALTER TABLE "property_types" ADD CONSTRAINT "property_types_category_id_property_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."property_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_filter_province_id_provinces_id_fk" FOREIGN KEY ("filter_province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "property_types_category_idx" ON "property_types" USING btree ("category_id");
  CREATE INDEX "category_idx" ON "property_types" USING btree ("category_id");
  CREATE INDEX "propertyType_idx" ON "property_subtypes" USING btree ("property_type_id");
  CREATE INDEX "listings_filter_province_idx" ON "listings" USING btree ("filter_province_id");
  CREATE INDEX "listings_city_idx" ON "listings" USING btree ("city_id");
  CREATE INDEX "listings_barangay_idx" ON "listings" USING btree ("barangay_id");
  CREATE INDEX "transactionType_idx" ON "listings" USING btree ("transaction_type");
  CREATE INDEX "propertyType_1_idx" ON "listings" USING btree ("property_type_id");
  CREATE INDEX "city_idx" ON "listings" USING btree ("city_id");
  CREATE INDEX "barangay_idx" ON "listings" USING btree ("barangay_id");
  ALTER TABLE "listings" DROP COLUMN "city";
  ALTER TABLE "listings" DROP COLUMN "barangay";
  ALTER TABLE "listings" DROP COLUMN "min_floor_area_sqm";
  ALTER TABLE "listings" DROP COLUMN "min_lot_area_sqm";
  ALTER TABLE "listings" DROP COLUMN "indicative_turnover";`)
}
