# 🗄️ Database Schema Rules & Patterns

This document outlines **all the rules you must follow** when building database schemas in this Payload CMS project.

---

## 📋 Table of Contents

1. [Core Schema Principles](#core-schema-principles)
2. [Field Type Patterns](#field-type-patterns)
3. [Relationship Rules](#relationship-rules)
4. [Access Control Patterns](#access-control-patterns)
5. [Validation Rules](#validation-rules)
6. [Location Hierarchy Rules](#location-hierarchy-rules)
7. [Indexing & Performance](#indexing--performance)
8. [Migration Patterns](#migration-patterns)
9. [Common Patterns](#common-patterns)

---

## 🎯 Core Schema Principles

### Rule 1: Use TypeScript Types for Enums

**✅ CORRECT:**
```typescript
export const ListingStatuses = [
  'draft',
  'submitted',
  'needs_revision',
  'published',
  'rejected',
] as const
export type ListingStatus = (typeof ListingStatuses)[number]

// Use in field
{
  name: 'status',
  type: 'select',
  options: ListingStatuses.map(status => ({
    label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    value: status,
  })),
}
```

**❌ WRONG:**
```typescript
{
  name: 'status',
  type: 'select',
  options: ['draft', 'submitted', 'published'], // Hard-coded, no type safety
}
```

**Why?** Type safety, reusability, and consistency across the codebase.

---

### Rule 2: Always Define Access Control

**✅ CORRECT:**
```typescript
import { authenticated, adminOnly } from '@/access'

export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  access: {
    read: authenticated,    // ✅ Always define
    create: adminOnly,      // ✅ Always define
    update: adminOnly,        // ✅ Always define
    delete: adminOnly,       // ✅ Always define
  },
}
```

**❌ WRONG:**
```typescript
export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  // Missing access control - defaults to public!
}
```

**Why?** Security by default. Never leave access control undefined.

---

### Rule 3: Use Centralized Access Helpers

**✅ CORRECT:**
```typescript
import { adminOnly, authenticated, approverOrAdmin } from '@/access'

access: {
  read: authenticated,
  create: adminOnly,
  update: approverOrAdmin,
}
```

**❌ WRONG:**
```typescript
access: {
  read: ({ req: { user } }) => Boolean(user),  // Don't write custom logic
  create: ({ req: { user } }) => user?.role === 'admin',
}
```

**Why?** Consistency, maintainability, and easier testing.

---

### Rule 4: Admin Metadata

**✅ CORRECT:**
```typescript
export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  admin: {
    useAsTitle: 'name',                    // ✅ Required
    defaultColumns: ['name', 'status'],    // ✅ Define columns
    group: 'Master Data',                  // ✅ Group related collections
    description: 'Brief description',      // ✅ Help users understand
  },
}
```

**Why?** Better UX in admin panel, organized navigation.

---

## 📝 Field Type Patterns

### Text Fields

```typescript
{
  name: 'title',
  type: 'text',
  required: true,
  unique: true,              // ✅ If must be unique
  maxLength: 120,            // ✅ Set reasonable limits
  index: true,               // ✅ If used in queries/filters
  admin: {
    placeholder: 'Enter title...',
    description: 'Helpful description',
  },
}
```

### Number Fields

```typescript
{
  name: 'price',
  type: 'number',
  required: true,
  min: 0,                   // ✅ Prevent negative values
  admin: {
    description: 'Price in PHP',
  },
}
```

### Select Fields (Enums)

```typescript
// ✅ Define constants first
export const StatusOptions = ['active', 'inactive'] as const

{
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'active',   // ✅ Always set default
  options: StatusOptions.map(opt => ({
    label: opt.charAt(0).toUpperCase() + opt.slice(1),
    value: opt,
  })),
}
```

### Relationship Fields

```typescript
// Single relationship
{
  name: 'city',
  type: 'relationship',
  relationTo: 'cities',
  required: true,
  filterOptions: {          // ✅ Filter by active only
    isActive: { equals: true },
  },
}

// Multiple relationships
{
  name: 'categories',
  type: 'relationship',
  relationTo: 'categories',
  hasMany: true,
  filterOptions: {
    isActive: { equals: true },
  },
}
```

### Conditional Fields

```typescript
{
  name: 'pricePerSqm',
  type: 'number',
  required: false,
  admin: {
    condition: (data) => {
      // ✅ Show only for lot types
      const lotTypes = ['lot', 'house-and-lot']
      return lotTypes.includes(data?.propertyType)
    },
    description: 'Required for lot properties',
  },
  validate: (value, { data }) => {
    // ✅ Enforce conditional requirement
    const lotTypes = ['lot', 'house-and-lot']
    if (lotTypes.includes(data?.propertyType) && !value) {
      return 'Price per sqm is required for lot properties'
    }
    return true
  },
}
```

---

## 🔗 Relationship Rules

### Rule 5: Always Filter Active Records

**✅ CORRECT:**
```typescript
{
  name: 'barangay',
  type: 'relationship',
  relationTo: 'barangays',
  filterOptions: {
    isActive: { equals: true },  // ✅ Only show active records
  },
}
```

**Why?** Prevents users from selecting inactive/deleted records.

---

### Rule 6: Use filterOptions for Dynamic Filtering

**✅ CORRECT:**
```typescript
{
  name: 'barangay',
  type: 'relationship',
  relationTo: 'barangays',
  filterOptions: ({ data }) => {
    // ✅ Filter based on parent selection
    if (data?.city) {
      return {
        city: {
          equals: typeof data.city === 'string' ? data.city : data.city.id,
        },
        isActive: { equals: true },
      }
    }
    return { isActive: { equals: true } }
  },
}
```

**Why?** Enforces data integrity and improves UX.

---

### Rule 7: Reset Dependent Fields on Parent Change

**✅ CORRECT:**
```typescript
hooks: {
  beforeChange: [
    ({ data, operation, originalDoc, req }) => {
      // ✅ Reset barangay when city changes
      if (operation === 'update' && data.city && originalDoc?.city) {
        const cityId = typeof data.city === 'string' ? data.city : data.city.id
        const originalCityId = typeof originalDoc.city === 'string' 
          ? originalDoc.city 
          : originalDoc.city.id

        if (cityId !== originalCityId) {
          data.barangay = null
          data.development = null
        }
      }
      return data
    },
  ],
}
```

**Why?** Prevents invalid data combinations.

---

## 🔐 Access Control Patterns

### Rule 8: Field-Level Access Control

**✅ CORRECT:**
```typescript
import { adminOnlyField, approverOrAdminField } from '@/access'

{
  name: 'role',
  type: 'select',
  access: {
    update: adminOnlyField,  // ✅ Use helpers
  },
}
```

**Note:** Field access **only returns boolean** (no query constraints).

---

### Rule 9: Role-Based Field Access

**✅ CORRECT:**
```typescript
{
  name: 'listingType',
  type: 'select',
  access: {
    update: ({ req: { user } }) => {
      // ✅ Agents cannot modify listingType
      if (user?.role === 'admin') return true
      return false
    },
  },
}
```

---

## ✅ Validation Rules

### Rule 10: Always Validate Required Fields

**✅ CORRECT:**
```typescript
{
  name: 'email',
  type: 'email',
  required: true,
  validate: (value) => {
    if (!value) return 'Email is required'
    if (!value.includes('@')) return 'Invalid email format'
    return true
  },
}
```

---

### Rule 11: Conditional Validation

**✅ CORRECT:**
```typescript
{
  name: 'pricePerSqm',
  type: 'number',
  validate: (value, { data }) => {
    // ✅ Required only for lot types
    const lotTypes = ['lot', 'house-and-lot']
    if (lotTypes.includes(data?.propertyType)) {
      if (!value) return 'Price per sqm is required for lot properties'
      if (value <= 0) return 'Price per sqm must be greater than 0'
    }
    return true
  },
}
```

---

## 🗺️ Location Hierarchy Rules

### Rule 12: Location Collections Structure

**✅ CORRECT:**
```typescript
// File: src/collections/locations/Cities.ts
export const Cities: CollectionConfig = {
  slug: 'cities',
  // ...
}

// File: src/collections/locations/Barangays.ts
export const Barangays: CollectionConfig = {
  slug: 'barangays',
  fields: [
    {
      name: 'city',
      type: 'relationship',
      relationTo: 'cities',  // ✅ Links to Cities
      required: true,
    },
  ],
}

// File: src/collections/locations/Developments.ts
export const Developments: CollectionConfig = {
  slug: 'developments',
  fields: [
    {
      name: 'barangay',
      type: 'relationship',
      relationTo: 'barangays',  // ✅ Links to Barangays
      required: true,
    },
  ],
}
```

**Hierarchy:**
```
City → Barangay → Development
```

---

### Rule 13: Never Manually Tag to Estates/Townships

**✅ CORRECT:**
```typescript
// Listings collection
{
  name: 'development',
  type: 'relationship',
  relationTo: 'developments',
  // ✅ NO estate field - inferred via development
  // ✅ NO township field - inferred via barangay
}
```

**Why?** Estates and Townships are **inferred**:
- **Estate**: `listing.development ∈ estate.includedDevelopments`
- **Township**: `listing.barangay ∈ township.coveredBarangays`

---

### Rule 14: Enforce Location Hierarchy in Hooks

**✅ CORRECT:**
```typescript
hooks: {
  beforeValidate: [
    async ({ data, req }) => {
      // ✅ Validate barangay belongs to city
      if (data.barangay && data.city) {
        const barangay = await req.payload.findByID({
          collection: 'barangays',
          id: typeof data.barangay === 'string' ? data.barangay : data.barangay.id,
          req,
        })
        
        const cityId = typeof data.city === 'string' ? data.city : data.city.id
        if (barangay.city !== cityId) {
          throw new Error('Barangay must belong to selected city')
        }
      }
      return data
    },
  ],
}
```

---

## 📊 Indexing & Performance

### Rule 15: Index Frequently Queried Fields

**✅ CORRECT:**
```typescript
{
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,  // ✅ Index for fast lookups
}

// Composite index for uniqueness
indexes: [
  {
    fields: ['name', 'barangay'],
    unique: true,  // ✅ Unique combination
  },
]
```

---

### Rule 16: Index Relationship Fields Used in Filters

**✅ CORRECT:**
```typescript
{
  name: 'city',
  type: 'relationship',
  relationTo: 'cities',
  index: true,  // ✅ If used in where clauses
}
```

---

## 🔄 Migration Patterns

### Rule 17: Use Migrations, Not Auto-Sync

**✅ CORRECT:**
```typescript
// payload.config.ts
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URL || '',
  },
  migrationDir: path.resolve(dirname, 'migrations'),
  push: false,  // ✅ Use migrations, not auto-sync
}),
```

**Workflow:**
1. Edit collection config
2. Run `pnpm migrate:create`
3. Review generated migration
4. Run `pnpm migrate`
5. Run `pnpm generate:types`

---

## 🎨 Common Patterns

### Pattern 1: Soft Delete (isActive Flag)

```typescript
{
  name: 'isActive',
  type: 'checkbox',
  required: true,
  defaultValue: true,
  admin: {
    position: 'sidebar',
    description: 'Inactive records are hidden but preserved',
  },
}

// Always filter in relationships
filterOptions: {
  isActive: { equals: true },
}
```

---

### Pattern 2: Timestamps

```typescript
// Payload automatically adds:
// - createdAt
// - updatedAt

// Custom timestamps
{
  name: 'submittedAt',
  type: 'date',
  admin: {
    readOnly: true,
    description: 'Automatically set when status changes to submitted',
  },
  hooks: {
    beforeChange: [
      ({ data, operation, previousDoc }) => {
        if (operation === 'update' && data.status === 'submitted' && previousDoc?.status !== 'submitted') {
          return new Date()
        }
        return data.submittedAt
      },
    ],
  },
}
```

---

### Pattern 3: Slug Generation

```typescript
{
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (!value && data?.name) {
          return data.name
            .toLowerCase()
            .trim()
            .replace(/['"]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/(^-|-$)/g, '')
        }
        return value
      },
    ],
  },
}
```

---

### Pattern 4: Status Workflow

```typescript
// Define statuses as const
export const Statuses = ['draft', 'submitted', 'published'] as const

// Field definition
{
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  options: Statuses.map(s => ({ label: s, value: s })),
  hooks: {
    beforeChange: [
      validateStatusTransition,  // ✅ Use hook to validate transitions
    ],
    afterChange: [
      notifyStatusChange,  // ✅ Notify on status change
    ],
  },
}
```

---

## 🚨 Critical Don'ts

### ❌ Don't Use Auto-Sync in Production

```typescript
// ❌ WRONG
db: postgresAdapter({
  push: true,  // Never in production!
})
```

### ❌ Don't Skip Access Control

```typescript
// ❌ WRONG
export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  // Missing access - defaults to public!
}
```

### ❌ Don't Hard-code Enum Values

```typescript
// ❌ WRONG
{
  name: 'status',
  type: 'select',
  options: ['draft', 'published'],  // No type safety
}
```

### ❌ Don't Create Manual Estate/Township Fields

```typescript
// ❌ WRONG
{
  name: 'estate',
  type: 'relationship',
  relationTo: 'estates',  // Should be inferred!
}
```

### ❌ Don't Skip Validation

```typescript
// ❌ WRONG
{
  name: 'price',
  type: 'number',
  // No validation - allows negative values!
}
```

---

## 📚 Reference Files

- **Field Schema**: `core-collection.md` - Detailed field specifications
- **Project Requirements**: `PROJECT-REQUIREMENTS_DOCUMENTS.md` - Business rules
- **Field Patterns**: `.cursor/rules/fields.md` - Field type examples
- **Access Control**: `.cursor/rules/access-control.md` - Access patterns
- **Collections**: `.cursor/rules/collections.md` - Collection patterns

---

## ✅ Checklist for New Collections

When creating a new collection, ensure:

- [ ] TypeScript types defined for enums
- [ ] Access control defined (read, create, update, delete)
- [ ] Admin metadata (useAsTitle, defaultColumns, group, description)
- [ ] Required fields marked
- [ ] Validation added where needed
- [ ] Indexes added for frequently queried fields
- [ ] isActive flag if soft delete needed
- [ ] filterOptions for relationships (isActive: true)
- [ ] Hooks for data integrity (if needed)
- [ ] Migration created (not auto-sync)
- [ ] Types regenerated (`pnpm generate:types`)

---

## 🎯 Summary

1. **Always use TypeScript types** for enums
2. **Always define access control** (use helpers from `@/access`)
3. **Always validate** required and conditional fields
4. **Always filter** active records in relationships
5. **Always use migrations** (not auto-sync)
6. **Never manually tag** to Estates/Townships
7. **Always index** frequently queried fields
8. **Always reset** dependent fields on parent change

Follow these rules, and your schemas will be secure, maintainable, and consistent! 🚀
