// features/dashboard/index.js (Was features/home/index.js)

import { registerRoute } from "../../shared/core/router.js";
import { loadComponent } from "../../shared/components/component-loader.js";

/**
 * The 'Dashboard' feature handles the default application route.
 * Route: #
 */

registerRoute("dashboard", async () => {
    console.log('registered. dashboard')

    // 1. Load the Dashboard HTML content into the main content area
    const loadSuccess = await loadComponent(
        "features/home/templates/dashboard.html", 
        "main-content-area"
    );
    
    if (loadSuccess) {
        // 2. Import and run the page-specific initialization script
        console.log('wait!')
        const { initializeDashboardPage } = await import("/feature/home/js/pages/dashboard.js");
        initializeDashboardPage();
        
        document.title = 'Kazzy Dashboard';
        console.log("[Dashboard] Page and Logic Initialized");
    }
});