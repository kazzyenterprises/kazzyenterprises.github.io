// js/pages/shop-directory.js

/**
 * Module for the Shop Directory page logic (CRUD for shops).
 * @param {object} services - Object containing initialized Firebase services (db, auth).
 * @param {Firestore} services.db - The Firestore database instance.
 * @param {Auth} services.auth - The Firebase Auth instance.
 */
export function initializeShopDirectory({ db, auth }) {

    // DOM Elements
    const routeSelect = document.getElementById("route-select");
    const placeInput = document.getElementById("place-input");
    const placesList = document.getElementById("places-list");
    const shopInput = document.getElementById("shop-name");
    const shopsList = document.getElementById("shops-list");
    const addShopBtn = document.getElementById("add-shop-btn");
    const contactInput = document.getElementById("contact-no");
    const emailInput = document.getElementById("email");
    const locationInput = document.getElementById("location");
    const locationLinkInput = document.getElementById("location-link");
    const shopsContainer = document.getElementById("shops-container");
    const currentPlaceName = document.getElementById("current-place-name");
    const shopListStatus = document.getElementById("shop-list-status");
    
    // Modal Elements (for Confirmation/Alerts)
    const modalOverlay = document.getElementById('confirmation-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');

    // Fail gracefully if required HTML elements are missing
    if (!routeSelect || !placeInput || !shopsContainer || !shopsList || !addShopBtn || !modalOverlay) {
        console.error("Shop Directory: One or more required DOM elements are missing.");
        return;
    }

    // -------------------- Utility Functions --------------------

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
            
            // Re-clone buttons to remove any old event listeners
            const newConfirmBtn = modalConfirmBtn.cloneNode(true);
            const newCancelBtn = modalCancelBtn.cloneNode(true);
            modalConfirmBtn.replaceWith(newConfirmBtn);
            modalCancelBtn.replaceWith(newCancelBtn);

            const cleanup = () => {
                modalOverlay.style.display = 'none';
                newConfirmBtn.removeEventListener('click', confirmHandler);
                newCancelBtn.removeEventListener('click', cancelHandler);
            };

            const confirmHandler = () => { cleanup(); resolve(true); };
            const cancelHandler = () => { cleanup(); resolve(false); };

            newConfirmBtn.addEventListener('click', confirmHandler);
            newCancelBtn.addEventListener('click', cancelHandler);
        });
    }

    function normalizeId(str) {
        return String(str || "").trim().toLowerCase().replace(/\s+/g, "_");
    }

    function generatePlaceId(routeId, placeName) {
        return `${normalizeId(routeId)}_${normalizeId(placeName)}`;
    }

    function generateShopDocId(routeId, placeName, shopName) {
        return `${normalizeId(routeId)}_${normalizeId(placeName)}_${normalizeId(shopName)}`;
    }
    
    /** Resets the main input form fields */
    function resetForm() {
        // Keep the route, place, and shop name, but clear details
        contactInput.value = "";
        emailInput.value = "";
        
        // Revert location input to initial GPS value if it exists, otherwise clear
        if (locationInput.dataset.original) {
            locationInput.value = locationInput.dataset.original; 
        } else {
            locationInput.value = "";
        }

        locationLinkInput.value = "";
        addShopBtn.textContent = "💾 Add Shop Details";
        addShopBtn.dataset.shopDocId = ''; // Clear ID to signal addition
    }

    // -------------------- Shop Card Rendering --------------------

    function createShopCard(data) {
        const card = document.createElement('div');
        card.className = 'shop-card';
        card.dataset.shopId = data.id;

        let coords = 'N/A';
        // V9: GeoPoint is now a class imported from firebase-firestore.js
        if (data.coordinates instanceof GeoPoint) {
            coords = `${data.coordinates.latitude.toFixed(6)}, ${data.coordinates.longitude.toFixed(6)}`;
        }
        
        // Using Font Awesome classes (fa-solid) as seen in the HTML template
        const locationIcon = data.locationLink ? '<i class="fa-solid fa-link"></i>' : '<i class="fa-solid fa-map-location-dot"></i>';

        card.innerHTML = `
            <h3>${data.name}</h3>
            <p><i class="fa-solid fa-phone"></i>: <strong>${data.contactNo || 'N/A'}</strong></p>
            <p><i class="fa-solid fa-envelope"></i>: <strong>${data.email || 'N/A'}</strong></p>
            <p>${locationIcon}: <strong>${coords}</strong></p>
            <div class="actions">
                <button class="btn-quick-edit btn-secondary" data-id="${data.id}" data-name="${data.name}">
                    ✏️ Load for Edit
                </button>
            </div>
        `;
        
        card.querySelector('.btn-quick-edit').addEventListener('click', (e) => {
            // Load the shop name into the filter and trigger the load details logic
            shopInput.value = e.target.dataset.name;
            loadShopForEditing();
        });

        return card;
    }

    // -------------------- Core Data Fetching Functions --------------------

    /**
     * FIX: Implements the missing fetchRoutes function.
     * Fetches all routes and populates the route dropdown.
     */
    async function fetchRoutes() {
        routeSelect.innerHTML = '<option value="">Select Route</option>';
        try {
            // V9: Use modular getDocs and collection
            const routesSnap = await getDocs(collection(db, "routes"));
            
            routesSnap.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement("option");
                opt.value = doc.id; 
                opt.textContent = data.name || doc.id;
                routeSelect.appendChild(opt);
            });

            // If a route is already selected (e.g., page refresh preserving state), fetch places
            if (routeSelect.value) {
                fetchPlacesForSelectedRoute();
            }

        } catch (error) {
            console.error("Error fetching routes:", error);
            routeSelect.innerHTML = '<option value="">Error Loading Routes</option>';
        }
    }


    async function fetchPlacesForSelectedRoute() {
        placesList.innerHTML = "";
        placeInput.value = ""; // Clear place input on route change
        shopsContainer.innerHTML = ""; // Clear shop cards
        shopsList.innerHTML = ""; // Clear shops datalist
        currentPlaceName.textContent = "---";
        shopListStatus.textContent = "Please select or type a Place name.";
        shopInput.value = "";
        resetForm();

        const routeId = routeSelect.value;
        if (!routeId) return;

        try {
            // V9: Use modular query and getDocs
            const placesRef = collection(db, "places");
            const q = query(placesRef, where("routeId", "==", routeId));
            const snap = await getDocs(q);

            snap.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement("option");
                opt.value = data.name; 
                opt.dataset.id = doc.id; // Store Firestore Document ID
                placesList.appendChild(opt);
            });
            
        } catch (error) {
             console.error("Error fetching places:", error);
        }
    }

    async function fetchShopsForSelectedPlace() {
        shopsList.innerHTML = "";
        shopsContainer.innerHTML = "";
        shopInput.value = "";
        resetForm();
        
        const routeId = routeSelect.value;
        const placeName = placeInput.value.trim();

        currentPlaceName.textContent = placeName || "---";
        shopListStatus.textContent = "Loading shops...";
        
        if (!routeId || !placeName) {
            shopListStatus.textContent = "Select a Route and enter a Place name.";
            return;
        }

        // 1. Get the actual Firestore document ID of the place (whether existing or generated for creation)
        const selectedPlaceOption = [...placesList.options].find(
            opt => opt.value.toLowerCase() === placeName.toLowerCase()
        );
        
        const placeId = selectedPlaceOption ? selectedPlaceOption.dataset.id : generatePlaceId(routeId, placeName);
        
        try {
            // V9: Use modular query and getDocs
            const shopsRef = collection(db, "shops");
            const q = query(shopsRef, where("routeId", "==", routeId), where("placeId", "==", placeId));
            const snap = await getDocs(q);

            if (snap.empty) {
                shopListStatus.textContent = `No shops found in ${placeName}. Ready to add one!`;
                return;
            }

            snap.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement("option");
                opt.value = data.name; 
                opt.dataset.id = doc.id; 
                shopsList.appendChild(opt);

                shopsContainer.appendChild(createShopCard({ id: doc.id, ...data }));
            });
            shopListStatus.textContent = `${snap.size} shops found in ${placeName}.`;

        } catch (error) {
            console.error("Error fetching shops:", error);
            shopListStatus.textContent = `Error loading shops. Please check console.`;
        }
    }

    // -------------------- Load Shop for Editing --------------------

    /**
     * Loads the details of a selected shop into the main input form.
     */
    async function loadShopForEditing() {
        const routeId = routeSelect.value;
        const placeName = placeInput.value.trim();
        const shopName = shopInput.value.trim();
        
        if (!routeId || !placeName || !shopName) {
            resetForm();
            return;
        }
        
        const shopOption = [...shopsList.options].find(
            opt => opt.value.toLowerCase() === shopName.toLowerCase()
        );

        if (shopOption) {
            // Existing shop: Load details
            const shopDocId = shopOption.dataset.id;
            // V9: Use modular doc() and getDoc()
            const shopRef = doc(db, "shops", shopDocId); 
            const docSnap = await getDoc(shopRef); 
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Set details in form
                contactInput.value = data.contactNo ? data.contactNo.replace('+91', '') : '';
                emailInput.value = data.email || '';
                locationLinkInput.value = data.locationLink || '';
                
                // Check if it's a GeoPoint instance (V9)
                if (data.coordinates instanceof GeoPoint) {
                    locationInput.value = `${data.coordinates.latitude.toFixed(6)},${data.coordinates.longitude.toFixed(6)}`;
                } else {
                    locationInput.value = '';
                }
                
                addShopBtn.textContent = `💾 Update Details for ${data.name}`;
                addShopBtn.dataset.shopDocId = shopDocId; 
            } else {
                resetForm();
            }
        } else {
            // New shop name entered: reset the detail fields
            resetForm();
            addShopBtn.textContent = `💾 Add New Shop: ${shopName}`;
            addShopBtn.dataset.shopDocId = ''; 
        }
    }

    // -------------------- Add Place if Missing --------------------

    async function checkAndAddPlace(routeId, placeName) {
        // Use the generated ID based on route+name for simplicity and lookup consistency
        const placeId = generatePlaceId(routeId, placeName);
        // V9: Use modular doc() and getDoc()
        const placeRef = doc(db, "places", placeId); 
        const placeDoc = await getDoc(placeRef); 

        if (!placeDoc.exists()) {
            const confirmAdd = await showConfirmation(
                "New Place Detected",
                `Place "${placeName}" does not exist under this route. Do you want to add it to proceed with shop creation?`
            );
            if (!confirmAdd) return null;

            // Title Case formatting
            const formattedPlaceName = placeName
                .split(" ")
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ");

            // V9: Use modular setDoc()
            await setDoc(placeRef, {
                name: formattedPlaceName,
                routeId
            });
            await showConfirmation("Success", "✅ Place added successfully. Proceeding to add shop.").then(() => {});
            
            // Re-fetch places so the new one appears in the datalist
            await fetchPlacesForSelectedRoute();
        }
        return placeId;
    }

    // -------------------- Add / Update Shop Main Logic --------------------

    addShopBtn.addEventListener("click", async () => {
        const routeId = routeSelect.value;
        const placeName = placeInput.value.trim();
        const shopNameRaw = shopInput.value.trim();

        if (!routeId) { await showConfirmation("Input Error", "Please select a route."); return; }
        if (!placeName) { await showConfirmation("Input Error", "Please enter a place."); return; }
        if (!shopNameRaw) { await showConfirmation("Input Error", "Please enter a shop name."); return; }

        addShopBtn.disabled = true;
        addShopBtn.textContent = 'Saving...';

        try {
            const placeId = await checkAndAddPlace(routeId, placeName);
            if (!placeId) return; // User canceled place creation

            // Title Case for Shop Name
            const shopName = shopNameRaw
                .split(" ")
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ");

            const coords = locationInput.value.split(",").map(c => c.trim());
            
            const shopData = {
                name: shopName,
                routeId,
                placeId, 
                contactNo: contactInput.value ? `+91${contactInput.value}` : "",
                email: emailInput.value,
                // V9: Use modular GeoPoint
                coordinates: locationInput.value && coords.length === 2 && !isNaN(parseFloat(coords[0]))
                    ? new GeoPoint(parseFloat(coords[0]), parseFloat(coords[1]))
                    : null,
                locationLink: locationLinkInput.value,
            };
            
            // Generate the document ID based on the formatted (title-cased) shop name
            const shopDocId = generateShopDocId(routeId, placeName, shopName);
            const shopRef = doc(db, "shops", shopDocId);
            const existingShop = await getDoc(shopRef);

            if (existingShop.exists()) {
                // UPDATE LOGIC
                // V9: Use modular serverTimestamp and updateDoc
                shopData.updatedAt = serverTimestamp(); 
                await updateDoc(shopRef, shopData);
                await showConfirmation("Success", `✅ Shop details for ${shopName} updated successfully.`).then(() => {});
                
            } else {
                // ADD LOGIC
                // V9: Use modular serverTimestamp and setDoc
                shopData.createdAt = serverTimestamp(); 
                await setDoc(shopRef, shopData);
                await showConfirmation("Success", `✅ Shop ${shopName} added successfully.`);
            }

            // After success, reload the view
            await fetchShopsForSelectedPlace(); 
            shopInput.value = shopName; 
            loadShopForEditing(); // Reload form with updated data

        } catch (err) {
            console.error("Error adding/updating shop:", err);
            await showConfirmation("Error", "An error occurred while saving the shop. Check console for details.");
        } finally {
            addShopBtn.disabled = false;
        }
    });
    
    // -------------------- Initial Setup & Event Listeners --------------------

    // Force contact number to digits only (pre-fixed to +91)
    contactInput.addEventListener("input", () => {
        contactInput.value = contactInput.value.replace(/\D/g, "").slice(0, 10);
    });

    // Auto-set GPS coordinates (initial load)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const coords = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
                locationInput.dataset.original = coords; // Store for reset
                locationInput.placeholder = coords;
            },
            err => {
                console.warn("GPS not available:", err);
                locationInput.placeholder = "GPS unavailable";
            }
        );
    } else {
        locationInput.placeholder = "GPS not supported by browser";
    }

    routeSelect.addEventListener("change", fetchPlacesForSelectedRoute);
    
    // When the user enters a Place, load the shops under it
    placeInput.addEventListener("change", fetchShopsForSelectedPlace);

    // When the user selects a Shop from the datalist or enters a new name, load the form details
    shopInput.addEventListener("change", loadShopForEditing);

    // Initial Load - FIX
    fetchRoutes();
}