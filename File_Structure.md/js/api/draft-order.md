# draft-service.js — *Draft Order Persistence Layer*
**Location:** `js/api/draft-service.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **Save Drafts** | Collects current order form state and saves it to both **localStorage** and **Firestore (`draftOrders/{USER_ID}`)**. Emits `draft-updated` to notify other modules. |
| **Load Drafts** | Retrieves saved drafts using a **3-tier cache**: memory → localStorage → Firestore fallback. Restores the last saved state if available. |
| **Delete Drafts** | Removes all stored drafts (from cache, localStorage, and Firestore). Emits `draft-deleted` to clear UI and dependent states. |
| **Get Cached Draft** | Returns the current in-memory draft instantly for quick synchronous access by other modules. |

---

## 🔄 Data Flow Overview

```plaintext
User Inputs (routeSelect, placeSelect, shopSelect, deliveryDateInput)
        │
        ▼
  saveDraftOrder(draftState)
        │
        ├── Save → localStorage
        ├── Save → Firestore (draftOrders/{USER_ID})
        └── Emit → 'draft-updated' → Event Bus
                      │
                      └── new-order.js updates UI

loadDraftOrder()
        ├── Try in-memory cache
        ├── Fallback → localStorage
        └── Fallback → Firestore

deleteDraftOrder()
        ├── Clear local + Firestore data
        └── Emit 'draft-deleted' → Event Bus → UI reset


