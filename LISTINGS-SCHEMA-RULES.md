# 🧱 LISTINGS & MASTER DATA SCHEMA

**(FINAL CONSOLIDATED • AUTHORITATIVE)**

---

# 1️⃣ CORE COLLECTION: `Listings`

> Single collection.
> 
> 
> Resale and Preselling are differentiated **only** by `listingType`.
> 

---

## A. Governance & Identity (ALL Listings)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `listingType` | select | ✅ | `resale`, `preselling` |
| `status` | select | ✅ | draft / submitted / needs_revision / published / rejected |
| `createdBy` | relationship → Users | ✅ | Agent or Admin |

### Rules

- Agents: `listingType = resale` (locked)
- Admin: may select `resale` or `preselling`
- `both` is **search-only**, never stored

---

## B. Core Presentation Fields (ALL Listings)

| Field | Type | Required | Semantics |
| --- | --- | --- | --- |
| `title` | text | ✅ | Marketing-facing title |
| `description` | richText | ❌ | Context, positioning |

**Preselling clarification**

- `modelName` = canonical identifier
- `title` = marketing-facing
- `description` = narrative / explanation

---

## C. Property Classification (CRITICAL – ALL Listings)

| Field | Type | Required |
| --- | --- | --- |
| `propertyCategory` | relationship → PropertyCategories | ✅ |
| `propertyType` | relationship → PropertyTypes | ✅ |
| `propertySubtype` | relationship → PropertySubtypes | ❌ |

### Hierarchy Enforcement (MANDATORY)

1. PropertyType ∈ PropertyCategory
2. PropertySubtype ∈ PropertyType
3. Changing Category resets Type & Subtype
4. Changing Type resets Subtype
5. Backend must reject invalid combinations

---

## D. Transaction & Payment (ALL Listings)

### Transaction Type

| Field | Type | Required |
| --- | --- | --- |
| `transactionType` | select | ✅ |

Values: `sale`, `rent`

`both` exists **only in search filters**

---

### Payment Terms

| Field | Type | Required | Semantics |
| --- | --- | --- | --- |
| `paymentTerms` | select (multi) | ❌ | Accepted (resale) / Supported (preselling) |

Options:

- cash
- bank
- pagibig
- deferred

---

## E. Address & Location (ALL Listings)

| Field | Type | Required | Semantics |
| --- | --- | --- | --- |
| `city` | relationship → Cities | ✅ | Official |
| `barangay` | relationship → Barangays | ✅ | Filtered by City |
| `development` | relationship → Developments | ❌ / ✅ | Required for Preselling |
| `fullAddress` | text | ✅ | Exact (resale) / Approximate (preselling) |

### Enforcement Rules (NON-NEGOTIABLE)

- City → filters Barangay
- Barangay → filters Development
- Changing City resets Barangay & Development
- Changing Barangay resets Development
- Invalid combinations rejected server-side

---

# 2️⃣ RESALE LISTING FIELDS

*(Applied when `listingType = resale`)*

## A. Pricing (ACTUAL)

| Field | Type | Required |
| --- | --- | --- |
| `price` | number | ✅ |
| `pricePerSqm` | number (computed) | ❌ |

### Rules

- Applies only to **Lot** property types
- Computation: `price / lotAreaSqm`
- Read-only
- Save blocked if lot resale lacks `lotAreaSqm`

---

## B. Area & Specs (ACTUAL)

| Field | Type | Required |
| --- | --- | --- |
| `floorAreaSqm` | number | ❌ |
| `lotAreaSqm` | number | ❌ |
| `bedrooms` | number | ❌ |
| `bathrooms` | number | ❌ |
| `parkingSlots` | number | ❌ |

---

## C. Attributes (ACTUAL)

| Field | Type |
| --- | --- |
| `furnishing` | select |
| `constructionYear` | number (YYYY) |
| `tenure` | select (`freehold`, `leasehold`) |

---

## D. Legal (ACTUAL)

| Field | Type |
| --- | --- |
| `titleStatus` | select (`clean`, `mortgaged`) |

---

### 🔐 Resale Validation Rules

- MUST have `price`
- Lot resale MUST have `lotAreaSqm`
- MUST NOT have preselling-only fields

---

# 3️⃣ PRESELLING LISTING FIELDS

*(Applied when `listingType = preselling`)*

> Represents a sellable model / variant, not a unit
> 

---

## A. Preselling Identity

| Field | Type | Required |
| --- | --- | --- |
| `modelName` | text | ✅ |

---

## B. Indicative Pricing (INFORMATIONAL)

| Field | Type | Required |
| --- | --- | --- |
| `indicativePrice` | number | ❌ |
| `indicativePriceMin` | number | ❌ |
| `indicativePriceMax` | number | ❌ |

### Validation

- Must provide:
    - `indicativePrice`
    - OR (`indicativePriceMin` AND `indicativePriceMax`)

---

## C. Model Specs (SEARCHABLE, NOT GUARANTEED)

| Field | Type | Semantics |
| --- | --- | --- |
| `bedrooms` | number | Typical model layout |
| `bathrooms` | number | Typical model layout |
| `parkingSlots` | number | Typical allocation |

