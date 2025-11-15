/**
 * Delivery Feature Entry
 * - Registers delivery-related routes
 * - Lazy-loads pages
 * - Initializes delivery page JS
 */

import { registerRoute } from "../../shared/core/router.js";
import { loadComponent } from "../../shared/components/component-loader.js";

/* -----------------------------
   ROUTE REGISTRATION
------------------------------*/

// #delivery/delivery-plan
registerRoute("delivery/delivery-plan", async () => {
    const contentArea = document.getElementById('main-content-area');
    await loadComponent("features/delivery/delivery-plan/delivery-plan-page.html", "main-content-area");

    try {
        const { initializeDeliveryPlanPage } = await import("/features/delivery/delivery-plan/delivery-plan-page.js");
        initializeDeliveryPlanPage();
        document.title = "Delivery Plan";
        console.log("[Delivery] Delivery Plan Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Delivery] Failed to import or initialize delivery-plan-page.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load Delivery Plan logic. Error: ${e.message}</p>`;
    }
});

// #delivery/delivery-orders
registerRoute("delivery/delivery-orders", async () => {
    const contentArea = document.getElementById('main-content-area');
    await loadComponent("features/delivery/delivery-orders/delivery-orders-page.html", "main-content-area");

    try {
        const { initializeDeliveryOrdersPage } = await import("/features/delivery/delivery-orders/delivery-orders-page.js");
        initializeDeliveryOrdersPage();
        document.title = "Delivery Orders";
        console.log("[Delivery] Delivery Orders Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Delivery] Failed to import or initialize delivery-orders-page.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load Delivery Orders logic. Error: ${e.message}</p>`;
    }
});

/* -----------------------------
   OPTIONAL: EventBus subscriptions
------------------------------*/

/*
// Example: refresh deliveries on update
EventBus.on("delivery:refresh", () => {
    console.log("[Delivery] Refreshing delivery list...");
});
*/

/* -----------------------------
   FEATURE EXPORT
------------------------------*/
export const DeliveryFeature = {
    name: "Delivery",
    routes: ["delivery/delivery-plan", "delivery/delivery-orders"]
};
