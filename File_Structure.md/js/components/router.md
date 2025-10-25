# router.js — *Client-Side Router for SPA Navigation*
**Location:** `js/components/router.js`

---

## ⚙️ Core Responsibilities

| Function / Section | Description |
|--------------------|-------------|
| **ROUTES Configuration** | Defines route paths, corresponding HTML templates, document titles, and initialization callbacks for each page (e.g., products, orders, shops, etc.). |
| **loadContent(route)** | Dynamically fetches and injects the HTML template for the selected route into the main content area. Executes the page’s initialization function once loaded. |
| **initializeRouter(appInstance)** | Bootstraps the router, listens to URL hash changes, and ensures the correct content is displayed. Also closes sidebar on mobile after navigation. |
| **Dynamic Title & Error Handling** | Updates the browser tab title and displays appropriate error messages for missing templates or fetch errors. |
| **Firebase App Integration** | Passes the Firebase app instance to page initializers that require it (e.g., for data fetching or Firestore operations). |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Initialization
initializeRouter(appInstance)
        │
        ├── Stores Firebase instance
        ├── Watches window.location.hash
        └── Calls → handleRouteChange()

2️⃣ Route Change
handleRouteChange()
        │
        ├── Extracts route from URL hash
        ├── Calls → loadContent(route)
        └── Collapses sidebar (mobile UX)

3️⃣ Load Page Content
loadContent(route)
        │
        ├── Looks up ROUTES[route] config
        ├── Fetches HTML template (via fetch)
        ├── Injects template → #main-content-area
        ├── Updates document title
        └── Executes routeConfig.onLoad(firebaseApp)

4️⃣ Error Handling
If route or template fails:
        └── Display 404-style message with error details
