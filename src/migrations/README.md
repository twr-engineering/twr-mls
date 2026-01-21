# Database Migrations

This directory contains database migration files for tracking and versioning schema changes.

## Commands

```bash
# Create a new migration (after changing collection schemas)
pnpm migrate:create

# Apply pending migrations
pnpm migrate

# Check migration status
pnpm migrate:status

# Rollback the last migration
pnpm migrate:down

# Reset and re-run all migrations (⚠️ DESTRUCTIVE - dev only)
pnpm migrate:refresh
```

## Workflow

### 1. Making Schema Changes

Edit your collection configs in `src/collections/`:

```typescript
// src/collections/Users.ts
export const Users: CollectionConfig = {
  slug: 'users',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phoneNumber', type: 'text' }, // NEW FIELD
  ],
}
```

### 2. Generate a Migration

```bash
pnpm migrate:create
```

This will:
- Compare your collection configs to the current database schema
- Generate a timestamped migration file (e.g., `20260122_120345.ts`)
- Create both `up()` and `down()` functions for the changes

### 3. Review the Migration

Open the generated file in `src/migrations/` and review the SQL:

```typescript
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "users" ADD COLUMN "phone_number" varchar;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "users" DROP COLUMN "phone_number";
  `)
}
```

### 4. Apply the Migration

```bash
pnpm migrate
```

### 5. Update TypeScript Types

```bash
pnpm generate:types
```

### 6. Commit Everything

Commit both the collection changes and migration files:

```bash
git add src/collections/ src/migrations/ src/payload-types.ts
git commit -m "Add phoneNumber field to Users collection"
```

## Production Deployment

Migrations run automatically during deployment by including in your start script:

```json
{
  "scripts": {
    "start": "pnpm migrate && pnpm payload"
  }
}
```

Or run explicitly before starting:

```bash
pnpm migrate
pnpm start
```

## Best Practices

1. **Always review generated migrations** - Ensure the SQL matches your intent
2. **Never edit applied migrations** - Create a new migration instead
3. **Test rollbacks locally** - Ensure `down()` functions work correctly
4. **Commit migrations with code changes** - Keep schema and code in sync
5. **Run migrations before deployment** - Avoid runtime schema mismatches

## Troubleshooting

### "No migrations to run"

You're up to date! This means your database schema matches your collection configs.

### "Migration failed"

1. Check the error message for SQL syntax issues
2. Review the generated migration file
3. Fix the issue and try again
4. If needed, rollback: `pnpm migrate:down`

### Custom Data Migrations

For complex data transformations, edit the generated migration:

```typescript
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // 1. Schema change
  await payload.db.drizzle.execute(sql`
    ALTER TABLE "users" ADD COLUMN "full_name" varchar;
  `)
  
  // 2. Data transformation
  const users = await payload.find({ collection: 'users', limit: 1000 })
  for (const user of users.docs) {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        fullName: `${user.firstName} ${user.lastName}`,
      },
    })
  }
}
```

## Migration File Structure

```
src/migrations/
├── 20260122_120345.ts        # Timestamped migration files
├── 20260122_143020.ts
├── 20260123_091530.ts
└── README.md                 # This file
```

## Disabling Auto-Sync (Recommended for Production)

Once you're using migrations, disable auto-sync in production:

```typescript
// src/payload.config.ts
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URL || '',
  },
  migrationDir: path.resolve(dirname, 'migrations'),
  // Add this in production environment
  disableAutoMigrate: process.env.NODE_ENV === 'production',
}),
```

This prevents Payload from automatically applying schema changes without migrations.
