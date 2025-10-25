kazzy-enterprises/
│
├── index.html                      <-- SPA entry point
├── app.js                          <-- Global app initializer (bootstraps router, sidebar, event-bus)
│
├── assets/                         <-- Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── features/                       <-- Feature-based modules
│   │
│   ├── products/
│   │   ├── html/
│   │   │   ├── pages/
│   │   │   │   └── products-management.html
│   │   │   └── components/
│   │   │       └── product-form.html          <-- Optional reusable HTML template
│   │   ├── css/
│   │   │   ├── pages/
│   │   │   │   └── products-management.css
│   │   │   └── components/
│   │   │       └── product-card.css
│   │   ├── js/
│   │   │   ├── pages/
│   │   │   │   └── products-management.js
│   │   │   └── components/
│   │   │       ├── product-card.js
│   │   │       └── product-form.js
│   │   └── index.js                         <-- Entry for this feature (registers routes/events)
│   │
│   ├── shops/
│   │   ├── html/
│   │   │   ├── pages/
│   │   │   │   ├── shop-management.html
│   │   │   │   ├── shop-directory.html
│   │   │   │   └── places-management.html
│   │   │   └── components/
│   │   │       ├── route-selector.html
│   │   │       └── place-card.html
│   │   ├── css/
│   │   │   ├── pages/
│   │   │   │   ├── shop-management.css
│   │   │   │   ├── shop-directory.css
│   │   │   │   └── places-management.css
│   │   │   └── components/
│   │   │       ├── shop-card.css
│   │   │       └── route-selector.css
│   │   ├── js/
│   │   │   ├── pages/
│   │   │   │   ├── shop-management.js
│   │   │   │   ├── shop-directory.js
│   │   │   │   └── places-management.js
│   │   │   └── components/
│   │   │       ├── shop-card.js
│   │   │       ├── place-card.js
│   │   │       └── route-selector.js
│   │   └── index.js
│   │
│   └── orders/
│       ├── html/
│       │   ├── pages/
│       │   │   ├── new-order.html
│       │   │   └── edit-order.html
│       │   └── components/
│       │       └── order-table.html
│       ├── css/
│       │   ├── pages/
│       │   │   ├── new-order.css
│       │   │   └── edit-order.css
│       │   └── components/
│       │       └── order-table.css
│       ├── js/
│       │   ├── pages/
│       │   │   ├── new-order.js
│       │   │   └── edit-order.js
│       │   └── components/
│       │   |   └── order-table.js
│       │   ├── managers/
│       │   │   ├── order-filter-manager.js
│       │   │   └── order-state-manager.js
│       │   └── controllers/
│       │       └── edit-order-controller.js
│       │       └── new-order-controller.js
│       └── index.js
│
├── shared/                         <-- Cross-feature shared logic and assets
│   │
│   ├── logic/                      <-- All JS logic shared app-wide
│   │   ├── store/
│   │   │   ├── data-store.js       <-- Central cache/state (uses localStorage or memory)
│   │   │   └── event-bus.js        <-- Pub/Sub messaging between modules
│   │   │
│   │   ├── api/                    <-- Backend data access (Firestore abstraction)
│   │   │   ├── _config/
│   │   │   │   └── firebase.js     <-- Firebase app and db initialization
│   │   │   ├── orders/
│   │   │   │   ├── order-service.js
│   │   │   │   ├── edit-order-service.js
│   │   │   │   └── draft-service.js
│   │   │   ├── shops/
│   │   │   │   ├── place-service.js
│   │   │   │   ├── route-service.js
│   │   │   │   └── shop-service.js
│   │   │   └── products/
│   │   │       └── product-service.js
│   │   │
│   │   ├── utils/
│   │   │   ├── dom-helpers.js      <-- querySelector shortcuts, createEl, etc.
│   │   │   ├── modal-helper.js     <-- Modal open/close logic
│   │   │   ├── id-generator.js     <-- Auto ID builder for orders/products
│   │   │   └── component-loader.js <-- Dynamic component rendering (HTML fragments)
│   │   │
│   │   └── core/
│   │       ├── router.js           <-- SPA route handler (hash-based or pathname)
│   │       ├── sidebar.js          <-- Layout and navigation control
│   │       └── app-config.js       <-- Global constants (routes, version, etc.)
│   │
│   └── css/
│       ├── base.css                <-- Normalize, typography, global reset
│       ├── layout.css              <-- Layout grid, sidebar, header
│       └── components/
│           ├── button.css
│           ├── modal.css
│           ├── sidebar.css
│           └── table.css




| File                                  | Purpose                                          |
| ------------------------------------- | ------------------------------------------------ |
| `shared/logic/core/app-config.js`     | Central config (version, constants, base routes) |
| `shared/logic/utils/http-helper.js`   | Optional fetch wrapper for REST APIs             |
| `shared/logic/utils/logger.js`        | Central logging with debug toggles               |
| `shared/logic/store/cache-service.js` | Optional cache layer for large data sets         |
| `shared/css/layout.css`               | Sidebar + content-area global structure          |
| `shared/css/components/modal.css`     | For popup/dialog reusability                     |
