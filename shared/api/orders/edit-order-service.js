// js/api/orders/edit-order-service.js
import { db, doc, setDoc, getDoc, deleteDoc, Timestamp } from '../config/firebase.js';
import { EventBus } from '../../store/event-bus.js'; 
import { normalizeOrderId, isValidOrderId } from '../../../shared/utils/id-generator.js';

/**
 * Overwrites an existing order in Firestore while preserving `orderId` and `createdAt`.
 * Recalculates item line totals and overall total.
 *
 * @param {string} orderId - Firestore order ID to update
 * @param {object} updatedData - Object containing fields to update:
 *                               customerName, routeId, placeId, shopId,
 *                               orderDate (Date), deliveryDate (Date), status, items (array)
 * @returns {object} - Updated order data
 */
export async function updateOrderStandalone(orderId, updatedData) {
  const cleanId = normalizeOrderId(orderId);
  if (!isValidOrderId(cleanId)) throw new Error("Invalid Order ID format.");

  // Fetch existing order
  const docRef = doc(db, "orders", cleanId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) throw new Error("Order not found.");

  const existing = snapshot.data();

  // Recalculate line totals and overall total
  const items = (updatedData.items || []).map(item => ({
    ...item,
    lineTotal: (item.orderQuantity || 0) * (item.sellingPrice || 0)
  }));

  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);

  const newData = {
    ...updatedData,
    items,
    total,
    updatedAt: Timestamp.now(),
    orderId: existing.orderId,       // Preserve original orderId
    createdAt: existing.createdAt    // Preserve original createdAt
  };

  // Overwrite the document
  await setDoc(docRef, newData);
  EventBus.emit('order-updated', { id: cleanId, ...newData });

  return { id: cleanId, ...newData };
}

/**
 * Deletes an order from Firestore.
 *
 * @param {string} orderId
 */
export async function deleteOrderStandalone(orderId) {
  const cleanId = normalizeOrderId(orderId);
  if (!isValidOrderId(cleanId)) throw new Error("Invalid Order ID format.");

  const docRef = doc(db, "orders", cleanId);
  await deleteDoc(docRef);

  EventBus.emit('order-deleted', { id: cleanId });
}
