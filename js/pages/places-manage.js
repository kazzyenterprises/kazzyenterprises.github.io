// js/pages/places-manage.js

/**
 * Module for the Place Management page logic.
 * @param {firebase.app.App} firebaseApp - The initialized Firebase App instance.
 */
export function initializePlaceManagement(firebaseApp) {
    const db = firebaseApp.firestore();

    // DOM Elements
    const routeSelect = document.getElementById("route-select");
    const newPlaceInput = document.getElementById("new-place-input");
    const addPlaceBtn = document.getElementById("add-place-btn");
    const currentRouteName = document.getElementById("current-route-name");
    const placesContainer = document.getElementById("places-container");
    const statusMessage = document.getElementById("place-list-status");

    // Modal Elements (for Confirmation/Alerts)
    const modalOverlay = document.getElementById('confirmation-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');

    let currentRouteId = null;

    // -------------------- Utility Functions --------------------

    function normalizeId(str) {
        return String(str || "").trim().toLowerCase().replace(/\s+/g, "_");
    }

    function generatePlaceId(routeId, placeName) {
        return `${normalizeId(routeId)}_${normalizeId(placeName)}`;
    }

    /**
     * Shows a confirmation modal (replacing window.confirm) and returns a promise.
     * @param {string} title
     * @param {string} message
     * @returns {Promise<boolean>}
     */
    function showConfirmation(title, message) {
        return new Promise(resolve => {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modalOverlay.style.display = 'flex';

            const confirmHandler = () => {
                // Clean up listeners before resolving
                modalConfirmBtn.removeEventListener('click', confirmHandler);
                modalCancelBtn.removeEventListener('click', cancelHandler);
                modalOverlay.style.display = 'none';
                resolve(true);
            };

            const cancelHandler = () => {
                // Clean up listeners before resolving
                modalConfirmBtn.removeEventListener('click', confirmHandler);
                modalCancelBtn.removeEventListener('click', cancelHandler);
                modalOverlay.style.display = 'none';
                resolve(false);
            };

            // Ensure listeners are fresh
            modalConfirmBtn.addEventListener('click', confirmHandler);
            modalCancelBtn.addEventListener('click', cancelHandler);
        });
    }

    // -------------------- Fetch & Display Places --------------------

    async function fetchAndDisplayPlaces() {
        placesContainer.innerHTML = "";
        currentRouteId = routeSelect.value;
        
        if (!currentRouteId) {
            currentRouteName.textContent = "---";
            statusMessage.textContent = "Please select a Route above to view existing places.";
            statusMessage.style.display = 'block';
            return;
        }

        const selectedOption = routeSelect.options[routeSelect.selectedIndex];
        currentRouteName.textContent = selectedOption.dataset.name || selectedOption.textContent;
        statusMessage.style.display = 'none';
        
        placesContainer.innerHTML = '<p class="status-message">Loading places...</p>';

        try {
            // Fetching without .orderBy() and sorting client-side to avoid index issues
            const snap = await db.collection("places")
                .where("routeId", "==", currentRouteId)
                .get(); 
            
            placesContainer.innerHTML = '';

            if (snap.empty) {
                placesContainer.innerHTML = '<p class="status-message">No places defined for this route yet. Add one above!</p>';
                return;
            }

            let places = [];
            snap.forEach(doc => places.push({ id: doc.id, ...doc.data() }));
            
            // Client-Side Sorting
            places.sort((a, b) => a.name.localeCompare(b.name));

            places.forEach(data => {
                const card = createPlaceCard(data);
                placesContainer.appendChild(card);
            });

        } catch (err) {
            console.error("Error fetching places:", err);
            placesContainer.innerHTML = '<p class="status-message error">Failed to load places. Check the console for Firebase index errors.</p>';
        }
    }
    
    // -------------------- Render Place Card --------------------

    function createPlaceCard(data) {
        const card = document.createElement('div');
        card.className = 'place-card';
        card.dataset.placeId = data.id;

        // Initial View Mode HTML
        card.innerHTML = `
            <div class="view-mode">
                <h3 id="place-name-${data.id}">🏙️ ${data.name}</h3>
                <p>ID: ${data.id}</p>
            </div>
            <div class="actions">
                <button class="btn-delete" data-id="${data.id}">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        // Attach Event Listeners
        const deleteBtn = card.querySelector('.btn-delete');

        deleteBtn.addEventListener('click', () => deletePlace(data.id, data.name));
        return card;
    }

    

    // -------------------- Delete Logic --------------------

    async function deletePlace(placeId, placeName) {
        const confirm = await showConfirmation(
            "Confirm Deletion",
            `WARNING: This will permanently delete the place "${placeName}" from the database. Are you sure?`
        );

        if (confirm) {
            try {
                await db.collection("places").doc(placeId).delete();
                await showConfirmation("Deletion Successful", `🗑️ Place "${placeName}" deleted successfully.`).then(() => {});

                // Remove card from UI
                const card = document.querySelector(`[data-place-id="${placeId}"]`);
                if (card) card.remove();
                
                // If all cards are gone, refresh to show "No places defined" message
                if (placesContainer.children.length === 0) {
                     fetchAndDisplayPlaces(); 
                }

            } catch (err) {
                console.error("Error deleting place:", err);
                await showConfirmation("Deletion Error", "Could not delete the place. It might be linked to other documents or due to a security rule issue.").then(() => {});
            }
        }
    }

    // -------------------- Initialization --------------------

    async function fetchRoutes() {
        try {
            const snap = await db.collection("routes").get();
            routeSelect.innerHTML = "<option value=''>Select Route</option>";
            snap.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement("option");
                opt.value = doc.id; 
                opt.textContent = data.name || doc.id;
                opt.dataset.name = data.name;
                routeSelect.appendChild(opt);
            });
        } catch (err) {
            console.error("Error fetching routes:", err);
            statusMessage.textContent = "Error loading routes.";
        }
    }

    addPlaceBtn.addEventListener("click", async () => {
        const routeId = routeSelect.value;
        const placeNameRaw = newPlaceInput.value.trim();

        if (!routeId) {
            await showConfirmation("Input Error", "Please select a route first.").then(() => {});
            return;
        }
        if (!placeNameRaw) {
            await showConfirmation("Input Error", "Please enter a name for the new place.").then(() => {});
            return;
        }

        addPlaceBtn.disabled = true;
        addPlaceBtn.innerHTML = '<span class="spinner"></span> Adding...';

        try {
            const placeId = generatePlaceId(routeId, placeNameRaw);
            const placeRef = db.collection("places").doc(placeId);
            const placeDoc = await placeRef.get();

            if (placeDoc.exists) {
                await showConfirmation("Duplicate Entry", `Place "${placeNameRaw}" already exists on the selected route.`).then(() => {});
                return;
            }

            const formattedPlaceName = placeNameRaw
                .split(" ")
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ");

            await placeRef.set({
                name: formattedPlaceName,
                routeId: routeId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            await showConfirmation("Success", `✅ Place "${formattedPlaceName}" added successfully.`).then(() => {});
            newPlaceInput.value = ""; 
            await fetchAndDisplayPlaces(); 

        } catch (err) {
            console.error("Error adding place:", err);
            await showConfirmation("Save Error", "An error occurred while adding the place. Check console for details.").then(() => {});
        } finally {
            addPlaceBtn.disabled = false;
            addPlaceBtn.textContent = "➕ Add Place to Route";
        }
    });
    
    // -------------------- Event Listeners & Initial Load --------------------

    routeSelect.addEventListener("change", fetchAndDisplayPlaces);

    // Initial Load
    fetchRoutes();
}