PROJECT REQUIREMENTS DOCUMENT

## 1. Overview

### Project Name

Internal MLS & Listing Management System

### Purpose

Build an **internal-only MLS and listing management system** for a real estate brokerage that supports:

- Resale listings (agent-created)
- Preselling listings (admin-created, centralized)
- Approval and document validation workflows
- Advanced internal search (MLS)
- Secure external sharing for clients
- Strong location intelligence (Township / Estate / Development)

### Timeline

**1-month MVP**

### Primary Platform

- **Payload CMS** (Admin UI as core interface)
- **Mobile PWA** (Agent-focused, lightweight)

### Scope Summary

- Internal use only
- No public marketplace
- No unit-level inventory
- No reservation or booking workflows

---

## 2. System Interfaces & UX Strategy

### 2.1 Payload Admin UI (Desktop-first)

**Used by:** Agents, Approvers, Admin

**Positioning:** *Office / heavy work*

### Responsibilities

- Full listing creation & editing
- Bulk table views, filters, sorting
- Approval & document validation
- Internal MLS search
- Notifications
- Master data management
- User & role management

### Rules

- Admin UI is the **source of truth**
- All system capabilities must be accessible here
- Desktop-first, data-dense UX is acceptable

---

### 2.2 Mobile PWA (Mobile-first) - If Time Permits

**Used by:** Agents

**Positioning:** *Field work / quick work*

### Responsibilities

- Create resale listings
- Upload photos & documents
- Track approval status
- Browse approved listings
- Generate external share links

### Explicit Non-Goals

- No approvals
- No master data editing
- No bulk actions

---

## 3. Users & Roles

### 3.1 Agent

- Create **Resale** listings only
- Edit own listings
- Upload documents
- Submit listings for approval
- View/search all published listings
- Generate client share links
- Cannot create or edit Preselling listings

---

### 3.2 Approver

- View all listings (all states)
- Validate documents
- Approve / reject / request revisions
- Publish listings
- Admin UI only

---

### 3.3 Admin

- Full system access
- Create and manage Preselling listings
- Manage all master data
- Manage users and roles

---

## 4. Listing Types & Governance

### 4.1 Listing Type

Each listing MUST have a `listingType`:

- **Resale**
- **Preselling**

This field controls:

- Who can create the listing
- Editing permissions
- Search filtering
- UI badges and disclaimers

---

### 4.2 Role-Based Creation Rules

### Agent

- Can create: `Resale`
- Cannot create: `Preselling`
- Listing Type selector is locked to Resale

### Admin

- Can create and edit:
  - Resale listings
  - Preselling listings

---

## 5. Preselling Listings (Centralized, Admin-Only)

### Definition

A **Preselling listing** represents a **sellable model or product variant** inside a Development.

It is **not** a unit.

Examples:

- House & Lot – Model A
- House & Lot – Model B
- Condominium – Studio
- Condominium – 2BR

---

### Rules

- Preselling listings:
  - Are centrally created by Admin
  - Are read-only for agents
  - Are not duplicated per agent
- A Development can have **multiple Preselling listings**

---

### Required Fields (Preselling Only)

- Model Name (required)
- Indicative Price or Price Range
- Minimum Lot Area / Floor Area
- Standard Inclusions (text)
- Notes / Disclaimers

🚫 No unit numbers

🚫 No availability tracking

🚫 No reservations

---

## 6. Resale Listings

### Definition

A **Resale listing** represents an individually owned property.

- Can exist inside or outside Developments
- Multiple resale listings per Development are allowed

---

## 7. Listing Lifecycle & Status

### Status Values

- `draft`
- `submitted`
- `needs_revision`
- `published`
- `rejected`

### Rules

- Only published listings appear in MLS search
- Only Approver/Admin can publish

---

## 8. Listing Fields

### Core Details

- Title
- Description

### Transaction & Pricing

- Transaction Type: Sale / Rent
- Price
- Price per sqm (required for lots)

### Area & Specs

- Floor Area (sqm)
- Lot Area (sqm)
- Bedrooms
- Bathrooms
- Parking

### Attributes

- Furnishing:
  - Unfurnished
  - Semi-Furnished
  - Fully Furnished
- Construction Year
- Tenure:
  - Freehold
  - Leasehold

### Legal & Payment

- Title Status:
  - Clean
  - Mortgaged
