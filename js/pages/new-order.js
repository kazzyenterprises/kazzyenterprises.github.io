/* js/pages/new-order.js - COMPLETE REPLACEMENT (Re-ordered for Scope/Hoisting) */

// Global state variables
let productCache = [];
let placesCache = [];
let draftOrderState = {
    routeId: "", placeId: "", placeName: "", shopId: "", shopName: "",
    deliveryDate: "", rows: []
};
let DOM = {}; 
const USER_ID = "staticUser"; 

// Declare db globally in the module, but initialize it inside initializeOrderPage
let db = null; 

// ------------------------------------------------------------------
// --- CORE INITIALIZATION HELPERS (MUST BE DEFINED BEFORE initializeOrderPage) ---
// ------------------------------------------------------------------

function getDOMElements() {
    // ... (Your getDOMElements function remains unchanged) ...
    return {
        orderDateInput: document.getElementById("order-date"),
        orderTimeInput: document.getElementById("order-time"),
        deliveryDateInput: document.getElementById("delivery-date"),
        routeSelect: document.getElementById("route"),
        placeSelect: document.getElementById("place"),
        shopSelect: document.getElementById("shop-name"),
        orderIdDisplay: document.getElementById("order-id-display"),
        orderTbody: document.getElementById("order-tbody"),
        addProductRowBtn: document.getElementById("add-product-row"),
        placeOrderBtn: document.getElementById("place-order"),
        grandTotalCell: document.getElementById("grand-total"),
        newCategoryInput: document.getElementById("new-category"),
        newProductInput: document.getElementById("new-product"),
        addProductBtn: document.getElementById("add-product"),
    };
}

function setupEventListeners() {
    // CRITICAL FIX: Replace element variables with DOM.elementName
    DOM.routeSelect.addEventListener("change", async () => {
        draftOrderState.routeId = DOM.routeSelect.value;
        await fetchPlacesForSelectedRoute();
        saveDraftToFirestore();
    });
    DOM.placeSelect.addEventListener("change", async () => {
        draftOrderState.placeId = DOM.placeSelect.value;
        await fetchShopsForSelectedPlace();
        saveDraftToFirestore();
    });
    DOM.shopSelect.addEventListener("change", () => {
        draftOrderState.shopId = DOM.shopSelect.value;
        saveDraftToFirestore();
    });
    DOM.deliveryDateInput.addEventListener("change", saveDraftToFirestore);
    DOM.addProductRowBtn.addEventListener("click", handleAddProductRow);
    DOM.placeOrderBtn.addEventListener("click", handlePlaceOrder);
    DOM.addProductBtn.addEventListener("click", handleAddNewProduct);
}

async function loadProducts() {
    try {
        const productsSnap = await db.collection("products").get();
        productCache = productsSnap.docs.map(d => d.data());
    } catch (err) {
        console.error("Error fetching products:", err);
    }
}

async function loadRoutes() {
    try {
        const routesSnap = await db.collection("routes").get();
        // CRITICAL FIX: Use DOM.routeSelect
        DOM.routeSelect.innerHTML = routesSnap.docs.map(doc => {
            const data = doc.data();
            return `<option value="${doc.id}">${data.name || doc.id}</option>`;
        }).join('');
        if (!DOM.routeSelect.value && DOM.routeSelect.options.length) {
            DOM.routeSelect.value = DOM.routeSelect.options[0].value;
        }
    } catch (err) {
        console.error("Error fetching routes:", err);
    }
}

async function generateOrderId() {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = String(now.getDate()).padStart(2, "0");
    const prefix = `${month}${day}`;

    const snap = await db.collection("orders")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

    let count = 0;
    snap.forEach(doc => {
        if (doc.id.startsWith(prefix)) {
            const num = parseInt(doc.id.split("-")[1]) || 0;
            count = Math.max(count, num);
        }
    });

    const orderId = `${prefix}-${String(count + 1).padStart(4, "0")}`;
    DOM.orderIdDisplay.dataset.orderId = orderId;
    DOM.orderIdDisplay.textContent = `Order ID: ${orderId}`;
}

