// features/orders/js/controllers/NewOrderController.js

import { OrderStateManager } from '../managers/order-state-manager.js';
import { getRoutes, getPlaces, getShops } from '../../../../shared/logic/store/data-store.js';
import { EventBus } from '../../../../shared/logic/store/event-bus.js';
import { fetchAllProducts, addProduct } from '../../../../shared/logic/api/products/product-service.js';
import { deleteDraftOrder } from '../../../../shared/logic/api/orders/draft-service.js';
import { createAddProductRow, restoreDraftToTable } from '../../../../shared/utils/js/dom-helpers.js';
import { placeOrder as placeOrderAPI } from '../../../../shared/logic/api/orders/order-service.js';
// NOTE: Must uncomment if using 'generateOrderIdFromFirestore' which requires firebase imports
// import { db, collection, getDocs } from '../../../../shared/js/api/config/firebase.js'; 
import { generateOrderId, isValidOrderId } from '../../../../shared/utils/js/id-generator.js';

export class NewOrderController {
    constructor() {
        this.DOM = this._getDOMElements();
        this.stateManager = new OrderStateManager();
    }

    // --- DOM Elements ---
    _getDOMElements() {
        return {
            orderDateInput: document.getElementById("order-date"),
            orderTimeInput: document.getElementById("order-time"),
            deliveryDateInput: document.getElementById("delivery-date"),
            routeSelect: document.getElementById("route"),
            placeSelect: document.getElementById("place"),
            shopSelect: document.getElementById("shop-name"),
            orderIdDisplay: document.getElementById("order-id-display"),
            orderTbody: document.getElementById("order-tbody"),
            addProductRowBtn: document.getElementById("add-product-row"),
            placeOrderBtn: document.getElementById("place-order"),
            grandTotalCell: document.getElementById("grand-total"),
            newCategoryInput: document.getElementById("new-category"),
            newProductInput: document.getElementById("new-product"),
            addProductBtn: document.getElementById("add-product")
        };
    }

    // --- Initialization ---
    async init() {
        this._setInitialDates();
        this._setupEventListeners();

        const draftLoaded = await this.stateManager.initializeState();
        if (draftLoaded) await this._restoreDraftFlow();
        else await this._initializeNewOrderFlow();

        // NOTE: Keeping the Firestore Order ID logic separate for now, but 
        // you will need to import 'db, collection, getDocs' to make it fully work.
        // await this._generateOrderIdFromFirestore(); 
    }

