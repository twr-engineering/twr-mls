import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "property_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "property_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"category_id" integer NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "property_subtypes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"property_type_id" integer NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "listings" ADD COLUMN "property_category_id" integer NOT NULL;
  ALTER TABLE "listings" ADD COLUMN "property_type_id" integer NOT NULL;
  ALTER TABLE "listings" ADD COLUMN "property_subtype_id" integer;
  ALTER TABLE "listings" ADD COLUMN "property_owner_name" varchar;
  ALTER TABLE "listings" ADD COLUMN "property_owner_contact" varchar;
  ALTER TABLE "listings" ADD COLUMN "property_owner_notes" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "property_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "property_types_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "property_subtypes_id" integer;
  ALTER TABLE "property_types" ADD CONSTRAINT "property_types_category_id_property_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."property_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "property_subtypes" ADD CONSTRAINT "property_subtypes_property_type_id_property_types_id_fk" FOREIGN KEY ("property_type_id") REFERENCES "public"."property_types"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "property_categories_name_idx" ON "property_categories" USING btree ("name");
  CREATE UNIQUE INDEX "property_categories_slug_idx" ON "property_categories" USING btree ("slug");
  CREATE INDEX "property_categories_updated_at_idx" ON "property_categories" USING btree ("updated_at");
  CREATE INDEX "property_categories_created_at_idx" ON "property_categories" USING btree ("created_at");
  CREATE INDEX "property_types_category_idx" ON "property_types" USING btree ("category_id");
  CREATE INDEX "property_types_updated_at_idx" ON "property_types" USING btree ("updated_at");
  CREATE INDEX "property_types_created_at_idx" ON "property_types" USING btree ("created_at");
  CREATE INDEX "category_idx" ON "property_types" USING btree ("category_id");
  CREATE INDEX "property_subtypes_property_type_idx" ON "property_subtypes" USING btree ("property_type_id");
  CREATE INDEX "property_subtypes_updated_at_idx" ON "property_subtypes" USING btree ("updated_at");
  CREATE INDEX "property_subtypes_created_at_idx" ON "property_subtypes" USING btree ("created_at");
  CREATE INDEX "propertyType_idx" ON "property_subtypes" USING btree ("property_type_id");
  ALTER TABLE "listings" ADD CONSTRAINT "listings_property_category_id_property_categories_id_fk" FOREIGN KEY ("property_category_id") REFERENCES "public"."property_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_property_type_id_property_types_id_fk" FOREIGN KEY ("property_type_id") REFERENCES "public"."property_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_property_subtype_id_property_subtypes_id_fk" FOREIGN KEY ("property_subtype_id") REFERENCES "public"."property_subtypes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_property_categories_fk" FOREIGN KEY ("property_categories_id") REFERENCES "public"."property_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_property_types_fk" FOREIGN KEY ("property_types_id") REFERENCES "public"."property_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_property_subtypes_fk" FOREIGN KEY ("property_subtypes_id") REFERENCES "public"."property_subtypes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "listings_property_category_idx" ON "listings" USING btree ("property_category_id");
  CREATE INDEX "listings_property_type_idx" ON "listings" USING btree ("property_type_id");
  CREATE INDEX "listings_property_subtype_idx" ON "listings" USING btree ("property_subtype_id");
  CREATE INDEX "propertyCategory_idx" ON "listings" USING btree ("property_category_id");
  CREATE INDEX "propertyType_1_idx" ON "listings" USING btree ("property_type_id");
  CREATE INDEX "payload_locked_documents_rels_property_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("property_categories_id");
  CREATE INDEX "payload_locked_documents_rels_property_types_id_idx" ON "payload_locked_documents_rels" USING btree ("property_types_id");
  CREATE INDEX "payload_locked_documents_rels_property_subtypes_id_idx" ON "payload_locked_documents_rels" USING btree ("property_subtypes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "property_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "property_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "property_subtypes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "property_categories" CASCADE;
  DROP TABLE "property_types" CASCADE;
  DROP TABLE "property_subtypes" CASCADE;
  ALTER TABLE "listings" DROP CONSTRAINT "listings_property_category_id_property_categories_id_fk";
  
  ALTER TABLE "listings" DROP CONSTRAINT "listings_property_type_id_property_types_id_fk";
  
  ALTER TABLE "listings" DROP CONSTRAINT "listings_property_subtype_id_property_subtypes_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_property_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_property_types_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_property_subtypes_fk";
  
  DROP INDEX "listings_property_category_idx";
  DROP INDEX "listings_property_type_idx";
  DROP INDEX "listings_property_subtype_idx";
  DROP INDEX "propertyCategory_idx";
  DROP INDEX "propertyType_1_idx";
  DROP INDEX "payload_locked_documents_rels_property_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_property_types_id_idx";
  DROP INDEX "payload_locked_documents_rels_property_subtypes_id_idx";
  ALTER TABLE "listings" DROP COLUMN "property_category_id";
  ALTER TABLE "listings" DROP COLUMN "property_type_id";
  ALTER TABLE "listings" DROP COLUMN "property_subtype_id";
  ALTER TABLE "listings" DROP COLUMN "property_owner_name";
  ALTER TABLE "listings" DROP COLUMN "property_owner_contact";
  ALTER TABLE "listings" DROP COLUMN "property_owner_notes";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "property_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "property_types_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "property_subtypes_id";`)
}
