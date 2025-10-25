
// features/orders/js/controllers/EditOrderController.js

import { OrderFilterManager } from '../managers/order-filter-manager.js';
import { getRoutes, getPlaces, getShops } from '../../../../shared/logic/store/data-store.js';
import { getOrderById } from '../../../../shared/logic/api/orders/order-service.js';
import { updateOrderStandalone, deleteOrderStandalone } from '../../../../shared/logic/api/orders/edit-order-service.js';
import { loadOrderTableComponent } from '../../../../shared/utils/js/component-loader.js';
import { normalizeOrderId } from '../../../../shared/utils/js/id-generator.js';
import { loadOrderTableComponent } from '../../../../shared/utils/js/order-list-table.js';

export class EditOrderController {
    constructor() {
        this.DOM = this._getDOMElements();
        this.filterManager = new OrderFilterManager(this.DOM);
        this.selectedOrder = null;

        this.filterManager = new OrderFilterManager(/* ... */);

        // 2. Load and Instantiate the Order Table Component for the List
        this.orderTableComponent =  loadOrderTableComponent(
            "orders-list-table-container", 
            this._loadOrderForEdit.bind(this), // Pass the callback for edit button
            this._handleDeleteOrder.bind(this) // Pass the callback for delete button
        );
        
        // Initial load of orders
        this._handleFilterOrders()
    }

    _getDOMElements() {
        return {
            filterOrderId: document.getElementById("filter-order-id"),
            filterRoute: document.getElementById("filter-route"),
            filterPlace: document.getElementById("filter-place"),
            filterShop: document.getElementById("filter-shop"),
            filterDate: document.getElementById("filter-date"),
            btnFilterOrders: document.getElementById("btn-filter-orders"),
            btnClearAll: document.getElementById("btn-clear-all"),
            ordersTableBody: document.getElementById("orders-table-body"),
            ordersCount: document.getElementById("orders-count"),
            editOrderCard: document.querySelector(".edit-order-card"),
            editOrderId: document.getElementById("edit-order-id"),
            customerInput: document.getElementById("customer-input"),
            routeSelect: document.getElementById("route-select"),
            placeSelect: document.getElementById("place-select"),
            shopSelect: document.getElementById("shop-select"),
            orderDateInput: document.getElementById("order-date-input"),
            deliveryDateInput: document.getElementById("delivery-date-input"),
            statusSelect: document.getElementById("status-select"),
            orderTotal: document.getElementById("order-total"),
            itemCount: document.getElementById("item-count"),
            updateBtn: document.getElementById("update-order-btn"),
            deleteBtn: document.getElementById("delete-order-btn"),
            sharedContainer: document.getElementById("shared-order-table-container"),
            orderItemsBody: null, // Populated after component load
            grandTotal: null,     // Populated after component load
            addProductBtn: null   // Populated after component load
        };
    }

    async init() {
        await this._loadFilterRoutes();
        // Load initial routes for the edit form
        await this._loadEditFormRoutes(); 
        this._setupEventListeners();

        // Run exclusion logic initially
        this._updateFilterExclusions();

        // Optional preselected dropdowns for filter section
        if (this.DOM.filterRoute.value) await this._loadFilterPlaces(this.DOM.filterRoute.value);
        if (this.DOM.filterPlace.value) await this._loadFilterShops(this.DOM.filterPlace.value);
    }

    // --- Core Setup ---

