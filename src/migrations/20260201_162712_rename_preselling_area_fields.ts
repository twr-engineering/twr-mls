import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE listings
    RENAME COLUMN min_lot_area TO min_lot_area_sqm;

    ALTER TABLE listings
    RENAME COLUMN min_floor_area TO min_floor_area_sqm;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE listings
    RENAME COLUMN min_lot_area_sqm TO min_lot_area;

    ALTER TABLE listings
    RENAME COLUMN min_floor_area_sqm TO min_floor_area;
  `)
}
