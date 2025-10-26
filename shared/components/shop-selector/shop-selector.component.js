// shared/components/shop-selector/shop-selector.component.js
import { getRoutes, getPlaces, getShops } from '../../store/data-store.js';
import { EventBus } from '../../store/event-bus.js';

export class ShopSelectorComponent {
  constructor(containerId, initialDraft = {}) {
    this.container = document.getElementById(containerId);
    this.draft = initialDraft || {};
    this._boundHandlers = {};

    if (!this.container) {
      console.error(`ShopSelectorComponent: container ${containerId} not found`);
      return;
    }

    // Use unique ids inside the fragment to avoid collisions (fragment should contain these ids)
    this.DOM = {
      routeSelect: this.container.querySelector('#shop-selector-route'),
      placeSelect: this.container.querySelector('#shop-selector-place'),
      shopSelect: this.container.querySelector('#shop-selector-shop-name'),
    };

    if (!this.DOM.routeSelect || !this.DOM.placeSelect || !this.DOM.shopSelect) {
      console.error('ShopSelectorComponent: required selects not found in container');
      return;
    }

    // bind handlers once so we can remove them later
    this._boundHandlers.onRouteChange = this._handleRouteChange.bind(this);
    this._boundHandlers.onPlaceChange = this._handlePlaceChange.bind(this);
    this._boundHandlers.onShopChange = this._handleShopChange.bind(this);
    this._boundHandlers.onPlacesUpdated = this._handlePlacesUpdated.bind(this);
    this._boundHandlers.onShopsUpdated = this._handleShopsUpdated.bind(this);

    this._setupEventListeners();
  }

  async init() {
    await this._loadRoutes();
    await this._fetchPlacesForSelectedRoute(false);
    await this._fetchShopsForSelectedPlace(false);
  }

  _setupEventListeners() {
    // DOM listeners
    this.DOM.routeSelect.addEventListener('change', this._boundHandlers.onRouteChange);
    this.DOM.placeSelect.addEventListener('change', this._boundHandlers.onPlaceChange);
    this.DOM.shopSelect.addEventListener('change', this._boundHandlers.onShopChange);

    // EventBus listeners (standardized)
    if (EventBus && typeof EventBus.on === 'function') {
      EventBus.on('places-updated', this._boundHandlers.onPlacesUpdated);
      EventBus.on('shops-updated', this._boundHandlers.onShopsUpdated);
    } else {
      // fallback if EventBus API is different
      console.warn('ShopSelectorComponent: EventBus.on() not found; ensure EventBus exposes on/emit/off');
    }
  }

  // remove listeners
  destroy() {
    try {
      this.DOM.routeSelect.removeEventListener('change', this._boundHandlers.onRouteChange);
      this.DOM.placeSelect.removeEventListener('change', this._boundHandlers.onPlaceChange);
      this.DOM.shopSelect.removeEventListener('change', this._boundHandlers.onShopChange);

      if (EventBus && typeof EventBus.off === 'function') {
        EventBus.off('places-updated', this._boundHandlers.onPlacesUpdated);
        EventBus.off('shops-updated', this._boundHandlers.onShopsUpdated);
      }
    } catch (err) {
      console.warn('ShopSelectorComponent.destroy error', err);
    }
  }

  _handlePlacesUpdated({ routeId, places } = {}) {
    if (routeId === this.DOM.routeSelect.value) this._renderPlaceOptions(places);
  }

  _handleShopsUpdated({ placeId, shops } = {}) {
    if (placeId === this.DOM.placeSelect.value) this._renderShopOptions(shops);
  }

  async _handleRouteChange() {
    await this._fetchPlacesForSelectedRoute(true);
    this._notifyParent();
  }

  async _handlePlaceChange() {
    await this._fetchShopsForSelectedPlace(true);
    this._notifyParent();
  }

  _handleShopChange() {
    this._notifyParent();
  }

  _notifyParent() {
    const payload = {
      routeId: this.DOM.routeSelect.value || '',
      placeId: this.DOM.placeSelect.value || '',
      shopId: this.DOM.shopSelect.value || '',
    };
    if (EventBus && typeof EventBus.emit === 'function') {
      EventBus.emit('shopSelector:selectionChanged', payload);
    } else if (EventBus && typeof EventBus.publish === 'function') {
      EventBus.publish('shopSelector:selectionChanged', payload); // fallback
    } else {
      console.warn('ShopSelectorComponent: EventBus emit/publish not found');
    }
  }

  async _loadRoutes(forceRefresh = false) {
    const routes = await getRoutes(forceRefresh);
    this.DOM.routeSelect.innerHTML = routes.map(r => `<option value="${r.id}">${r.name || r.id}</option>`).join('');
    if (this.draft.routeId) this.DOM.routeSelect.value = this.draft.routeId;
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

  _renderPlaceOptions(places) {
    this.DOM.placeSelect.innerHTML = "";
    if (!places || places.length === 0) {
      this.DOM.placeSelect.innerHTML = "<option value=''>No places found</option>";
      this.DOM.shopSelect.innerHTML = "<option value=''>Select route & place</option>";
      return;
    }
    this.DOM.placeSelect.innerHTML = places.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (this.draft.placeId) this.DOM.placeSelect.value = this.draft.placeId;
    else if (places.length > 0) this.DOM.placeSelect.value = places[0].id;
  }

  _renderShopOptions(shops) {
    this.DOM.shopSelect.innerHTML = "";
    if (!shops || shops.length === 0) {
      this.DOM.shopSelect.innerHTML = "<option value=''>No shops found</option>";
      return;
    }
    this.DOM.shopSelect.innerHTML = shops.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    if (this.draft.shopId) this.DOM.shopSelect.value = this.draft.shopId;
    else if (shops.length > 0) this.DOM.shopSelect.value = shops[0].id;
  }
}
