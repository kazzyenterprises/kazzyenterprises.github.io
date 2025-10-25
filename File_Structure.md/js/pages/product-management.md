# products-manage.js — *Product Management Page Controller*
**Location:** `js/pages/products-manage.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **initializeProductManagement()** | Main entry point for managing products. Sets up DOM elements, event listeners, loads products, and handles adding/updating products. |
| **loadProducts(forceRefresh)** | Fetches all products from the API (`fetchAllProducts`) or uses persisted cache (`localStorage`). Populates category list and stores a local `productCache`. |
| **populateCategories()** | Extracts unique product categories from `productCache` and populates `<datalist>` for the category input. |
| **populateProductsByCategory(category)** | Populates `<datalist>` of product names filtered by the selected category. |
| **loadProductDetails()** | Loads a product's details (variant, MRP, selling price, stock, active status) into the form when category or product changes. Clears the form if not found. |
| **saveProduct()** | Validates form fields and calls `addProduct(category, productFullName)` to save a new product. Refreshes the cache/UI and emits a `products-updated` event. Handles spinner, error, and success messages. |
| **Event Listeners** | Handles form submission, category selection changes, product selection changes, and variant/units changes to auto-populate fields. |
| **Event Bus** | Listens for `products-updated` events to refresh local cache and UI across pages. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Page Initialization
initializeProductManagement()
        │
        ├── Get DOM elements
        ├── Load products → loadProducts()
        │       ├─ fetchAllProducts()
        │       └─ populateCategories()
        └── Bind event listeners

2️⃣ Selecting a Category
[User selects category]
        │
        └── populateProductsByCategory(category)

3️⃣ Selecting a Product / Variant
[User selects product/variant]
        │
        └── loadProductDetails() → prefill form fields

4️⃣ Saving a Product
[User submits form]
        │
        ├── Validate required fields
        ├── Build full product name with variant
        ├── Call addProduct(category, productFullName)
        ├── Refresh cache → loadProducts(true)
        └── Emit "products-updated" for other pages
