import * as migration_20260121_193543 from './20260121_193543';
import * as migration_20260122_100145_add_township_estate_to_listings from './20260122_100145_add_township_estate_to_listings';
import * as migration_20260130_131952_addPropertyCategorization from './20260130_131952_addPropertyCategorization';
import * as migration_20260131_195249 from './20260131_195249';
import * as migration_20260201_045432 from './20260201_045432';
import * as migration_20260201_052118 from './20260201_052118';
import * as migration_20260201_060709 from './20260201_060709';
import * as migration_20260201_072914_add_indicative_price_field from './20260201_072914_add_indicative_price_field';
import * as migration_20260201_073938_make_price_field_conditional from './20260201_073938_make_price_field_conditional';
import * as migration_20260201_162712_rename_preselling_area_fields from './20260201_162712_rename_preselling_area_fields';
import * as migration_20260201_162841_add_indicative_turnover_field from './20260201_162841_add_indicative_turnover_field';

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
    name: '20260131_195249',
  },
  {
    up: migration_20260201_045432.up,
    down: migration_20260201_045432.down,
    name: '20260201_045432',
  },
  {
    up: migration_20260201_052118.up,
    down: migration_20260201_052118.down,
    name: '20260201_052118',
  },
  {
    up: migration_20260201_060709.up,
    down: migration_20260201_060709.down,
    name: '20260201_060709',
  },
  {
    up: migration_20260201_072914_add_indicative_price_field.up,
    down: migration_20260201_072914_add_indicative_price_field.down,
    name: '20260201_072914_add_indicative_price_field',
  },
  {
    up: migration_20260201_073938_make_price_field_conditional.up,
    down: migration_20260201_073938_make_price_field_conditional.down,
    name: '20260201_073938_make_price_field_conditional'
  },
  {
    up: migration_20260201_162712_rename_preselling_area_fields.up,
    down: migration_20260201_162712_rename_preselling_area_fields.down,
    name: '20260201_162712_rename_preselling_area_fields',
  },
  {
    up: migration_20260201_162841_add_indicative_turnover_field.up,
    down: migration_20260201_162841_add_indicative_turnover_field.down,
    name: '20260201_162841_add_indicative_turnover_field',
  },
];