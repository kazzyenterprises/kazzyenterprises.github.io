// js/api/order-service.js
import { db, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from '../config/firebase.js';
import { query, where, getDocs } from "../config/firebase.js";
import { saveDraftOrder, deleteDraftOrder, getCachedDraft } from './draft-service.js';
import { getRoutes, getPlaces, getShops } from '../../store/data-store.js';
import { EventBus } from '../../store/event-bus.js'; 
import { normalizeOrderId, isValidOrderId } from '../../../utils/js/id-generator.js';

// ------------------------------------------------------------------
// PLACE ORDER
// ------------------------------------------------------------------
export async function placeOrder(draftOrderState, DOM) {
  const orderId = DOM.orderIdDisplay.dataset.orderId;
  if (!orderId || !isValidOrderId(orderId)) {
    throw new Error(`Invalid or missing Order ID: ${orderId}`);
  }

  const selectedPlaceName = DOM.placeSelect.options[DOM.placeSelect.selectedIndex]?.textContent || "";
  const selectedShopName = DOM.shopSelect.options[DOM.shopSelect.selectedIndex]?.textContent || "";

  const finalItems = draftOrderState.rows.map(r => ({
    ...r,
    lineTotal: r.orderQuantity * r.sellingPrice
  }));

  if (!finalItems.length) throw new Error("No items to place order.");

  const orderData = {
    orderId,
    userId: "staticUser",
    orderDate: Timestamp.fromDate(new Date(`${DOM.orderDateInput.value}T${DOM.orderTimeInput.value}:00`)),
    deliveryDate: Timestamp.fromDate(new Date(DOM.deliveryDateInput.value)),
    routeId: DOM.routeSelect.value,
    placeId: DOM.placeSelect.value,
    placeName: selectedPlaceName,
    shopId: DOM.shopSelect.value,
    shopName: selectedShopName,
    items: finalItems,
    total: finalItems.reduce((sum, r) => sum + r.lineTotal, 0),
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "orders", orderId), orderData);
    await deleteDraftOrder();
    EventBus.emit('order-placed', orderData);
    return orderData;
  } catch (error) {
    console.error("Order Service Error: Failed to place order:", error);
    throw new Error("Failed to place order.");
  }
}

// ------------------------------------------------------------------
// GET SINGLE ORDER
// ------------------------------------------------------------------
export async function getOrderById(orderId) {
  const cleanId = normalizeOrderId(orderId);
  if (!isValidOrderId(cleanId)) {
    console.warn("Invalid order ID format:", orderId);
    return null;
  }

  const docRef = doc(db, "orders", cleanId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

// ------------------------------------------------------------------
// UPDATE ORDER
// ------------------------------------------------------------------
export async function updateOrder(orderId, updatedData) {
  const cleanId = normalizeOrderId(orderId);
  if (!isValidOrderId(cleanId)) throw new Error("Invalid Order ID format.");

  const docRef = doc(db, "orders", cleanId);
  await updateDoc(docRef, { ...updatedData, updatedAt: Timestamp.now() });
}

// ------------------------------------------------------------------
// DELETE ORDER
// ------------------------------------------------------------------
export async function deleteOrder(orderId) {
  const cleanId = normalizeOrderId(orderId);
  if (!isValidOrderId(cleanId)) throw new Error("Invalid Order ID format.");

  const docRef = doc(db, "orders", cleanId);
  await deleteDoc(docRef);
}

// ------------------------------------------------------------------
// ADD PRODUCT TO DRAFT
// ------------------------------------------------------------------
export async function addProductToDraft(category, name, draftOrderState, DOM) {
  if (!category || !name) throw new Error("Category and Product Name are required.");

  try {
    const newProductRef = doc(collection(db, "products"));
    await setDoc(newProductRef, {
      id: newProductRef.id,
      category,
      name,
      sellingPrice: 0.00,
      mrp: 0.00,
      createdAt: serverTimestamp()
    });

    DOM.newCategoryInput.value = '';
    DOM.newProductInput.value = '';

    await saveDraftOrder(draftOrderState, DOM.routeSelect, DOM.placeSelect, DOM.shopSelect, DOM.deliveryDateInput);
    EventBus.emit('product-added', { id: newProductRef.id, category, name });

    return { id: newProductRef.id, category, name };
  } catch (error) {
    console.error("Order Service Error: Failed to add product to draft:", error);
    throw new Error("Failed to add product.");
  }
}

// ------------------------------------------------------------------
// HELPER: CALCULATE LINE TOTAL
// ------------------------------------------------------------------
export function calculateLineTotal(orderQuantity, sellingPrice) {
  return (orderQuantity || 0) * (sellingPrice || 0);
}

// ------------------------------------------------------------------
// CACHE HELPERS
// ------------------------------------------------------------------
export async function getCachedRoutes(forceRefresh = false) {
  return await getRoutes(forceRefresh);
}

export async function getCachedPlaces(routeId, forceRefresh = false) {
  return await getPlaces(routeId, forceRefresh);
}

export async function getCachedShops(placeId, forceRefresh = false) {
  return await getShops(placeId, forceRefresh);
}

export function getCachedDraftState() {
  return getCachedDraft();
}

// ------------------------------------------------------------------
// FETCH MULTIPLE ORDERS (for edit-orders page)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// FETCH MULTIPLE ORDERS (for edit-orders page)
// ------------------------------------------------------------------
export async function fetchOrders(filters = {}) {
  try {
    const ordersRef = collection(db, "orders");
    let q = ordersRef;
    const constraints = [];

    // --- 1️⃣ Order ID Filter (priority) ---
    if (filters.orderId) {
      const cleanId = normalizeOrderId(filters.orderId);
      if (!isValidOrderId(cleanId)) throw new Error("Invalid Order ID format.");
      const order = await getOrderById(cleanId);
      return order ? [order] : [];
    }

    // --- 2️⃣ Route / Place / Shop Filters ---
    if (filters.routeId) constraints.push(where("routeId", "==", filters.routeId));
    if (filters.placeId) constraints.push(where("placeId", "==", filters.placeId));
    if (filters.shopId) constraints.push(where("shopId", "==", filters.shopId));

    // --- 3️⃣ Date Range Filter (from start to end of day) ---
    if (filters.date && filters.date.startOfDay && filters.date.endOfDay) {
      constraints.push(
        where("orderDate", ">=", Timestamp.fromDate(filters.date.startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(filters.date.endOfDay))
      );
    }

    // --- 4️⃣ Apply filters ---
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // --- 5️⃣ Return sorted by orderDate (optional, nice UX) ---
    orders.sort((a, b) => {
      const da = a.orderDate?.toDate?.() || new Date(0);
      const db = b.orderDate?.toDate?.() || new Date(0);
      return db - da; // latest first
    });

    return orders;
  } catch (error) {
    console.error("Order Service Error: Failed to fetch orders:", error);
    throw error;
  }
}
