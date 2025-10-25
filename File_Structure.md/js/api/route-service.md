# route-service.js — *Route Management Service*
**Location:** `js/api/route-service.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **Fetch Routes** | Retrieves all routes from Firestore. Can be integrated with centralized cache if needed. Returns an array of route objects `{id, name}`. |
| **Add Route** | Adds a route to the centralized cache using `addRouteToCache`. Does **not** persist to Firestore. |
| **Get Cached Routes** | Returns cached routes from the centralized data-store without forcing a Firestore refresh. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Fetching Routes
fetchRoutes()
        │
        ├── Query Firestore 'routes' collection
        └── Return array of route objects → used by dropdowns, forms, and filters

2️⃣ Adding a Route
addRoute(route)
        │
        └── Update centralized cache via addRouteToCache → UI can react via cache

3️⃣ Getting Cached Routes
getCachedRoutes()
        │
        └── Return cached routes from store → avoids unnecessary Firestore calls
