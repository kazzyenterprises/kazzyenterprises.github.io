// features/dashboard/index.js
import { registerRoute } from "../../shared/core/router.js";
import { loadComponent } from "../../shared/components/component-loader.js";

registerRoute("dashboard", async () => {
    console.log('[Dashboard] registering route');

    try {
        // 1. Load component HTML (This will THROW an error on failure)
        await loadComponent(
            "features/dashboard/dashboard-page.html",
            "main-content-area"
        );
        
        // 2. If loadComponent succeeds, proceed with page logic
        try {
            // import page logic (use relative path without leading slash)
            const { initializeDashboardPage } = await import("./dashboard-page.js");
            
            if (typeof initializeDashboardPage === 'function') initializeDashboardPage();
            
            document.title = 'Kazzy Dashboard';
            console.log("[Dashboard] Page and Logic Initialized");
            
        } catch (e) {
            // Catches errors from the dynamic import or initializeDashboardPage()
            console.error("[Dashboard] Failed to initialize page logic or import module:", e);
        }

    } catch (e) {
        // 3. This CATCHES the error THROWN by loadComponent (e.g., 404, target not found)
        console.error("[Dashboard] Failed to load dashboard component:", e);
    }
});