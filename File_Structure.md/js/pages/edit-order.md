# edit-orders.js — *Edit Orders Page Controller*
**Location:** `js/pages/edit-orders.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **initializeEditOrdersPage()** | Initializes DOM references, binds filter, update, delete buttons, sets up dependent dropdowns, and loads initial routes. |
| **Filter Orders** | Handles filtering by order ID, route, place, shop, and date. Validates order IDs and fetches matching orders using `fetchOrders`. |
| **renderOrdersTable()** | Dynamically renders the orders table with Edit and Delete buttons for each row. |
| **loadOrderForEdit()** | Loads a selected order into the editable form, including customer info, route/place/shop selections, dates, status, and items table. Uses reusable component loader for order items table. |
| **renderOrderItems()** | Populates the order items table, calculates line totals, grand total, and allows deleting individual items. |
| **handleUpdateOrder()** | Updates the selected order in Firestore with modified details, recalculates total, and refreshes the table. |
| **handleDeleteOrder()** | Deletes the selected order from Firestore and refreshes the table. |
| **Dropdown Helpers** | `loadFilterPlaces()`, `loadFilterShops()`, `loadPlacesDropdown()`, `loadShopsDropdown()` manage dependent dropdowns for route → place → shop. |
| **Date Formatting** | `formatOrderDate()` converts Firestore `Timestamp` or `Date` objects to `YYYY-MM-DD` for input fields. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Page Initialization
initializeEditOrdersPage()
        │
        ├── DOM references collected
        ├── Bind buttons: filter, clear, update, delete
        ├── Load routes → populate filterRoute dropdown
        └── Set dependent dropdown listeners (route → place → shop)

2️⃣ Filtering Orders
handleFilterOrders()
        │
        ├── Read filters (orderId, route, place, shop, date)
        ├── Validate orderId
        ├── Call fetchOrders(filters)
        └── renderOrdersTable(orders)

3️⃣ Editing an Order
renderOrdersTable() → click Edit button
        │
        └── loadOrderForEdit(orderId)
               ├── Populate editable form
               ├── Load order items table component
               └── renderOrderItems(items)

4️⃣ Updating / Deleting Order
handleUpdateOrder() → updates Firestore via updateOrder()
handleDeleteOrder() → deletes Firestore via deleteOrder()
        │
        └── Refresh table via handleFilterOrders()

5️⃣ Dropdown Dependencies
route → loadFilterPlaces() → place → loadFilterShops() → shop
