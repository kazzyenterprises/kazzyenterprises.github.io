// shared/core/router.js
const ROUTES = {};
const CONTENT_AREA_ID = 'main-content-area';
let firebaseApp = null;

// default route - change as you like
const DEFAULT_ROUTE = 'dashboard';

export function registerRoute(route, callback) {
  if (route === null || route === undefined || typeof callback !== 'function') {
    console.warn(`[Router] Invalid route registration: ${route}`);
    return;
  }
  ROUTES[route] = callback;
}

async function safeLoad404() {
  // if a 404 route is registered, run it; else render inline fallback
  const contentArea = document.getElementById(CONTENT_AREA_ID);
  if (ROUTES['404']) {
    try {
      await ROUTES['404'](firebaseApp);
    } catch (err) {
      console.error('[Router] Error loading 404 route:', err);
      if (contentArea) contentArea.innerHTML = `<h1 class="error">404 - Page Not Found</h1><p>Unable to render 404 page.</p>`;
    }
    return;
  }

  if (contentArea) {
    contentArea.innerHTML = `
      <section style="padding:24px">
        <h1 style="font-size:22px">404 - Page Not Found</h1>
        <p>No route registered for this path. Use the sidebar or click <a href="#dashboard">Dashboard</a>.</p>
      </section>`;
    document.title = '404 - Not Found';
  }
}

async function loadRoute(route) {
  const contentArea = document.getElementById(CONTENT_AREA_ID);
  if (!contentArea) {
    console.error('Router Error: #main-content-area not found in DOM.');
    return;
  }

  const callback = ROUTES[route];
  if (!callback) {
    console.warn(`[Router] No route registered for: ${route} — showing 404`);
    await safeLoad404();
    return;
  }

  try {
    await callback(firebaseApp);
  } catch (error) {
    console.error(`[Router] Error loading route ${route}:`, error);
    // Show friendly error & provide a link back home
    contentArea.innerHTML = `
      <section style="padding:24px">
        <h1 style="font-size:22px">Failed to load page</h1>
        <p>${(error && error.message) ? error.message : 'Unknown error'}</p>
        <p><a href="#dashboard">Go to Dashboard</a></p>
      </section>`;
    document.title = 'Error - Kazzy';
  }
}

export function initializeRouter(appInstance) {
  firebaseApp = appInstance;

  const getRoute = () =>
    window.location.hash.substring(1).split('?')[0].replace(/^\//, '') || '';

  // If no hash present on first load, redirect to DEFAULT_ROUTE (replace state to avoid back entry)
  if (!window.location.hash || window.location.hash === '#') {
    history.replaceState(null, '', `#${DEFAULT_ROUTE}`);
  }

  let route_change_count = 0;
  const handleRouteChange = () => {
    route_change_count += 1;
    const route = getRoute();
    console.log(`[Router] Change #${route_change_count}: Handling route: #${route}`);
    loadRoute(route);

    // Auto-close sidebar on mobile
    const sidebar = document.getElementById("sidebar");
    if (sidebar && sidebar.classList.contains("active")) {
      sidebar.classList.remove("active");
    }
  };

  window.addEventListener("hashchange", handleRouteChange);

  // prevent page jump for top '#' anchors, do not interfere with real routes
  document.body.addEventListener("click", (e) => {
    const target = e.target.closest('a[href^="#"]');
    if (target && target.getAttribute('href') === '#') {
      e.preventDefault();
    }
  });

  // initial run
  handleRouteChange();
}
