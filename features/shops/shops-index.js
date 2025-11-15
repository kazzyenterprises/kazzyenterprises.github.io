// features/shops/shops-index.js

/**
 * Shops Feature Entry
 * - Registers all shops-related routes
 * - Handles lazy-loading of pages
 */

import { registerRoute } from "../../shared/core/router.js";
import { loadComponent } from "../../shared/components/component-loader.js";

/* -----------------------------
    ROUTE REGISTRATION
------------------------------*/

// Route 1: #shops/shop-directory
registerRoute("shops/shop-directory", async () => {
    const contentArea = document.getElementById('main-content-area');
    
    // Load the HTML template (Example path)
    await loadComponent("features/shops/shop-directory/shop-directory-page.html", "main-content-area");
    
    try {
        // Dynamically import and initialize the page-specific JavaScript
        const { initializeShopDirectoryPage } = await import("/features/shops/shop-directory/shop-directory-page.js"); 
        
        initializeShopDirectoryPage();
        document.title = 'Shop Directory';
        console.log("[Shops] Shop Directory Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Shops] Failed to import or initialize shop-directory-page.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load Shop Directory logic. Error: ${e.message}</p>`;
    }
});

// Route 2: #shops/places (The route path in sidebar is 'shops/places-manage')
registerRoute("shops/manage-places", async () => {
    const contentArea = document.getElementById('main-content-area');
    
    // Load the HTML template
    await loadComponent("features/shops/manage-places/manage-places-page.html", "main-content-area");
    
    try {
        const { initializePlacesManagePage } = await import("/features/shops/manage-places/manage-places-page.js"); 
        
        initializePlacesManagePage();
        document.title = 'Manage Places';
        console.log("[Shops] Places Management Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Shops] Failed to import or initialize places-manage-page.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load Places Management logic. Error: ${e.message}</p>`;
    }
});

// Route 3: #shops/manage-shops (Your new feature page, route path is 'shops/manage')
registerRoute("shops/manage-shops", async () => {
    const contentArea = document.getElementById('main-content-area');
    
    // Load the HTML template
    await loadComponent("features/shops/manage-shops/manage-shops-page.html", "main-content-area");
    
    try {
        const { initializeShopManagementPage } = await import("/features/shops/manage-shops/manage-shops-page.js"); 
        
        initializeShopManagementPage();
        document.title = 'Shop Management';
        console.log("[Shops] Shop Management Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Shops] Failed to import or initialize shop-management-page.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load shop management logic. Error: ${e.message}</p>`;
    }
});

// Route 4: #shops/shop-images (Route path is 'shops/images')
registerRoute("shops/images", async () => {
    const contentArea = document.getElementById('main-content-area');
    
    // Load the HTML template
    await loadComponent("features/shops/shop-images/shop-images-page.html", "main-content-area");
    
    try {
        const { initializeShopImagesPage } = await import("/features/shops/logic/shop-images-page.js"); 
        
        initializeShopImagesPage();
        document.title = 'Shop Images';
        console.log("[Shops] Shop Images Page Initialized SUCCESS");
    } catch (e) {
        console.error("[Shops] Failed to import or initialize shop-images-page.js:", e);
        contentArea.innerHTML += `<p class="error">Failed to load Shop Images logic. Error: ${e.message}</p>`;
    }
});

/* -----------------------------
    FEATURE EXPORT
------------------------------*/

export const ShopsFeature = {
    name: "Shops",
    routes: [
        "shops/shop-directory", 
        "shops/manage-places", 
        "shops/manage-shops", 
        "shops/images"
    ],
};