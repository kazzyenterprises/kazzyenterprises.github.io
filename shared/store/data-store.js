// shared/logic/store/data-store.js
import { fetchRoutes as fetchRoutesFromDb } from '../api/shops/route-service.js';
import { fetchPlacesByRouteFromDb } from '../api/shops/place-service.js';
import { fetchShopsByPlaceFromDb } from '../api/shops/shop-service.js';
import { EventBus } from './event-bus.js';

const CACHE_VERSION = 1;

export const store = {
  version: CACHE_VERSION,
  timestamp: Date.now(),
  routes: [],
  places: {}, // keyed by routeId
  shops: {},  // keyed by placeId
};

// ---------------------------
// LOCAL STORAGE
// ---------------------------
function saveToLocalStorage() {
  try {
    localStorage.setItem('kazzyStore', JSON.stringify(store));
  } catch (err) {
    console.warn("Failed to save store:", err);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('kazzyStore');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.version === CACHE_VERSION) {
      store.routes = parsed.routes || [];
      store.places = parsed.places || {};
      store.shops = parsed.shops || {};
      store.timestamp = parsed.timestamp || Date.now();
    }
  } catch (err) {
    console.warn("Failed to load store:", err);
  }
}
loadFromLocalStorage();

// ---------------------------
// ROUTES
// ---------------------------
export async function getRoutes(forceRefresh = false) {
  if (forceRefresh || store.routes.length === 0) {
    store.routes = await fetchRoutesFromDb();
    store.timestamp = Date.now();
    EventBus.emit('routes-updated', store.routes);
    saveToLocalStorage();
  }
  return store.routes;
}

export function addRouteToCache(route) {
  store.routes.push(route);
  store.timestamp = Date.now();
  EventBus.emit('routes-updated', store.routes);
  saveToLocalStorage();
}

// ---------------------------
// PLACES
// ---------------------------
export async function getPlaces(routeId, forceRefresh = false) {
  if (!store.places[routeId] || forceRefresh) {
    const places = await fetchPlacesByRouteFromDb(routeId);
    store.places[routeId] = places;
    store.timestamp = Date.now();
    EventBus.emit('places-updated', { routeId, places });
    saveToLocalStorage();
  }
  return store.places[routeId];
}

export function addPlaceToCache(routeId, place) {
  if (!store.places[routeId]) store.places[routeId] = [];
  store.places[routeId].push(place);
  store.timestamp = Date.now();
  EventBus.emit('places-updated', { routeId, places: store.places[routeId] });
  saveToLocalStorage();
}

// ---------------------------
// SHOPS
// ---------------------------
export async function getShops(placeId, forceRefresh = false) {
  if (!store.shops[placeId] || forceRefresh) {
    const shops = await fetchShopsByPlaceFromDb(placeId);
    store.shops[placeId] = shops;
    store.timestamp = Date.now();
    EventBus.emit('shops-updated', { placeId, shops });
    saveToLocalStorage();
  }
  return store.shops[placeId];
}

export function addShopToCache(placeId, shop) {
  if (!store.shops[placeId]) store.shops[placeId] = [];
  store.shops[placeId].push(shop);
  store.timestamp = Date.now();
  EventBus.emit('shops-updated', { placeId, shops: store.shops[placeId] });
  saveToLocalStorage();
}

// ---------------------------
// CLEAR CACHE
// ---------------------------
export function clearStore() {
  store.routes = [];
  store.places = {};
  store.shops = {};
  store.timestamp = Date.now();
  EventBus.emit('store-cleared', {});
  saveToLocalStorage();
}

export default store;
