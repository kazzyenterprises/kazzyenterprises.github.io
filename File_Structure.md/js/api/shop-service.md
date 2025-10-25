# shop-service.js — *Shop Management Service*
**Location:** `js/api/shop-service.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **Fetch Shops by Place** | Retrieves all shops from Firestore for a given `placeId`. Returns an array of shop objects. Direct Firestore fetch, no caching. |
| **Add Shop to Cache** | Adds a shop to the centralized cache for a specific place after it is added to Firestore. |
| **Get Cached Shops** | Returns cached shops for a specific place from the centralized data-store without querying Firestore. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Fetching Shops
fetchShopsByPlaceFromDb(placeId)
        │
        ├── Validate placeId
        ├── Query Firestore 'shops' collection where placeId == given ID
        └── Return array of shop objects → populate dropdowns/UI

2️⃣ Adding Shop to Cache
addShopToCacheForPlace(placeId, shop)
        │
        └── Update centralized cache → UI can react to new shop

3️⃣ Getting Cached Shops
getCachedShops(placeId)
        │
        └── Retrieve shops from centralized cache → avoids unnecessary Firestore queries
