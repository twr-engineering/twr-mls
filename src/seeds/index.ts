import * as migration_20260122_161656_initial_seed from './20260122_161656_initial_seed';

export const migrations = [
    {
        up: migration_20260122_161656_initial_seed.up,
        down: migration_20260122_161656_initial_seed.down,
        name: '20260122_161656_initial_seed',
    },
];
