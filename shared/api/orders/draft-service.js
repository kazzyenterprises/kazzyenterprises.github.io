// js/api/draft-service.js
import { db, doc, setDoc, getDoc, deleteDoc, serverTimestamp, Timestamp } from '../config/firebase.js';
import { EventBus } from '../../store/event-bus.js';

const USER_ID = "staticUser";
let draftCache = null;

function saveToLocalCache(draftData) {
  try { localStorage.setItem('draftOrder', JSON.stringify(draftData)); }
  catch (err) { console.warn("LocalStorage save failed:", err); }
}
function loadFromLocalCache() {
  try { const str = localStorage.getItem('draftOrder'); return str ? JSON.parse(str) : null; }
  catch (err) { console.warn("LocalStorage load failed:", err); return null; }
}
function removeFromLocalCache() {
  try { localStorage.removeItem('draftOrder'); } catch (err) {}
}

function resolveElement(maybeElOrDom, selectorOrId) {
  if (!maybeElOrDom) return null;
  if (maybeElOrDom instanceof Element || maybeElOrDom instanceof HTMLSelectElement || maybeElOrDom instanceof HTMLInputElement) {
    return maybeElOrDom;
  }
  if (typeof maybeElOrDom === 'object') {
    const propCandidates = [
      selectorOrId,
      selectorOrId.replace(/-/g, ''),
      selectorOrId + 'Select',
      selectorOrId + 'Input',
      selectorOrId.replace(/-/g, '_'),
      selectorOrId.toLowerCase()
    ];
    for (const p of propCandidates) {
      if (p && (p in maybeElOrDom) && maybeElOrDom[p] instanceof Element) return maybeElOrDom[p];
    }
    if (typeof maybeElOrDom.querySelector === 'function') {
      try {
        const byId = maybeElOrDom.querySelector(`#${selectorOrId}`);
        if (byId) return byId;
        const byData = maybeElOrDom.querySelector(`[name="${selectorOrId}"]`) || maybeElOrDom.querySelector(selectorOrId);
        if (byData) return byData;
      } catch (err) { /* ignore */ }
    }
  }
  return null;
}

/**
 * Save draft. Accepts:
 *  - saveDraftOrder(draftState, routeEl, placeEl, shopEl, deliveryEl)
 *  - saveDraftOrder(draftState, domObject) // domObject contains the elements or can query them
 */
export async function saveDraftOrder(draftState, routeSelectOrDom, placeSelectOrNull, shopSelectOrNull, deliveryDateOrNull) {
  // Resolve elements (use correct variable names)
  const routeEl = resolveElement(routeSelectOrDom, 'route') ||
                  resolveElement(placeSelectOrNull, 'route') || null;

  const placeEl = resolveElement(placeSelectOrNull || routeSelectOrDom, 'place') ||
                  resolveElement(placeSelectOrNull, 'place') || null;

  const shopEl = resolveElement(shopSelectOrNull || routeSelectOrDom, 'shop-name') ||
                 resolveElement(shopSelectOrNull || routeSelectOrDom, 'shop') ||
                 resolveElement(shopSelectOrNull || routeSelectOrDom, 'shopSelect') || null;

  let deliveryEl = null;
  if (deliveryDateOrNull instanceof Element) deliveryEl = deliveryDateOrNull;
  else {
    deliveryEl = resolveElement(routeSelectOrDom, 'delivery-date') ||
                 resolveElement(routeSelectOrDom, 'deliveryDate') ||
                 resolveElement(placeSelectOrNull, 'delivery-date') ||
                 resolveElement(shopSelectOrNull, 'delivery-date') || null;
  }

  const placeName = placeEl?.options?.[placeEl.selectedIndex]?.textContent || (placeEl?.value || '');
  const shopName = shopEl?.options?.[shopEl.selectedIndex]?.textContent || (shopEl?.value || '');

  let deliveryValue = null;
  if (deliveryEl && deliveryEl.value) {
    try { deliveryValue = Timestamp.fromDate(new Date(deliveryEl.value)); } catch (err) { deliveryValue = null; }
  } else if (typeof deliveryDateOrNull === 'string' && deliveryDateOrNull) {
    try { deliveryValue = Timestamp.fromDate(new Date(deliveryDateOrNull)); } catch (err) { deliveryValue = null; }
  }

  const draftData = {
    routeId: routeEl?.value || (routeSelectOrDom?.routeId || '') || '',
    placeId: placeEl?.value || (routeSelectOrDom?.placeId || '') || '',
    placeName: placeName || '',
    shopId: shopEl?.value || (routeSelectOrDom?.shopId || '') || '',
    shopName: shopName || '',
    deliveryDate: deliveryValue || null,
    rows: (draftState && draftState.rows) ? draftState.rows : (draftState?.rows || []),
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
  if (localDraft) { draftCache = localDraft; return draftCache; }

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

export function getCachedDraft() {
  return draftCache || loadFromLocalCache();
}
