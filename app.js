import { renderSidebar, initializeMenuToggle, initializeSidebarAccordion } from './shared/core/sidebar.js';
import { initializeRouter } from './shared/core/router.js';
import { app as firebaseApp, db } from './shared/api/config/firebase.js'; // Corrected shared path based on your structure

// ✅ Import all feature entry points so they can register routes
import './features/orders/order-index.js';
import './features/errors/errors-index.js';
import './features/dashboard/dashboard-index.js'; // <-- CORRECTED PATH/NAME
//import './features/products/index.js';
import './features/shops/shops-index.js';
import './features/products/product-index.js';
import './features/delivery/delivery-index.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Firebase App & Firestore ready:", firebaseApp, db);

        // Initialize UI Components
        renderSidebar();
        initializeMenuToggle();
        initializeSidebarAccordion();

        // Initialize Router (after routes are registered)
        initializeRouter(firebaseApp);
    } catch (e) {
        console.error("App Initialization Error:", e);
        document.getElementById('main-content-area').innerHTML =
            `<h1>Initialization Error</h1><p>Check console for details.</p>`;
    }
});
