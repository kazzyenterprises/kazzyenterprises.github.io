# shop-management.js — *Shop Management Page Controller*

**Location:** `js/pages/shop-management.js`

---

## ⚙️ Core Responsibilities

| Function / Feature                   | Description                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **initializeShopManagement()**       | Main entry point for managing shops. Sets up DOM elements, event listeners, loads routes, places, and shops, and handles adding new shops.                                      |
| **loadRoutes()**                     | Fetches all routes from the API (`fetchRoutes`) and populates the `<select>` dropdown for routes.                                                                               |
| **loadPlacesForRoute(forceRefresh)** | Fetches places for the selected route from cache (`getPlaces`) and populates the `<select>` for places. Optionally refreshes cache.                                             |
| **loadShopsForPlace(forceRefresh)**  | Fetches shops for the selected place from cache (`getShops`) and populates the `<select>` for shops. Handles "No shops found" gracefully.                                       |
| **Add Shop Button Handler**          | Validates place selection and shop name, creates a simple shop object with a timestamp-based ID, updates cache (`addShopToCache`), reloads shop dropdown, and clears the input. |
| **Event Listeners**                  | Handles `change` events on route and place dropdowns to refresh places and shops dynamically. Handles shop addition click.                                                      |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Page Initialization
initializeShopManagement()
        │
        ├── Get DOM elements
        ├── Load routes → loadRoutes()
        │       └─ populate routeSelect
        └── Bind event listeners

2️⃣ Selecting a Route
[User selects a route]
        │
        └── loadPlacesForRoute(forceRefresh)
                 └─ populate placeSelect

3️⃣ Selecting a Place
[User selects a place]
        │
        └── loadShopsForPlace(forceRefresh)
                 └─ populate shopSelect
                 └─ handles "No shops found"

4️⃣ Adding a Shop
[User enters shop name & clicks Add]
        │
        ├── Validate input
        ├── Create shop object `{id, name}`
        ├── addShopToCache(placeId, shop)
        ├── reload shops → loadShopsForPlace(true)
        └── Clear input & show success alert
```

---

## 📝 Notes

* Shop IDs are currently generated using `Date.now()` for simplicity.
* Cache is updated immediately via `addShopToCache` to reflect changes across the app.
* Minimal validation is implemented (checks for empty place selection and shop name).
* Event listeners ensure cascading dropdown updates:

  * Changing route updates places.
  * Changing place updates shops.
