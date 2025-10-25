// js/api/route-service.js
import { db, collection, getDocs } from '../../api/config/firebase.js';
import { getRoutes, addRouteToCache } from '../../store/data-store.js';

/**
 * Fetch all routes, optionally forcing a fresh Firestore read.
 * Uses centralized data-store cache.
 * @param {boolean} forceRefresh - force Firestore fetch
 * @returns {Array} routes
 */
export async function fetchRoutes() {
  const snapshot = await getDocs(collection(db, "routes"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Add a new route to cache and emit update.
 * This does NOT write to Firestore; Firestore writes should be handled separately.
 * @param {Object} route - route object {id, name}
 */
export function addRoute(route) {
  addRouteToCache(route);
}

/**
 * Get cached routes only (from centralized cache)
 */
export function getCachedRoutes() {
  return getRoutes(false); // returns cache without forcing refresh
}
