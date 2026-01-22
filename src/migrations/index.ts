import * as migration_20260121_193543 from './20260121_193543';
import * as migration_20260122_100145_add_township_estate_to_listings from './20260122_100145_add_township_estate_to_listings';

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
];
