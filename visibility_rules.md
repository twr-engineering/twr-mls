### 1. Agent Visibility Rules

**Given** a user with the **Agent** role:

### Draft & Submitted Listings

- The agent **MUST see and edit ONLY their own** listings in:
  - `draft`
  - `submitted`
  - `needs_revision`
- The agent **MUST NOT see**:
  - Other agents’ `draft` listings
  - Other agents’ `submitted` listings
  - Other agents’ `needs_revision` listings

✅ **Pass condition:**

Agent list views, searches, and API responses exclude all non-owned listings unless `status = published`.

---

### Published Listings

- The agent **MUST see ALL published listings** belonging to the brokerage, regardless of owner.
- Published listings **MUST be searchable** via:
  - Payload Admin UI
  - Mobile PWA
  - Typesense search index

✅ **Pass condition:**

Agent search results return all listings with `status = published`.

---

### 2. Sensitive Data Masking (Property Owner)

**Given** a user with the **Agent** role viewing a listing they do NOT own:

- The agent **MUST NOT see**:
  - Property owner name
  - Property owner contact details
  - Property owner identification data
  - Any private notes related to ownership

✅ **Pass condition:**

Property owner fields are:

- Fully hidden or redacted in UI
- Not present in API responses for non-owning agents

---

### 3. Agent Access to Own Listings

**Given** a user with the **Agent** role viewing their OWN listing:

- The agent **MUST see full listing data**, including:
  - Property owner details
  - Uploaded documents
  - Internal notes (if any)
- The agent **MUST be able to**:
  - Edit listing fields
  - Upload or replace documents
  - Re-submit after `needs_revision`

✅ **Pass condition:**

Agent has full CRUD access to owned listings, subject to status rules.

---

### 4. Approver Visibility Rules

**Given** a user with the **Approver** role:

- The approver **MUST see ALL listings**, regardless of:
  - Owner
  - Status (`draft`, `submitted`, `needs_revision`, `published`, `rejected`)
- The approver **MUST see full data**, including:
  - Property owner details
  - Uploaded documents
  - Verification status
  - Approval history
- The approver **MUST be able to**:
  - Approve listings
  - Reject listings
  - Request revisions
  - Publish listings

✅ **Pass condition:**

Approver list views and detail views expose complete data across all listings.

---

### 5. Admin Visibility Rules

**Given** a user with the **Admin** role:

- Admin **MUST have full visibility and control** across:
  - All listings
  - All documents
  - All property owner data
  - All approval states

✅ **Pass condition:**

Admin access is unrestricted except by explicit business rules.

---

### 6. Search & Index Enforcement

- **Only `published` listings** MUST be:
  - Indexed in Typesense
  - Returned in agent search results
  - Available for external share links
- Draft, submitted, needs_revision, and rejected listings:
  - MUST NOT appear in search results for agents
  - MUST NOT be externally shareable

✅ **Pass condition:**

Search queries never return non-published listings for Agents.

---

### 7. Security Enforcement (Non-Bypassable)

- All visibility rules **MUST be enforced at BOTH levels**:
  - Payload access control (backend)
  - API responses consumed by Mobile PWA
- UI hiding alone is **NOT sufficient**.

✅ **Pass condition:**

Unauthorized data is not retrievable even via direct API calls.

## Document Visibility Control

### Purpose

Allow the **listing agent** to control which uploaded documents are visible to **other agents**, while ensuring **approvers and admins retain full visibility** for compliance and approval.

---

## 🔐 Document Visibility Rules

Each uploaded document **MUST include a visibility setting** controlled by the listing agent.

### Document Visibility Levels

Each document must have a field:

- `visibility`
  - `private` — visible only to:
    - Listing Agent (owner)
    - Approver
    - Admin
  - `internal` — visible to:
    - All agents in the brokerage
    - Approver
    - Admin

> Default value on upload: private

---

## 👤 Role-Based Document Access

### 1. Listing Agent (Owner)

**Given** an agent viewing their own listing:

- The agent **MUST see all documents**, regardless of visibility
- The agent **MUST be able to**:
  - Toggle document visibility (`private` ↔ `internal`)
  - Replace or remove documents (subject to status rules)

✅ **Pass condition:**

Listing agent has full control over document visibility for their own listings.

---

### 2. Other Agents (Non-Owner)

**Given** an agent viewing another agent’s listing:

- The agent **MUST see ONLY documents** marked as:
  - `visibility = internal`
- The agent **MUST NOT see**:
  - Documents marked as `private`
  - Any metadata (filename, size, type) of private documents

✅ **Pass condition:**

Private documents are completely hidden from non-owning agents.

---

### 3. Approver

**Given** a user with the Approver role:

- The approver **MUST see ALL documents**, regardless of visibility
- The approver **MUST see document verification status**

✅ **Pass condition:**

Approver access bypasses document visibility restrictions.

---

### 4. Admin

**Given** a user with the Admin role:

- Admin **MUST see ALL documents**
- Admin **MAY override visibility settings** if needed

---

## 🔍 Search & Indexing Rules

- Documents marked as `private`:
  - MUST NOT be indexed
  - MUST NOT appear in search results
  - MUST NOT be exposed via APIs to non-owning agents
- Only `internal` documents:
  - MAY appear in agent-facing document lists
