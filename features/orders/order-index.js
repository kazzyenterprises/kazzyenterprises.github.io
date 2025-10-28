// features/orders/index.js

/**
 * Orders Feature Entry
 * - Registers routes
 * - Lazy-loads pages
 * - Subscribes to order-related events
 */

import { registerRoute } from "../../shared/core/router.js";
import { loadComponent } from "../../shared/components/component-loader.js";
// Assuming you have an EventBus implementation
// import { EventBus } from "../../shared/js/store/event-bus.js"; 

/* -----------------------------
    ROUTE REGISTRATION
------------------------------*/

// #orders/new-order
// features/orders/index.js

// #orders/new-order
registerRoute("orders/new-order", async () => {
    console.log('registered. orders')
    
    // TEMPORARY BYPASS OF loadComponent
    const contentArea = document.getElementById('main-content-area');
    await loadComponent("features/orders/new-order/new-order-page.html", "main-content-area");
    
    try {
        // FIX: Using the ABSOLUTE (root-relative) path for the dynamic import.
        const { initializeOrderPage } = await import("/features/orders/new-order/new-order-page.js"); 
        
        initializeOrderPage();
        document.title = 'New  Order Page';
        console.log("[Orders] New Order Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Orders] Failed to import or initialize new-order.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load new order logic. Error: ${e.message}</p>`;
    }
});
// #orders/edit-orders
registerRoute("orders/edit-orders", async () => {
    await loadComponent("features/orders/edit-order/edit-orders-page.html", "main-content-area");

    try {
        // 2. FIX: Use the ABSOLUTE (root-relative) path for the dynamic import.
        const { initializeEditOrdersPage } = await import("/edit-order/edit-orders-page.js");
        
        initializeEditOrdersPage();
        document.title = 'Edit Order Page';
        console.log("[Orders] Edit Order Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Orders] Failed to import or initialize edit-order.js:", e);
        document.getElementById('main-content-area').innerHTML += `<p class="error">Failed to load edit logic. Error: ${e.message}</p>`;
    }
});

/* -----------------------------
    EVENT SUBSCRIPTIONS (Example)
------------------------------*/

/*
// Example: refresh orders when a new order is created
EventBus.on("order:refresh", () => {
    console.log("[Orders] Refreshing orders table...");
    // Here you could call a function to reload the table
});
*/

/* -----------------------------
    FEATURE EXPORT (Optional)
------------------------------*/

export const OrdersFeature = {
    name: "Orders",
    routes: ["orders/new-order", "orders/edit-orders"],

};


