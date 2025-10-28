// features/orders/js/controllers/EditOrderController.js

import { OrderFilterManager } from './utils/order-filter-manager.js';
import { getRoutes, getPlaces, getShops } from '../../../shared/store/data-store.js';
import { getOrderById } from '../../../shared/api/orders/order-service.js';
import { updateOrderStandalone, deleteOrderStandalone as deleteOrderService } from '../../../shared/api/orders/edit-order-service.js';
import { normalizeOrderId } from '../../../shared/utils/id-generator.js';

// NEW components (make sure these files exist and export the functions below)
import { loadOrdersListTable } from '../../../shared/components/order-list-table/orders-list-table-component.js';
import { loadOrderItemTable } from '../../../shared/components/order-item-table/order-item-table-component.js';

export class EditOrderController {
  // Instances of the two components
  ordersListComponent = null;
  orderItemTable = null;

  constructor() {
    // --- SYNCHRONOUS SETUP ONLY ---
    this.DOM = this._getDOMElements();
    // Initialize the filter manager only once
    this.filterManager = new OrderFilterManager(this.DOM);
    this.selectedOrder = null;

    this._setupEventListeners();
  }

  /**
   * Initializes the controller, handling all asynchronous setup tasks.
   * This method MUST be called manually after creating the controller instance.
   */
    async init() {
    // 1. Load Filter/Edit Form Dropdowns
    await this._loadFilterRoutes();
    await this._loadEditFormRoutes();

    // 2. Load and Instantiate the Orders List Table Component
    this.ordersListComponent = await loadOrdersListTable(
      'orders-list-table-container',
      this._loadOrderForEdit.bind(this),
      this._handleListDelete.bind(this)
    );

    // Ensure DOM refs for orders table are now present for the manager
    this.DOM.ordersTableBody = document.getElementById('orders-table-body') || this.DOM.ordersTableBody;

    // 3. Initial Data Load — do not auto-fetch; wait for user action
    this._updateFilterExclusions(); // Apply exclusion logic
    if (this.ordersListComponent) this.ordersListComponent.render([]);
  }

  // --- DOM Methods ---
  _getDOMElements() {
    return {
      filterOrderId: document.getElementById('filter-order-id'),
      filterRoute: document.getElementById('filter-route'),
      filterPlace: document.getElementById('filter-place'),
      filterShop: document.getElementById('filter-shop'),
      filterDate: document.getElementById('filter-date'),
      btnFilterOrders: document.getElementById('btn-filter-orders'),
      btnClearAll: document.getElementById('btn-clear-all'),
      ordersTableBody: document.getElementById('orders-table-body'), // optional direct ref
      ordersCount: document.getElementById('orders-count'),
      editOrderCard: document.querySelector('.edit-order-card'),
      editOrderId: document.getElementById('edit-order-id'),
      customerInput: document.getElementById('customer-input'),
      routeSelect: document.getElementById('route-select'),
      placeSelect: document.getElementById('place-select'),
      shopSelect: document.getElementById('shop-select'),
      orderDateInput: document.getElementById('order-date-input'),
      deliveryDateInput: document.getElementById('delivery-date-input'),
      statusSelect: document.getElementById('status-select'),
      orderTotal: document.getElementById('order-total'),
      itemCount: document.getElementById('item-count'),
      updateBtn: document.getElementById('update-order-btn'),
      deleteBtn: document.getElementById('delete-order-btn'), // The delete button on the edit card
      sharedContainer: document.getElementById('shared-order-table-container'), // Container for item details
      // populated later by order-item-table
      orderItemsBody: null,
      grandTotal: null,
      addProductBtn: null
    };
  }

