import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_id" integer;
   ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   CREATE INDEX IF NOT EXISTS "users_avatar_id_idx" ON "users" USING btree ("avatar_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "users" DROP CONSTRAINT "users_avatar_id_media_id_fk";
   DROP INDEX IF EXISTS "users_avatar_id_idx";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_id";`)
}