    _setupEventListeners() {
        this._setupClearButtons();

        // Filter Dropdowns: Dependent dropdown logic
        // Also call _updateFilterExclusions on filter change
        this.DOM.filterRoute.addEventListener("change", (e) => {
            this._handleRouteFilterChange(e);
            this._updateFilterExclusions();
        });
        this.DOM.filterPlace.addEventListener("change", (e) => {
            this._handlePlaceFilterChange(e);
            this._updateFilterExclusions();
        });
        this.DOM.filterShop.addEventListener("change", this._updateFilterExclusions.bind(this));
        this.DOM.filterDate.addEventListener("change", this._updateFilterExclusions.bind(this));

        // Edit Form Dropdowns: Permanent event listeners for dependent selects
        this.DOM.routeSelect.addEventListener("change", this._handleEditRouteChange.bind(this));
        this.DOM.placeSelect.addEventListener("change", this._handleEditPlaceChange.bind(this));

        // Main actions
        this.DOM.btnFilterOrders.addEventListener("click", this._handleFilterOrders.bind(this));
        this.DOM.updateBtn.addEventListener("click", this._handleUpdateOrder.bind(this));
        this.DOM.deleteBtn.addEventListener("click", this._handleDeleteOrder.bind(this));

        // Auto-format/search Order ID
        this.DOM.filterOrderId.addEventListener("blur", () => {
            this._handleOrderIdBlur();
            this._updateFilterExclusions();
        });
        this.DOM.filterOrderId.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this._handleFilterOrders();
        });
        this.DOM.filterOrderId.addEventListener("input", this._updateFilterExclusions.bind(this));
    }

    _setupClearButtons() {
        document.querySelectorAll(".clear-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.dataset.clearFor;
                switch (target) {
                    case "order-id": this.DOM.filterOrderId.value = ""; break;
                    case "route":
                        this.DOM.filterRoute.value = "";
                        this._loadFilterPlaces("");
                        this.DOM.filterShop.innerHTML = "<option value=''>All Shops</option>";
                        break;
                    case "place":
                        this.DOM.filterPlace.value = "";
                        this.DOM.filterShop.innerHTML = "<option value=''>All Shops</option>";
                        break;
                    case "shop": this.DOM.filterShop.value = ""; break;
                    case "date": this.DOM.filterDate.value = ""; break;
                }
                this._updateFilterExclusions(); // Re-run exclusion logic after clearing
            });
        });

        this.DOM.btnClearAll.addEventListener("click", () => {
            this.DOM.filterOrderId.value = this.DOM.filterRoute.value = this.DOM.filterPlace.value = this.DOM.filterShop.value = this.DOM.filterDate.value = "";
            this.DOM.ordersTableBody.innerHTML = "";
            this.DOM.editOrderCard.style.display = "none";
            this.selectedOrder = null; // Clear selected order on clearing everything
            if (this.DOM.ordersCount) this.DOM.ordersCount.textContent = "";
            this._updateFilterExclusions(); // Re-run exclusion logic after clearing all
        });
    }

    // --- Filter Exclusion Logic ---
    _updateFilterExclusions() {
        const orderIdPresent = !!this.DOM.filterOrderId.value.trim();
        const datePresent = !!this.DOM.filterDate.value;
        const locationPresent = !!this.DOM.filterRoute.value || !!this.DOM.filterPlace.value || !!this.DOM.filterShop.value;

        // Collect all filter fields that participate in the exclusion
        const allFilters = [
            this.DOM.filterRoute,
            this.DOM.filterPlace,
            this.DOM.filterShop,
            this.DOM.filterDate,
        ];
        
        // D. No filter is present (Initial state / everything is cleared)
        // Enable all fields by default
        this.DOM.filterOrderId.disabled = false;
        allFilters.forEach(el => el.disabled = false);

        if (orderIdPresent) {
            // A. Order ID is present
            // Disable R, P, S, D
            allFilters.forEach(el => el.disabled = true);
            this.DOM.filterOrderId.disabled = false;
        } else if (datePresent) {
            // B. Date is present
            // Disable OID, R, P, S
            this.DOM.filterOrderId.disabled = true;
            [this.DOM.filterRoute, this.DOM.filterPlace, this.DOM.filterShop].forEach(el => el.disabled = true);
            this.DOM.filterDate.disabled = false;
        } else if (locationPresent) {
            // C. Route, Place, or Shop is present
            // Disable OID
            this.DOM.filterOrderId.disabled = true;
            [this.DOM.filterRoute, this.DOM.filterPlace, this.DOM.filterShop, this.DOM.filterDate].forEach(el => el.disabled = false);
        }
    }
    // -----------------------------

    // --- Date/Helper ---

    _formatOrderDate(ts) {
        if (!ts) return "";
        if (typeof ts.toDate === "function") return ts.toDate().toISOString().split("T")[0];
        if (ts instanceof Date) return ts.toISOString().split("T")[0];
        return new Date(ts).toISOString().split("T")[0];
    }

    // --- Filter Dropdown Loaders ---

    async _loadFilterRoutes() {
        const routes = await getRoutes();
        this.DOM.filterRoute.innerHTML =
            "<option value=''>All Routes</option>" +
            routes.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
    }

    async _loadFilterPlaces(routeId) {
        if (!routeId) {
            this.DOM.filterPlace.innerHTML = "<option value=''>Select route first</option>";
            return;
        }
        const places = await getPlaces(routeId);
        this.DOM.filterPlace.innerHTML = places.length
            ? "<option value=''>All Places</option>" + places.map(p => `<option value="${p.id}">${p.name}</option>`).join("")
            : "<option value=''>No places found</option>";
    }

    async _loadFilterShops(placeId) {
        if (!placeId) {
            this.DOM.filterShop.innerHTML = "<option value=''>Select place first</option>";
            return;
        }
        const shops = await getShops(placeId);
        this.DOM.filterShop.innerHTML = shops.length
            ? "<option value=''>All Shops</option>" + shops.map(s => `<option value="${s.id}">${s.name}</option>`).join("")
            : "<option value=''>No shops found</option>";
    }

    async _handleRouteFilterChange() {
        // This is now called via the event listener which passes the event, but we can ignore it for the async calls
        await this._loadFilterPlaces(this.DOM.filterRoute.value);
        this.DOM.filterShop.innerHTML = "<option value=''>Select place first</option>";
    }

    async _handlePlaceFilterChange() {
        // This is now called via the event listener which passes the event, but we can ignore it for the async calls
        await this._loadFilterShops(this.DOM.filterPlace.value);
    }
    
    _handleOrderIdBlur() {
        const raw = this.DOM.filterOrderId.value.trim();
        if (raw) this.DOM.filterOrderId.value = normalizeOrderId(raw);
    }

    // --- Edit Form Dropdown Loaders and Handlers ---

    async _loadEditFormRoutes() {
        const routes = await getRoutes();
        this.DOM.routeSelect.innerHTML = 
            "<option value=''>Select Route</option>" + 
            routes.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
    }

    /**
     * Loads places into the edit form's place dropdown.
     * @param {string} routeId - The ID of the selected route.
     * @param {boolean} [isInitialLoad=false] - True if loading for a selected order, allowing the value to be set.
     */
    async _loadPlacesDropdown(routeId, isInitialLoad = false) {
        if (!routeId) {
            this.DOM.placeSelect.innerHTML = "<option value=''>Select Route first</option>";
            return;
        }
        const places = await getPlaces(routeId);
        this.DOM.placeSelect.innerHTML = places.length
            ? "<option value=''>Select Place</option>" + places.map(p => `<option value="${p.id}">${p.name}</option>`).join("")
            : "<option value=''>No places found</option>";
        
        if (isInitialLoad && this.selectedOrder) {
             this.DOM.placeSelect.value = this.selectedOrder.placeId || "";
        }
    }

    /**
     * Loads shops into the edit form's shop dropdown.
     * @param {string} placeId - The ID of the selected place.
     * @param {boolean} [isInitialLoad=false] - True if loading for a selected order, allowing the value to be set.
     */
    async _loadShopsDropdown(placeId, isInitialLoad = false) {
        if (!placeId) {
            this.DOM.shopSelect.innerHTML = "<option value=''>Select Place first</option>";
            return;
        }
        const shops = await getShops(placeId);
        this.DOM.shopSelect.innerHTML = shops.length
            ? "<option value=''>Select Shop</option>" + shops.map(s => `<option value="${s.id}">${s.name}</option>`).join("")
            : "<option value=''>No shops found</option>";

        if (isInitialLoad && this.selectedOrder) {
            this.DOM.shopSelect.value = this.selectedOrder.shopId || "";
        }
    }

    async _handleEditRouteChange() {
        // When user changes the route, reset place/shop and load new places.
        this.DOM.placeSelect.value = "";
        this.DOM.shopSelect.innerHTML = "<option value=''>Select Place first</option>"; // Reset shops
        await this._loadPlacesDropdown(this.DOM.routeSelect.value);
    }

    async _handleEditPlaceChange() {
        // When user changes the place, load new shops.
        await this._loadShopsDropdown(this.DOM.placeSelect.value);
    }

    // --- Order Table Flow ---

    async _handleFilterOrders() {
        const orders = await this.filterManager.fetchFilteredOrders();
        if (!orders?.length) {
            this.DOM.ordersTableBody.innerHTML = "";
            this.DOM.editOrderCard.style.display = "none";
            if (this.DOM.ordersCount) this.DOM.ordersCount.textContent = "0 orders found";
            return alert("No orders found with these filters.");
        }

        this._renderOrdersTable(orders);
        this.DOM.editOrderCard.style.display = "none"; // Hide edit card when showing a list

        if (orders.length === 1) {
            await this._loadOrderForEdit(orders[0].id);
            if (this.DOM.ordersCount) this.DOM.ordersCount.textContent = "1 order found (auto-opened for editing)";
        } else {
            if (this.DOM.ordersCount) this.DOM.ordersCount.textContent = `${orders.length} orders found`;
        }
    }

    async _handleDeleteOrder(orderId) {
        // Note: The confirmation is handled inside the component.
        await deleteOrderService(orderId); // Call the shared API service
        this._handleFilterOrders(); // Re-fetch and re-render the list
    }

    _renderOrdersTable(orders) {
        // The component handles rendering the list
        this.orderTableComponent.render(orders);
    }

    async _loadOrderForEdit(orderId) {
        this.selectedOrder = await getOrderById(orderId);
        if (!this.selectedOrder) return alert("Order not found!");

        // Load reusable order table component and update DOM refs
        const tableRefs = await loadOrderTableComponent("shared-order-table-container");
        this.DOM.orderItemsBody = tableRefs.orderItemsBody;
        this.DOM.grandTotal = tableRefs.grandTotal;
        this.DOM.addProductBtn = tableRefs.addProductBtn;
        
        // Load dependent dropdowns and set the selected values (isInitialLoad = true)
        this.DOM.routeSelect.value = this.selectedOrder.routeId || "";
        await this._loadPlacesDropdown(this.selectedOrder.routeId, true);
        await this._loadShopsDropdown(this.selectedOrder.placeId, true);
        // Note: Event listeners for routeSelect/placeSelect are in _setupEventListeners

        this.DOM.editOrderCard.style.display = "block";
        this.DOM.editOrderId.textContent = this.selectedOrder.id;
        this.DOM.customerInput.value = this.selectedOrder.customerName || "";
        this.DOM.orderDateInput.value = this._formatOrderDate(this.selectedOrder.orderDate);
        this.DOM.deliveryDateInput.value = this._formatOrderDate(this.selectedOrder.deliveryDate);
        this.DOM.statusSelect.value = this.selectedOrder.status || "pending";

        this._renderOrderItems(this.selectedOrder.items || []);
    }

    /**
     * Calculates the total price of all items and updates the total display elements.
     * @param {Array<Object>} items - The list of order items.
     */
    _calculateAndRenderTotal(items) {
        let total = 0;
        items.forEach(item => {
            total += (item.orderQuantity || 0) * (item.sellingPrice || 0);
        });
        
        // Update total display elements
        this.DOM.itemCount.textContent = items.length;
        this.DOM.orderTotal.textContent = total.toFixed(2);
        if (this.DOM.grandTotal) this.DOM.grandTotal.textContent = `Total: ₹${total.toFixed(2)}`;
    }

    _renderOrderItems(items) {
        if (!this.DOM.orderItemsBody) return console.warn("Order table not loaded yet!");
        
        this.DOM.orderItemsBody.innerHTML = ""; 

        items.forEach((item, idx) => {
            const tr = document.createElement("tr");
            
            const subtotal = (item.orderQuantity || 0) * (item.sellingPrice || 0);

            tr.innerHTML = `
                <td>${item.productCategory}</td>
                <td>${item.productName}</td>
                <td><input type="number" value="${item.orderQuantity}" min="1"></td>
                <td><input type="number" value="${item.sellingPrice}" min="0" step="0.01"></td>
                <td>₹${item.mrp?.toFixed(2) || 0}</td>
                <td><button class="delete-btn">🗑️</button></td>`;

            this.DOM.orderItemsBody.appendChild(tr);

            const quantityInput = tr.cells[2].querySelector("input");
            const priceInput = tr.cells[3].querySelector("input");
            const subtotalCell = tr.cells[5]; 

            const recalc = () => {
                // 1. Mutate the item object directly for persistence
                item.orderQuantity = Number(quantityInput.value);
                item.sellingPrice = Number(priceInput.value);
                
                // 2. Recalculate and update the subtotal for *this* row only
                const newSubtotal = (item.orderQuantity || 0) * (item.sellingPrice || 0);
                subtotalCell.textContent = `₹${newSubtotal.toFixed(2)}`; 
                
                // 3. Recalculate and update the overall grand total (efficiently)
                this._calculateAndRenderTotal(items);
            };

            quantityInput.addEventListener("input", recalc);
            priceInput.addEventListener("input", recalc);

            tr.querySelector(".delete-btn").addEventListener("click", () => {
                // Note: The delete button logic still requires re-rendering to correctly update the array index (idx)
                items.splice(idx, 1);
                this._renderOrderItems(items);
            });
        });

        this._calculateAndRenderTotal(items);
    }

    // --- Update / Delete ---
    
    async _handleUpdateOrder() {
        if (!this.selectedOrder) return alert("No order selected!");

        // Gather updated items from table inputs
        const updatedItems = Array.from(this.DOM.orderItemsBody.rows).map(row => {
            // Cell indices: Category(0), Name(1), Quantity(2), Price(3), MRP(4)
            return {
                productCategory: row.cells[0].textContent,
                productName: row.cells[1].textContent,
                orderQuantity: Number(row.cells[2].querySelector("input").value),
                sellingPrice: Number(row.cells[3].querySelector("input").value),
                mrp: Number(row.cells[4].textContent.replace("₹","")) || 0
            };
        });

        const updatedOrderData = {
            customerName: this.DOM.customerInput.value,
            routeId: this.DOM.routeSelect.value,
            placeId: this.DOM.placeSelect.value,
            shopId: this.DOM.shopSelect.value,
            // Ensure dates are valid
            orderDate: this.DOM.orderDateInput.value ? new Date(this.DOM.orderDateInput.value) : null,
            deliveryDate: this.DOM.deliveryDateInput.value ? new Date(this.DOM.deliveryDateInput.value) : null,
            status: this.DOM.statusSelect.value,
            items: updatedItems
        };
        
        // Basic validation for required fields
        if (!updatedOrderData.routeId || !updatedOrderData.placeId || !updatedOrderData.shopId) {
             return alert("⚠️ Please select a **Route**, **Place**, and **Shop** before updating.");
        }
        if (!updatedItems.length) {
             return alert("⚠️ Order must contain at least one item.");
        }

        try {
            await updateOrderStandalone(this.selectedOrder.id, updatedOrderData);
            alert("✅ Order updated successfully!");
            // Refresh table and re-open the updated order for immediate review
            await this._handleFilterOrders(); 
        } catch (err) {
            console.error("Update Order Error:", err);
            alert("⚠️ Failed to update order. Check console.");
        }
    }

    async _handleDeleteOrder() {
        if (!this.selectedOrder) return;
        if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;

        try {
            await deleteOrderStandalone(this.selectedOrder.id);
            this.DOM.editOrderCard.style.display = "none";
            this.selectedOrder = null; // Clear selected order
            alert("🗑️ Order deleted successfully!");
            await this._handleFilterOrders(); // Refresh table
        } catch (err) {
            console.error("Delete Order Error:", err);
            alert("⚠️ Failed to delete order. Check console.");
        }
    }
}