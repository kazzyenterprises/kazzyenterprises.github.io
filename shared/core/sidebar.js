// shared/core/sidebar.js (renamed to sidebar.js in shared/logic/core)
// - Defines the static HTML structure of the sidebar menu.
// - Contains the logic for the mobile toggle and the accordion behavior.

const SIDEBAR_HTML_TEMPLATE = `
    <div class="sidebar" id="sidebar">
        <div class="logo"><i class="fa-solid fa-building"></i> Kazzy Enterprises</div>
        <ul>
            <li><a href="#dashboard" data-route=""><i class="fa-solid fa-gauge"></i> <span>Dashboard</span></a></li>
            
            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-cart-shopping"></i> Orders</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#orders/all" data-route="orders/all"><i class="fa-regular fa-list-alt"></i> All Orders</a></li>
                    <li><a href="#orders/new-order" data-route="orders/new-order"><i class="fa-solid fa-plus"></i> New Order</a></li>
                    <li><a href="#orders/edit-orders" data-route="orders/edit-orders"><i class="fa-solid fa-pen-to-square"></i> Edit Order</a></li>
                </ul>
            </li>

            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-store"></i> Shops</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#shops/shop-directory" data-route="shops/shop-directory"><i class="fa-solid fa-address-book"></i> Shop Directory</a></li>
                    <li><a href="#shops/manage-places" data-route="shops/manage-places"><i class="fa-solid fa-location-dot"></i> Places</a></li>
                    <li><a href="#shops/manage-shops" data-route="shops/manage-shops"><i class="fa-solid fa-gear"></i> Manage Shops</a></li> 
                    <li><a href="#shops/shop-images" data-route="shops/images"><i class="fa-regular fa-image"></i> Shop Images</a></li>
                </ul>
            </li>

            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-box"></i> Products</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#products/product-catalog" data-route="products/product-catalog"><i class="fa-solid fa-boxes-stacked"></i> Product Catalog</a></li>
                    <li><a href="#products/manage-products" data-route="products/manage-products"><i class="fa-solid fa-pen-to-square"></i> Manage Products</a></li>
                    <li><a href="#products/inventory" data-route="products/inventory"><i class="fa-solid fa-warehouse"></i> Inventory</a></li>
                </ul>
            </li>

            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-truck"></i> Delivery</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#delivery/delivery-plan" data-route="delivery/delivery-plan"><i class="fa-solid fa-route"></i> Delivery Plan</a></li>
                    <li><a href="#delivery/delivery-orders" data-route="delivery/delivery-orders"><i class="fa-solid fa-box-open"></i> Delivery Orders</a></li>
                </ul>
            </li>

            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-credit-card"></i> Payments</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#payments/records" data-route="payments/records"><i class="fa-solid fa-file-invoice-dollar"></i> Payment Records</a></li>
                    <li><a href="#payments/pending" data-route="payments/pending"><i class="fa-solid fa-clock"></i> Pending Payments</a></li>
                </ul>
            </li>

            <li><a href="#contact" data-route="contact"><span><i class="fa-solid fa-envelope"></i> Contact</span></a></li>
            <li><a href="#login" data-route="login"><span><i class="fa-solid fa-right-to-bracket"></i> Login</span></a></li>
        </ul>
    </div>
`;

/**
 * Inserts the sidebar template into the main layout's placeholder.
 */
export function renderSidebar() {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (placeholder) {
        placeholder.innerHTML = SIDEBAR_HTML_TEMPLATE;
    }
}

/**
 * Initializes the mobile toggle behavior.
 */
export function initializeMenuToggle() {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }
}

/**
 * Initializes the submenu accordion behavior and handles icon rotation.
 */
export function initializeSidebarAccordion() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.querySelectorAll("li > .menu-item.has-submenu").forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault(); 
                
                const submenu = item.nextElementSibling;
                const arrowIcon = item.querySelector('i:last-child'); 

                // Close all other open submenus
                sidebar.querySelectorAll(".submenu.open").forEach(menu => {
                    if (menu !== submenu) {
                        menu.classList.remove("open");
                        const otherArrow = menu.previousElementSibling.querySelector('i:last-child');
                        if (otherArrow) {
                            otherArrow.classList.remove("fa-chevron-down");
                            otherArrow.classList.add("fa-chevron-right");
                        }
                    }
                });

                // Toggle the clicked submenu
                if (submenu) {
                    const isOpening = !submenu.classList.contains("open");
                    submenu.classList.toggle("open");
                    
                    if (isOpening) {
                        arrowIcon.classList.remove("fa-chevron-right");
                        arrowIcon.classList.add("fa-chevron-down");
                    } else {
                        arrowIcon.classList.remove("fa-chevron-down");
                        arrowIcon.classList.add("fa-chevron-right");
                    }
                }
            });
        });
    }
}

/**
 * Public function called by the Router to set the active menu item based on the current route.
 * @param {string} currentRoutePath - The path part of the route (e.g., "orders/new-order").
 */
export function setActiveMenuItem(currentRoutePath) {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    // 1. Remove active class from all links
    sidebar.querySelectorAll('a').forEach(a => {
        a.classList.remove('active');
    });

    // 2. Find the link corresponding to the current route path
    const activeLink = sidebar.querySelector(`a[data-route="${currentRoutePath}"]`);

    if (activeLink) {
        // 3. Set the active class
        activeLink.classList.add('active');

        // 4. Ensure the parent submenu is open for visibility
        let parentSubmenu = activeLink.closest('.submenu');
        if (parentSubmenu) {
            parentSubmenu.classList.add('open');
            
            // 5. Flip the submenu header icon to point down
            const headerItem = parentSubmenu.previousElementSibling;
            if (headerItem) {
                const arrowIcon = headerItem.querySelector('i:last-child');
                if (arrowIcon) {
                    arrowIcon.classList.remove("fa-chevron-right");
                    arrowIcon.classList.add("fa-chevron-down");
                }
            }
        }
    }
}