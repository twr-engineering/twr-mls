import * as migration_20260202_135839 from './20260202_135839';
import * as migration_20260203_012431_add_city_to_developments from './20260203_012431_add_city_to_developments';
import * as migration_20260203_020726_update_townships_schema from './20260203_020726_update_townships_schema';
import * as migration_20260203_022727_add_names_to_listings from './20260203_022727_add_names_to_listings';
import * as migration_20260203_023342_add_names_to_developments from './20260203_023342_add_names_to_developments';

export const migrations = [
  {
    up: migration_20260202_135839.up,
    down: migration_20260202_135839.down,
    name: '20260202_135839',
  },
  {
    up: migration_20260203_012431_add_city_to_developments.up,
    down: migration_20260203_012431_add_city_to_developments.down,
    name: '20260203_012431_add_city_to_developments',
  },
  {
    up: migration_20260203_020726_update_townships_schema.up,
    down: migration_20260203_020726_update_townships_schema.down,
    name: '20260203_020726_update_townships_schema',
  },
  {
    up: migration_20260203_022727_add_names_to_listings.up,
    down: migration_20260203_022727_add_names_to_listings.down,
    name: '20260203_022727_add_names_to_listings',
  },
  {
    up: migration_20260203_023342_add_names_to_developments.up,
    down: migration_20260203_023342_add_names_to_developments.down,
    name: '20260203_023342_add_names_to_developments'
  },
];
