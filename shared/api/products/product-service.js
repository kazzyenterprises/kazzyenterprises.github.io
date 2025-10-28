// shared/logic/api/product-service.js

import { db, collection, getDocs, setDoc, doc, serverTimestamp } from '../config/firebase.js';
import { EventBus } from '../../store/event-bus.js';
import store from '../../store/data-store.js';

/**
 * Fetch all products, using centralized cache.
 * @param {boolean} forceRefresh - bypass cache
 * @returns {Array<Object>} products
 */
export async function fetchAllProducts(forceRefresh = false) {
    if (!store.products || store.products.length === 0 || forceRefresh) {
        try {
            const snap = await getDocs(collection(db, "products"));
            store.products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            localStorage.setItem('cachedProducts', JSON.stringify(store.products));
            EventBus.emit('products-updated', store.products);
        } catch (err) {
            console.error("Product Service Error: Failed to fetch products:", err);
            store.products = [];
        }
    }
    return store.products;
}

/**
 * Add a new product to Firestore and update centralized cache.
 * @param {string} category
 * @param {string} name
 * @returns {Object} new product
 */
export async function addProduct(category, name) {
    try {
        const newProductRef = doc(collection(db, "products"));
        const newProduct = {
            id: newProductRef.id,
            category,
            name,
            sellingPrice: 0.00,
            mrp: 0.00,
            createdAt: serverTimestamp()
        };
        await setDoc(newProductRef, newProduct);

        // Update centralized cache
        if (!store.products) store.products = [];
        store.products.push(newProduct);
        localStorage.setItem('cachedProducts', JSON.stringify(store.products));
        EventBus.emit('products-updated', store.products);

        return newProduct;
    } catch (err) {
        console.error("Product Service Error: Failed to add product:", err);
        throw new Error("Failed to add new product.");
    }
}

/**
 * Find product in centralized cache
 */
export function findProduct(category, itemName) {
    if (!store.products) store.products = [];
    return store.products.find(p => p.category === category && p.name === itemName);
}

/**
 * Initialize products cache from localStorage on app startup
 */
export function initializeProductsCache() {
    try {
        const cached = localStorage.getItem('cachedProducts');
        if (cached) store.products = JSON.parse(cached);
    } catch (err) {
        console.warn("Failed to load products from localStorage:", err);
        store.products = [];
    }
}
