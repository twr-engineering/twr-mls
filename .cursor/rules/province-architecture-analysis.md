# Province Architecture Analysis
## Adding Provinces to Resolve Duplicate City Names

**Author**: Senior Architecture Analysis
**Date**: 2026-02-01
**Status**: Recommendation

---

## 1. Problem Statement

### Current State
- **1656 cities** in database with 284 duplicate names
- Top duplicates:
  - San Isidro: 9 instances
  - San Miguel: 8 instances
  - Pilar, San Jose, Santa Maria: 7 instances each
  - 20+ cities with 4-6 duplicates

### Business Impact
- **User Confusion**: Cannot distinguish "Victoria, Tarlac" from "Victoria, Northern Samar"
- **Data Integrity**: 254 cities couldn't be updated with PSGC codes due to name collisions
- **UX Issues**: Dropdowns show ambiguous city names
- **Broken Workflows**: Barangay fetching fails for duplicate cities without proper PSGC codes

### Technical Debt
- Current location hierarchy: `City → Barangay → Development`
- Missing level: **Province** (standard Philippine administrative structure)
- Philippine hierarchy: `Region → Province → City/Municipality → Barangay`

---

## 2. Data Analysis

### PSGC API Structure

**Province Endpoint**: `https://psgc.cloud/api/v2/provinces`
```json
{
  "code": "1004300000",
  "name": "Misamis Oriental",
  "region": "Region X (Northern Mindanao)"
}
```
- 81 provinces total
- 10-digit codes ending in "00000"
- Includes region classification

**City Endpoint**: `https://psgc.cloud/api/v2/cities-municipalities/{code}`
```json
{
  "code": "1030500000",
  "name": "City of Cagayan De Oro",
  "province": "Misamis Oriental",
  "region": "Region X (Northern Mindanao)",
  "barangays_count": 80
}
```
- City detail includes **province name** (string)
- No direct province code reference

### Code Mapping Analysis
- Province codes: `1004300000` (Misamis Oriental)
- City codes: `1030500000` (Cagayan de Oro)
- **No simple substring relationship** between codes
- Must fetch province name from city detail endpoint

---

## 3. Architectural Options

### Option 1: Province as String Field (Simple)

**Implementation**:
```typescript
// Cities.ts
{
  name: 'province',
  type: 'text',
  admin: {
    description: 'Province name from PSGC API',
    readOnly: true,
  },
}
```

**Pros**:
- ✅ Quick implementation (1-2 hours)
- ✅ No new collection needed
- ✅ Minimal migration complexity
- ✅ Solves immediate display issue

**Cons**:
- ❌ No data normalization (duplicate province strings)
- ❌ Can't filter listings by province
- ❌ Can't enforce referential integrity
- ❌ Typo/inconsistency risk
- ❌ Doesn't follow existing location pattern
- ❌ Limited query capabilities

**Use Case**: Quick fix, low complexity projects

---

### Option 2: Provinces Collection with Relationship (Normalized)

**Implementation**:
```typescript
// Provinces.ts (NEW)
export const Provinces: CollectionConfig = {
  slug: 'provinces',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'psgcCode', type: 'text', unique: true },
    { name: 'region', type: 'text' },
  ],
}

// Cities.ts (MODIFIED)
{
  name: 'province',
  type: 'relationship',
  relationTo: 'provinces',
  required: true,
  admin: {
    position: 'sidebar',
  },
}
```

**Pros**:
- ✅ Normalized data model
- ✅ Follows existing pattern (matches Cities, Barangays structure)
- ✅ Enables province-level filtering
- ✅ Referential integrity
- ✅ Future-proof (can add region filtering later)
- ✅ Aligns with Philippine administrative structure
- ✅ Enables cascading filters: Province → City → Barangay → Development

**Cons**:
- ⚠️ More complex migration
- ⚠️ Additional collection to manage
- ⚠️ Requires seeding 81 provinces
- ⚠️ Need to update 1656 city records

**Use Case**: Production systems, scalable architecture

---

### Option 3: Composite Display Name (UI-Only)

**Implementation**:
```typescript
// Cities.ts
{
  name: 'displayName',
  type: 'text',
  admin: {
    readOnly: true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => `${data.name}, ${data.province}`,
    ],
  },
}
```

**Pros**:
- ✅ No database schema changes
- ✅ Solves UI display issue
- ✅ Backward compatible

**Cons**:
- ❌ Doesn't solve data integrity issue
- ❌ Still need province string somewhere
- ❌ Filtering remains difficult
- ❌ Doesn't address root cause

**Use Case**: Temporary workaround only

---

### Option 4: Hybrid Approach (String + Future Migration Path)

**Implementation**:
Add province string now, plan collection migration later.

**Pros**:
- ✅ Immediate fix
- ✅ Can migrate incrementally

