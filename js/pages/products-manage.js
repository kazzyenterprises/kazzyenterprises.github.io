/**
 * Entry point for the Manage Products page logic.
 * This function is called by the router after the HTML template 
 * (pages/products-manage.html) has been injected into the DOM.
 * @param {object} firebaseApp - The initialized Firebase app instance (v8 compat API).
 */
export function initializeProductManagement(firebaseApp) {
    console.log("Manage Products page logic initializing...");

    // 1. Get a reference to the Firestore database
    // CRITICAL FIX: db and firebase (for FieldValue) are now LOCAL to this scope
    const db = firebaseApp.firestore();
    const firebase = window.firebase; // Access the global compatibility object for FieldValue

    // 2. Get all required DOM element references (They are now available in the DOM)
    const categoryInput = document.getElementById("category");
    const categoryList = document.getElementById("category-list");
    const productInput = document.getElementById("product");
    const productList = document.getElementById("product-list");
    const variantValueInput = document.getElementById("variantValue");
    const variantUnitInput = document.getElementById("variantUnit");
    const statusMsg = document.getElementById("status");
    const saveBtn = document.getElementById("saveBtn");
    const form = document.getElementById('product-manager-form'); 

    // --- Helper Functions (Now LOCAL to this file/scope) ---

    function slugify(str) {
        return str.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
    }

    function normalizeName(name) {
        if (name.includes(" ")) {
            return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        }
        return name;
    }

    function resetButton() {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "💾 Save Product";
        }
    }

    function clearForm() {
        if (productInput) productInput.value = "";
        if (productInput) productInput.dataset.id = "";
        if (variantValueInput) variantValueInput.value = "";
        if (variantUnitInput) variantUnitInput.value = "ml";
        if (document.getElementById("mrp")) document.getElementById("mrp").value = "";
        if (document.getElementById("sellingPrice")) document.getElementById("sellingPrice").value = "";
        if (document.getElementById("stockLevel")) document.getElementById("stockLevel").value = 0;
        if (document.getElementById("active")) document.getElementById("active").value = "true";
        if (statusMsg) statusMsg.textContent = "";
        if (statusMsg) statusMsg.className = "";
    }

    // --- Firebase Logic Functions (Now using the local 'db' variable) ---

    async function loadCategories() {
        if (!db || !categoryList) return; 
        categoryList.innerHTML = "";
    
        try {
            const snapshot = await db.collection("products").get();
            const categories = new Set();
            snapshot.forEach(doc => {
                if (doc.data().category) categories.add(doc.data().category);
            });
            categories.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat;
                categoryList.appendChild(opt);
            });
        } catch (e) {
            console.error("Error loading categories:", e);
        }
    }

    // products-manage.js

    async function handleCategoryChange() {
        const category = categoryInput.value.trim();
        if (!category || !db || !productList) { productList.innerHTML = ""; return; }
        
        productList.innerHTML = "";

        try {
            const snapshot = await db.collection("products").where("category", "==", category).get();
            // REMOVE the products Set logic for stripping the variant.
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement("option");
                
                // CRITICAL FIX: Load the full name from the database (data.name)
                opt.value = data.name; // e.g., "Milk 500ml" 
                
                productList.appendChild(opt);
            });
        } catch (e) {
            console.error("Error loading products:", e);
        }
    }
    // products-manage.js

    async function loadProductDetails() {
        const category = categoryInput.value.trim();
        const productFullName = productInput.value.trim(); // <-- Now this contains the full name (e.g., "Milk 500ml")

        // The logic below that extracts variantValue and variantUnit from the form is now redundant 
        // and should be removed/simplified. The core logic should check Category and Full Name.
        
        if (!category || !productFullName) {
            // Clear all fields except category/product, as variant fields will be loaded from DB
            clearForm(); 
            categoryInput.value = category; 
            productInput.value = productFullName;
            return;
        }
        
        // variantValueInput.value and variantUnitInput.value are now cleared by clearForm() 
        // or should be ignored until the database lookup is successful.
        
        try {
            const snapshot = await db.collection("products")
                .where("category","==",category)
                .where("name","==",productFullName) // CRITICAL FIX: Query by the full name
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                productInput.dataset.id = doc.id; 
                
                // CRITICAL FIX: Populate the variant fields from the database data
                variantValueInput.value = data.variantValue; 
                variantUnitInput.value = data.variantUnit;
                
                // ... (rest of the fields populate as normal)
                document.getElementById("mrp").value = data.mrp || "";
                document.getElementById("sellingPrice").value = data.sellingPrice || "";
                document.getElementById("stockLevel").value = data.stockLevel || 0;
                document.getElementById("active").value = data.active ? "true" : "false";
            } else {
                // ... (clear detail fields if not found)
            }
        } catch (e) {
            console.error("Error loading product details:", e);
        }
    }

    async function saveProduct() {
        // ... (rest of the saveProduct logic remains the same, using local 'db' and 'firebase')
        if (!saveBtn || !statusMsg) return;

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span> Saving...'; 
        statusMsg.textContent = "";
        statusMsg.className = "";

        const category = categoryInput.value.trim();
        let productBaseName = productInput.value.trim();
        const variantValue = variantValueInput.value.trim();
        const variantUnit = variantUnitInput.value;

        if (!category || !productBaseName || !variantValue) { 
            statusMsg.textContent = "❌ Please fill in Category, Product, and Variant fields.";
            statusMsg.className = "error";
            resetButton(); return; 
        }

        productBaseName = normalizeName(productBaseName);
        const productFullName = `${productBaseName} ${variantValue}${variantUnit}`;
        const docId = `${slugify(category)}_${slugify(productBaseName)}_${variantValue}${variantUnit}`;
        
        const productData = {
            name: productFullName,
            category: category,
            variantValue: parseInt(variantValue),
            variantUnit: variantUnit,
            mrp: parseFloat(document.getElementById("mrp").value) || 0,
            sellingPrice: parseFloat(document.getElementById("sellingPrice").value) || 0,
            stockLevel: parseInt(document.getElementById("stockLevel").value) || 0,
            active: document.getElementById("active").value === "true",
            // CRITICAL FIX: Uses the local 'firebase' variable for FieldValue
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = db.collection("products").doc(docId);
        
        try {
            const doc = await docRef.get(); // Fetch the document to check existence

            if (doc.exists) {
                if (!confirm(`Product "${productFullName}" exists. Update its details?`)) { 
                    resetButton(); 
                    return; 
                }
                await docRef.update(productData);
                statusMsg.textContent = "✅ Product updated successfully!";
            } else {
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await docRef.set(productData);
                statusMsg.textContent = "✅ New product added successfully!";
            }
            statusMsg.className = "success";

            loadCategories();
            
            setTimeout(() => {
                categoryInput.value = "";
                clearForm();
            }, 2000);

        } catch (error) {
            statusMsg.textContent = "❌ Error saving product: " + error.message;
            statusMsg.className = "error";
        } finally {
            resetButton();
        }
    }
    
    // 3. Attach Event Listeners (Must be done inside this function)

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProduct(); // Call the local function
        });
        
        categoryInput.addEventListener('change', handleCategoryChange);
        productInput.addEventListener('change', loadProductDetails);
        variantValueInput.addEventListener('change', loadProductDetails);
        variantUnitInput.addEventListener('change', loadProductDetails);

        // Load initial data
        loadCategories();
        
        console.log("Manage Products page logic initialized successfully: Form listener and data loaders attached.");
    } else {
        console.error("ERROR: Could not find element with ID 'product-manager-form' in the loaded HTML.");
    }
}
