# Migration Setup - Next Steps

## Current Situation

✅ Migrations are configured in `src/payload.config.ts`
✅ Migration scripts added to `package.json`
✅ Initial migration created: `src/migrations/20260121_193543.ts`
⚠️ Database already exists from running in dev mode with auto-sync

## Option 1: Keep Existing Data (Safe) ✅

Your initial migration matches the current database schema, so it's safe to proceed:

```bash
# Accept the prompt when asked
pnpm migrate
# Type: y [Enter]
```

This will:
- Mark the initial migration as applied
- Keep all your existing data
- Future migrations will work normally

## Option 2: Fresh Start (Data Loss)

If you want a completely clean slate:

```bash
# Drop and recreate database (⚠️ DELETES ALL DATA)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Apply migrations
pnpm migrate

# Start dev server
pnpm dev
```

## After Setup

Once migrations are applied, your workflow is:

### Making Schema Changes

1. **Edit collection config:**
   ```bash
   # Edit src/collections/Users.ts (or any collection)
   ```

2. **Create migration:**
   ```bash
   pnpm migrate:create
   ```

3. **Review generated migration:**
   ```bash
   # Check src/migrations/[timestamp].ts
   ```

4. **Apply migration:**
   ```bash
   pnpm migrate
   ```

5. **Update types:**
   ```bash
   pnpm generate:types
   ```

6. **Commit everything:**
   ```bash
   git add src/collections/ src/migrations/ src/payload-types.ts
   git commit -m "feat: add new field to Users"
   ```

## Available Commands

```bash
pnpm migrate:create         # Create new migration
pnpm migrate                # Apply pending migrations
pnpm migrate:status         # Check migration status
pnpm migrate:down           # Rollback last migration
pnpm migrate:refresh        # Reset & re-run all (⚠️ dev only)
```

## For Production

Add to your deployment process:

```bash
# In CI/CD or deployment script
pnpm migrate           # Apply pending migrations
pnpm build            # Build the app
pnpm start            # Start the server
```

Or update `package.json`:

```json
{
  "scripts": {
    "start": "pnpm migrate && cross-env NODE_OPTIONS=--no-deprecation next start"
  }
}
```

## Disabling Auto-Sync in Production

Recommended for production to ensure only migrations can change schema:

```typescript
// src/payload.config.ts
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URL || '',
  },
  migrationDir: path.resolve(dirname, 'migrations'),
  disableAutoMigrate: process.env.NODE_ENV === 'production',
}),
```

## Troubleshooting

### "No migrations to run"
✅ You're up to date!

### Migration failed
1. Check error message
2. Review migration file
3. Fix SQL and retry
4. If needed: `pnpm migrate:down` to rollback

### Still seeing auto-sync warnings
Make sure you've run `pnpm migrate` at least once to mark migrations as the source of truth.

## Learn More

- See `src/migrations/README.md` for detailed workflow
- Payload Migrations Docs: https://payloadcms.com/docs/database/migrations
