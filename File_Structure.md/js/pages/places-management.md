# places-manage.js — *Place Management Page Controller*
**Location:** `js/pages/places-manage.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **initializePlaceManagement()** | Main entry point to set up the place management page. Initializes DOM elements, renders routes and places, and binds event listeners. |
| **renderRoutes()** | Loads all routes from centralized cache (`getRoutes`) and populates the `<select>` dropdown for route selection. |
| **renderPlaces(routeId, forceRefresh)** | Fetches and renders all places for the selected route from centralized cache (`getPlaces`). Shows status messages if none exist or while loading. |
| **createPlaceCard(place, routeId)** | Generates a DOM card for a single place with a delete button. Binds deletion logic with confirmation modal. |
| **addPlaceBtn click handler** | Adds a new place for the selected route via `addPlace()` API, updates centralized cache, re-renders the places list, and shows modal confirmation. |
| **routeSelect change handler** | Re-renders places whenever the route selection changes. |
| **delete button handler** | Deletes a place using `deletePlaceById()` API, updates centralized cache, and shows confirmation or error modal. |
| **Event Bus Listener** | Listens for `places-updated` events to refresh the current route's places dynamically. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Page Initialization
initializePlaceManagement()
        │
        ├── Get DOM elements
        ├── Render all routes → renderRoutes()
        ├── Render places for selected route → renderPlaces(routeId)
        └── Bind event listeners

2️⃣ Adding a Place
[User clicks Add Place]
        │
        ├── Validate route and place name
        ├── Call addPlace(routeId, placeName)
        ├── Update centralized cache → addPlaceToCache()
        └── Re-render places list + show modal

3️⃣ Deleting a Place
[User clicks Delete]
        │
        ├── Show confirmation modal
        ├── Call deletePlaceById(placeId)
        ├── Update cache (optionally remove from cache)
        └── Remove card from DOM + show confirmation modal

4️⃣ Dropdown & Event-Bus Updates
routeSelect change → renderPlaces(newRouteId)
places-updated event → renderPlaces(updatedRouteId)