**Cons**:
- ❌ Technical debt accumulation
- ❌ Two-phase implementation complexity
- ❌ Risk of "temporary" becoming permanent

**Use Case**: Resource-constrained teams

---

## 4. Recommended Solution: Option 2 (Provinces Collection)

### Justification

**Architectural Principles**:
1. **Consistency**: Matches existing location hierarchy pattern (Cities, Barangays, Developments)
2. **Scalability**: Supports future features (province-level analytics, region filtering)
3. **Data Integrity**: Enforces referential integrity via relationships
4. **PSGC Alignment**: Mirrors official Philippine geographic structure

**Business Value**:
- Resolves duplicate city ambiguity permanently
- Enables province-based search/filtering
- Improves user experience (clearer dropdowns)
- Future-proof for regional expansion

**Technical Benefits**:
- Normalized data (81 provinces vs 1656 duplicate strings)
- Type-safe relationships
- Easier testing (fixed province dataset)
- Better query performance (indexed relationships)

**Why Not Other Options**:
- **Option 1**: Creates technical debt, doesn't follow existing patterns
- **Option 3**: Doesn't solve root problem
- **Option 4**: Adds unnecessary complexity

---

## 5. Implementation Plan

### Phase 1: Create Provinces Collection (1-2 hours)

**File**: `src/collections/locations/Provinces.ts`
```typescript
import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly } from '@/access'

export const Provinces: CollectionConfig = {
  slug: 'provinces',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'region', 'psgcCode'],
    group: 'Location Master Data',
    description: 'Provinces are administrative divisions containing cities/municipalities',
  },
  access: {
    read: authenticated,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Province name from PSGC',
      },
    },
    {
      name: 'psgcCode',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: '10-digit PSGC province code',
        readOnly: true,
      },
    },
    {
      name: 'region',
      type: 'text',
      required: true,
      admin: {
        description: 'Administrative region (e.g., Region X)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
```

**Update**: `src/collections/locations/index.ts`
```typescript
export { Provinces } from './Provinces'
```

**Update**: `src/payload.config.base.ts`
```typescript
import { Provinces, Cities, Barangays, ... } from '@/collections/locations'

collections: [
  Provinces, // Add before Cities
  Cities,
  Barangays,
  // ...
]
```

### Phase 2: Add Province Relationship to Cities (30 min)

**Update**: `src/collections/locations/Cities.ts`
```typescript
fields: [
  {
    name: 'name',
    type: 'text',
    required: true,
  },
  {
    name: 'province',
    type: 'relationship',
    relationTo: 'provinces',
    required: true,
    admin: {
      position: 'sidebar',
      description: 'Province from PSGC API',
    },
  },
  {
    name: 'psgcCode',
    type: 'text',
    required: true,
    unique: true,
    admin: {
      readOnly: true,
    },
  },
  // ... rest of fields
]
```

### Phase 3: Database Migration (1 hour)

**Create**: `src/migrations/20260201_HHMMSS_add_provinces.ts`

**Steps**:
1. Create `provinces` table
2. Add `province_id` column to `cities` table
3. Fetch all provinces from PSGC API
4. Seed provinces
5. For each city with valid PSGC code:
   - Fetch city detail from PSGC API
   - Extract province name
   - Find matching province ID
   - Update city.province_id
6. Handle edge cases (cities without valid PSGC codes)

### Phase 4: Update PSGC Service (1 hour)

**Create**: `src/lib/psgc/province-service.ts`
```typescript
export async function fetchAndCacheProvinces(): Promise<void>
export async function getProvinceByName(name: string): Promise<Province | null>
```

**Update**: `scripts/update-psgc-codes.ts`
- Fetch province name from city detail endpoint
- Link city to province during update

### Phase 5: Update UI Components (2 hours)

**Update**: `src/components/BarangaySelect.tsx`
- Show city as "City Name (Province)"

**Update**: `src/components/listing-form.tsx`
- Add optional province filter above city dropdown
- Cascade: Province → City → Barangay → Development

**Update**: `src/components/search-filters.tsx`
- Add province dropdown
- Filter cities by selected province

**Update**: Display format everywhere:
```typescript
const displayName = city.province
  ? `${city.name} (${city.province.name})`
  : city.name
```

### Phase 6: Update Seeds (30 min)

**Update**: `src/seeds/20260122_161656_initial_seed.ts`
- Seed provinces before cities
- Link cities to provinces during seeding

---

## 6. Migration Strategy

### Data Migration Script

**File**: `scripts/backfill-provinces.ts`

