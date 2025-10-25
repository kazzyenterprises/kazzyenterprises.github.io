// features/orders/js/pages/new-order.js
// Entry point for the New Order Feature

import { NewOrderController } from './new-order.controller.js';
import { loadOrderItemTable } from '../../../shared/components/order-item-table/order-item-table.component.js';
// NOTE: All shared imports, state, and functions have been moved to the Controller/Manager.

/**
 * SPA entry point for the New Order page.
 * Instantiates the controller and starts the process.
 */

// new-order.js
export async function initializeOrderPage() {
    console.log('bug here')
    await loadOrderItemTable('order-item-table-container');
    console.log('bug finished') // HTML is loaded/inserted here
    const controller = new NewOrderController(); // Controller is instantiated here (calls _getDOMElements)
    await controller.init(); // Controller logic runs here
}