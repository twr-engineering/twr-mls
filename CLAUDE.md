# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Internal MLS & Listing Management System for a real estate brokerage built with Payload CMS 3.72 and Next.js 15. The system manages both resale and preselling property listings with role-based access control and a sophisticated location hierarchy.

**Tech Stack:**
- Payload CMS 3.72 (admin interface)
- Next.js 15 with React 19
- PostgreSQL (via Drizzle ORM)
- TypeScript
- Lexical rich text editor
- S3-compatible object storage
- pnpm package manager

## Development Commands

### Essential Commands
```bash
# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm devsafe               # Clean .next and start dev server

# Build & Production
pnpm build                 # Build for production
pnpm start                 # Start production server

# Type Generation & Validation
pnpm generate:types        # Generate TypeScript types from Payload schema
pnpm generate:importmap    # Generate component import map for admin UI
tsc --noEmit              # Validate TypeScript (no output)

# Linting
pnpm lint                  # Run ESLint

# Database Migrations
pnpm migrate:create        # Create new migration after schema changes
pnpm migrate              # Apply pending migrations
pnpm migrate:status       # Check migration status
pnpm migrate:down         # Rollback last migration
pnpm migrate:refresh      # Reset & re-run all (dev only, destructive)

# Seeding (Separate Config)
pnpm seed:create          # Create seed migration
pnpm seed:run            # Run seed migrations
pnpm seed:revert         # Revert seed migrations

# Testing
pnpm test                # Run all tests (integration + e2e)
pnpm test:int           # Run integration tests (Vitest)
pnpm test:e2e           # Run E2E tests (Playwright)
```

### Schema Change Workflow
```bash
# 1. Modify collection/field in src/collections/
# 2. Create migration
pnpm migrate:create
# 3. Review generated migration in src/migrations/
# 4. Apply migration
pnpm migrate
# 5. Generate types
pnpm generate:types
# 6. If you added/modified components
pnpm generate:importmap
```

## Architecture

### Core Business Logic

This system implements a **dual listing type architecture** with strict access control:

1. **Listing Types:**
   - `resale`: Individual properties created by agents
   - `preselling`: Centralized project models created by admins only

2. **Location Hierarchy (Critical):**
   - **Explicit:** City → Barangay → Development (optional) → Full Address
   - **Implicit/Derived:** Estate (from Development) and Township (from Barangay)
   - Changing parent resets children (enforced server-side)

3. **Property Classification (3-Tier):**
   - PropertyCategory → PropertyType → PropertySubtype
   - Hierarchical filtering enforced
   - Changing parent resets children

4. **Role-Based Access:**
   - `agent`: Create resale only, see own drafts + all published
   - `approver`: Full visibility, can approve/reject/publish
   - `admin`: Full system access, can create preselling listings

### Key Collections

**Primary Collections:**
- `Listings` - Single collection for both resale and preselling (differentiated by `listingType`)
- `Documents` - Uploaded files with visibility controls (private/internal)
- `Users` - Auth-enabled with role field (`agent`, `approver`, `admin`)
- `ExternalShareLinks` - Token-based public sharing
- `Notifications` - System notifications

**Location Master Data (Admin Only):**
- `Cities` - Top-level locations
- `Barangays` - Filtered by City
- `Developments` - Filtered by Barangay (explicit selection)
- `Estates` - Contains multiple Developments (derived membership)
- `Townships` - Covers multiple Barangays (derived membership)

**Property Classification (Admin Only):**
- `PropertyCategories` - Top level (e.g., Residential, Commercial)
- `PropertyTypes` - Filtered by Category (e.g., House & Lot, Condominium)
- `PropertySubtypes` - Filtered by Type (e.g., Townhouse, Studio)

### Directory Structure

```
src/
├── app/
│   ├── (frontend)/          # Public-facing routes
│   └── (payload)/           # Payload admin routes
├── collections/             # Collection definitions
│   ├── locations/           # City, Barangay, Development, Estate, Township
│   ├── Listings.ts          # Core listing collection
│   ├── Documents.ts
│   ├── Users.ts
│   ├── PropertyCategories.ts
│   ├── PropertyTypes.ts
│   └── PropertySubtypes.ts
├── access/                  # Access control functions
│   ├── index.ts
│   └── roles.ts             # Role helper functions
├── hooks/                   # Payload hooks
│   ├── listings/            # Listing-specific hooks
│   └── locations/           # Location hierarchy hooks
├── components/              # Custom React components (admin UI)
├── lib/                     # Shared utilities
├── validations/            # Zod schemas and validators
├── migrations/             # Database migrations
├── seeds/                  # Seed data
└── payload.config.base.ts  # Main Payload configuration
```

## Critical Security Patterns (MUST FOLLOW)

### 1. Local API Access Control
```typescript
// ❌ WRONG: Bypasses access control even with user
await payload.find({
  collection: 'posts',
  user: someUser,
})

// ✅ CORRECT: Enforces user permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false, // REQUIRED
})
```

