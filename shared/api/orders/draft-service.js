// js/api/draft-service.js
import { db, doc, setDoc, getDoc, deleteDoc, serverTimestamp, Timestamp } from '../config/firebase.js';
import { EventBus } from '../../store/event-bus.js'; 

const USER_ID = "staticUser"; // replace with auth ID if available
let draftCache = null;

// --- PERSISTENCE HELPERS ---
function saveToLocalCache(draftData) {
  try {
    localStorage.setItem('draftOrder', JSON.stringify(draftData));
  } catch (err) {
    console.warn("LocalStorage save failed:", err);
  }
}

function loadFromLocalCache() {
  try {
    const str = localStorage.getItem('draftOrder');
    return str ? JSON.parse(str) : null;
  } catch (err) {
    console.warn("LocalStorage load failed:", err);
    return null;
  }
}

function removeFromLocalCache() {
  try {
    localStorage.removeItem('draftOrder');
  } catch (err) { }
}

// --- DRAFT OPERATIONS ---
export async function saveDraftOrder(draftState, routeSelect, placeSelect, shopSelect, deliveryDateInput) {
  const placeName = placeSelect.options[placeSelect.selectedIndex]?.textContent || "";
  const shopName = shopSelect.options[shopSelect.selectedIndex]?.textContent || "";

  const draftData = {
    routeId: routeSelect.value || "",
    placeId: placeSelect.value || "",
    placeName,
    shopId: shopSelect.value || "",
    shopName,
    deliveryDate: deliveryDateInput.value ? Timestamp.fromDate(new Date(deliveryDateInput.value)) : null,
    rows: draftState.rows,
    lastUpdated: serverTimestamp()
  };

  draftCache = draftData;
  saveToLocalCache(draftData);

  try {
    await setDoc(doc(db, "draftOrders", USER_ID), draftData);
    EventBus.emit('draft-updated', draftData);
    console.debug("✅ Draft order saved successfully");
  } catch (err) {
    console.error("❌ Error saving draft order:", err);
  }
}

export async function loadDraftOrder() {
  if (draftCache) return draftCache;

  const localDraft = loadFromLocalCache();
  if (localDraft) {
    draftCache = localDraft;
    return draftCache;
  }

  try {
    const draftDocRef = doc(db, "draftOrders", USER_ID);
    const draftDocSnap = await getDoc(draftDocRef);
    if (draftDocSnap.exists()) {
      draftCache = draftDocSnap.data();
      saveToLocalCache(draftCache);
      return draftCache;
    }
    return null;
  } catch (err) {
    console.error("❌ Error loading draft order:", err);
    return null;
  }
}

export async function deleteDraftOrder() {
  draftCache = null;
  removeFromLocalCache();

  try {
    await deleteDoc(doc(db, "draftOrders", USER_ID));
    EventBus.emit('draft-deleted');
    console.debug("🗑️ Draft order deleted");
  } catch (err) {
    console.error("❌ Error deleting draft order:", err);
  }
}

/**
 * Get current draft from cache (sync, for other pages)
 */
export function getCachedDraft() {
  return draftCache || loadFromLocalCache();
}
