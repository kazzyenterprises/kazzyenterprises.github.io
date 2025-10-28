// js/pages/places-manage.js
import { getRoutes, getPlaces, addPlaceToCache, clearStore } from "../../../../shared/js/store/data-store.js";
import { on, emit } from "../../../../shared/js/store/event-bus.js";
import { addPlace, deletePlaceById } from "../../../../shared/js/api/shops/place-service.js";
import { showConfirmationModal } from "../../../../shared/js/utils/modal-helper.js";

export async function initializePlaceManagement() {
  const routeSelect = document.getElementById("route-select");
  const newPlaceInput = document.getElementById("new-place-input");
  const addPlaceBtn = document.getElementById("add-place-btn");
  const currentRouteName = document.getElementById("current-route-name");
  const placesContainer = document.getElementById("places-container");
  const statusMessage = document.getElementById("place-list-status");

  // --------------------------------------------------
  // RENDER FUNCTIONS
  // --------------------------------------------------
  function clearPlacesContainer() {
    placesContainer.innerHTML = "";
  }

  function setStatusMessage(msg, visible = true) {
    statusMessage.textContent = msg;
    statusMessage.style.display = visible ? "block" : "none";
  }

  function createPlaceCard(place, routeId) {
    const card = document.createElement("div");
    card.className = "place-card";
    card.dataset.placeId = place.id;

    card.innerHTML = `
      <div class="view-mode">
        <h3>🏙️ ${place.name}</h3>
        <p>ID: ${place.id}</p>
      </div>
      <div class="actions">
        <button class="btn-delete" data-id="${place.id}">🗑️ Delete</button>
      </div>
    `;

    card.querySelector(".btn-delete").addEventListener("click", async () => {
      const confirmed = await showConfirmationModal("Confirm Deletion", `Delete place "${place.name}"?`);
      if (!confirmed) return;

      try {
        await deletePlaceById(place.id, routeId);
        // Update centralized cache
        addPlaceToCache(routeId, place); // or call a delete function if implemented
        card.remove();
        if (placesContainer.children.length === 0) {
          setStatusMessage("No places for this route yet.");
        }
        await showConfirmationModal("Deleted", `Place "${place.name}" deleted successfully.`);
      } catch (err) {
        console.error(err);
        await showConfirmationModal("Error", "Failed to delete place. Check console.");
      }
    });

    return card;
  }

  async function renderPlaces(routeId, forceRefresh = false) {
    if (!routeId) {
      currentRouteName.textContent = "---";
      clearPlacesContainer();
      return setStatusMessage("Select a route above to view its places.");
    }

    const selected = routeSelect.options[routeSelect.selectedIndex];
    currentRouteName.textContent = selected.dataset.name;
    clearPlacesContainer();
    setStatusMessage("Loading places...", true);

    const places = await getPlaces(routeId, forceRefresh);

    clearPlacesContainer();
    if (!places || places.length === 0) {
      return setStatusMessage("No places for this route yet.");
    }

    places.sort((a, b) => a.name.localeCompare(b.name));
    places.forEach(p => placesContainer.appendChild(createPlaceCard(p, routeId)));
    setStatusMessage("", false);
  }

  async function renderRoutes() {
    routeSelect.innerHTML = "<option value=''>Select Route</option>";
    const routes = await getRoutes();
    routes.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name || r.id;
      opt.dataset.name = r.name || r.id;
      routeSelect.appendChild(opt);
    });
  }

  // --------------------------------------------------
  // EVENT LISTENERS
  // --------------------------------------------------
  addPlaceBtn.addEventListener("click", async () => {
    const routeId = routeSelect.value;
    const placeName = newPlaceInput.value.trim();

    if (!routeId) return showConfirmationModal("Error", "Please select a route first.");
    if (!placeName) return showConfirmationModal("Error", "Please enter a place name.");

    addPlaceBtn.disabled = true;
    addPlaceBtn.innerHTML = "<span class='spinner'></span> Adding...";

    try {
      const newPlace = await addPlace(routeId, placeName);
      addPlaceToCache(routeId, newPlace); // update centralized cache
      newPlaceInput.value = "";
      await renderPlaces(routeId);
      await showConfirmationModal("Success", `✅ Place "${placeName}" added.`);
    } catch (err) {
      console.error(err);
      await showConfirmationModal("Error", "Failed to add place. Check console.");
    } finally {
      addPlaceBtn.disabled = false;
      addPlaceBtn.textContent = "➕ Add Place to Route";
    }
  });

  routeSelect.addEventListener("change", async () => {
    await renderPlaces(routeSelect.value);
  });

  // --------------------------------------------------
  // EVENT-BUS LISTENERS (Optional: multi-page updates)
  // --------------------------------------------------
  on("places-updated", ({ routeId }) => {
    if (routeId === routeSelect.value) renderPlaces(routeId);
  });

  // --------------------------------------------------
  // INITIALIZE
  // --------------------------------------------------
  await renderRoutes();
  if (routeSelect.options.length > 1) {
    routeSelect.value = routeSelect.options[1].value;
    await renderPlaces(routeSelect.value);
  }
}