```typescript
/**
 * Backfill provinces and link existing cities
 * Run AFTER migration creates tables
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@/payload.config'

async function backfillProvinces() {
  const payload = await getPayload({ config })

  // Step 1: Fetch and seed provinces
  console.log('📥 Fetching provinces from PSGC API...')
  const provincesResponse = await fetch('https://psgc.cloud/api/v2/provinces')
  const provincesData = await provincesResponse.json()
  const psgcProvinces = provincesData.data

  const provinceMap = new Map<string, number>()

  for (const prov of psgcProvinces) {
    const created = await payload.create({
      collection: 'provinces',
      data: {
        name: prov.name,
        psgcCode: prov.code,
        region: prov.region,
      },
      overrideAccess: true,
    })
    provinceMap.set(prov.name, created.id)
    console.log(`✓ Created province: ${prov.name}`)
  }

  // Step 2: Link cities to provinces
  console.log('\n🔗 Linking cities to provinces...')

  const { docs: cities } = await payload.find({
    collection: 'cities',
    limit: 10000,
    overrideAccess: true,
  })

  let linked = 0
  let skipped = 0

  for (const city of cities) {
    // Skip if no valid PSGC code
    if (!city.psgcCode || city.psgcCode.length !== 10) {
      console.warn(`⚠ Skipping ${city.name} - invalid PSGC code`)
      skipped++
      continue
    }

    try {
      // Fetch city detail to get province name
      const cityDetail = await fetch(
        `https://psgc.cloud/api/v2/cities-municipalities/${city.psgcCode}`
      )
      const cityData = await cityDetail.json()
      const provinceName = cityData.data?.province

      if (!provinceName) {
        console.warn(`⚠ No province for ${city.name}`)
        skipped++
        continue
      }

      const provinceId = provinceMap.get(provinceName)
      if (!provinceId) {
        console.warn(`⚠ Province not found: ${provinceName}`)
        skipped++
        continue
      }

      // Update city with province relationship
      await payload.update({
        collection: 'cities',
        id: city.id,
        data: { province: provinceId },
        overrideAccess: true,
      })

      console.log(`✓ Linked ${city.name} → ${provinceName}`)
      linked++

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`❌ Error linking ${city.name}:`, error)
      skipped++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`  ✅ Provinces created: ${provinceMap.size}`)
  console.log(`  ✅ Cities linked: ${linked}`)
  console.log(`  ⚠️ Cities skipped: ${skipped}`)
}

backfillProvinces().catch(console.error)
```

### Migration Execution Order

```bash
# 1. Create migration
pnpm migrate:create

# 2. Review generated migration
# Check: src/migrations/20260201_HHMMSS_add_provinces.ts

# 3. Apply migration (creates tables)
pnpm migrate

# 4. Backfill data
pnpm tsx scripts/backfill-provinces.ts

# 5. Generate types
pnpm generate:types

# 6. Validate
pnpm tsc --noEmit
```

---

## 7. UI/UX Considerations

### Display Format

**Before**:
```
City: [Victoria ▼]
```
Ambiguous! Which Victoria?

**After**:
```
Province: [All Provinces ▼]  (optional filter)
City: [Victoria (Tarlac) ▼]
      [Victoria (Northern Samar) ▼]
      [Victoria (Laguna) ▼]
```

### Dropdown Formats

**Option A: Inline Province**
```
Cagayan de Oro (Misamis Oriental)
Victoria (Tarlac)
```
✅ Clear, compact
❌ Long for small dropdowns

**Option B: Grouped by Province**
```
Misamis Oriental
  ├─ Cagayan de Oro
  └─ El Salvador
Tarlac
  ├─ Capas
  └─ Victoria
```
✅ Organized
❌ More complex component

**Recommendation**: Option A for simplicity

### Search Filter Flow

```
1. User selects Province (optional)
   ↓
2. City dropdown filters to show only cities in that province
   ↓
3. User selects City
   ↓
4. Barangay dropdown fetches barangays for that city
   ↓
5. User selects Barangay
   ↓
6. Development dropdown shows developments in that barangay
```

### Admin UI

**Payload Admin - Cities**:
- Province field: Sidebar, relationship dropdown
- Display: "Cagayan de Oro" (show province in subtitle)
- Read-only: Yes (derived from PSGC)

**Payload Admin - Provinces**:
- Auto-seeded from PSGC
- Admin-only access
- Show city count per province

---

## 8. Data Integrity

### Constraints

1. **Province Required on Cities**:
   ```typescript
   required: true
   ```
   All cities MUST have province

2. **Unique Province Names**:
   ```typescript
   unique: true
   ```
   No duplicate provinces

3. **PSGC Code Validation**:
   ```typescript
   validate: (val) => val?.length === 10
   ```
   Enforce 10-digit format

### Edge Cases

**Cities Without Province**:
- 254 cities with invalid PSGC codes
- Strategy: Manual mapping or exclude from active listings
- Flag with `isActive: false`

**Province Name Mismatches**:
- PSGC API returns: "Misamis Oriental"
- Database might have: "Mis. Oriental"
- Solution: Fuzzy matching during migration
- Fallback: Manual review

**NCR Special Case**:
- NCR cities don't have traditional provinces
- Solution: Create "Metro Manila" pseudo-province
- Or: Allow province to be null for NCR cities

---

## 9. Testing Strategy

### Unit Tests

```typescript
describe('Province Service', () => {
  it('should fetch provinces from PSGC API')
  it('should cache provinces in database')
  it('should find province by name')
})

