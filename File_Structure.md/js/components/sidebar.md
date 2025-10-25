# sidebar.js — *Sidebar Menu Component*
**Location:** `js/components/sidebar.js`

---

## ⚙️ Core Responsibilities

| Function / Feature | Description |
|--------------------|-------------|
| **Sidebar HTML Template** | Defines the static structure of the sidebar including main items and nested submenus for Orders, Shops, Products, Delivery, Payments, etc. |
| **renderSidebar()** | Inserts the sidebar template into the layout placeholder (`#sidebar-placeholder`). |
| **initializeMenuToggle()** | Adds mobile toggle functionality to show/hide the sidebar when `#menu-toggle` is clicked. |
| **initializeSidebarAccordion()** | Handles submenu accordion behavior, allowing only one submenu to be open at a time. Rotates chevron icons dynamically based on open/close state. |

---

## 🔄 Data Flow Overview

```plaintext
1️⃣ Rendering Sidebar
renderSidebar()
        │
        └── Injects SIDEBAR_HTML_TEMPLATE → #sidebar-placeholder

2️⃣ Mobile Toggle
initializeMenuToggle()
        │
        └── Click #menu-toggle → toggles 'active' class on #sidebar → show/hide sidebar

3️⃣ Submenu Accordion
initializeSidebarAccordion()
        │
        ├── Click a menu item with submenu
        ├── Close any other open submenus
        ├── Toggle clicked submenu open/closed
        └── Update chevron icon direction (right ↔ down)
