# place-service.js — *Place Management Service*
**Location:** `js/api/place-service.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **Fetch Places by Route** | Retrieves all places from Firestore for a given `routeId`. Returns an array of place objects. No caching is used. |
| **Add Place** | Generates a unique place ID and adds a new place document to Firestore with `name`, `routeId`, and `createdAt` timestamp. Returns the new place object. |
| **Delete Place** | Deletes a place from Firestore using its `placeId`. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Fetching Places
fetchPlacesByRouteFromDb(routeId)
        │
        ├── Validate routeId
        ├── Query Firestore 'places' collection
        └── Return array of place objects → used by UI dropdowns / page controllers

2️⃣ Adding a Place
addPlace(routeId, placeName)
        │
        ├── Generate unique placeId
        ├── Save to Firestore → 'places/{placeId}'
        └── Return new place object → update UI / dropdowns

3️⃣ Deleting a Place
deletePlaceById(placeId)
        │
        └── Remove document from Firestore → UI should refresh list