    _setInitialDates() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        this.DOM.orderDateInput.value = now.toISOString().split("T")[0];
        this.DOM.orderTimeInput.value = now.toTimeString().slice(0,5);
        this.DOM.deliveryDateInput.value = tomorrow.toISOString().split("T")[0];
    }

    // --- Render Helpers ---
    _renderPlaceOptions(places) {
        this.DOM.placeSelect.innerHTML = "";
        if (!places || places.length === 0) {
            this.DOM.placeSelect.innerHTML = "<option value=''>No places found</option>";
            this.DOM.shopSelect.innerHTML = "<option value=''>Select route & place</option>";
            return;
        }

        this.DOM.placeSelect.innerHTML = places.map(p => 
            `<option value="${p.id}">${p.name}</option>`
        ).join('');
        
        const currentPlaceId = this.stateManager.getState().placeId;
        if (currentPlaceId) this.DOM.placeSelect.value = currentPlaceId;
        else if (places.length > 0) this.DOM.placeSelect.value = places[0].id;
    }

    _renderShopOptions(shops) {
        this.DOM.shopSelect.innerHTML = "";
        if (!shops || shops.length === 0) {
            this.DOM.shopSelect.innerHTML = "<option value=''>No shops found</option>";
            return;
        }
        
        this.DOM.shopSelect.innerHTML = shops.map(s => 
            `<option value="${s.id}">${s.name}</option>`
        ).join('');

        const currentShopId = this.stateManager.getState().shopId;
        if (currentShopId) this.DOM.shopSelect.value = currentShopId;
        else if (shops.length > 0) this.DOM.shopSelect.value = shops[0].id;
    }

    // --- Event Listeners ---
    _setupEventListeners() {
        this.DOM.routeSelect.addEventListener("change", this._handleRouteChange.bind(this));
        this.DOM.placeSelect.addEventListener("change", this._handlePlaceChange.bind(this));
        this.DOM.shopSelect.addEventListener("change", this._handleShopChange.bind(this));
        this.DOM.deliveryDateInput.addEventListener("change", this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
        this.DOM.addProductRowBtn.addEventListener("click", this._handleAddProductRow.bind(this));
        this.DOM.placeOrderBtn.addEventListener("click", this._handlePlaceOrder.bind(this));
        this.DOM.addProductBtn.addEventListener("click", this._handleAddNewProduct.bind(this));

        // Listen for centralized cache updates
        EventBus.onEvent('places-updated', this._handlePlacesUpdated.bind(this));
        EventBus.onEvent('shops-updated', this._handleShopsUpdated.bind(this));
        EventBus.onEvent('products-updated', this._handleProductsUpdated.bind(this));
    }

    _handlePlacesUpdated({ routeId, places }) {
        if (routeId === this.DOM.routeSelect.value) this._renderPlaceOptions(places);
    }

    _handleShopsUpdated({ placeId, shops }) {
        if (placeId === this.DOM.placeSelect.value) this._renderShopOptions(shops);
    }

    _handleProductsUpdated(products) {
        // Rerender the table with new product list after an update
        restoreDraftToTable(this.DOM, this.stateManager.getState(), products, this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
    }

    async _handleRouteChange() {
        this.stateManager.updateState('routeId', this.DOM.routeSelect.value);
        await this._fetchPlacesForSelectedRoute(true);
        await this.stateManager.persistDraft(this.DOM);
    }

    async _handlePlaceChange() {
        this.stateManager.updateState('placeId', this.DOM.placeSelect.value);
        await this._fetchShopsForSelectedPlace(true);
        await this.stateManager.persistDraft(this.DOM);
    }

    async _handleShopChange() {
        this.stateManager.updateState('shopId', this.DOM.shopSelect.value);
        await this.stateManager.persistDraft(this.DOM);
    }

    // --- Data Loading & Flow ---

    async _loadRoutes(forceRefresh = false) {
        const routes = await getRoutes(forceRefresh);
        this.DOM.routeSelect.innerHTML = routes.map(r => `<option value="${r.id}">${r.name || r.id}</option>`).join('');

        const currentRouteId = this.stateManager.getState().routeId;
        if (currentRouteId) this.DOM.routeSelect.value = currentRouteId;
        else if (routes.length > 0) this.DOM.routeSelect.value = routes[0].id;
    }

    async _fetchPlacesForSelectedRoute(forceRefresh = false) {
        const routeId = this.DOM.routeSelect.value;
        if (!routeId) {
            this.DOM.placeSelect.innerHTML = "<option value=''>Select route first</option>";
            this.DOM.shopSelect.innerHTML = "<option value=''>Select route & place</option>";
            return;
        }

        const places = await getPlaces(routeId, forceRefresh);
        this._renderPlaceOptions(places);
        await this._fetchShopsForSelectedPlace(forceRefresh);
    }

    async _fetchShopsForSelectedPlace(forceRefresh = false) {
        const placeId = this.DOM.placeSelect.value;
        if (!placeId) {
            this.DOM.shopSelect.innerHTML = "<option value=''>Select place first</option>";
            return;
        }

        const shops = await getShops(placeId, forceRefresh);
        this._renderShopOptions(shops);
    }
    
    // --- Handlers ---
    async _handleAddProductRow() {
        const lastTr = this.DOM.orderTbody.lastElementChild;
        if (lastTr) {
            const selects = lastTr.querySelectorAll("select");
            const inputs = lastTr.querySelectorAll("input");
            const lastProduct = selects[1]?.value || "";
            const lastQty = parseInt(inputs[0]?.value, 10) || 0;
            if (!lastProduct || lastQty <= 0) return alert("⚠️ Please select a product and enter a quantity before adding a new row.");
        }

        const products = await fetchAllProducts();
        createAddProductRow({}, this.DOM, products, this.stateManager.getState(), this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
        this.DOM.placeOrderBtn.style.display = "block";
    }

    async _handlePlaceOrder() {
        try {
            const state = this.stateManager.getState();
            // Ensure state is up-to-date before placing the order
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
        const category = this.DOM.newCategoryInput.value.trim();
        const name = this.DOM.newProductInput.value.trim();
        if (!category || !name) return alert("Category and Product Name are required.");

        try {
            await addProduct(category, name);
            this.DOM.newCategoryInput.value = '';
            this.DOM.newProductInput.value = '';
            alert(`✅ Product '${name}' saved successfully. Reloading products...`);
            
            const products = await fetchAllProducts(true);
            restoreDraftToTable(this.DOM, this.stateManager.getState(), products, this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
        } catch (err) {
            console.error(err);
            alert("❌ Failed to add product.");
        }
    }

    // --- Draft/Initial Flow ---

    async _restoreDraftFlow() {
        const draft = this.stateManager.getState();
        
        // Load minimal data, prefer cached (no Firestore hits)
        await this._loadRoutes(false);
        this.DOM.routeSelect.value = draft.routeId;
        
        await this._fetchPlacesForSelectedRoute(false);
        this.DOM.placeSelect.value = draft.placeId;

        await this._fetchShopsForSelectedPlace(false);
        this.DOM.shopSelect.value = draft.shopId;

        const products = await fetchAllProducts(false);
        restoreDraftToTable(this.DOM, draft, products, this.stateManager.persistDraft.bind(this.stateManager, this.DOM));
        this.stateManager.persistDraft(this.DOM); // Updates grand total
    }

    async _initializeNewOrderFlow() {
        await this._loadRoutes(true);

        if (this.DOM.routeSelect.value) {
            await this._fetchPlacesForSelectedRoute(true);
            await this._fetchShopsForSelectedPlace(true);
        }

        // Use loadProducts from the original file (if needed, move to a service)
        await fetchAllProducts(true); 
    }
}