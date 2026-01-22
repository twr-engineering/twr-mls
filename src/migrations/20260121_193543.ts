import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('agent', 'approver', 'admin');
  CREATE TYPE "public"."enum_listings_payment_terms" AS ENUM('cash', 'bank', 'pagibig', 'deferred');
  CREATE TYPE "public"."enum_listings_listing_type" AS ENUM('resale', 'preselling');
  CREATE TYPE "public"."enum_listings_status" AS ENUM('draft', 'submitted', 'needs_revision', 'published', 'rejected');
  CREATE TYPE "public"."enum_listings_transaction_type" AS ENUM('sale', 'rent');
  CREATE TYPE "public"."enum_listings_furnishing" AS ENUM('unfurnished', 'semi_furnished', 'fully_furnished');
  CREATE TYPE "public"."enum_listings_tenure" AS ENUM('freehold', 'leasehold');
  CREATE TYPE "public"."enum_listings_title_status" AS ENUM('clean', 'mortgaged');
  CREATE TYPE "public"."enum_documents_type" AS ENUM('title', 'tax_declaration', 'contract', 'floor_plan', 'site_plan', 'photo_id', 'proof_of_billing', 'other');
  CREATE TYPE "public"."enum_documents_visibility" AS ENUM('private', 'internal');
  CREATE TYPE "public"."enum_notifications_type" AS ENUM('listing_published', 'listing_needs_revision', 'listing_rejected', 'listing_submitted');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'agent' NOT NULL,
  	"first_name" varchar,
  	"last_name" varchar,
  	"phone" varchar,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"uploaded_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "cities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "barangays" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"city_id" integer NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "developments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"barangay_id" integer NOT NULL,
  	"primary_estate_id" integer,
  	"slug" varchar NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "estates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "estates_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"developments_id" integer
  );
  
  CREATE TABLE "townships" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "townships_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"barangays_id" integer
  );
  
  CREATE TABLE "listings_payment_terms" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_listings_payment_terms",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "listings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" jsonb,
  	"listing_type" "enum_listings_listing_type" DEFAULT 'resale' NOT NULL,
  	"created_by_id" integer NOT NULL,
  	"status" "enum_listings_status" DEFAULT 'draft' NOT NULL,
  	"transaction_type" "enum_listings_transaction_type" NOT NULL,
  	"price" numeric NOT NULL,
  	"price_per_sqm" numeric,
  	"floor_area_sqm" numeric,
  	"lot_area_sqm" numeric,
  	"bedrooms" numeric,
  	"bathrooms" numeric,
  	"parking_slots" numeric,
  	"furnishing" "enum_listings_furnishing",
  	"construction_year" numeric,
  	"tenure" "enum_listings_tenure",
  	"title_status" "enum_listings_title_status",
  	"city_id" integer NOT NULL,
  	"barangay_id" integer NOT NULL,
  	"development_id" integer,
  	"full_address" varchar NOT NULL,
  	"model_name" varchar,
  	"indicative_price_min" numeric,
  	"indicative_price_max" numeric,
  	"min_lot_area" numeric,
  	"min_floor_area" numeric,
  	"standard_inclusions" jsonb,
  	"preselling_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "listings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_documents_type" NOT NULL,
  	"file_id" integer NOT NULL,
  	"listing_id" integer NOT NULL,
  	"notes" varchar,
  	"visibility" "enum_documents_visibility" DEFAULT 'private' NOT NULL,
  	"uploaded_by_id" integer,
  	"uploaded_at" timestamp(3) with time zone,
  	"verified" boolean DEFAULT false,
  	"verified_by_id" integer,
  	"verified_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "notifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_notifications_type" NOT NULL,
  	"message" varchar NOT NULL,
  	"recipient_id" integer NOT NULL,
  	"listing_id" integer,
  	"read" boolean DEFAULT false,
  	"read_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "external_share_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token" varchar NOT NULL,
  	"listing_id" integer NOT NULL,
  	"created_by_id" integer NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"is_active" boolean DEFAULT true,
  	"view_count" numeric DEFAULT 0,
  	"last_viewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"cities_id" integer,
  	"barangays_id" integer,
  	"developments_id" integer,
  	"estates_id" integer,
  	"townships_id" integer,
  	"listings_id" integer,
  	"documents_id" integer,
  	"notifications_id" integer,
  	"external_share_links_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "barangays" ADD CONSTRAINT "barangays_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "developments" ADD CONSTRAINT "developments_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "developments" ADD CONSTRAINT "developments_primary_estate_id_estates_id_fk" FOREIGN KEY ("primary_estate_id") REFERENCES "public"."estates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "estates_rels" ADD CONSTRAINT "estates_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."estates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "estates_rels" ADD CONSTRAINT "estates_rels_developments_fk" FOREIGN KEY ("developments_id") REFERENCES "public"."developments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "townships_rels" ADD CONSTRAINT "townships_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."townships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "townships_rels" ADD CONSTRAINT "townships_rels_barangays_fk" FOREIGN KEY ("barangays_id") REFERENCES "public"."barangays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "listings_payment_terms" ADD CONSTRAINT "listings_payment_terms_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings_rels" ADD CONSTRAINT "listings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "listings_rels" ADD CONSTRAINT "listings_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "external_share_links" ADD CONSTRAINT "external_share_links_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "external_share_links" ADD CONSTRAINT "external_share_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cities_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_barangays_fk" FOREIGN KEY ("barangays_id") REFERENCES "public"."barangays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_developments_fk" FOREIGN KEY ("developments_id") REFERENCES "public"."developments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_estates_fk" FOREIGN KEY ("estates_id") REFERENCES "public"."estates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_townships_fk" FOREIGN KEY ("townships_id") REFERENCES "public"."townships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_listings_fk" FOREIGN KEY ("listings_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk" FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_external_share_links_fk" FOREIGN KEY ("external_share_links_id") REFERENCES "public"."external_share_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_uploaded_by_idx" ON "media" USING btree ("uploaded_by_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "cities_slug_idx" ON "cities" USING btree ("slug");
  CREATE INDEX "cities_updated_at_idx" ON "cities" USING btree ("updated_at");
  CREATE INDEX "cities_created_at_idx" ON "cities" USING btree ("created_at");
  CREATE INDEX "barangays_city_idx" ON "barangays" USING btree ("city_id");
  CREATE INDEX "barangays_updated_at_idx" ON "barangays" USING btree ("updated_at");
  CREATE INDEX "barangays_created_at_idx" ON "barangays" USING btree ("created_at");
  CREATE UNIQUE INDEX "city_name_idx" ON "barangays" USING btree ("city_id","name");
  CREATE INDEX "developments_barangay_idx" ON "developments" USING btree ("barangay_id");
  CREATE INDEX "developments_primary_estate_idx" ON "developments" USING btree ("primary_estate_id");
  CREATE INDEX "developments_updated_at_idx" ON "developments" USING btree ("updated_at");
  CREATE INDEX "developments_created_at_idx" ON "developments" USING btree ("created_at");
  CREATE UNIQUE INDEX "barangay_name_idx" ON "developments" USING btree ("barangay_id","name");
  CREATE UNIQUE INDEX "estates_name_idx" ON "estates" USING btree ("name");
  CREATE UNIQUE INDEX "estates_slug_idx" ON "estates" USING btree ("slug");
  CREATE INDEX "estates_updated_at_idx" ON "estates" USING btree ("updated_at");
  CREATE INDEX "estates_created_at_idx" ON "estates" USING btree ("created_at");
  CREATE INDEX "estates_rels_order_idx" ON "estates_rels" USING btree ("order");
  CREATE INDEX "estates_rels_parent_idx" ON "estates_rels" USING btree ("parent_id");
  CREATE INDEX "estates_rels_path_idx" ON "estates_rels" USING btree ("path");
  CREATE INDEX "estates_rels_developments_id_idx" ON "estates_rels" USING btree ("developments_id");
  CREATE UNIQUE INDEX "townships_name_idx" ON "townships" USING btree ("name");
  CREATE UNIQUE INDEX "townships_slug_idx" ON "townships" USING btree ("slug");
  CREATE INDEX "townships_updated_at_idx" ON "townships" USING btree ("updated_at");
  CREATE INDEX "townships_created_at_idx" ON "townships" USING btree ("created_at");
  CREATE INDEX "townships_rels_order_idx" ON "townships_rels" USING btree ("order");
  CREATE INDEX "townships_rels_parent_idx" ON "townships_rels" USING btree ("parent_id");
  CREATE INDEX "townships_rels_path_idx" ON "townships_rels" USING btree ("path");
  CREATE INDEX "townships_rels_barangays_id_idx" ON "townships_rels" USING btree ("barangays_id");
  CREATE INDEX "listings_payment_terms_order_idx" ON "listings_payment_terms" USING btree ("order");
  CREATE INDEX "listings_payment_terms_parent_idx" ON "listings_payment_terms" USING btree ("parent_id");
  CREATE INDEX "listings_created_by_idx" ON "listings" USING btree ("created_by_id");
  CREATE INDEX "listings_city_idx" ON "listings" USING btree ("city_id");
  CREATE INDEX "listings_barangay_idx" ON "listings" USING btree ("barangay_id");
  CREATE INDEX "listings_development_idx" ON "listings" USING btree ("development_id");
  CREATE INDEX "listings_updated_at_idx" ON "listings" USING btree ("updated_at");
  CREATE INDEX "listings_created_at_idx" ON "listings" USING btree ("created_at");
  CREATE INDEX "status_idx" ON "listings" USING btree ("status");
  CREATE INDEX "listingType_idx" ON "listings" USING btree ("listing_type");
  CREATE INDEX "transactionType_idx" ON "listings" USING btree ("transaction_type");
  CREATE INDEX "city_idx" ON "listings" USING btree ("city_id");
  CREATE INDEX "barangay_idx" ON "listings" USING btree ("barangay_id");
  CREATE INDEX "development_idx" ON "listings" USING btree ("development_id");
  CREATE INDEX "price_idx" ON "listings" USING btree ("price");
  CREATE INDEX "createdBy_idx" ON "listings" USING btree ("created_by_id");
  CREATE INDEX "status_listingType_idx" ON "listings" USING btree ("status","listing_type");
  CREATE INDEX "listings_rels_order_idx" ON "listings_rels" USING btree ("order");
  CREATE INDEX "listings_rels_parent_idx" ON "listings_rels" USING btree ("parent_id");
  CREATE INDEX "listings_rels_path_idx" ON "listings_rels" USING btree ("path");
  CREATE INDEX "listings_rels_media_id_idx" ON "listings_rels" USING btree ("media_id");
  CREATE INDEX "documents_file_idx" ON "documents" USING btree ("file_id");
  CREATE INDEX "documents_listing_idx" ON "documents" USING btree ("listing_id");
  CREATE INDEX "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by_id");
  CREATE INDEX "documents_verified_by_idx" ON "documents" USING btree ("verified_by_id");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE INDEX "listing_idx" ON "documents" USING btree ("listing_id");
  CREATE INDEX "type_idx" ON "documents" USING btree ("type");
  CREATE INDEX "visibility_idx" ON "documents" USING btree ("visibility");
  CREATE INDEX "verified_idx" ON "documents" USING btree ("verified");
  CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_id");
  CREATE INDEX "notifications_listing_idx" ON "notifications" USING btree ("listing_id");
  CREATE INDEX "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at");
  CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
  CREATE INDEX "recipient_idx" ON "notifications" USING btree ("recipient_id");
  CREATE INDEX "type_1_idx" ON "notifications" USING btree ("type");
  CREATE INDEX "read_idx" ON "notifications" USING btree ("read");
  CREATE INDEX "listing_1_idx" ON "notifications" USING btree ("listing_id");
  CREATE UNIQUE INDEX "external_share_links_token_idx" ON "external_share_links" USING btree ("token");
  CREATE INDEX "external_share_links_listing_idx" ON "external_share_links" USING btree ("listing_id");
  CREATE INDEX "external_share_links_created_by_idx" ON "external_share_links" USING btree ("created_by_id");
  CREATE INDEX "external_share_links_updated_at_idx" ON "external_share_links" USING btree ("updated_at");
  CREATE INDEX "external_share_links_created_at_idx" ON "external_share_links" USING btree ("created_at");
  CREATE UNIQUE INDEX "token_idx" ON "external_share_links" USING btree ("token");
  CREATE INDEX "listing_2_idx" ON "external_share_links" USING btree ("listing_id");
  CREATE INDEX "createdBy_1_idx" ON "external_share_links" USING btree ("created_by_id");
  CREATE INDEX "isActive_idx" ON "external_share_links" USING btree ("is_active");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_cities_id_idx" ON "payload_locked_documents_rels" USING btree ("cities_id");
  CREATE INDEX "payload_locked_documents_rels_barangays_id_idx" ON "payload_locked_documents_rels" USING btree ("barangays_id");
  CREATE INDEX "payload_locked_documents_rels_developments_id_idx" ON "payload_locked_documents_rels" USING btree ("developments_id");
  CREATE INDEX "payload_locked_documents_rels_estates_id_idx" ON "payload_locked_documents_rels" USING btree ("estates_id");
  CREATE INDEX "payload_locked_documents_rels_townships_id_idx" ON "payload_locked_documents_rels" USING btree ("townships_id");
  CREATE INDEX "payload_locked_documents_rels_listings_id_idx" ON "payload_locked_documents_rels" USING btree ("listings_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("notifications_id");
  CREATE INDEX "payload_locked_documents_rels_external_share_links_id_idx" ON "payload_locked_documents_rels" USING btree ("external_share_links_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "cities" CASCADE;
  DROP TABLE "barangays" CASCADE;
  DROP TABLE "developments" CASCADE;
  DROP TABLE "estates" CASCADE;
  DROP TABLE "estates_rels" CASCADE;
  DROP TABLE "townships" CASCADE;
  DROP TABLE "townships_rels" CASCADE;
  DROP TABLE "listings_payment_terms" CASCADE;
  DROP TABLE "listings" CASCADE;
  DROP TABLE "listings_rels" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "notifications" CASCADE;
  DROP TABLE "external_share_links" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_listings_payment_terms";
  DROP TYPE "public"."enum_listings_listing_type";
  DROP TYPE "public"."enum_listings_status";
  DROP TYPE "public"."enum_listings_transaction_type";
  DROP TYPE "public"."enum_listings_furnishing";
  DROP TYPE "public"."enum_listings_tenure";
  DROP TYPE "public"."enum_listings_title_status";
  DROP TYPE "public"."enum_documents_type";
  DROP TYPE "public"."enum_documents_visibility";
  DROP TYPE "public"."enum_notifications_type";`)
}
