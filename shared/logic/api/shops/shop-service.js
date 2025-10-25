import { db, collection, getDocs, query, where } from '../../api/config/firebase.js';
import { getShops, addShopToCache } from '../../store/data-store.js';

/**
 * Fetch shops for a given place (direct Firestore fetch)
 * @param {string} placeId
 * @returns {Array} shops
 */
export async function fetchShopsByPlaceFromDb(placeId) {
  if (!placeId) return [];

  try {
    const q = query(collection(db, "shops"), where("placeId", "==", placeId));
    const snapshot = await getDocs(q);
    const shops = [];
    snapshot.forEach(doc => shops.push({ id: doc.id, ...doc.data() }));
    return shops;
  } catch (err) {
    console.error(`Error fetching shops for place ${placeId}:`, err);
    return [];
  }
}

/**
 * Add a shop to centralized cache (after Firestore addition)
 */
export function addShopToCacheForPlace(placeId, shop) {
  addShopToCache(placeId, shop);
}

/**
 * Get cached shops for a place (no Firestore fetch)
 */
export async function getCachedShops(placeId) {
  const shops = await getShops(placeId, false);
  return shops;
}