  // --- Core Setup ---
  _setupEventListeners() {
    this._setupClearButtons();

    // Filter Dropdowns
    if (this.DOM.filterRoute) this.DOM.filterRoute.addEventListener('change', (e) => {
      this._handleRouteFilterChange(e);
      this._updateFilterExclusions();
    });
    if (this.DOM.filterPlace) this.DOM.filterPlace.addEventListener('change', (e) => {
      this._handlePlaceFilterChange(e);
      this._updateFilterExclusions();
    });
    if (this.DOM.filterShop) this.DOM.filterShop.addEventListener('change', this._updateFilterExclusions.bind(this));
    if (this.DOM.filterDate) this.DOM.filterDate.addEventListener('change', this._updateFilterExclusions.bind(this));

    // Edit Form Dropdowns
    if (this.DOM.routeSelect) this.DOM.routeSelect.addEventListener('change', this._handleEditRouteChange.bind(this));
    if (this.DOM.placeSelect) this.DOM.placeSelect.addEventListener('change', this._handleEditPlaceChange.bind(this));

    // Main actions
    if (this.DOM.btnFilterOrders) this.DOM.btnFilterOrders.addEventListener('click', this._handleFilterOrders.bind(this));
    if (this.DOM.updateBtn) this.DOM.updateBtn.addEventListener('click', this._handleUpdateOrder.bind(this));
    if (this.DOM.deleteBtn) this.DOM.deleteBtn.addEventListener('click', this._handleEditCardDelete.bind(this));

    // Auto-format/search Order ID
    if (this.DOM.filterOrderId) {
      this.DOM.filterOrderId.addEventListener('blur', () => {
        this._handleOrderIdBlur();
        this._updateFilterExclusions();
      });
      this.DOM.filterOrderId.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this._handleFilterOrders();
      });
      this.DOM.filterOrderId.addEventListener('input', this._updateFilterExclusions.bind(this));
    }
  }

  _setupClearButtons() {
    document.querySelectorAll('.clear-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.clearFor;
        switch (target) {
          case 'order-id': if (this.DOM.filterOrderId) this.DOM.filterOrderId.value = ''; break;
          case 'route':
            if (this.DOM.filterRoute) this.DOM.filterRoute.value = '';
            this._loadFilterPlaces('');
            if (this.DOM.filterShop) this.DOM.filterShop.innerHTML = "<option value=''>All Shops</option>";
            break;
          case 'place':
            if (this.DOM.filterPlace) this.DOM.filterPlace.value = '';
            if (this.DOM.filterShop) this.DOM.filterShop.innerHTML = "<option value=''>All Shops</option>";
            break;
          case 'shop': if (this.DOM.filterShop) this.DOM.filterShop.value = ''; break;
          case 'date': if (this.DOM.filterDate) this.DOM.filterDate.value = ''; break;
        }
        this._updateFilterExclusions();
      });
    });

    if (this.DOM.btnClearAll) {
      this.DOM.btnClearAll.addEventListener('click', () => {
        if (this.DOM.filterOrderId) this.DOM.filterOrderId.value = '';
        if (this.DOM.filterRoute) this.DOM.filterRoute.value = '';
        if (this.DOM.filterPlace) this.DOM.filterPlace.value = '';
        if (this.DOM.filterShop) this.DOM.filterShop.value = '';
        if (this.DOM.filterDate) this.DOM.filterDate.value = '';

        if (this.DOM.ordersTableBody) this.DOM.ordersTableBody.innerHTML = '';
        if (this.DOM.editOrderCard) this.DOM.editOrderCard.style.display = 'none';
        this.selectedOrder = null;
        if (this.DOM.ordersCount) this.DOM.ordersCount.textContent = '';
        this._updateFilterExclusions();
        if (this.ordersListComponent) this.ordersListComponent.render([]);
      });
    }
  }

  // --- Filter Exclusion Logic ---
  _updateFilterExclusions() {
    const orderIdPresent = !!(this.DOM.filterOrderId && this.DOM.filterOrderId.value && this.DOM.filterOrderId.value.trim());
    const datePresent = !!(this.DOM.filterDate && this.DOM.filterDate.value);
    const locationPresent = !!(this.DOM.filterRoute && (this.DOM.filterRoute.value || this.DOM.filterPlace.value || this.DOM.filterShop.value));

    const allFilters = [
      this.DOM.filterRoute,
      this.DOM.filterPlace,
      this.DOM.filterShop,
      this.DOM.filterDate,
    ].filter(Boolean);

    // Default: Enable all
    if (this.DOM.filterOrderId) this.DOM.filterOrderId.disabled = false;
    allFilters.forEach(el => el.disabled = false);

    if (orderIdPresent) {
      allFilters.forEach(el => el.disabled = true);
      if (this.DOM.filterOrderId) this.DOM.filterOrderId.disabled = false;
    } else if (datePresent) {
      if (this.DOM.filterOrderId) this.DOM.filterOrderId.disabled = true;
      [this.DOM.filterRoute, this.DOM.filterPlace, this.DOM.filterShop].forEach(el => { if (el) el.disabled = true; });
      if (this.DOM.filterDate) this.DOM.filterDate.disabled = false;
    } else if (locationPresent) {
      if (this.DOM.filterOrderId) this.DOM.filterOrderId.disabled = true;
    }
  }

  // -----------------------------
  // --- Date/Helper ---
  _formatOrderDate(ts) {
    if (!ts) return '';
    if (typeof ts.toDate === 'function') return ts.toDate().toISOString().split('T')[0];
    if (ts instanceof Date) return ts.toISOString().split('T')[0];
    return new Date(ts).toISOString().split('T')[0];
  }

  // --- Filter Dropdown Loaders ---
  async _loadFilterRoutes() {
    const routes = await getRoutes();
    if (this.DOM.filterRoute) {
      this.DOM.filterRoute.innerHTML =
        "<option value=''>All Routes</option>" +
        routes.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    }
  }

  async _loadFilterPlaces(routeId) {
    if (!routeId) {
      if (this.DOM.filterPlace) this.DOM.filterPlace.innerHTML = "<option value=''>Select route first</option>";
      return;
    }
    const places = await getPlaces(routeId);
    if (this.DOM.filterPlace) {
      this.DOM.filterPlace.innerHTML = places.length
        ? "<option value=''>All Places</option>" + places.map(p => `<option value="${p.id}">${p.name}</option>`).join('')
        : "<option value=''>No places found</option>";
    }
  }

  async _loadFilterShops(placeId) {
    if (!placeId) {
      if (this.DOM.filterShop) this.DOM.filterShop.innerHTML = "<option value=''>Select place first</option>";
      return;
    }
    const shops = await getShops(placeId);
    if (this.DOM.filterShop) {
      this.DOM.filterShop.innerHTML = shops.length
        ? "<option value=''>All Shops</option>" + shops.map(s => `<option value="${s.id}">${s.name}</option>`).join('')
        : "<option value=''>No shops found</option>";
    }
  }

  async _handleRouteFilterChange() {
    if (!this.DOM.filterRoute) return;
    await this._loadFilterPlaces(this.DOM.filterRoute.value);
    if (this.DOM.filterShop) this.DOM.filterShop.innerHTML = "<option value=''>Select place first</option>";
  }

  async _handlePlaceFilterChange() {
    if (!this.DOM.filterPlace) return;
    await this._loadFilterShops(this.DOM.filterPlace.value);
  }

  _handleOrderIdBlur() {
    if (!this.DOM.filterOrderId) return;
    const raw = this.DOM.filterOrderId.value.trim();
    if (raw) this.DOM.filterOrderId.value = normalizeOrderId(raw);
  }

  // --- Edit Form Dropdown Loaders and Handlers ---
  async _loadEditFormRoutes() {
    const routes = await getRoutes();
    if (this.DOM.routeSelect) {
      this.DOM.routeSelect.innerHTML =
        "<option value=''>Select Route</option>" +
        routes.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    }
  }

  async _loadPlacesDropdown(routeId, isInitialLoad = false) {
    if (!routeId) {
      if (this.DOM.placeSelect) this.DOM.placeSelect.innerHTML = "<option value=''>Select Route first</option>";
      return;
    }
    const places = await getPlaces(routeId);
    if (this.DOM.placeSelect) {
      this.DOM.placeSelect.innerHTML = places.length
        ? "<option value=''>Select Place</option>" + places.map(p => `<option value="${p.id}">${p.name}</option>`).join('')
        : "<option value=''>No places found</option>";
    }
    if (isInitialLoad && this.selectedOrder && this.DOM.placeSelect) {
      this.DOM.placeSelect.value = this.selectedOrder.placeId || '';
    }
  }

  async _loadShopsDropdown(placeId, isInitialLoad = false) {
    if (!placeId) {
      if (this.DOM.shopSelect) this.DOM.shopSelect.innerHTML = "<option value=''>Select Place first</option>";
      return;
    }
    const shops = await getShops(placeId);
    if (this.DOM.shopSelect) {
      this.DOM.shopSelect.innerHTML = shops.length
        ? "<option value=''>Select Shop</option>" + shops.map(s => `<option value="${s.id}">${s.name}</option>`).join('')
        : "<option value=''>No shops found</option>";
    }
    if (isInitialLoad && this.selectedOrder && this.DOM.shopSelect) {
      this.DOM.shopSelect.value = this.selectedOrder.shopId || '';
    }
  }

  async _handleEditRouteChange() {
    if (this.DOM.placeSelect) this.DOM.placeSelect.value = '';
    if (this.DOM.shopSelect) this.DOM.shopSelect.innerHTML = "<option value=''>Select Place first</option>";
    await this._loadPlacesDropdown(this.DOM.routeSelect.value);
  }

  async _handleEditPlaceChange() {
    await this._loadShopsDropdown(this.DOM.placeSelect.value);
  }

  // --- Order Table Flow ---
  async _handleFilterOrders() {
    // fetchFilteredOrders is defensive now; it won't crash if DOM refs are absent
    const orders = await this.filterManager.fetchFilteredOrders();

    if (!orders?.length) {
      if (this.ordersListComponent) this.ordersListComponent.render([]);
      if (this.DOM.editOrderCard) this.DOM.editOrderCard.style.display = 'none';
      if (this.DOM.ordersCount) this.DOM.ordersCount.textContent = '0 orders found';
      return alert('No orders found with these filters.');
    }

    this._renderOrdersTable(orders);
    if (this.DOM.editOrderCard) this.DOM.editOrderCard.style.display = 'none';

    if (orders.length === 1) {
      await this._loadOrderForEdit(orders[0].id);
      if (this.DOM.ordersCount) this.DOM.ordersCount.textContent = '1 order found (auto-opened for editing)';
    } else {
      if (this.DOM.ordersCount) this.DOM.ordersCount.textContent = `${orders.length} orders found`;
    }
  }

  async _handleListDelete(orderId) {
    if (!confirm(`Are you sure you want to delete order ${orderId}?`)) return;

    try {
      await deleteOrderService(orderId);
      alert('🗑️ Order deleted successfully!');
      if (this.DOM.editOrderCard) this.DOM.editOrderCard.style.display = 'none';
      await this._handleFilterOrders();
    } catch (err) {
      console.error('Delete Order Error:', err);
      alert('⚠️ Failed to delete order. Check console.');
    }
  }

  _renderOrdersTable(orders) {
    if (this.ordersListComponent) {
      this.ordersListComponent.render(orders);
    } else {
      console.error('Orders List Component not initialized.');
    }
  }

  async _loadOrderForEdit(orderId) {
    this.selectedOrder = await getOrderById(orderId);
    if (!this.selectedOrder) return alert('Order not found!');

    // load reusable order items table component (injects its HTML into the shared container)
    // Note: loadOrderItemTable returns an instance with .render(items) API
    this.orderItemTable = await loadOrderItemTable('order-item-table-container');

    // set DOM refs now that order-item HTML has been injected
    this.DOM.orderItemsBody = document.getElementById('order-items-body');
    this.DOM.grandTotal = document.getElementById('grand-total');
    this.DOM.addProductBtn = document.getElementById('add-product-row');

    // Load dependent dropdowns and set the selected values (isInitialLoad = true)
    if (this.DOM.routeSelect) this.DOM.routeSelect.value = this.selectedOrder.routeId || '';
    await this._loadPlacesDropdown(this.selectedOrder.routeId, true);
    await this._loadShopsDropdown(this.selectedOrder.placeId, true);

    if (this.DOM.editOrderCard) this.DOM.editOrderCard.style.display = 'block';
    if (this.DOM.editOrderId) this.DOM.editOrderId.textContent = this.selectedOrder.id;
    if (this.DOM.customerInput) this.DOM.customerInput.value = this.selectedOrder.customerName || '';
    if (this.DOM.orderDateInput) this.DOM.orderDateInput.value = this._formatOrderDate(this.selectedOrder.orderDate);
    if (this.DOM.deliveryDateInput) this.DOM.deliveryDateInput.value = this._formatOrderDate(this.selectedOrder.deliveryDate);
    if (this.DOM.statusSelect) this.DOM.statusSelect.value = this.selectedOrder.status || 'pending';

    // Use the item-table component API to render items
    if (this.orderItemTable && typeof this.orderItemTable.render === 'function') {
      const items = Array.isArray(this.selectedOrder.items) ? this.selectedOrder.items : [];
      this.orderItemTable.render(items);
    } else {
      // fallback: render via controller's DOM-based renderer
      this._renderOrderItems(this.selectedOrder.items || []);
    }
  }

  // --- Order Item Editing ---
  _calculateAndRenderTotal(items) {
    let total = 0;
    items.forEach(item => {
      total += (item.orderQuantity || 0) * (item.sellingPrice || 0);
    });

    if (this.DOM.itemCount) this.DOM.itemCount.textContent = items.length;
    if (this.DOM.orderTotal) this.DOM.orderTotal.textContent = total.toFixed(2);
    if (this.DOM.grandTotal) this.DOM.grandTotal.textContent = `Total: ₹${total.toFixed(2)}`;
  }

  // fallback renderer (kept for compatibility)
  _renderOrderItems(items) {
    if (!this.DOM.orderItemsBody) return console.warn('Order item body not loaded yet!');

    this.DOM.orderItemsBody.innerHTML = '';

    // ensure items reference is the same object we will mutate
    const mutableItems = Array.isArray(items) ? items : [];

    mutableItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.productCategory}</td>
        <td>${item.productName}</td>
        <td><input type="number" value="${item.orderQuantity}" min="1"></td>
        <td><input type="number" value="${item.sellingPrice}" min="0" step="0.01"></td>
        <td>₹${item.mrp?.toFixed(2) || 0}</td>
        <td><button class="delete-btn">🗑️</button></td>`;

      this.DOM.orderItemsBody.appendChild(tr);

      const qtyInput = tr.cells[2].querySelector('input');
      const priceInput = tr.cells[3].querySelector('input');

      const recalc = () => {
        item.orderQuantity = Number(qtyInput.value);
        item.sellingPrice = Number(priceInput.value);
        this._calculateAndRenderTotal(mutableItems);
      };

      qtyInput.addEventListener('input', recalc);
      priceInput.addEventListener('input', recalc);

      tr.querySelector('.delete-btn').addEventListener('click', () => {
        mutableItems.splice(idx, 1);
        this._renderOrderItems(mutableItems);
      });
    });

    this._calculateAndRenderTotal(mutableItems);
  }

  // --- Update / Delete ---
  async _handleUpdateOrder() {
    if (!this.selectedOrder) return alert('No order selected!');

    // Prefer component-managed items when available
    const updatedItems = Array.isArray(this.selectedOrder.items) ? this.selectedOrder.items : [];

    const updatedOrderData = {
      customerName: (this.DOM.customerInput && this.DOM.customerInput.value) ? this.DOM.customerInput.value : '',
      routeId: (this.DOM.routeSelect && this.DOM.routeSelect.value) ? this.DOM.routeSelect.value : '',
      placeId: (this.DOM.placeSelect && this.DOM.placeSelect.value) ? this.DOM.placeSelect.value : '',
      shopId: (this.DOM.shopSelect && this.DOM.shopSelect.value) ? this.DOM.shopSelect.value : '',
      orderDate: (this.DOM.orderDateInput && this.DOM.orderDateInput.value) ? new Date(this.DOM.orderDateInput.value) : null,
      deliveryDate: (this.DOM.deliveryDateInput && this.DOM.deliveryDateInput.value) ? new Date(this.DOM.deliveryDateInput.value) : null,
      status: (this.DOM.statusSelect && this.DOM.statusSelect.value) ? this.DOM.statusSelect.value : 'pending',
      items: updatedItems
    };

    if (!updatedOrderData.routeId || !updatedOrderData.placeId || !updatedOrderData.shopId) {
      return alert('⚠️ Please select a **Route**, **Place**, and **Shop** before updating.');
    }
    if (!updatedItems.length) {
      return alert('⚠️ Order must contain at least one item.');
    }

    try {
      await updateOrderStandalone(this.selectedOrder.id, updatedOrderData);
      alert('✅ Order updated successfully!');
      await this._handleFilterOrders(); // Refresh table and potentially re-open the updated order
    } catch (err) {
      console.error('Update Order Error:', err);
      alert('⚠️ Failed to update order. Check console.');
    }
  }

  async _handleEditCardDelete() {
    if (!this.selectedOrder) return;
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

    try {
      await deleteOrderService(this.selectedOrder.id);
      if (this.DOM.editOrderCard) this.DOM.editOrderCard.style.display = 'none';
      this.selectedOrder = null;
      alert('🗑️ Order deleted successfully!');
      await this._handleFilterOrders(); // Refresh table
    } catch (err) {
      console.error('Delete Order Error:', err);
      alert('⚠️ Failed to delete order. Check console.');
    }
  }
}


