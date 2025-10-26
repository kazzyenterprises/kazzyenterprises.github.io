// features/orders/js/controllers/NewOrderController.js

import { OrderStateManager } from '../_utils/order-state-manager.js';
import { EventBus } from '../../../shared/store/event-bus.js';
import { fetchAllProducts, addProduct } from '../../../shared/api/products/product-service.js';
import { deleteDraftOrder } from '../../../shared/api/orders/draft-service.js';
import { createAddProductRow, restoreDraftToTable } from '../../../shared/utils/dom-helpers.js';
import { placeOrder as placeOrderAPI } from '../../../shared/api/orders/order-service.js';
import { generateOrderId, isValidOrderId } from '../../../shared/utils/id-generator.js';

import { ShopSelectorComponent } from '../../../shared/components/shop-selector/shop-selector.component.js';
import { Loader } from '../../../shared/components/global-loader/gloabal-loader.component.js';

import { SuccessStatus } from '../../../shared/components/global-status/global-success-status.component.js'; 
import { ErrorStatus } from '../../../shared/components/global-status/global-erroor-status.component.js';

// Assuming you have a utility function like this to load HTML fragments dynamically
async function loadComponentFragment(containerId, htmlPath) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const response = await fetch(htmlPath);
    container.innerHTML = await response.text();
}

export class NewOrderController {
  constructor() {
    // Delay DOM binding until after fragments are loaded
    this.DOM = this._getDOMElements();
    this.stateManager = new OrderStateManager();
    this.shopSelector = null;
    this._orderTableLoaded = false;
  }

  _getDOMElements() {
    return {
      orderDateInput: document.getElementById("order-date"),
      orderTimeInput: document.getElementById("order-time"),
      deliveryDateInput: document.getElementById("delivery-date"),
      orderIdDisplay: document.getElementById("order-id-display"),
      // table-related refs will be bound after fragment load:
      orderTbody: document.getElementById("order-items-body"),
      addProductRowBtn: document.getElementById("add-product-row"),
      placeOrderBtn: document.getElementById("place-order"),
      grandTotalCell: document.getElementById("grand-total"),
      newCategoryInput: document.getElementById("new-category"),
      newProductInput: document.getElementById("new-product"),
      addProductBtn: document.getElementById("add-product")
    };
  }

  // Helper to bind table-specific DOM refs after injecting the HTML fragment
  _bindTableDOM() {
    this.DOM.orderTbody = document.getElementById("order-items-body");
    this.DOM.addProductRowBtn = document.getElementById("add-product-row");
    this.DOM.grandTotalCell = document.getElementById("grand-total");
    // if element exists, wire the Add Product row button (guarded)
    if (this.DOM.addProductRowBtn) {
      // ensure we don't double-bind in case _setupEventListeners already bound it
      // We'll leave binding to _setupEventListeners; _setupEventListeners is called AFTER this helper
    }
    this._orderTableLoaded = !!this.DOM.orderTbody;
  }

  async init() {

    //await Loader.waitInit();
    //Loader.show('Initializing order page...');
    //SuccessStatus.show(`Order saved successfully!`);

    //Loader.setText('Loading UI components...');

    // 1. Load draft state first (so components can restore using it)
    const draftLoaded = await this.stateManager.initializeState();
    const draft = this.stateManager.getState();

    // 2. Load and initialize shop selector fragment + component (so the selects get rendered)
    await loadComponentFragment('shop-selector-component-container', 'shared/components/shop-selector/shop-selector.component.html');
    this.DOM = this._getDOMElements(); // re-evaluate DOM (shop-selector container exists)
    this.shopSelector = new ShopSelectorComponent('shop-selector-component-container', draft);
    await this.shopSelector.init();

    // 3. Load order-item-table fragment into its container (must come before restoring the draft)
    await loadComponentFragment('order-item-table-container', 'shared/components/order-item-table/order-item-table.component.html');
    // now bind the table DOM elements (orderTbody, grandTotalCell, addProductRowBtn)
    this._bindTableDOM();

    // 4. Setup other page event listeners now that table DOM exists
    this._setInitialDates();
    this._setupEventListeners();

    // 5. If draft existed, restore it into the now-present table; else initialize product cache
    if (draftLoaded) {
      await this._restoreDraftFlow();   // restoreDraftToTable will find DOM.orderTbody now
    } else {
      await this._initializeNewOrderFlow();
    }
  }

