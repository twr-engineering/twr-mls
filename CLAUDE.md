# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Internal MLS (Multiple Listing Service) & Real Estate Listing Management System built on Payload CMS 3.x. This is an internal tool for brokerage agents—no public marketplace.

**Tech Stack:** Payload CMS 3.72 + Next.js 15 + React 19 + TypeScript + PostgreSQL

## Commands

```bash
pnpm dev                 # Start dev server (http://localhost:3000)
pnpm build               # Production build
pnpm lint                # ESLint
pnpm generate:types      # Regenerate payload-types.ts after schema changes
pnpm generate:importmap  # Regenerate admin component imports after adding components
pnpm test                # Run all tests
pnpm test:int            # Integration tests only (Vitest)
pnpm test:e2e            # E2E tests only (Playwright)
tsc --noEmit             # Type-check without emitting
```

## Architecture

This is a **Payload CMS project**, not a traditional Next.js app. Payload owns the database schema, admin UI, and API layer.

```
src/
├── app/
│   ├── (frontend)/      # Public-facing pages (Server Components)
│   └── (payload)/       # Payload admin panel + REST/GraphQL API
├── collections/         # Collection configs (schema + hooks + access control)
├── globals/             # Global configs
├── components/          # Custom React components
├── hooks/               # Hook functions
├── access/              # Access control functions
├── payload.config.ts    # Main Payload configuration
└── payload-types.ts     # Auto-generated types (DO NOT EDIT)
```

**Path aliases:**
- `@/*` → `./src/*`
- `@payload-config` → `./src/payload.config.ts`

## Critical Patterns

### Always use `type` instead of `interface`

### Type Generation
After any collection schema changes, run:
```bash
pnpm generate:types
```

### Local API Access Control
When passing `user` to Local API, ALWAYS set `overrideAccess: false`:
```typescript
// ❌ WRONG: Access control bypassed
await payload.find({ collection: 'posts', user: someUser })

// ✅ CORRECT: Enforces user permissions
await payload.find({ collection: 'posts', user: someUser, overrideAccess: false })
```

### Transaction Safety in Hooks
Always pass `req` to nested operations in hooks for atomicity:
```typescript
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req, // Maintains atomicity
      })
    },
  ],
}
```

### Prevent Infinite Hook Loops
Use context flags when updating documents in their own hooks:
```typescript
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

## Code Style

- Single quotes, no semicolons, trailing commas
- 100 character line width
- TypeScript strict mode enabled

## Environment

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `PAYLOAD_SECRET` - Secret for Payload CMS

## References

- `.cursor/rules/` - Detailed Payload CMS guides (access control, hooks, collections, etc.)
- `AGENTS.md` - Comprehensive Payload CMS development guide
- `PROJECT-REQUIREMENTS_DOCUMENTS.md` - MLS system requirements and PRD