async function loadDraftOrder() {
      try {
        const draftDoc = await db.collection("draftOrders").doc(USER_ID).get();
        if (draftDoc.exists) {
            draftOrderState = draftDoc.data();
            
            // Restore UI state from draft
            if (draftOrderState.routeId) DOM.routeSelect.value = draftOrderState.routeId;
            await fetchPlacesForSelectedRoute();
            if (draftOrderState.placeId) DOM.placeSelect.value = draftOrderState.placeId;
            await fetchShopsForSelectedPlace();
            if (draftOrderState.shopId) DOM.shopSelect.value = draftOrderState.shopId;
            if (draftOrderState.deliveryDate) {
                const date = draftOrderState.deliveryDate.toDate().toISOString().split("T")[0];
                DOM.deliveryDateInput.value = date;
            }
            restoreDraftToTable();
        }
    } catch (err) {
        console.error("Error loading draft order:", err);
    }
}

// ------------------------------------------------------------------
// --- MAIN INITIALIZATION FUNCTION (Called by the router) ---
// ------------------------------------------------------------------

export async function initializeOrderPage(appInstance) { 
    // CRITICAL FIX 1: Initialize the module's db variable *now*
    if (!appInstance) {
        console.error("Firebase App Instance not passed to initializeOrderPage.");
        return;
    }
    db = appInstance.firestore(); 
    
    // 1. Populate the global DOM object. 
    DOM = getDOMElements();

    const now = new Date();
    
    // Check if critical elements were found using the DOM object
    if (!DOM.orderDateInput || !DOM.orderTimeInput || !DOM.deliveryDateInput) {
        console.error("DOM Initialization Error: Elements not found after router injection.", DOM);
        return; 
    }

    // Set values using the DOM object
    DOM.orderDateInput.value = now.toISOString().split("T")[0];
    DOM.orderTimeInput.value = now.toTimeString().slice(0,5);
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    DOM.deliveryDateInput.value = tomorrow.toISOString().split("T")[0];

    // Load and setup initial data and listeners
    // These functions are now guaranteed to be defined above this point
    setupEventListeners();
    await loadProducts();
    await loadRoutes();
    await generateOrderId();
    await loadDraftOrder();
}

// ------------------------------------------------------------------
// --- REST OF HELPERS (Place below initialization as they are called later) ---
// ------------------------------------------------------------------

function restoreDraftToTable() {
    // CRITICAL FIX: Use DOM.orderTbody and DOM.placeOrderBtn
    DOM.orderTbody.innerHTML = "";
    if (!draftOrderState.rows?.length) return;
    draftOrderState.rows.forEach(row => createRow(row));
    updateGrandTotal();
    if (draftOrderState.rows.length) DOM.placeOrderBtn.style.display = "block";
}

function saveDraftToFirestore() {
    updateDraftState(); // Always sync local state from DOM first

    // CRITICAL FIX: Use DOM.selects
    const placeName = DOM.placeSelect.options[DOM.placeSelect.selectedIndex]?.textContent || "";
    const shopName = DOM.shopSelect.options[DOM.shopSelect.selectedIndex]?.textContent || "";

    const draftData = {
        // CRITICAL FIX: Use DOM.selects and DOM.deliveryDateInput
        routeId: DOM.routeSelect.value || "",
        placeId: DOM.placeSelect.value || "",
        placeName,
        shopId: DOM.shopSelect.value || "",
        shopName,
        // The global 'firebase' object is available via the <script> tags in index.html
        deliveryDate: firebase.firestore.Timestamp.fromDate(new Date(DOM.deliveryDateInput.value)),
        rows: draftOrderState.rows,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("draftOrders").doc(USER_ID).set(draftData)
        .then(() => console.debug("Saved draftOrder successfully."))
        .catch(err => console.error("Error saving draft:", err));
}

// ------------------------------------------------------------------
// --- PLACES, SHOPS, AND PRODUCTS (CRUD helpers) ---
// ------------------------------------------------------------------

async function fetchPlacesForSelectedRoute() {
    // clear
    // CRITICAL FIX: Use DOM.placeSelect
    DOM.placeSelect.innerHTML = "";
    placesCache = [];

    const routeId = DOM.routeSelect.value;
    if (!routeId) return;

    const snap = await db.collection("places")
        .where("routeId", "==", routeId)
        .get();

    snap.forEach(doc => {
        const data = doc.data();
        placesCache.push({ id: doc.id, ...data });
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = data.name;
        DOM.placeSelect.appendChild(opt);
    });

    if (placesCache.length > 0 && !DOM.placeSelect.value) {
        DOM.placeSelect.value = placesCache[0].id;
    }

    if (DOM.placeSelect.value) {
        await fetchShopsForSelectedPlace();
    }
}

async function fetchShopsForSelectedPlace() {
    // CRITICAL FIX: Use DOM.shopSelect
    DOM.shopSelect.innerHTML = "";

    const routeId = DOM.routeSelect.value;
    const placeId = DOM.placeSelect.value;

    if (!routeId || !placeId) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Select route & place";
        DOM.shopSelect.appendChild(opt);
        return;
    }

    const snap = await db.collection("shops")
        .where("routeId", "==", routeId)
        .where("placeId", "==", placeId)
        .get();

    if (snap.empty) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No shops found";
        DOM.shopSelect.appendChild(opt);
        return;
    }

    snap.forEach(doc => {
        const data = doc.data();
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = data.name;
        DOM.shopSelect.appendChild(opt);
    });
}

