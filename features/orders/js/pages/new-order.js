// features/orders/js/pages/new-order.js
// Entry point for the New Order Feature

import { NewOrderController } from '../controllers/new-order-controller.js';

// NOTE: All shared imports, state, and functions have been moved to the Controller/Manager.

/**
 * SPA entry point for the New Order page.
 * Instantiates the controller and starts the process.
 */
export async function initializeOrderPage() {
    const controller = new NewOrderController();
    await controller.init(); 
}