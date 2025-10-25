# new-order.js — *New Order Page Controller*
**Location:** `js/pages/new-order.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **initializeOrderPage()** | Initializes DOM references, sets initial dates, restores draft order if exists, or initializes a new order flow. Generates a new order ID. |
| **setInitialDates()** | Sets `orderDate` to today, `deliveryDate` to tomorrow, and current time in `orderTime`. |
| **renderPlaceOptions() / renderShopOptions()** | Populates the `<select>` dropdowns for places and shops dynamically. Handles empty states. |
| **setupEventListeners()** | Binds event listeners for route/place/shop changes, delivery date changes, add product row, place order, add new product, and listens to centralized cache updates for `places`, `shops`, and `products`. |
| **fetchPlacesForSelectedRoute() / fetchShopsForSelectedPlace()** | Loads dependent dropdowns from cache (or Firestore if forced) and renders options. |
| **Draft Management** | Uses `draftOrderState` object and helper functions `getDraftRowsFromDOM()`, `persistDraft()`, `restoreDraftFlow()` to maintain unsaved orders across page reloads. Saves via `saveDraftOrder()` and deletes via `deleteDraftOrder()`. |
| **handleAddProductRow()** | Adds a new product row to the order table. Validates the last row before allowing a new row. |
| **handlePlaceOrder()** | Calls `placeOrderAPI()` to persist the order in Firestore, clears draft, and reloads the page. |
| **handleAddNewProduct()** | Adds a new product to Firestore via `addProduct()` and refreshes the order table with updated product list. |
| **loadProducts() / loadRoutes()** | Loads products and routes from centralized cache or forces a Firestore refresh. |
| **Order ID Generation** | `generateOrderIdFromFirestore()` computes the next sequential Order ID based on existing orders in Firestore and ensures it follows the expected format. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Page Initialization
initializeOrderPage()
        │
        ├── Get DOM elements
        ├── Set initial dates
        ├── Setup event listeners
        ├── Restore draft if exists → restoreDraftFlow()
        └── Generate new Order ID from Firestore

2️⃣ Dropdown Dependencies
route → fetchPlacesForSelectedRoute()
place → fetchShopsForSelectedPlace()
shop → update draft

3️⃣ Draft Management
getDraftRowsFromDOM() → persistDraft() → saveDraftOrder()
restoreDraftFlow() → populate DOM from saved draft

4️⃣ Adding Products
handleAddProductRow() → createAddProductRow()
handleAddNewProduct() → addProduct() → refresh products table

5️⃣ Placing Order
handlePlaceOrder() → placeOrderAPI() → deleteDraftOrder() → page reload
