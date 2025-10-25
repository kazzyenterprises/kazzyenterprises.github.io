# shop-directory.js — *Shop Directory Page Controller*

**Location:** `js/pages/shop-directory.js`

---

## ⚙️ Core Responsibilities

| Function / Feature                          | Description                                                                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **initializeShopDirectory()**               | Main entry point for managing shops. Sets up DOM elements, event listeners, loads routes, places, shops, and handles adding/updating shop details.  |
| **fetchRoutes()**                           | Retrieves all routes from Firestore and populates the `route-select` dropdown.                                                                      |
| **fetchPlaces()**                           | Retrieves places for the selected route from Firestore and populates `place-select`. Resets shop form and dropdown when route changes.              |
| **renderShops()**                           | Fetches shops for the selected route & place, populates `shop-select`, renders shop cards in `shops-container`, and updates status messages.        |
| **createShopCard(shop)**                    | Returns a DOM element representing a shop card. Displays name, contact, email, location, and handles click to load details into the form.           |
| **loadShop()**                              | Loads the selected shop’s details into the form (contact, email, coordinates, location link) and highlights the corresponding shop card.            |
| **handleCardClick(shopDocId, cardElement)** | Handles shop card click: highlights card and calls `loadShop()` to populate the form.                                                               |
| **checkAndAddPlace(routeId, placeName)**    | Checks if a place exists under a route; prompts user to create if not. Updates Firestore and refreshes places dropdown.                             |
| **Add / Update Shop Button**                | Reads form fields, builds shop data object, creates or updates Firestore document (`setDoc`/`updateDoc`), and refreshes shop list & card highlight. |
| **Form & Input Utilities**                  | `resetForm()` clears input fields and active card highlight. Input masking on contact number limits to 10 digits.                                   |
| **Confirmation Modal**                      | `showConfirmation(title, message)` shows a modal for user confirmation (add new place, update/delete shop). Returns a `Promise<boolean>`.           |
| **Event Listeners**                         | Handles `routeSelect` & `placeSelect` change events, shop dropdown selection, input masking for contact, and GPS initialization for location input. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Page Initialization
initializeShopDirectory()
        │
        ├── Get DOM elements
        ├── Setup state & modal helpers
        ├── Bind event listeners
        ├── Setup GPS placeholder for location input
        └── Load initial routes → fetchRoutes()

2️⃣ Selecting a Route
[User selects route]
        │
        └── fetchPlaces() → populate place-select, reset shop dropdown and form

3️⃣ Selecting a Place
[User selects place]
        │
        └── renderShops() → populate shop-select, render shop cards, update status

4️⃣ Selecting a Shop / Clicking Card
[User selects shop from dropdown or clicks card]
        │
        └── loadShop() → populate form fields, highlight card

5️⃣ Adding / Updating Shop
[User clicks "Add/Update Shop" button]
        │
        ├── Validate route, place, shop selection
        ├── Parse coordinates input → GeoPoint
        ├── Determine Firestore doc ID (new or update)
        ├── setDoc / updateDoc in Firestore
        ├── Show confirmation modal
        └── Refresh shops list → renderShops(), re-highlight updated shop
```

---

## 📝 Notes

* Shop cards are highlighted using aggressive inline styles to indicate the active selection.
* Contact input automatically strips non-numeric characters and limits to 10 digits.
* GPS coordinates are optionally pre-filled if the user allows geolocation.
* Firestore structure relies on normalized IDs: `routeId_placeId_shopName`.
* Modal system is reusable for confirmation and success/error messages.
* Supports creating a new place on the fly if it doesn’t exist under the selected route.