### 2. Transaction Safety in Hooks
```typescript
// ❌ WRONG: Breaks transaction atomicity
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        // Missing req!
      })
    },
  ],
}

// ✅ CORRECT: Maintains transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req, // Required for atomicity
      })
    },
  ],
}
```

### 3. Prevent Infinite Hook Loops
```typescript
// ✅ Use context flags
hooks: {
  afterChange: [
    async ({ doc, req, context }) => {
      if (context.skipHooks) return

      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        context: { skipHooks: true },
        req,
      })
    },
  ],
}
```

## Business Rules Enforcement

### Listing Type Constraints
- Agents can ONLY create `listingType: 'resale'`
- Only admins can create `listingType: 'preselling'`
- Preselling listings MUST have `development` (required)
- Preselling listings MUST have `modelName`
- Resale listings use actual values (price, lotAreaSqm, floorAreaSqm)
- Preselling listings use indicative/minimum values

### Location Hierarchy Enforcement
- Changing `city` resets `barangay` and `development`
- Changing `barangay` resets `development`
- Estate membership: `listing.development ∈ estate.includedDevelopments`
- Township membership: `listing.barangay ∈ township.coveredBarangays`
- NEVER manually tag listings to Estates or Townships

### Property Classification Enforcement
- PropertyType must belong to selected PropertyCategory
- PropertySubtype must belong to selected PropertyType
- Changing category resets type and subtype
- Changing type resets subtype

### Visibility Rules
- Agents see:
  - Their own listings (all statuses)
  - ALL published listings (regardless of owner)
  - Property owner details ONLY on their own listings
- Documents have visibility: `private` (owner/approver/admin only) or `internal` (all agents)
- Only `published` listings appear in search and can be shared externally

## Code Style

### Type Definitions
- Always use `type` instead of `interface` (per user's global rules)
- Generate types after schema changes: `pnpm generate:types`
- Import from `@/payload-types` for generated types

### Access Control
- Use helper functions from `@/access/roles.ts`:
  - `isAdmin(user)`, `isApproverOrAdmin(user)`, `isAgent(user)`
  - `adminOnly`, `approverOrAdmin`, `authenticated`, `anyone`
- Field-level access only returns boolean (no query constraints)
- Collection-level access can return boolean or query constraints

### Component Paths
- Components defined using file paths relative to `src/`
- Named exports: use `#ExportName` suffix
- Generate import map after changes: `pnpm generate:importmap`

## Testing

### Test Databases
- **Development**: `twr-mls` (configured in `.env`)
- **Testing**: `twr-mls-test` (configured in `test.env`)
- Tests are **completely isolated** from dev/prod databases

### Test Setup (First Time)
```bash
# 1. Copy test environment template
cp test.env.example test.env

# 2. Edit test.env with your test database credentials

# 3. Create test database
PGPASSWORD="your_password" psql -h 127.0.0.1 -p 5432 -U postgres -c "CREATE DATABASE \"twr-mls-test\";"

# 4. Run migrations on test database
./scripts/setup-test-db.sh
```

### Running Tests
- Integration tests: `pnpm test:int` (Vitest)
- E2E tests: `pnpm test:e2e` (Playwright)
- All tests: `pnpm test`

### After Schema Changes
```bash
pnpm migrate:create          # Create migration
pnpm migrate                 # Apply to dev DB
./scripts/setup-test-db.sh   # Apply to test DB
```

**IMPORTANT**: `test.env` contains sensitive credentials and is in `.gitignore`. Never commit it to git.

## Important Context Files

Additional documentation in `.cursor/rules/`:
- `security-critical.mdc` - Critical security patterns
- `access-control.md` - Access control patterns
- `payload-overview.md` - Payload CMS fundamentals
- `collections.md`, `fields.md`, `hooks.md` - Detailed Payload patterns

Project requirements:
- `PROJECT-REQUIREMENTS_DOCUMENTS.md` - Complete business requirements
- `core-collection.md` - Listings schema and field matrix
- `visibility_rules.md` - Access and document visibility rules
- `AGENTS.md` - Payload development best practices (reference file)

## Development Workflow

1. Make schema changes in `src/collections/`
2. Create migration: `pnpm migrate:create`
3. Review generated migration in `src/migrations/`
4. Apply migration: `pnpm migrate`
5. Generate types: `pnpm generate:types`
6. If components modified: `pnpm generate:importmap`
7. Validate TypeScript: `tsc --noEmit`
8. Run tests: `pnpm test`
9. Commit migrations, types, and code together

## Database

- PostgreSQL with Drizzle ORM
- Migrations managed by Payload (never use auto-sync in production)
- Connection string in `DATABASE_URL` environment variable
- Migration directory: `src/migrations/`

## Storage

- S3-compatible object storage for media uploads
- Configured via environment variables:
  - `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`
  - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

## Common Pitfalls

1. Forgetting `overrideAccess: false` when passing `user` to Local API
2. Not passing `req` to nested operations in hooks (breaks transactions)
3. Creating hook loops without context flags
4. Editing locations without regenerating filters
5. Forgetting to run `pnpm generate:types` after schema changes
6. Not running `pnpm generate:importmap` after adding components
7. Allowing agents to create preselling listings (must enforce at access control level)