function getProduct(category, itemName) {
    return productCache.find(p => p.category === category && p.name === itemName);
}

function populateItems(category, selectEl) {
    selectEl.innerHTML = "";
    const items = productCache.filter(p => p.category === category);
    items.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.name;
        opt.textContent = p.name;
        selectEl.appendChild(opt);
    });
}

// ------------------------------------------------------------------
// --- TABLE AND ROW LOGIC ---
// ------------------------------------------------------------------

function createRow(rowData = {}) {
    const tr = document.createElement("tr");
    tr.className = "order-category";

    const categories = [...new Set(productCache.map(p => p.category))];

    // category select setup
    const categorySelect = document.createElement("select");
    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });
    categorySelect.value = rowData.productCategory || categories[0] || "";

    // item select setup
    const itemSelect = document.createElement("select");
    populateItems(categorySelect.value, itemSelect);
    if (rowData.productName) {
        const hasOpt = [...itemSelect.options].some(o => o.value === rowData.productName);
        if (hasOpt) {
            itemSelect.value = rowData.productName;
        }
    }

    // qty, price, mrp inputs setup
    const countInput = document.createElement("input");
    countInput.type = "number"; countInput.className = "count-input";
    countInput.max = 999; countInput.step = 1; countInput.value = rowData.orderQuantity ?? "";

    const marginInput = document.createElement("input");
    marginInput.type = "number"; marginInput.className = "margin-input";
    marginInput.step = "0.01"; marginInput.value = rowData.sellingPrice ?? "";

    const mrpInput = document.createElement("input");
    mrpInput.type = "number"; mrpInput.className = "mrp-input";
    mrpInput.step = "0.01"; mrpInput.value = rowData.mrp ?? "";

    // Row Event Listeners: Update state and save draft (non-blocking)
    const updateAndSave = () => {
        updateDraftState();
        saveDraftToFirestore();
    };

    categorySelect.addEventListener("change", () => {
        populateItems(categorySelect.value, itemSelect);
        itemSelect.value = "";
        marginInput.value = "";
        mrpInput.value = "";
        updateAndSave();
    });

    itemSelect.addEventListener("change", () => {
        const selectedProduct = getProduct(categorySelect.value, itemSelect.value);
        if (selectedProduct) {
            marginInput.value = selectedProduct.sellingPrice ?? "";
            mrpInput.value = selectedProduct.mrp ?? "";
        }
        updateAndSave();
    });

    countInput.addEventListener("input", updateAndSave);
    marginInput.addEventListener("input", updateAndSave);
    mrpInput.addEventListener("input", updateAndSave);

    // delete
    const deleteTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "🗑️";
    
    deleteBtn.addEventListener("click", () => { 
        tr.remove();
        updateDraftState();
        saveDraftToFirestore();
        // CRITICAL FIX: Use DOM.placeOrderBtn and DOM.orderTbody
        if (DOM.orderTbody.children.length === 0) DOM.placeOrderBtn.style.display = "none";
    });
    deleteTd.appendChild(deleteBtn);

    // append cells
    tr.appendChild(createTd(categorySelect, "category-col"));
    tr.appendChild(createTd(itemSelect, "item-col"));
    tr.appendChild(createTd(countInput, "count-col"));
    tr.appendChild(createTd(marginInput, "margin-col"));
    tr.appendChild(createTd(mrpInput, "mrp-col"));
    tr.appendChild(deleteTd);

    // CRITICAL FIX: Use DOM.orderTbody
    DOM.orderTbody.appendChild(tr);
}

function createTd(el, cls = "") {
    const td = document.createElement("td");
    if (cls) td.className = cls;
    td.appendChild(el);
    return td;
}

