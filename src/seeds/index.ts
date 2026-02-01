import * as migration_20260122_161656_initial_seed from './20260122_161656_initial_seed';
import * as migration_20260201_164952_property_classifications from './property-classifications.seed';

export const migrations = [
    {
        up: migration_20260122_161656_initial_seed.up,
        down: migration_20260122_161656_initial_seed.down,
        name: '20260122_161656_initial_seed',
    },
    {
        up: migration_20260201_164952_property_classifications.up,
        down: migration_20260201_164952_property_classifications.down,
        name: '20260201_164952_property_classifications',
    },
];
