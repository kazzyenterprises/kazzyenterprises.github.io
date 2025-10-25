/**
 * Modular Router System
 * - Allows each feature (Orders, Products, Shops, etc.) to register its own routes dynamically.
 */

const ROUTES = {}; // central route registry
const CONTENT_AREA_ID = 'main-content-area';
let firebaseApp = null;

/* ------------------------------------------------------------------
    REGISTER ROUTE
    ------------------------------------------------------------------ */
export function registerRoute(route, callback) {
    // Check if route is explicitly null/undefined OR callback is not a function.
    // We explicitly allow route === "" (empty string) for the default route.
    if (route === null || route === undefined || typeof callback !== 'function') {
        // Log the route being warned about for better debugging
        console.warn(`[Router] Invalid route registration: ${route}`); 
        return;
    }
    ROUTES[route] = callback;
}

/* ------------------------------------------------------------------
    LOAD ROUTE
    ------------------------------------------------------------------ */
async function loadRoute(route) {
    const contentArea = document.getElementById(CONTENT_AREA_ID);
    if (!contentArea) {
        console.error('Router Error: #main-content-area not found in DOM.');
        return;
    }

    const callback = ROUTES[route];
    if (!callback) {
        contentArea.innerHTML = `<h1 class="error">Not error. create a index page/welcome page to load.404 - Page Not Found</h1>
        <p>No route registered for <code>#${route}</code></p>`;
        document.title = '404 Not Found';
        return;
    }

    try {
        await callback(firebaseApp); // run route callback (async-safe)
    } catch (error) {
        console.error(`[Router] Error loading route ${route}:`, error);
        contentArea.innerHTML = `<h1 class="error">Failed to Load</h1>
        <p>Error loading <code>${route}</code>: ${error.message}</p>`;
    }
}

/* ------------------------------------------------------------------
    INITIALIZE ROUTER
    ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
    INITIALIZE ROUTER
    ------------------------------------------------------------------ */

// Removed 'count = 0' as it was misplaced and not effective
export function initializeRouter(appInstance) {
    firebaseApp = appInstance;

    const getRoute = () =>
        window.location.hash.substring(1).split('?')[0].replace(/^\//, '') || '';

    // Initialize a local count for debugging purposes inside the closure
    let route_change_count = 0; 

    const handleRouteChange = () => {
        route_change_count += 1; // Increment on every execution
        const route = getRoute();
        
        // CORRECTED LOGGING: Show the route being handled
        console.log(`[Router] Change #${route_change_count}: Handling route: #${route}`); 
        
        loadRoute(route);

        // Auto-close sidebar on mobile
        const sidebar = document.getElementById("sidebar");
        if (sidebar && sidebar.classList.contains("active")) {
            sidebar.classList.remove("active");
        }
    };

    window.addEventListener("hashchange", handleRouteChange);
    
    // Removed the previous misplaced console.log('hash changed!', count)

    // Handle clicks on hash links (no reload)
    // shared/js/core/router.js -> Inside initializeRouter

// Handle clicks on hash links (no reload)
    document.body.addEventListener("click", (e) => {
        const target = e.target.closest('a[href^="#"]');
        
        if (target) {
            // 1. If the href is ONLY "#" (default hash), prevent default to stop page jump.
            // The empty hash "" is handled by the hashchange listener.
            if (target.getAttribute('href') === '#') {
                e.preventDefault(); 
            }
            
            // 2. DO NOT preventDefault for other hash links (e.g., #orders/new-order)
            // because we rely on the browser to change the URL hash and fire the
            // window.addEventListener("hashchange", handleRouteChange) event.
        }
    });

    // Initial route load
    handleRouteChange();
}