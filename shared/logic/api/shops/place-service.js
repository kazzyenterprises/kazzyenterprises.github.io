// js/api/place-service.js
import { db, collection, getDocs, query, where, doc, setDoc, deleteDoc, serverTimestamp } from '../../api/config/firebase.js';
import { generatePlaceId } from '../../../utils/js/id-generator.js';

/**
 * Fetch places from Firestore directly (no cache)
 * @param {string} routeId
 * @returns {Array} places
 */
export async function fetchPlacesByRouteFromDb(routeId) {
  if (!routeId) return [];
  try {
    const q = query(collection(db, "places"), where("routeId", "==", routeId));
    const snapshot = await getDocs(q);
    const places = [];
    snapshot.forEach(d => places.push({ id: d.id, ...d.data() }));
    return places;
  } catch (err) {
    console.error(`Error fetching places for route ${routeId}:`, err);
    return [];
  }
}

/**
 * Add a new place to Firestore
 * @param {string} routeId
 * @param {string} placeName
 * @returns {Object} newPlace
 */
export async function addPlace(routeId, placeName) {
  const placeId = generatePlaceId(routeId, placeName);
  const placeRef = doc(db, "places", placeId);

  await setDoc(placeRef, {
    name: placeName,
    routeId,
    createdAt: serverTimestamp()
  });

  return { id: placeId, name: placeName, routeId };
}

/**
 * Delete a place from Firestore
 * @param {string} placeId
 */
export async function deletePlaceById(placeId) {
  await deleteDoc(doc(db, "places", placeId));
}
