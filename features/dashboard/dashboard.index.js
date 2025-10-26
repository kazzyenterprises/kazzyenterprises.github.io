// features/dashboard/index.js
import { registerRoute } from "../../shared/core/router.js";
import { loadComponent } from "../../shared/components/component-loader.js";

registerRoute("dashboard", async () => {
  console.log('[Dashboard] registering route');

  // load component HTML into main-content-area (adjust path to your file)
  const loadSuccess = await loadComponent(
    "features/dashboard/dashboard.page.html",
    "main-content-area"
  );

  if (loadSuccess) {
    // import page logic (use relative path without leading slash)
    const { initializeDashboardPage } = await import("/feature/dashboard/dashboard.page.js");
    if (typeof initializeDashboardPage === 'function') initializeDashboardPage();
    document.title = 'Kazzy Dashboard';
    console.log("[Dashboard] Page and Logic Initialized");
  } else {
    console.error("[Dashboard] Failed to load dashboard HTML");
  }
});
