// js/utils/id-generator.js

/**
 * Normalize a string for ID usage
 * Converts to lowercase, trims, replaces spaces with underscores
 * @param {string} str
 * @returns {string}
 */
export function normalizeStringForId(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * Generate a Firebase doc ID for a place
 * @param {string} routeId
 * @param {string} placeName
 * @returns {string}
 */
export function generatePlaceId(routeId, placeName) {
  return `${normalizeStringForId(routeId)}_${normalizeStringForId(placeName)}`;
}

/**
 * Generate a Firebase doc ID for a product
 * @param {string} category
 * @param {string} productName
 * @returns {string}
 */
export function generateProductId(category, productName) {
  return `${normalizeStringForId(category)}_${normalizeStringForId(productName)}`;
}

/* ------------------------------------------------------------------
   ORDER ID UTILITIES
------------------------------------------------------------------ */

/**
 * Normalize and format an order ID entered by the user.
 * Example:
 *  - "oct04-1"  → "OCT04-0001"
 *  - "oct04 1"  → "OCT04-0001"
 *  - "OCT041"   → "OCT04-0001"
 * @param {string} rawInput
 * @returns {string}
 */
export function normalizeOrderId(rawInput) {
  if (!rawInput) return "";
  
  let value = rawInput.toUpperCase().replace(/\s+/g, "");

  // Auto-add dash if missing (e.g. OCT041 → OCT04-1)
  if (/^[A-Z]{3}\d{2}\d+$/.test(value)) {
    value = value.replace(/^([A-Z]{3}\d{2})(\d+)$/, "$1-$2");
  }

  // Pad number part with zeros (e.g. OCT04-1 → OCT04-0001)
  if (/^[A-Z]{3}\d{2}-\d+$/.test(value)) {
    const [prefix, num] = value.split("-");
    value = `${prefix}-${num.padStart(4, "0")}`;
  }

  return value;
}

/**
 * Validate order ID format.
 * Expected pattern: AAA00-0000 (e.g. OCT04-0001)
 * @param {string} orderId
 * @returns {boolean}
 */
export function isValidOrderId(orderId) {
  return /^[A-Z]{3}\d{2}-\d{4}$/.test(orderId);
}

/**
 * Generate a new order ID based on the current date and last order.
 * Example output: OCT08-0001, OCT08-0002, etc.
 * @param {number} sequenceNumber - e.g. 1, 2, 3
 * @param {Date} [date=new Date()] - date to base the prefix on
 * @returns {string}
 */
export function generateOrderId(sequenceNumber, date = new Date()) {
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
                      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const prefix = `${monthNames[date.getMonth()]}${String(date.getDate()).padStart(2, "0")}`;
  const suffix = String(sequenceNumber).padStart(4, "0");
  return `${prefix}-${suffix}`;
}