- Payment Terms (multi-select):
  - Cash
  - Bank
  - Pag-IBIG
  - Deferred

---

## 9. Address & Location Model (CRITICAL)

### 9.1 Official Address Hierarchy (Required)

1. **City**
2. **Barangay** (filtered by City)
3. **Development** (optional, filtered by Barangay)
4. **Full Address** (required)

> Canonical term: Development
>
> UI label may show: *Development / Subdivision*

### Enforcement

- Changing City resets Barangay & Development
- Changing Barangay resets Development
- Invalid combinations not allowed via UI or API

---

## 9.2 Developments (Explicit)

### Definition

A **Development** is a named physical place where resale or preselling properties exist.

Examples:

- Ignatius Enclave
- One Uptown Residences

### Development Data Model (Admin Only)

**Collection: Developments**

- name
- barangay (required)
- primaryEstate (optional, informational)
- isActive

> primaryEstate is for admin clarity only
>
> It does NOT drive search logic

---

## 9.3 Estates (Implicit via Developments)

### Definition

An **Estate** is a branded grouping of multiple Developments.

Examples:

- Xavier Estates
- Pueblo de Oro

### Estate Data Model (Admin Only)

**Collection: Estates**

- name
- slug
- includedDevelopments (multi-select)
- isActive

### Rule

A listing belongs to an Estate **if and only if**:

```
listing.development ∈ estate.includedDevelopments

```

Listings are NEVER manually tagged to Estates.

---

## 9.4 Townships (Implicit via Barangays)

### Definition

A **Township** is a market-recognized geographic area spanning multiple barangays.

Examples:

- Uptown CDO
- Bonifacio Global City

### Township Data Model (Admin Only)

**Collection: Townships**

- name
- slug
- coveredBarangays (multi-select)
- isActive

### Rule

A listing belongs to a Township if:

```
listing.barangay ∈ township.coveredBarangays

```

---

## 10. Search Behavior (MLS)

### Search Types & Inclusion Logic

| Search Term | Inclusion Rule       |
| ----------- | -------------------- |
| Township    | Barangay ∈ Township  |
| Estate      | Development ∈ Estate |
| Development | Listing linked       |
| Barangay    | Listing in barangay  |

---

## 11. Listing Type Search Toggle

### Filter: Listing Type

- Resale
- Preselling
- Both (default)

### Behavior

- Enforced at backend & search index
- Applies to Admin UI, Mobile PWA, and Client Shares

---

## 12. Visual Indicators (Required)

All listings must display a badge:

- **Resale – Available Property**
- **Preselling – Project Model**

Displayed in:

- Listing cards
- Listing detail views
- Client share pages

---

## 13. Document Management

### Document Fields

- Type
- File
- UploadedBy
- UploadedAt
- Verified
- VerifiedBy
- VerifiedAt
- Visibility:
  - Private
  - Internal

### Visibility Rules

- Listing agent controls visibility
- Other agents see only `Internal` documents
- Approvers/Admin see all documents

---

## 14. Notifications

### Events

- Listing published → notify all agents
- Needs revision → notify listing agent

---

## 15. External Share Links (Client Offer)

### Rules

- Only published listings
- Token-based access
- Revocable
- Optional expiry
- Listing type badge visible

---

## 16. Security & Enforcement

- Role-based access enforced at backend
- UI hiding alone is not acceptable
- Property owner info hidden from non-owning agents
- Preselling listings are read-only for agents

---

## 17. Explicit Non-Goals (Locked)

The system does NOT support:

- Unit-level inventory
- Reservations
- Availability tracking
- Developer price matrices
- Contract workflows
- Construction tracking

These belong to a future phase.

---

## 18. Final Acceptance Criteria (High-Level)

- Agents can create resale listings only
- Admin manages preselling listings centrally
- Multiple preselling models per Development allowed
- Development is the only explicit project selection
- Estate & Township membership is always inferred
- Search behaves consistently across interfaces
- No duplicate preselling chaos
- Clear UX distinction between resale and preselling

---

## 19. Architect’s Final Assessment

This PRD is:

- **Internally consistent**
- **Scalable**
- **Resale-safe**
- **Preselling-governed**
- **Search-accurate**
- **Agent-proof**

[FIELD SCHEMA - LISTINGS](https://www.notion.so/FIELD-SCHEMA-LISTINGS-2ef5f94a36908004add5fef5cc10294f?pvs=21)