describe('City-Province Relationship', () => {
  it('should require province when creating city')
  it('should display city with province name')
  it('should filter cities by province')
})
```

### Integration Tests

```typescript
describe('Migration', () => {
  it('should create provinces table')
  it('should add province_id to cities')
  it('should backfill all valid cities')
})

describe('API Endpoints', () => {
  it('GET /api/provinces should return all provinces')
  it('GET /api/cities?province=X should filter by province')
})
```

### Manual Testing Checklist

- [ ] Payload admin: Create listing with city selection
- [ ] Frontend: Search filters with province dropdown
- [ ] Verify: Duplicate cities show province qualifier
- [ ] Test: Barangay fetching still works
- [ ] Test: Development dropdown cascades correctly
- [ ] Edge case: Cities without province (should fail gracefully)

---

## 10. Rollback Plan

### If Migration Fails

```bash
# Revert migration
pnpm migrate:down

# Drop provinces table
psql $DATABASE_URL -c "DROP TABLE IF EXISTS provinces CASCADE;"

# Remove province_id column
psql $DATABASE_URL -c "ALTER TABLE cities DROP COLUMN IF EXISTS province_id;"
```

### If Backfill Fails

- Provinces table exists but cities aren't linked
- Safe state: Can re-run backfill script
- No data loss (cities remain unchanged)

### Feature Flag Approach

```typescript
// payload.config.ts
const ENABLE_PROVINCES = process.env.ENABLE_PROVINCES === 'true'

// Conditionally add province field
fields: [
  // ... other fields
  ...(ENABLE_PROVINCES ? [{
    name: 'province',
    type: 'relationship',
    relationTo: 'provinces',
  }] : []),
]
```

Toggle feature on/off without code changes.

---

## 11. Estimated Effort

| Phase | Task | Time |
|-------|------|------|
| 1 | Create Provinces collection | 1-2 hours |
| 2 | Add relationship to Cities | 30 min |
| 3 | Database migration | 1 hour |
| 4 | Backfill script | 1 hour |
| 5 | Update UI components | 2 hours |
| 6 | Update PSGC service | 1 hour |
| 7 | Testing | 2 hours |
| 8 | Documentation | 1 hour |

**Total**: ~10 hours (1.5 days)

**Dependencies**:
- PSGC API availability
- Database access
- No blocking production deployments

---

## 12. Success Metrics

**Before**:
- ❌ 284 duplicate city names
- ❌ 254 cities with invalid PSGC codes
- ❌ Ambiguous dropdowns
- ❌ Barangay fetching fails for duplicates

**After**:
- ✅ 81 provinces correctly mapped
- ✅ ~1400 cities linked to provinces
- ✅ Clear city display: "City (Province)"
- ✅ Province-level filtering enabled
- ✅ Duplicate cities differentiated
- ✅ Future-proof for regional features

---

## 13. Alternatives Considered and Rejected

### 1. Use City Code as Display Name
**Rejected**: User-unfriendly, doesn't solve root issue

### 2. Add Province to City Name
**Example**: "Victoria - Tarlac"
**Rejected**: Breaks existing data, search, slugs

### 3. Use Regions Instead of Provinces
**Rejected**: Too broad (17 regions vs 81 provinces), doesn't resolve duplicates

### 4. Manual Province Mapping (CSV Upload)
**Rejected**: Error-prone, doesn't leverage PSGC API

---

## 14. Recommendation Summary

**PROCEED WITH OPTION 2: Provinces Collection with Relationship**

**Rationale**:
- ✅ Aligns with Philippine administrative structure
- ✅ Follows existing Payload pattern
- ✅ Solves duplicate city problem permanently
- ✅ Enables future province-level features
- ✅ Maintains data integrity via relationships
- ✅ Reasonable effort (~10 hours)

**Next Steps**:
1. Get stakeholder approval
2. Create feature branch: `feature/add-provinces`
3. Implement phases 1-6
4. Test thoroughly (phase 7)
5. Deploy to staging
6. Production deployment with rollback plan

**Risk Level**: 🟡 Medium
- Database migration required
- External API dependency (PSGC)
- Data backfill needs validation
- Mitigated by: Rollback plan, feature flags, thorough testing

---

**Prepared by**: Senior Architecture Team
**Review**: Recommended for implementation
**Decision Required**: Product Owner approval
