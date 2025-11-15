// features/products/index.js

/**
 * Products Feature Entry
 * - Registers all product-related routes
 * - Handles lazy-loading of pages
 */

import { registerRoute } from "../../shared/core/router.js";
import { loadComponent } from "../../shared/components/component-loader.js";

/* -----------------------------
    ROUTE REGISTRATION
------------------------------*/

// Route 1: #products/product-catalog
registerRoute("products/product-catalog", async () => {
    const contentArea = document.getElementById('main-content-area');
    
    // Load the HTML template
    await loadComponent("features/products/product-catalog/product-catalog-page.html", "main-content-area");
    
    try {
        // Dynamically import and initialize the page-specific JavaScript
        const { initializeCatalogPage } = await import("/features/products/logic/product-catalog-page.js"); 
        
        initializeCatalogPage();
        document.title = 'Product Catalog';
        console.log("[Products] Product Catalog Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Products] Failed to import or initialize product-catalog-page.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load Product Catalog logic. Error: ${e.message}</p>`;
    }
});

// Route 2: #products/manage-products (Using 'products/manage-products' for consistency)
registerRoute("products/manage-products", async () => {
    const contentArea = document.getElementById('main-content-area');
    
    // Load the HTML template
    await loadComponent("features/products/manage-products/manage-products-page.html", "main-content-area");
    
    try {
        const { initializeManageProductsPage } = await import("/features/products/manage-products/manage-products-page.js"); 
        
        initializeManageProductsPage();
        document.title = 'Manage Products';
        console.log("[Products] Manage Products Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Products] Failed to import or initialize manage-products-page.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load Manage Products logic. Error: ${e.message}</p>`;
    }
});

// Route 3: #products/inventory
registerRoute("products/inventory", async () => {
    const contentArea = document.getElementById('main-content-area');
    
    // Load the HTML template
    await loadComponent("features/products/inventory/inventory-page.html", "main-content-area");
    
    try {
        const { initializeInventoryPage } = await import("/features/products/logic/inventory-page.js"); 
        
        initializeInventoryPage();
        document.title = 'Inventory Management';
        console.log("[Products] Inventory Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Products] Failed to import or initialize inventory-page.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load Inventory logic. Error: ${e.message}</p>`;
    }
});

/* -----------------------------
    FEATURE EXPORT
------------------------------*/

export const ProductsFeature = {
    name: "Products",
    routes: [
        "products/product-catalog", 
        "products/manage-products", // Note: Corrected to plural for internal consistency
        "products/inventory"
    ],
};