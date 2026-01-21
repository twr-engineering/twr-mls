# 🧱 FIELD SCHEMA — LISTINGS (Core Collection)

## Collection: `Listings`

---

## A. Core Details

| Field Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | text | ✅ | Max length recommended: 120 |
| `description` | richText | ❌ | Used internally + for client sharing |

---

## B. Listing Type & Governance

| Field Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `listingType` | select | ✅ | Values: `resale`, `preselling` |
| `createdBy` | relationship (Users) | ✅ | Agent or Admin |
| `status` | select | ✅ | draft / submitted / needs_revision / published / rejected |

🔒 **Access Rules**

- Agents: `listingType` locked to `resale`
- Admin: can select both

---

## C. Transaction & Pricing

| Field Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `transactionType` | select | ✅ | `sale`, `rent` |
| `price` | number | ✅ | Base price |
| `pricePerSqm` | number | ❌ | **Required if Lot** (see rules below) |

### Conditional Rule

- If `propertyType` is any **Lot** type → `pricePerSqm` required

---

## D. Area & Specifications

| Field Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `floorAreaSqm` | number | ❌ | Required for condos, offices, buildings |
| `lotAreaSqm` | number | ❌ | Required for lots & house-and-lot |
| `bedrooms` | number | ❌ | Required for residential units (except lots) |
| `bathrooms` | number | ❌ | Same as above |
| `parkingSlots` | number | ❌ | Optional |

---

## E. Attributes

### Furnishing

| Field Name | Type | Required | Options |
| --- | --- | --- | --- |
| `furnishing` | select | ❌ | `unfurnished`, `semi_furnished`, `fully_furnished` |

---

### Construction & Tenure

| Field Name | Type | Required | Options |
| --- | --- | --- | --- |
| `constructionYear` | number (YYYY) | ❌ | e.g. 2018 |
| `tenure` | select | ❌ | `freehold`, `leasehold` |

---

## F. Legal & Payment

### Title Status

| Field Name | Type | Required | Options |
| --- | --- | --- | --- |
| `titleStatus` | select | ❌ | `clean`, `mortgaged` |

---

### Payment Terms

| Field Name | Type | Required | Options |
| --- | --- | --- | --- |
| `paymentTerms` | select (multi) | ❌ | `cash`, `bank`, `pagibig`, `deferred` |

---

## G. Address & Location (CRITICAL)

### Address Relationships

| Field Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `city` | relationship (Cities) | ✅ | Official |
| `barangay` | relationship (Barangays) | ✅ | Filtered by City |
| `development` | relationship (Developments) | ❌ | Filtered by Barangay |
| `fullAddress` | text | ✅ | Free text |

---

### Address Enforcement Rules (Non-Negotiable)

- Selecting **City** filters Barangays
- Selecting **Barangay** filters Developments
- Changing City resets Barangay & Development
- Changing Barangay resets Development
- Backend validation must reject invalid combinations

---

# 🧩 MASTER DATA COLLECTIONS (Admin Only)

---

## Collection: `Developments`

> Canonical term: Development
> 
> 
> UI may display “Development / Subdivision”
> 

| Field Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | text | ✅ |  |
| `barangay` | relationship (Barangays) | ✅ |  |
| `primaryEstate` | relationship (Estates) | ❌ | Informational only |
| `isActive` | boolean | ✅ | Soft deactivate |

🔎 `primaryEstate`

- Admin clarity only
- Does NOT affect search or inference logic

---

## Collection: `Estates`

| Field Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | text | ✅ |  |
| `slug` | text | ✅ | URL-safe |
| `includedDevelopments` | relationship (Developments, multi) | ✅ | Source of truth |
| `isActive` | boolean | ✅ |  |

### Estate Rule (Strict)

```
listing belongsto estate
IF listing.development ∈ estate.includedDevelopments

```

Listings are **never manually tagged** to Estates.

---

## Collection: `Townships`

| Field Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | text | ✅ |  |
| `slug` | text | ✅ |  |
| `coveredBarangays` | relationship (Barangays, multi) | ✅ |  |
| `isActive` | boolean | ✅ |  |

### Township Rule (Strict)

```
listing belongsto township
IF listing.barangay ∈ township.coveredBarangays

```

Listings are **never manually tagged** to Townships.

---

# 🧠 Inference Summary (For Developers)

| Entity | Explicit on Listing? | How it’s Derived |
| --- | --- | --- |
| City | ✅ | Selected |
| Barangay | ✅ | Selected |
| Development | ❌ | Optional selection |
| Estate | ❌ | Via Development ∈ Estate |
| Township | ❌ | Via Barangay ∈ Township |

---

# 🔐 Validation & Integrity Rules (Backend)

- Invalid City–Barangay–Development combinations rejected
- Agents cannot:
    - Create Preselling listings
    - Modify listingType
- Preselling listings:
    - Editable only by Admin
- ListingType affects:
    - Search filters
    - UI badges
    - Edit permissions