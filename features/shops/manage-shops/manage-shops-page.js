import { fetchRoutes } from "../../../../shared/js/api/shops/route-service.js";
import { getPlaces } from "../../../../shared/js/store/data-store.js";
import { getShops, addShopToCache } from "../../../../shared/js/store/data-store.js";
import { fetchShopsByPlaceFromDb } from "../../../../shared/js/api/shops/shop-service.js"; 
import { showConfirmationModal } from "../../../../shared/js/utils/modal-helper.js";

export async function initializeShopManagement() {
  const routeSelect = document.getElementById("route-select");
  const placeSelect = document.getElementById("place-select");
  const shopSelect = document.getElementById("shop-select"); // should be <select>
  const shopNameInput = document.getElementById("shop-name");
  const addShopBtn = document.getElementById("add-shop-btn");

  // -------------------- Load Routes --------------------
  async function loadRoutes() {
    const routes = await fetchRoutes();
    routeSelect.innerHTML = "<option value=''>Select Route</option>";
    routes.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name || r.id;
      routeSelect.appendChild(opt);
    });
  }

  // -------------------- Load Places --------------------
  async function loadPlacesForRoute(forceRefresh = false) {
    const routeId = routeSelect.value;
    placeSelect.innerHTML = "<option value=''>Select Place</option>";
    if (!routeId) return;

    const places = await getPlaces(routeId, forceRefresh);
    places.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      placeSelect.appendChild(opt);
    });

    if (placeSelect.value) await loadShopsForPlace(true);
  }

  // -------------------- Load Shops --------------------
  async function loadShopsForPlace(forceRefresh = false) {
    const placeId = placeSelect.value;
    shopSelect.innerHTML = "<option value=''>Select Shop</option>";
    if (!placeId) return;

    const shops = await getShops(placeId, forceRefresh);
    if (!shops || shops.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No shops found";
      shopSelect.appendChild(opt);
      return;
    }

    shops.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      shopSelect.appendChild(opt);
    });
  }

  // -------------------- Add Shop --------------------
  addShopBtn.addEventListener("click", async () => {
    const placeId = placeSelect.value;
    if (!placeId) return alert("Select a place first.");

    const shopName = shopNameInput.value.trim();
    if (!shopName) return alert("Enter shop name.");

    const shop = { id: `shop-${Date.now()}`, name: shopName }; // simple ID for now
    addShopToCache(placeId, shop); // update cache & emit event
    await loadShopsForPlace(true);
    shopNameInput.value = "";
    alert(`✅ Shop "${shopName}" added.`);
  });

  // -------------------- Event Listeners --------------------
  routeSelect.addEventListener("change", () => loadPlacesForRoute());
  placeSelect.addEventListener("change", () => loadShopsForPlace());

  // -------------------- Initial Load --------------------
  await loadRoutes();
}
