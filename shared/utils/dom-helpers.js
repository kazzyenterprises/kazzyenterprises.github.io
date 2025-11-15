// dom-helpers.js
// Handles dynamic order table DOM manipulations

/**
 * Create a single product row and append to order table
 * @param {Object} rowData - existing row data (optional)
 * @param {Object} DOM - DOM references
 * @param {Array} productCache - cached products
 * @param {Object} draftOrderState - state object holding rows
 * @param {Function} saveDraftCallback - function to call after any change
 */
export function createAddProductRow(rowData = {}, DOM, productCache, draftOrderState, saveDraftCallback) {
    const tr = document.createElement("tr");
    tr.className = "order-category";

    // Category select
    const categories = [...new Set(productCache.map(p => p.category))];
    const categorySelect = document.createElement("select");
    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });
    categorySelect.value = rowData.productCategory || categories[0] || "";

    // Item select
    const itemSelect = document.createElement("select");
    const populateItems = (cat, selectEl) => {
        selectEl.innerHTML = "";
        productCache.filter(p => p.category === cat)
            .forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.name;
                opt.textContent = p.name;
                selectEl.appendChild(opt);
            });
    };
    populateItems(categorySelect.value, itemSelect);
    if (rowData.productName && [...itemSelect.options].some(o => o.value === rowData.productName)) {
        itemSelect.value = rowData.productName;
    }

    // Inputs
    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.className = "count-input";
    countInput.max = 999;
    countInput.step = 1;
    countInput.value = rowData.orderQuantity ?? "";

    const marginInput = document.createElement("input");
    marginInput.type = "number";
    marginInput.className = "margin-input";
    marginInput.step = "0.01";
    marginInput.value = rowData.sellingPrice ?? "";

    const mrpInput = document.createElement("input");
    mrpInput.type = "number";
    mrpInput.className = "mrp-input";
    mrpInput.step = "0.01";
    mrpInput.value = rowData.mrp ?? "";

    const updateAndSave = () => saveDraftCallback();

    // Event listeners
    categorySelect.addEventListener("change", () => {
        populateItems(categorySelect.value, itemSelect);
        itemSelect.value = "";
        marginInput.value = "";
        mrpInput.value = "";
        updateAndSave();
    });
    itemSelect.addEventListener("change", () => {
        const selected = productCache.find(p => p.category === categorySelect.value && p.name === itemSelect.value);
        if (selected) {
            marginInput.value = selected.sellingPrice ?? "";
            mrpInput.value = selected.mrp ?? "";
        }
        updateAndSave();
    });
    countInput.addEventListener("input", updateAndSave);
    marginInput.addEventListener("input", updateAndSave);
    mrpInput.addEventListener("input", updateAndSave);

    // Delete button
    const deleteTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.addEventListener("click", () => {
        tr.remove();
        updateAndSave();
        if (DOM.orderTbody.children.length === 0) DOM.placeOrderBtn.style.display = "none";
    });
    deleteTd.appendChild(deleteBtn);

    const createTd = (el) => { const td = document.createElement("td"); td.appendChild(el); return td; };

    tr.appendChild(createTd(categorySelect));
    tr.appendChild(createTd(itemSelect));
    tr.appendChild(createTd(countInput));
    tr.appendChild(createTd(marginInput));
    tr.appendChild(createTd(mrpInput));
    tr.appendChild(deleteTd);

    DOM.orderTbody.appendChild(tr);
}

/**
 * Restore all draft rows into the table
 * @param {Object} DOM
 * @param {Object} draftOrderState
 * @param {Array} productCache
 * @param {Function} saveDraftCallback
 */
export function restoreDraftToTable(DOM, draftOrderState, productCache, saveDraftCallback) {
    DOM.orderTbody.innerHTML = "";
    if (!draftOrderState.rows?.length) return;

    draftOrderState.rows.forEach(row => createAddProductRow(row, DOM, productCache, draftOrderState, saveDraftCallback));
    updateGrandTotal(DOM, draftOrderState);
    if (draftOrderState.rows.length) DOM.placeOrderBtn.style.display = "block";
}

/**
 * Update grand total based on draft rows
 * @param {Object} DOM
 * @param {Object} draftOrderState
 */
export function updateGrandTotal(DOM, draftOrderState) {
    let total = draftOrderState.rows.reduce((sum, r) => sum + (r.lineTotal || 0), 0);
    DOM.grandTotalCell.textContent = "Total: " + total.toFixed(2);
}
