# order-service.js — *Order Management & Draft Integration*
**Location:** `js/api/order-service.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **Place Order** | Converts a draft order into a finalized order, calculates totals, sets timestamps, saves to Firestore (`orders/{orderId}`), deletes the draft, and emits `order-placed`. |
| **Get Single Order** | Fetches a single order by ID from Firestore with validation and ID normalization. |
| **Update Order** | Updates an existing order with new data and updates `updatedAt` timestamp. |
| **Delete Order** | Deletes an order from Firestore by ID after validating the order ID. |
| **Add Product to Draft** | Creates a new product in Firestore and saves it into the current draft; emits `product-added`. |
| **Calculate Line Total** | Utility to compute line totals (`orderQuantity * sellingPrice`). |
| **Cached Data Helpers** | Provides cached versions of routes, places, shops, and draft state for UI efficiency (`getCachedRoutes`, `getCachedPlaces`, `getCachedShops`, `getCachedDraftState`). |
| **Fetch Multiple Orders** | Retrieves multiple orders from Firestore based on filters (order ID, route, place, shop, date range), sorted by `orderDate`. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Placing an Order
User completes draft order → placeOrder(draftOrderState, DOM)
        │
        ├── Validate Order ID & Form Inputs
        ├── Calculate totals
        ├── Save → Firestore ('orders/{orderId}')
        ├── Delete Draft → deleteDraftOrder()
        └── Emit 'order-placed' → Event Bus → UI updates

2️⃣ Managing Drafts
addProductToDraft(category, name, draftOrderState, DOM)
        │
        ├── Create product in Firestore
        ├── Update draft → saveDraftOrder()
        └── Emit 'product-added' → Event Bus → UI updates

3️⃣ Fetching Orders
fetchOrders(filters)
        │
        ├── Apply filters (orderId / route / place / shop / date)
        ├── Query Firestore
        └── Return sorted order list → used in edit-orders or UI listings

4️⃣ Updating / Deleting Orders
updateOrder(orderId, updatedData) → Firestore update
deleteOrder(orderId) → Firestore deletion
