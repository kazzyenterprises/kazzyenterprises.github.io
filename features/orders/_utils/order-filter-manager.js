// features/orders/js/managers/order-filter-manager.js

import { fetchOrders } from '../../../shared/api/orders/order-service.js';
import { normalizeOrderId, isValidOrderId } from '../../../shared/utils/id-generator.js';

/**
 * Manages the logic for filtering and fetching orders on the Edit Order page.
 * It's responsible for converting DOM values into a valid Firestore query payload.
 */
export class OrderFilterManager {
    /**
     * @param {object} DOM - Reference to the page's DOM elements (filter inputs).
     */
    constructor(DOM) {
        this.DOM = DOM || {};
    }

    // small helper to safely query an element by id (fall back to previously provided ref)
    _safeEl(ref, id) {
        if (ref) return ref;
        if (!id) return null;
        return document.getElementById(id);
    }

    getFilters() {
        const rawOrderId = (this.DOM.filterOrderId && this.DOM.filterOrderId.value) ? this.DOM.filterOrderId.value.trim() : '';
        const normalizedOrderId = rawOrderId ? normalizeOrderId(rawOrderId) : "";

        if (normalizedOrderId && !isValidOrderId(normalizedOrderId)) {
            alert("⚠️ Invalid Order ID format. Use pattern like OCT04-0001.");
            if (this.DOM.filterOrderId && typeof this.DOM.filterOrderId.focus === 'function') this.DOM.filterOrderId.focus();
            return null;
        }

        if (this.DOM.filterOrderId) this.DOM.filterOrderId.value = normalizedOrderId;

        let dateFilter = null;
        const filterDateVal = (this.DOM.filterDate && this.DOM.filterDate.value) ? this.DOM.filterDate.value : null;
        if (filterDateVal) {
            const selected = new Date(filterDateVal);
            const startOfDay = new Date(selected.getTime());
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(selected.getTime());
            endOfDay.setHours(23, 59, 59, 999);

            dateFilter = { startOfDay, endOfDay };
        }

        return {
            orderId: normalizedOrderId || null,
            routeId: (this.DOM.filterRoute && this.DOM.filterRoute.value) ? this.DOM.filterRoute.value : null,
            placeId: (this.DOM.filterPlace && this.DOM.filterPlace.value) ? this.DOM.filterPlace.value : null,
            shopId: (this.DOM.filterShop && this.DOM.filterShop.value) ? this.DOM.filterShop.value : null,
            date: dateFilter,
        };
    }

    /**
     * Executes the order fetching based on current filter state.
     * @returns {Promise<Array>} A promise that resolves to the list of orders.
     */
    async fetchFilteredOrders() {
        const filters = this.getFilters();
        if (filters === null) return []; // Validation failed

        try {
            // Defensive writes: the DOM nodes may not exist yet (component injection timing)
            const ordersTableBody = this._safeEl(this.DOM.ordersTableBody, 'orders-table-body');
            const editOrderCard = this._safeEl(this.DOM.editOrderCard, null); // already a node usually
            const ordersCount = this._safeEl(this.DOM.ordersCount, 'orders-count');

            if (ordersTableBody) ordersTableBody.innerHTML = "";
            if (editOrderCard) editOrderCard.style.display = "none";
            if (ordersCount) ordersCount.textContent = "";

            const orders = await fetchOrders(filters);
            return orders || [];
        } catch (err) {
            console.error("Order Filter Manager Error:", err);
            alert("Failed to fetch orders. Check console.");
            return [];
        }
    }
}
