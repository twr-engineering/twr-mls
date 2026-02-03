# Integration Tests

This project uses **separate databases** for development and testing to ensure your data is never affected by tests.

## Database Setup

### Development Database
- **Name**: `twr-mls`
- **Config**: `.env` file
- **Usage**: Normal development work (`pnpm dev`)

### Test Database
- **Name**: `twr-mls-test`
- **Config**: `test.env` file
- **Usage**: Integration tests (`pnpm test:int`)

## Initial Test Database Setup

### 1. Create Test Environment File

First time setup - copy the example file and fill in your credentials:

```bash
cp test.env.example test.env
```

Then edit `test.env` with your local test database credentials:
```env
DATABASE_URL=postgres://postgres:password@127.0.0.1:5432/twr-mls-test
PAYLOAD_SECRET=your_secret_here
# ... other credentials
```

**IMPORTANT**: `test.env` is in `.gitignore` and should NEVER be committed to git.

### 2. Create Test Database

```bash
# Create the test database (one time)
PGPASSWORD="your_password" psql -h 127.0.0.1 -p 5432 -U postgres -c "CREATE DATABASE \"twr-mls-test\";"
```

### 3. Run Migrations

Initialize the test database schema:

```bash
./scripts/setup-test-db.sh
```

This script will:
1. Load credentials from `test.env`
2. Run all migrations on the test database
3. Prepare the schema for testing

## Running Tests

```bash
# Run all integration tests
pnpm test:int

# Run all tests (integration + e2e)
pnpm test

# Run specific test file
pnpm test:int tests/int/api.int.spec.ts
```

## How It Works

1. **Environment Isolation**
   - `vitest.setup.ts` loads `test.env` (NOT `.env`)
   - Ensures `DATABASE_URL` points to `twr-mls-test`
   - Safety check: tests will fail if not using test database

2. **Payload Configuration**
   - Tests use `@/payload.config.test` instead of `@/payload.config`
   - Test config sets `createDatabase: false` (database must exist)

3. **Test Helpers**
   - `tests/helpers/test-db.ts` provides `getTestPayload()`
   - Singleton pattern ensures one Payload instance per test run
   - Safety check prevents accidentally using production database

## After Schema Changes

When you modify collections or fields:

```bash
# 1. Create migration
pnpm migrate:create

# 2. Apply to dev database
pnpm migrate

# 3. Apply to test database
./scripts/setup-test-db.sh

# 4. Generate types
pnpm generate:types
```

## Test Database Cleanup

The test database will accumulate data over time. To reset it:

```bash
# Drop and recreate test database
PGPASSWORD="twrmls@2026" psql -h 127.0.0.1 -p 5432 -U postgres -c "DROP DATABASE IF EXISTS \"twr-mls-test\";"
PGPASSWORD="twrmls@2026" psql -h 127.0.0.1 -p 5432 -U postgres -c "CREATE DATABASE \"twr-mls-test\";"

# Run migrations
./scripts/setup-test-db.sh
```

## Safety Features

✅ **Cannot accidentally use dev/prod database**
- Test helper checks database name before connecting
- Will throw error if not using `twr-mls-test`

✅ **Separate credentials**
- `test.env` completely isolated from `.env`
- No risk of overwriting production data

✅ **Automatic verification**
- Test setup logs which database it's using
- Console output shows: `[TEST ENV] Using database: 2026`

## Writing Tests

Use the test helper to get a Payload instance:

```typescript
import { Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'
import { getTestPayload } from '../helpers/test-db'

let payload: Payload

describe('My Test Suite', () => {
  beforeAll(async () => {
    // Automatically uses test database from test.env
    payload = await getTestPayload()
  })

  it('should do something', async () => {
    const result = await payload.find({
      collection: 'users',
    })
    expect(result).toBeDefined()
  })
})
```

## Troubleshooting

### Tests fail with "relation does not exist"
The test database needs migrations:
```bash
./scripts/setup-test-db.sh
```

### Tests fail with "CRITICAL: Tests are not using test database"
Check that `test.env` is configured correctly and contains:
```
DATABASE_URL=postgres://postgres:twrmls@2026@127.0.0.1:5432/twr-mls-test
```

### Tests are slow
Tests share a single Payload instance per file. If tests are creating lots of data, consider:
1. Cleaning up test data in afterEach hooks
2. Using test-specific data that doesn't conflict
