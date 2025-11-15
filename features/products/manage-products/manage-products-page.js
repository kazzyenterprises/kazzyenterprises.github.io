// js/pages/products-manage.js
import { fetchAllProducts, addProduct } from "../../../../shared/js/api/products/product-service.js";
import { emit } from '../../../../shared/js/store/event-bus.js';

export async function initializeProductManagement() {
  console.log("Manage Products page logic initializing...");

  // --- DOM Elements ---
  const categoryInput = document.getElementById("category");
  const categoryList = document.getElementById("category-list");
  const productInput = document.getElementById("product");
  const productList = document.getElementById("product-list");
  const variantValueInput = document.getElementById("variantValue");
  const variantUnitInput = document.getElementById("variantUnit");
  const statusMsg = document.getElementById("status");
  const saveBtn = document.getElementById("saveBtn");
  const form = document.getElementById("product-manager-form");
  const mrpInput = document.getElementById("mrp");
  const sellingPriceInput = document.getElementById("sellingPrice");
  const stockLevelInput = document.getElementById("stockLevel");
  const activeInput = document.getElementById("active");

  // --- Local cache ---
  let productCache = [];

  const slugify = str => str.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
  const normalizeName = name => name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const resetButton = () => {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "💾 Save Product"; }
  };

  const clearForm = () => {
    if (productInput) { productInput.value = ""; productInput.dataset.id = ""; }
    if (variantValueInput) variantValueInput.value = "";
    if (variantUnitInput) variantUnitInput.value = "ml";
    if (mrpInput) mrpInput.value = "";
    if (sellingPriceInput) sellingPriceInput.value = "";
    if (stockLevelInput) stockLevelInput.value = 0;
    if (activeInput) activeInput.value = "true";
    if (statusMsg) { statusMsg.textContent = ""; statusMsg.className = ""; }
  };

  // --- Load products into centralized cache ---
  async function loadProducts(forceRefresh = false) {
    try {
      productCache = await fetchAllProducts(forceRefresh);
      localStorage.setItem("cachedProducts", JSON.stringify(productCache)); // persist
      populateCategories();
    } catch (err) {
      console.error("Error loading products:", err);
      const persisted = localStorage.getItem("cachedProducts");
      if (persisted) productCache = JSON.parse(persisted);
      populateCategories();
    }
  }

  function populateCategories() {
    if (!categoryList) return;
    categoryList.innerHTML = "";
    const categories = [...new Set(productCache.map(p => p.category))];
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      categoryList.appendChild(opt);
    });
  }

  function populateProductsByCategory(category) {
    if (!productList) return;
    productList.innerHTML = "";
    const filtered = productCache.filter(p => p.category === category);
    filtered.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.name;
      productList.appendChild(opt);
    });
  }

  function loadProductDetails() {
    const category = categoryInput.value.trim();
    const productFullName = productInput.value.trim();
    if (!category || !productFullName) { clearForm(); return; }

    const product = productCache.find(p => p.category === category && p.name === productFullName);
    if (product) {
      productInput.dataset.id = product.id;
      variantValueInput.value = product.variantValue || "";
      variantUnitInput.value = product.variantUnit || "ml";
      mrpInput.value = product.mrp || "";
      sellingPriceInput.value = product.sellingPrice || "";
      stockLevelInput.value = product.stockLevel || 0;
      activeInput.value = product.active ? "true" : "false";
    } else {
      clearForm();
    }
  }

  async function saveProduct() {
    if (!saveBtn || !statusMsg) return;

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
    statusMsg.textContent = ""; statusMsg.className = "";

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

    try {
      await addProduct(category, productFullName);
      // refresh cache and UI
      await loadProducts(true);
      statusMsg.textContent = `✅ Product "${productFullName}" saved successfully.`;
      statusMsg.className = "success";
      clearForm();
      categoryInput.value = "";
      emit("products-updated"); // notify other pages
    } catch (err) {
      console.error(err);
      statusMsg.textContent = "❌ Failed to save product. Check console.";
      statusMsg.className = "error";
    } finally {
      resetButton();
    }
  }

  // --- Event Listeners ---
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      saveProduct();
    });

    categoryInput.addEventListener("change", () => {
      const cat = categoryInput.value.trim();
      populateProductsByCategory(cat);
    });

    productInput.addEventListener("change", loadProductDetails);
    variantValueInput.addEventListener("change", loadProductDetails);
    variantUnitInput.addEventListener("change", loadProductDetails);
  }

  // --- Event-bus for cross-page updates ---
  on("products-updated", () => loadProducts(true));

  // --- Initialize ---
  await loadProducts();
  console.log("Manage Products page logic initialized successfully.");
}