function updateDraftState() {
    draftOrderState.rows = [];
    let hasValidRows = false;
    document.querySelectorAll("tr.order-category").forEach(tr => {
        const selects = tr.querySelectorAll("select");
        const inputs = tr.querySelectorAll("input");

        const productCategory = selects[0].value;
        const productName = selects[1].value;
        const orderQuantity = parseInt(inputs[0].value, 10) || 0;
        const sellingPrice = parseFloat(inputs[1].value) || 0;
        const mrp = parseFloat(inputs[2].value) || 0;

        if (productName && orderQuantity > 0) {
            draftOrderState.rows.push({
                productCategory, productName, orderQuantity, sellingPrice, mrp,
                lineTotal: orderQuantity * sellingPrice
            });
            hasValidRows = true;
        }
    });

    updateGrandTotal();
    // CRITICAL FIX: Use DOM.placeOrderBtn
    DOM.placeOrderBtn.style.display = hasValidRows ? "block" : "none";
}

function updateGrandTotal() {
    let total = draftOrderState.rows.reduce((sum, r) => sum + (r.lineTotal || 0), 0);
    // CRITICAL FIX: Use DOM.grandTotalCell
    DOM.grandTotalCell.textContent = "Total: " + total.toFixed(2);
}

// ------------------------------------------------------------------
// --- HANDLERS ---
// ------------------------------------------------------------------

function handleAddProductRow() {
    // CRITICAL FIX: Use DOM.orderTbody
    const lastTr = DOM.orderTbody.lastElementChild;
    if (lastTr) {
        const selects = lastTr.querySelectorAll("select");
        const inputs = lastTr.querySelectorAll("input");
        const lastProduct = selects[1]?.value || "";
        const lastQty = parseInt(inputs[0]?.value, 10) || 0;
        
        if (!lastProduct || lastQty <= 0) {
            return alert("⚠️ Please select a product and enter a quantity before adding a new row.");
        }
    }

    updateDraftState();
    createRow();
    saveDraftToFirestore(); 
}

async function handlePlaceOrder() {
    // CRITICAL FIX: Use DOM.orderIdDisplay
    const orderId = DOM.orderIdDisplay.dataset.orderId;
    if (!orderId) return alert("Missing Order ID. Try again.");
    
    updateDraftState(); 
    
    if (!draftOrderState.rows.length) return alert("No items to place order.");

    // CRITICAL FIX: Use DOM.selects
    const selectedPlaceName = DOM.placeSelect.options[DOM.placeSelect.selectedIndex]?.textContent || "";
    const selectedShopName = DOM.shopSelect.options[DOM.shopSelect.selectedIndex]?.textContent || "";

    const finalItems = draftOrderState.rows.map(r => ({ ...r, lineTotal: r.orderQuantity * r.sellingPrice }));

    try {
        await db.collection("orders").doc(orderId).set({
            orderId: orderId,
            userId: USER_ID,
            orderDate: firebase.firestore.Timestamp.fromDate(
                // CRITICAL FIX: Use DOM.date and time inputs
                new Date(`${DOM.orderDateInput.value}T${DOM.orderTimeInput.value}:00`)
            ),
            deliveryDate: firebase.firestore.Timestamp.fromDate(
                // CRITICAL FIX: Use DOM.deliveryDateInput
                new Date(DOM.deliveryDateInput.value)
            ),
            routeId: DOM.routeSelect.value,
            placeId: DOM.placeSelect.value,
            placeName: selectedPlaceName,
            shopId: DOM.shopSelect.value,
            shopName: selectedShopName,
            items: finalItems,
            total: finalItems.reduce((sum, r) => sum + r.lineTotal, 0),
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection("draftOrders").doc(USER_ID).delete();

        alert("✅ Order placed successfully!");
        location.reload();
    } catch (error) {
        console.error("Error placing order:", error);
        alert("❌ Failed to place order. Check console for details.");
    }
}

async function handleAddNewProduct() {
    // CRITICAL FIX: Use DOM.newCategoryInput and DOM.newProductInput
    const category = DOM.newCategoryInput.value.trim();
    const name = DOM.newProductInput.value.trim();
    
    if (!category || !name) {
        return alert("Category and Product Name are required.");
    }
    
    try {
        const newProductRef = db.collection("products").doc();
        await newProductRef.set({
            id: newProductRef.id,
            category: category,
            name: name,
            sellingPrice: 0.00,
            mrp: 0.00,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        DOM.newCategoryInput.value = '';
        DOM.newProductInput.value = '';
        alert(`✅ Product '${name}' saved successfully. Reloading products...`);
        await loadProducts();
        restoreDraftToTable(); 
    } catch (error) {
        console.error("Error adding new product:", error);
        alert("❌ Failed to add product.");
    }
}