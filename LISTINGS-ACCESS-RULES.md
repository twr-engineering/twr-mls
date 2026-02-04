## Listings & Documents Access Logic

This document defines the **backend-enforced logic** for how Agents, Approvers, and Admins can **see and interact with Listings and their Documents**. All rules here **must be enforced at the Payload access layer and API level** (not just UI).

---

### 1. Agent Visibility Rules

**Given** a user with the **Agent** role:

#### Draft & Submitted Listings

- **Agent MUST see and edit ONLY their own listings** in statuses:
  - `draft`
  - `submitted`
  - `needs_revision`
- **Agent MUST NOT see**:
  - Other agents’ `draft` listings
  - Other agents’ `submitted` listings
  - Other agents’ `needs_revision` listings

**✅ Pass condition**

- Agent list views, searches, and API responses **exclude all non-owned listings** unless `status = published`.

---

### 2. Published Listings

- Agent **MUST see ALL published listings** belonging to the brokerage, regardless of owner.
- Published listings **MUST be searchable** via:
  - Payload Admin UI
  - Mobile PWA
  - Typesense search index

**✅ Pass condition**

- Agent search results **return all listings with `status = published`**.

---

### 3. Sensitive Data Masking (Property Owner)

**Given** a user with the **Agent** role viewing a listing they **do NOT own**:

- Agent **MUST NOT see**:
  - Property owner name
  - Property owner contact details
  - Property owner identification data
  - Any private notes related to ownership

**✅ Pass condition**

- Property owner fields are:
  - Fully hidden or redacted in UI
  - **Not present in API responses** for non-owning agents

---

### 4. Agent Access to Own Listings

**Given** a user with the **Agent** role viewing their **OWN** listing:

- Agent **MUST see full listing data**, including:
  - Property owner details
  - Uploaded documents
  - Internal notes (if any)
- Agent **MUST be able to**:
  - Edit listing fields
  - Upload or replace documents
  - Re-submit after `needs_revision`

**✅ Pass condition**

- Agent has **full CRUD access** to owned listings, subject to status rules.

---

### 5. Approver Visibility Rules

**Given** a user with the **Approver** role:

- Approver **MUST see ALL listings**, regardless of:
  - Owner
  - Status (`draft`, `submitted`, `needs_revision`, `published`, `rejected`)
- Approver **MUST see full data**, including:
  - Property owner details
  - Uploaded documents
  - Verification status
  - Approval history
- Approver **MUST be able to**:
  - Approve listings
  - Reject listings
  - Request revisions
  - Publish listings

**✅ Pass condition**

- Approver list views and detail views **expose complete data** across all listings.

---

### 6. Admin Visibility Rules

**Given** a user with the **Admin** role:

- Admin **MUST have full visibility and control** across:
  - All listings
  - All documents
  - All property owner data
  - All approval states

**✅ Pass condition**

- Admin access is **unrestricted** except by explicit business rules.

---

### 7. Search & Index Enforcement

- **Only `published` listings MUST be**:
  - Indexed in Typesense
  - Returned in agent search results
  - Available for external share links
- Draft, submitted, needs_revision, and rejected listings:
  - **MUST NOT** appear in search results for agents
  - **MUST NOT** be externally shareable

**✅ Pass condition**

- Search queries **never return non-published listings for Agents**.

---

### 8. Security Enforcement (Non-Bypassable)

- All visibility rules **MUST be enforced at BOTH levels**:
  - Payload access control (backend)
  - API responses consumed by Mobile PWA
- UI hiding alone is **NOT sufficient**.

**✅ Pass condition**

- Unauthorized data is **not retrievable even via direct API calls**.

---

## Document Visibility Control

### Purpose

Allow the **listing agent** to control which uploaded documents are visible to **other agents**, while ensuring **approvers and admins retain full visibility** for compliance and approval.

---

### 🔐 Document Visibility Rules

Each uploaded document **MUST include a visibility setting** controlled by the listing agent.

#### Document Visibility Levels

Each document must have a field:

- `visibility`
  - `private` — visible only to:
    - Listing Agent (owner)
    - Approver
    - Admin
  - `internal` — visible to:
    - All agents in the brokerage
    - Approver
    - Admin

> **Default value on upload:** `private`

---

### 👤 Role-Based Document Access

#### 1. Listing Agent (Owner)

**Given** an agent viewing their own listing:

- Agent **MUST see all documents**, regardless of visibility.
- Agent **MUST be able to**:
  - Toggle document visibility (`private` ↔ `internal`)
  - Replace or remove documents (subject to status rules)

**✅ Pass condition**

- Listing agent has **full control over document visibility** for their own listings.

---

#### 2. Other Agents (Non-Owner)

**Given** an agent viewing another agent’s listing:

- Agent **MUST see ONLY documents** marked as:
  - `visibility = internal`
- Agent **MUST NOT see**:
  - Documents marked as `private`
  - Any metadata (filename, size, type) of private documents

**✅ Pass condition**

- Private documents are **completely hidden** from non-owning agents.

---

#### 3. Approver

**Given** a user with the **Approver** role:

- Approver **MUST see ALL documents**, regardless of visibility.
- Approver **MUST see document verification status**.

**✅ Pass condition**

- Approver access **bypasses document visibility restrictions**.

---

#### 4. Admin

**Given** a user with the **Admin** role:

- Admin **MUST see ALL documents**.
- Admin **MAY override visibility settings** if needed.

---

### 🔍 Document Search & Indexing Rules

- Documents marked as `private`:
  - **MUST NOT** be indexed in any agent-facing document search.
  - **MUST NOT** appear in search results for non-owning agents.
  - **MUST NOT** be exposed via APIs to non-owning agents.
- Only `internal` documents:
  - **MAY** appear in agent-facing document lists and searches.

