# product-service.js — *Product Management Service*
**Location:** `js/api/product-service.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **Fetch All Products** | Retrieves all products from Firestore using centralized cache (`store.products`). Supports `forceRefresh` to bypass cache. Emits `products-updated` after fetching. |
| **Add Product** | Adds a new product to Firestore and updates the centralized cache and localStorage. Emits `products-updated`. |
| **Find Product** | Searches the cached products array for a product matching `category` and `itemName`. Returns the product object or `undefined`. |
| **Initialize Products Cache** | Loads cached products from localStorage into `store.products` on app startup. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Fetching Products
fetchAllProducts(forceRefresh)
        │
        ├── Check centralized cache (store.products)
        ├── If empty or forceRefresh → query Firestore 'products' collection
        ├── Update store.products + localStorage
        └── Emit 'products-updated' → Event Bus → UI updates

2️⃣ Adding a Product
addProduct(category, name)
        │
        ├── Create new product in Firestore
        ├── Update centralized cache + localStorage
        └── Emit 'products-updated' → Event Bus → UI updates

3️⃣ Searching for Product
findProduct(category, itemName)
        │
        └── Return product object from centralized cache → used by draft/order forms

4️⃣ Initializing Cache
initializeProductsCache()
        │
        └── Load cachedProducts from localStorage → store.products
