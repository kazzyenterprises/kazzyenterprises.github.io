// features/orders/js/pages/edit-order.js
// Entry point for the Edit Orders Feature

import { EditOrderController } from './edit-order.controller.js';
// NOTE: All shared imports, state, and functions have been moved to the Controller/Manager.

/**
 * SPA entry point for the Edit Orders page.
 * Instantiates the controller and starts the process.
 */
export async function initializeEditOrdersPage() {
    const controller = new EditOrderController();
    await controller.init();
}