---

## D. Minimum Size (MODEL-LEVEL)

| Field | Type | Required |
| --- | --- | --- |
| `minLotAreaSqm` | number | ❌ |
| `minFloorAreaSqm` | number | ❌ |

At least one required.

---

## E. Tenure (PROJECT-LEVEL)

| Field | Type | Semantics |
| --- | --- | --- |
| `tenure` | select | Project-level tenure |

Values:

- freehold
- leasehold

---

## F. Indicative Turnover

| Field | Type | Notes |
| --- | --- | --- |
| `indicativeTurnover` | text / number | Informational only |

Auto-display disclaimer:

> “Indicative only. Subject to change.”
> 

---

## G. Preselling Content

| Field | Type |
| --- | --- |
| `standardInclusions` | richText |
| `presellingNotes` | richText |

---

### 🔐 Preselling Validation Rules

- MUST have:
    - `modelName`
    - Development
    - Indicative pricing
    - Minimum size
- MAY have:
    - Bedrooms / Bathrooms / Parking
    - Tenure
    - Payment terms
    - Indicative turnover
- MUST NOT have:
    - `price`, `pricePerSqm`
    - `lotAreaSqm`, `floorAreaSqm`
    - Furnishing, constructionYear, titleStatus
    - Owner-specific data

---

# 4️⃣ MASTER DATA COLLECTIONS (ADMIN ONLY)

## 4.1 `Developments`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | text | ✅ |  |
| `barangay` | relationship → Barangays | ✅ |  |
| `primaryEstate` | relationship → Estates | ❌ | Informational only |
| `isActive` | boolean | ✅ | Soft deactivate |

**Important**

- `primaryEstate` is **NOT** used for inference
- Never infer Estate from this field

---

## 4.2 `Estates`

| Field | Type | Required |
| --- | --- | --- |
| `name` | text | ✅ |
| `slug` | text | ✅ |
| `includedDevelopments` | relationship → Developments (multi) | ✅ |
| `isActive` | boolean | ✅ |

### Estate Rule (STRICT)

```
listing belongsto estate
IF listing.development ∈ estate.includedDevelopments

```

Listings are **never manually tagged** to Estates.

---

## 4.3 `Townships`

| Field | Type | Required |
| --- | --- | --- |
| `name` | text | ✅ |
| `slug` | text | ✅ |
| `coveredBarangays` | relationship → Barangays (multi) | ✅ |
| `isActive` | boolean | ✅ |

### Township Rule (STRICT)

```
listing belongsto township
IF listing.barangay ∈ township.coveredBarangays

```

Listings are **never manually tagged** to Townships.

---

# 5️⃣ INFERENCE SUMMARY (MANDATORY FOR DEVS)

| Entity | Stored on Listing? | How Derived |
| --- | --- | --- |
| City | ✅ | Explicit |
| Barangay | ✅ | Explicit |
| Development | ❌ (optional) | Explicit |
| Estate | ❌ | Development ∈ Estate |
| Township | ❌ | Barangay ∈ Township |

---

# 🧾 ONE-GLANCE FIELD APPLICABILITY MATRIX

**(For Fast Dev Decisions)**

| Field / Group | Resale | Preselling |
| --- | --- | --- |
| Title | ✅ | ✅ |
| Description | ✅ | ✅ |
| Model Name | ❌ | ✅ |
| Property Category | ✅ | ✅ |
| Property Type | ✅ | ✅ |
| Property Subtype | ✅ | ✅ |
| Transaction Type | ✅ | ✅ |
| Price | ✅ | ❌ |
| Price per sqm | ✅ (computed) | ❌ |
| Indicative Price / Range | ❌ | ✅ |
| Bedrooms | ✅ | ✅ (model-level) |
| Bathrooms | ✅ | ✅ (model-level) |
| Parking Slots | ✅ | ✅ (model-level) |
| Floor Area (Actual) | ✅ | ❌ |
| Lot Area (Actual) | ✅ | ❌ |
| Minimum Floor Area | ❌ | ✅ |
| Minimum Lot Area | ❌ | ✅ |
| Tenure | ✅ | ✅ (project-level) |
| Indicative Turnover | ❌ | ✅ |
| Furnishing | ✅ | ❌ |
| Construction Year | ✅ | ❌ |
| Title Status | ✅ | ❌ |
| Payment Terms | ✅ | ✅ |
| Standard Inclusions | ❌ | ✅ |
| Preselling Notes | ❌ | ✅ |
| City | ✅ | ✅ |
| Barangay | ✅ | ✅ |
| Development | Optional | Required |
| Full Address | ✅ | ✅ |
| Estate (Derived) | ❌ | ❌ |
| Township (Derived) | ❌ | ❌ |

---

# 6️⃣ NON-NEGOTIABLE DEV RULES

- Single `Listings` collection
- Conditional fields via backend validation (not UI only)
- Estate & Township are **derived only**
- ListingType & TransactionType are **single-select**
- “Both” exists **only in search queries**

