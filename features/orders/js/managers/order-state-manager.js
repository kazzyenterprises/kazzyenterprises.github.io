// features/orders/js/managers/OrderStateManager.js

import { saveDraftOrder, loadDraftOrder } from '../../../../shared/logic/api/orders/draft-service.js';
import { updateGrandTotal } from '../../../../shared/utils/js/dom-helpers.js';

/**
 * Manages the client-side state of a new order (draft order).
 * Encapsulates state manipulation, persistence, and total calculations.
 */
export class OrderStateManager {
    constructor() {
        this.state = {
            routeId: "",
            placeId: "",
            placeName: "",
            shopId: "",
            shopName: "",
            deliveryDate: "",
            rows: [] // Draft rows from the table
        };
    }

    /**
     * Initializes the state by attempting to load a saved draft.
     * @returns {Promise<boolean>} True if a draft was loaded, false otherwise.
     */
    async initializeState() {
        const draft = await loadDraftOrder();
        if (draft) {
            this.state = draft;
            return true;
        }
        return false;
    }

    /**
     * Updates a single property in the internal state.
     * @param {string} key - The state property key.
     * @param {*} value - The new value.
     */
    updateState(key, value) {
        if (key in this.state) {
            this.state[key] = value;
        }
    }

    getState() {
        return this.state;
    }

    /**
     * Gathers the current order rows from the live DOM table.
     * NOTE: This is a necessary coupling point to the DOM to read draft data.
     * @returns {Array<object>} Array of item rows.
     */
    getDraftRowsFromDOM() {
        const rows = [];
        // Requires the DOM to be passed in or assumed globally/as a reference. 
        // For simplicity in this refactor, we'll assume the DOM access is managed by the controller 
        // and passed to us, OR we access globally if using native methods.
        // Let's stick to reading the DOM directly, but this is the least "pure" method.
        document.querySelectorAll("tr.order-category").forEach(tr => {
            const selects = tr.querySelectorAll("select");
            const inputs = tr.querySelectorAll("input");
            const productCategory = selects[0]?.value || "";
            const productName = selects[1]?.value || "";
            const orderQuantity = parseInt(inputs[0]?.value, 10) || 0;
            const sellingPrice = parseFloat(inputs[1]?.value) || 0;
            const mrp = parseFloat(inputs[2]?.value) || 0;

            if (productName && orderQuantity > 0) {
                rows.push({
                    productCategory,
                    productName,
                    orderQuantity,
                    sellingPrice,
                    mrp,
                    lineTotal: orderQuantity * sellingPrice
                });
            }
        });
        return rows;
    }

    /**
     * Updates state from DOM and persists it to local storage.
     * @param {object} DOM - The DOM object references.
     */
    async persistDraft(DOM) {
        this.state.rows = this.getDraftRowsFromDOM();

        // The saveDraftOrder utility requires the DOM elements to get current values for persistence metadata
        await saveDraftOrder(
            this.state, 
            DOM.routeSelect, 
            DOM.placeSelect, 
            DOM.shopSelect, 
            DOM.deliveryDateInput
        );
        
        // Update the total cell in the DOM
        updateGrandTotal(DOM, this.state);
    }
}