  _setInitialDates() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (this.DOM.orderDateInput) this.DOM.orderDateInput.value = now.toISOString().split("T")[0];
    if (this.DOM.orderTimeInput) this.DOM.orderTimeInput.value = now.toTimeString().slice(0,5);
    if (this.DOM.deliveryDateInput) this.DOM.deliveryDateInput.value = tomorrow.toISOString().split("T")[0];
  }

  _setupEventListeners() {
    // Guard DOM refs - these may be null in unit tests or other pages
    if (this.DOM.deliveryDateInput) {
      this.DOM.deliveryDateInput.addEventListener("change", this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
    }
    // add-product-row should now exist after _bindTableDOM
    if (this.DOM.addProductRowBtn) {
      this.DOM.addProductRowBtn.addEventListener("click", this._handleAddProductRow.bind(this));
    }
    if (this.DOM.placeOrderBtn) {
      this.DOM.placeOrderBtn.addEventListener("click", this._handlePlaceOrder.bind(this));
    }
    if (this.DOM.addProductBtn) {
      this.DOM.addProductBtn.addEventListener("click", this._handleAddNewProduct.bind(this));
    }

    // central events
    EventBus.on('products-updated', this._handleProductsUpdated.bind(this));
    EventBus.on('shopSelector:selectionChanged', this._handleShopSelectionChanged.bind(this));
  }

  async _handleShopSelectionChanged({ routeId, placeId, shopId }) {
    this.stateManager.updateState('routeId', routeId);
    this.stateManager.updateState('placeId', placeId);
    this.stateManager.updateState('shopId', shopId);
    await this.stateManager.persistDraft(this.DOM);
  }

  _handleProductsUpdated(products) {
    // ensure table is loaded; if not, log and skip (table should be loaded in init)
    if (!this._orderTableLoaded) {
      console.warn('Products updated but order table not loaded yet — skipping until initialized.');
      return;
    }
    try {
      restoreDraftToTable(this.DOM, this.stateManager.getState(), products, this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
    } catch (err) {
      console.error('Error in products-updated handling', err);
    }
  }

  // --- Handlers (unchanged) ---
  async _handleAddProductRow() {
    const lastTr = this.DOM.orderTbody?.lastElementChild;
    if (lastTr) {
      const selects = lastTr.querySelectorAll("select");
      const inputs = lastTr.querySelectorAll("input");
      const lastProduct = selects[1]?.value || "";
      const lastQty = parseInt(inputs[0]?.value, 10) || 0;
      if (!lastProduct || lastQty <= 0) return alert("⚠️ Please select a product and enter a quantity before adding a new row.");
    }
    const products = await fetchAllProducts();
    createAddProductRow({}, this.DOM, products, this.stateManager.getState(), this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
    if (this.DOM.placeOrderBtn) this.DOM.placeOrderBtn.style.display = "block";
  }

  async _handlePlaceOrder() {
    try {
      const state = this.stateManager.getState();
      await this.stateManager.persistDraft(this.DOM);
      await placeOrderAPI(state, this.DOM);
      await deleteDraftOrder();
      alert("✅ Order placed successfully!");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to place order.");
    }
  }

  async _handleAddNewProduct() {
    const category = this.DOM.newCategoryInput?.value.trim() || "";
    const name = this.DOM.newProductInput?.value.trim() || "";
    if (!category || !name) return alert("Category and Product Name are required.");
    try {
      await addProduct(category, name);
      if (this.DOM.newCategoryInput) this.DOM.newCategoryInput.value = '';
      if (this.DOM.newProductInput) this.DOM.newProductInput.value = '';
      alert(`✅ Product '${name}' saved successfully. Reloading products...`);
      const products = await fetchAllProducts(true);
      // now that products are loaded, restore draft to table (table present)
      restoreDraftToTable(this.DOM, this.stateManager.getState(), products, this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add product.");
    }
  }

  async _restoreDraftFlow() {
    const draft = this.stateManager.getState();
    // now the table is loaded, fetch products (prefer cache)
    const products = await fetchAllProducts(false);
    restoreDraftToTable(this.DOM, draft, products, this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
    await this.stateManager.persistDraft(this.DOM); // Updates grand total
  }

  async _initializeNewOrderFlow() {
    // initial load of products into cache
    await fetchAllProducts(true);
  }
}
