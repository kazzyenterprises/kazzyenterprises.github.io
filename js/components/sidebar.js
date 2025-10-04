/**
 * js/components/sidebar.js
 * - Defines the static HTML structure of the sidebar menu.
 * - Contains the logic for the mobile toggle and the accordion behavior.
 */

const SIDEBAR_HTML_TEMPLATE = `
    <div class="sidebar" id="sidebar">
        <div class="logo"><i class="fa-solid fa-building"></i> Kazzy Enterprises</div>
        <ul>
            <li><a href="#"><i class="fa-solid fa-gauge"></i> <span>Dashboard</span></a></li>
            
            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-cart-shopping"></i> Orders</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#orders/all"><i class="fa-regular fa-list-alt"></i> All Orders</a></li>
                    <li><a href="#orders/new-order"><i class="fa-solid fa-plus"></i> New Order</a></li>
                    <li><a href="#orders/edit"><i class="fa-solid fa-pen-to-square"></i> Edit Order</a></li>
                </ul>
            </li>

            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-store"></i> Shops</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#shops/shop-directory"><i class="fa-solid fa-address-book"></i> Shop Directory</a></li>
                    <li><a href="#shops/places-manage"><i class="fa-solid fa-location-dot"></i> Places</a></li>
                    <li><a href="#shops/manage"><i class="fa-solid fa-gear"></i> Manage Shops</a></li>
                    <li><a href="#shops/images"><i class="fa-regular fa-image"></i> Shop Images</a></li>
                </ul>
            </li>

            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-box"></i> Products</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#products/catalog"><i class="fa-solid fa-boxes-stacked"></i> Product Catalog</a></li>
                    <li><a href="#products/manage"><i class="fa-solid fa-pen-to-square"></i> Manage Products</a></li>
                    <li><a href="#products/inventory"><i class="fa-solid fa-warehouse"></i> Inventory</a></li>
                </ul>
            </li>

            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-truck"></i> Delivery</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#delivery/plan"><i class="fa-solid fa-route"></i> Delivery Plan</a></li>
                    <li><a href="#delivery/orders"><i class="fa-solid fa-box-open"></i> Delivery Orders</a></li>
                </ul>
            </li>

            <li>
                <a class="menu-item has-submenu"><span><i class="fa-solid fa-credit-card"></i> Payments</span><i class="fa-solid fa-chevron-right"></i></a>
                <ul class="submenu">
                    <li><a href="#payments/records"><i class="fa-solid fa-file-invoice-dollar"></i> Payment Records</a></li>
                    <li><a href="#payments/pending"><i class="fa-solid fa-clock"></i> Pending Payments</a></li>
                </ul>
            </li>

            <li><a href="#contact"><span><i class="fa-solid fa-envelope"></i> Contact</span></a></li>
            <li><a href="#login"><span><i class="fa-solid fa-right-to-bracket"></i> Login</span></a></li>
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
        // Toggle the 'active' class on the sidebar to show/hide it for mobile
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
                
                // Get the submenu and the arrow icon for the clicked item
                const submenu = item.nextElementSibling;
                const arrowIcon = item.querySelector('i:last-child'); // Last icon is the chevron

                // Close all other open submenus
                sidebar.querySelectorAll(".submenu.open").forEach(menu => {
                    if (menu !== submenu) {
                        menu.classList.remove("open");
                        // Find and flip the icon back to the right for closed menus
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
                    
                    // Flip the icon for the currently clicked item
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
