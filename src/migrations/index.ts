import * as migration_20260121_193543 from './20260121_193543';
import * as migration_20260122_100145_add_township_estate_to_listings from './20260122_100145_add_township_estate_to_listings';
import * as migration_20260130_131952_addPropertyCategorization from './20260130_131952_addPropertyCategorization';
import * as migration_20260131_195249 from './20260131_195249';

export const migrations = [
  {
    up: migration_20260121_193543.up,
    down: migration_20260121_193543.down,
    name: '20260121_193543',
  },
  {
    up: migration_20260122_100145_add_township_estate_to_listings.up,
    down: migration_20260122_100145_add_township_estate_to_listings.down,
    name: '20260122_100145_add_township_estate_to_listings',
  },
  {
    up: migration_20260130_131952_addPropertyCategorization.up,
    down: migration_20260130_131952_addPropertyCategorization.down,
    name: '20260130_131952_addPropertyCategorization',
  },
  {
    up: migration_20260131_195249.up,
    down: migration_20260131_195249.down,
    name: '20260131_195249'
  },
];
