// js/components/router.js

// --------------------------------------------------------------------------------
// FIX 1: Import all necessary page initialization functions from their correct modules.
// --------------------------------------------------------------------------------
import { initializeProductManagement } from '../pages/products-manage.js';
import { initializeOrderPage } from '../pages/new-order.js'; 
import { initializeShopManagement } from '../pages/shop-management.js';
// import { initializeHome } from '../pages/home.js'; // Uncomment when home.js is ready

const CONTENT_AREA_ID = 'main-content-area'; // Assuming your index.html has an element with this ID
let firebaseApp = null; 

// --- Routing Configuration ---
const ROUTES = {
    // Home/Default Route (path: #)
    '': { 
        templatePath: 'pages/home.html', 
        title: 'Dashboard | Kazzy Enterprises',
        onLoad: (app) => {
            // Placeholder/Fallback logic for the home page
            const contentArea = document.getElementById(CONTENT_AREA_ID);
            if (contentArea.innerHTML === "") { // Only set placeholder if content is empty
                contentArea.innerHTML = 
                '<h1>Welcome to the Dashboard</h1><p>Use the sidebar to navigate.</p>';
            }
            // Call initializeHome(app) once home.js is ready
            // if (typeof initializeHome === 'function') initializeHome(app);
        }
    },

    // Route for Shop Management (path: #shop-management)
    'shops/manage': {
        templatePath: 'pages/shop-management.html', // Standardized key
        title: 'Manage Shops & Places | Kazzy Enterprises',
        onLoad: initializeShopManagement // Standardized key
    },

    // Route for New Order (path: #orders/new-order)
    'orders/new-order': { 
        templatePath: 'pages/new-order.html', 
        title: 'New Orders | Kazzy Enterprises',
        onLoad: initializeOrderPage 
    },
    
    // Route for Product Management (path: #products/manage)
    'products/manage': { 
        templatePath: 'pages/products-manage.html', 
        title: 'Manage Products | Kazzy Enterprises',
        onLoad: initializeProductManagement 
    },

    // Example placeholders for other routes:
    'products/catalog': { 
        templatePath: 'pages/products-catalog.html', 
        title: 'Product Catalog | Kazzy Enterprises',
        onLoad: () => { /* Logic here */ }
    },
    'products/inventory': { 
        templatePath: 'pages/products-inventory.html', 
        title: 'Inventory | Kazzy Enterprises',
        onLoad: () => { /* Logic here */ }
    }
};

/**
 * Fetches the HTML template and inserts it into the main content area.
 */
async function loadContent(route) {
    const contentArea = document.getElementById(CONTENT_AREA_ID);
    if (!contentArea) return;

    // Use the route directly for lookup, defaulting to the home route ('')
    const routeConfig = ROUTES[route] || ROUTES['']; 

    // Handle 404 if the route exists but is missing a templatePath (shouldn't happen with the current config)
    if (!routeConfig.templatePath) {
        contentArea.innerHTML = `<h1 class="error">404 - Configuration Error</h1><p>The route "${route}" is defined but missing a template path.</p>`;
        document.title = '404 Not Found';
        return;
    }

    try {
        // 1. Fetch the HTML template
        const response = await fetch(routeConfig.templatePath);
        if (!response.ok) {
            // Check if it's a known route with a missing file (404) or a genuine unconfigured route
            throw new Error(`Failed to load template (HTTP ${response.status}): ${routeConfig.templatePath}`);
        }
        const html = await response.text();
        
        // 2. INJECT THE HTML (Must happen before onLoad is called)
        contentArea.innerHTML = html; 

        // 3. Update the document title
        document.title = routeConfig.title;

        // 4. Run the page's specific initialization function, passing the Firebase app instance
        if (routeConfig.onLoad && typeof routeConfig.onLoad === 'function') {
            // IMPORTANT: Pass firebaseApp which contains the initialized Firestore instance
            routeConfig.onLoad(firebaseApp); 
        }
    } catch (error) {
        contentArea.innerHTML = `<h1 class="error">404 - Page Not Found</h1><p>The page template for route <code>#${route}</code> could not be loaded.<br>Error: ${error.message}</p>`;
        document.title = '404 Not Found';
        console.error('Routing Error:', error);
    }
}


/**
 * Initializes the router and sets up event listeners.
 * @param {object} appInstance - The initialized Firebase app object.
 */
export function initializeRouter(appInstance) {
    firebaseApp = appInstance; 
    
    // Function to get the current route key from the URL hash
    // Example: #orders/new-order?param=1 -> orders/new-order
    const getRoute = () => window.location.hash.substring(1).split('?')[0].replace(/^\//, ''); 

    // Function to handle route change and content loading
    const handleRouteChange = () => {
        loadContent(getRoute()); 
        
        // Auto-close sidebar on navigation (mobile friendly)
        const sidebar = document.getElementById("sidebar");
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove("active");
        }
    };

    // 1. Listen for hash changes
    window.addEventListener('hashchange', handleRouteChange);

    // 2. Intercept link clicks to prevent full page reloads (optional but recommended)
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target && target.hasAttribute('href') && target.getAttribute('href').startsWith('#')) {
            // Allow the browser's default hashchange mechanism to trigger handleRouteChange
            // No need for e.preventDefault() as we want the hash to change.
        }
    });

    // 3. Initial load based on the current URL
    handleRouteChange();
}