import {
    db,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    GeoPoint,
    serverTimestamp
} from '../../../../shared/js/api/config/firebase.js';

/**
 * Module for the Shop Directory page logic (CRUD for shops) using dropdowns and a list view.
 */
export async function initializeShopDirectory() {
    // --- DOM Elements ---
    const routeSelect = document.getElementById("route-select");
    const placeSelect = document.getElementById("place-select");
    const shopSelect = document.getElementById("shop-select");
    const addShopBtn = document.getElementById("add-shop-btn");

    const contactInput = document.getElementById("contact-no");
    const emailInput = document.getElementById("email");
    const locationInput = document.getElementById("location");
    const locationLinkInput = document.getElementById("location-link");
    const shopsContainer = document.getElementById("shops-container");
    const shopListStatus = document.getElementById("shop-list-status");

    // Modal Elements
    const modalOverlay = document.getElementById('confirmation-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');

    if (!routeSelect || !placeSelect || !shopSelect || !addShopBtn || !shopsContainer) {
        console.error("Shop Directory: Missing required DOM elements.");
        return;
    }

    // --- State Management ---
    let activeShopCard = null; // Tracks the currently highlighted shop card element

    // -------------------- Utility Functions --------------------
    function normalizeId(str) {
        return String(str || "").trim().toLowerCase().replace(/\s+/g, "_");
    }
    function generatePlaceId(routeId, placeName) {
        return `${normalizeId(routeId)}_${normalizeId(placeName)}`;
    }
    function generateShopDocId(routeId, placeId, shopName) {
        return `${normalizeId(routeId)}_${placeId}_${normalizeId(shopName)}`;
    }

    function showConfirmation(title, message) {
        return new Promise(resolve => {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modalOverlay.style.display = 'flex';

            // Clone buttons to clear previous event listeners (robust approach)
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

    function resetForm() {
        contactInput.value = "";
        emailInput.value = "";
        // Reset location input to current GPS placeholder if available, or empty
        locationInput.value = locationInput.dataset.original || ""; 
        locationLinkInput.value = "";
        addShopBtn.textContent = "💾 Add Shop Details";
        addShopBtn.dataset.shopDocId = '';
        
        // Remove active state from the previous card by clearing inline styles
        if (activeShopCard) {
            activeShopCard.style.border = '';
            activeShopCard.style.backgroundColor = '';
            activeShopCard.style.boxShadow = '';
            activeShopCard = null;
        }
    }
    
    /**
     * Handles the click event on a shop card to load its details into the form and highlight the card.
     * @param {string} shopDocId The document ID of the shop.
     * @param {HTMLElement} cardElement The shop card DOM element.
     */
    function handleCardClick(shopDocId, cardElement) {
        // Log action for immediate, non-UI confirmation (check F12 console)
        console.log(`Card Clicked: Loading shop ID ${shopDocId} into form.`); 
        
        // 1. Remove active state from the previous card
        if (activeShopCard) {
            activeShopCard.style.border = '';
            activeShopCard.style.backgroundColor = '';
            activeShopCard.style.boxShadow = '';
        }

        // 2. Set active state on the new card using aggressive inline styles
        cardElement.style.border = '4px solid #4f46e5'; // Prominent Indigo border
        cardElement.style.backgroundColor = '#eef2ff'; // Light Indigo background
        cardElement.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'; // A noticeable shadow
        activeShopCard = cardElement;

        // 3. Update dropdown and load form
        shopSelect.value = shopDocId;
        loadShop(); 
    }

    function createShopCard(shop) {
        const card = document.createElement('div');
        // Add classes for styling and initial hover effect (Tailwind classes kept for non-active states)
        card.className = 'shop-card cursor-pointer hover:bg-indigo-50 transition duration-150 ease-in-out transform hover:scale-[1.01] shadow-lg';
        
        // Store the ID on the card and attach the click listener
        card.dataset.shopDocId = shop.id;
        card.addEventListener('click', () => handleCardClick(shop.id, card));

        let coords = 'N/A';
        if (shop.coordinates instanceof GeoPoint) {
            coords = `${shop.coordinates.latitude.toFixed(6)}, ${shop.coordinates.longitude.toFixed(6)}`;
        }

        const locationIcon = shop.locationLink ? '🔗' : '📍';

        // Display the contact number with the +91 prefix for clarity
        const displayContact = shop.contactNo ? `+91 ${shop.contactNo.replace('+91','')}` : 'N/A';

        card.innerHTML = `
            <h3>${shop.name}</h3>
            <p>📞 ${displayContact}</p>
            <p>📧 ${shop.email || 'N/A'}</p>
            <p>${locationIcon}: ${coords}</p>
        `;

        return card;
    }

    // -------------------- Fetch Data --------------------
    async function fetchRoutes() {
        routeSelect.innerHTML = `<option value="">Select Route</option>`;
        try {
            const snap = await getDocs(collection(db, "routes"));
            snap.forEach(docSnap => {
                const opt = document.createElement("option");
                opt.value = docSnap.id;
                opt.textContent = docSnap.data().name || docSnap.id;
                routeSelect.appendChild(opt);
            });
        } catch (error) {
            console.error("Error fetching routes:", error);
        }
    }

    async function fetchPlaces() {
        placeSelect.innerHTML = `<option value="">Select Place</option>`;
        shopSelect.innerHTML = `<option value="">Select Shop</option>`;
        shopsContainer.innerHTML = '';
        resetForm(); // Reset form and active card when route changes
        if (!routeSelect.value) return;

        try {
            const q = query(collection(db, "places"), where("routeId", "==", routeSelect.value));
            const snap = await getDocs(q);
            snap.forEach(docSnap => {
                const opt = document.createElement("option");
                opt.value = docSnap.id;
                opt.textContent = docSnap.data().name;
                placeSelect.appendChild(opt);
            });
        } catch (error) {
            console.error("Error fetching places:", error);
        }
    }

    async function renderShops() {
        shopsContainer.innerHTML = '';
        shopSelect.innerHTML = `<option value="">Select Shop</option>`;
        resetForm(); // Reset form and active card when place changes
        
        if (!routeSelect.value || !placeSelect.value) {
            shopListStatus.textContent = "Please select a Route and a Place.";
            return;
        }
        
        shopListStatus.textContent = "Loading shops...";

        try {
            const q = query(
                collection(db, "shops"),
                where("routeId", "==", routeSelect.value),
                where("placeId", "==", placeSelect.value)
            );
            const snap = await getDocs(q);

            const shops = [];
            snap.forEach(docSnap => {
                const data = docSnap.data();
                data.id = docSnap.id;
                shops.push(data);

                const opt = document.createElement("option");
                opt.value = docSnap.id;
                opt.textContent = data.name;
                shopSelect.appendChild(opt);
            });

            if (shops.length === 0) {
                shopListStatus.textContent = "No shops found for this place. Select a Shop name to add new details.";
            } else {
                shopListStatus.textContent = `${shops.length} shop(s) found. Click a card to edit details.`;
                shops.forEach(shop => shopsContainer.appendChild(createShopCard(shop)));
            }
        } catch (error) {
            console.error("Error rendering shops:", error);
            shopListStatus.textContent = "Error loading shops.";
        }
    }

    async function loadShop() {
        const selectedShopId = shopSelect.value;

        if (!selectedShopId) {
            resetForm();
            return;
        }

        try {
            const shopRef = doc(db, "shops", selectedShopId);
            const docSnap = await getDoc(shopRef);
            
            if (!docSnap.exists()) {
                resetForm();
                return;
            }

            const data = docSnap.data();
            // Remove +91 prefix for editing in the contact input field
            contactInput.value = data.contactNo?.replace('+91','') || ''; 
            emailInput.value = data.email || '';
            
            // Format GeoPoint data for display in the location input field
            locationInput.value = data.coordinates instanceof GeoPoint 
                ? `${data.coordinates.latitude.toFixed(6)},${data.coordinates.longitude.toFixed(6)}`
                : '';
                
            locationLinkInput.value = data.locationLink || '';
            addShopBtn.textContent = `💾 Update Details for ${data.name}`;
            addShopBtn.dataset.shopDocId = selectedShopId;
            
            // Manually highlight the corresponding card if the dropdown was changed programmatically (e.g., from renderShops)
            const cardToHighlight = shopsContainer.querySelector(`[data-shop-doc-id="${selectedShopId}"]`);
            if (cardToHighlight && cardToHighlight !== activeShopCard) {
                // Manually apply the inline styles to highlight
                if (activeShopCard) {
                    activeShopCard.style.border = '';
                    activeShopCard.style.backgroundColor = '';
                    activeShopCard.style.boxShadow = '';
                }
                cardToHighlight.style.border = '4px solid #4f46e5'; 
                cardToHighlight.style.backgroundColor = '#eef2ff'; 
                cardToHighlight.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                activeShopCard = cardToHighlight;
            }
        } catch (error) {
            console.error("Error loading shop details:", error);
        }
    }

    async function checkAndAddPlace(routeId, placeName) {
        const placeId = generatePlaceId(routeId, placeName);
        const placeRef = doc(db, "places", placeId);
        const placeDoc = await getDoc(placeRef);

        if (!placeDoc.exists()) {
            const confirmAdd = await showConfirmation("New Place Detected", `Place "${placeName}" does not exist under this route. Add it?`);
            if (!confirmAdd) return null;

            const formattedPlaceName = placeName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            await setDoc(placeRef, { name: formattedPlaceName, routeId });
            await showConfirmation("Success", "✅ Place added successfully. Please re-select the route/place.");
            await fetchPlaces();
        }

        return placeId;
    }

    // -------------------- Add / Update Shop --------------------
    addShopBtn.addEventListener("click", async () => {
        const routeId = routeSelect.value;
        const placeId = placeSelect.value;
        const shopName = shopSelect.options[shopSelect.selectedIndex]?.text || "";

        if (!routeId || !placeId || !shopName) {
            await showConfirmation("Input Error", "Please select route, place, and shop.");
            return;
        }

        addShopBtn.disabled = true;
        addShopBtn.textContent = 'Saving...';

        try {
            const [latStr, lonStr] = locationInput.value.split(",").map(s => s.trim());
            
            let geoPoint = null;
            if (latStr && lonStr && !isNaN(parseFloat(latStr)) && !isNaN(parseFloat(lonStr))) {
                geoPoint = new GeoPoint(parseFloat(latStr), parseFloat(lonStr));
            }

            const shopData = {
                name: shopName,
                routeId,
                placeId,
                contactNo: contactInput.value ? `+91${contactInput.value.replace(/\D/g, "")}` : "",
                email: emailInput.value,
                coordinates: geoPoint,
                locationLink: locationLinkInput.value
            };

            // Determine whether we are updating or creating
            let shopDocId = addShopBtn.dataset.shopDocId; // reuse if editing
            if (!shopDocId) {
                // New shop, generate normalized ID
                shopDocId = generateShopDocId(routeId, placeId, shopName);
            }

            const shopRef = doc(db, "shops", shopDocId);
            const existingShop = await getDoc(shopRef);

            if (existingShop.exists()) {
                shopData.updatedAt = serverTimestamp();
                await updateDoc(shopRef, shopData);
                await showConfirmation("Success", `✅ Shop details for ${shopName} updated successfully.`);
            } else {
                shopData.createdAt = serverTimestamp();
                await setDoc(shopRef, shopData);
                await showConfirmation("Success", `✅ Shop ${shopName} added successfully.`);
            }

            // Refresh list and highlight updated/added shop
            await renderShops();
            shopSelect.value = shopDocId;
            loadShop(); // ensures the card is highlighted and form synced

        } catch (err) {
            console.error(err);
            await showConfirmation("Error", "An error occurred while saving the data. Check console for details.");
        } finally {
            addShopBtn.disabled = false;
        }
    });


    // -------------------- Event Listeners --------------------
    // Input masking for contact number
    contactInput.addEventListener("input", () => {
        contactInput.value = contactInput.value.replace(/\D/g, "").slice(0, 10);
    });

    routeSelect.addEventListener("change", fetchPlaces);
    // Listen for changes and load/render data
    placeSelect.addEventListener("change", renderShops);
    // This is for when the user changes the shop via the dropdown, not the card click
    shopSelect.addEventListener("change", loadShop); 

    // GPS placeholder
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const coords = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
                locationInput.dataset.original = coords; // Store for form reset
                locationInput.placeholder = `Current GPS: ${coords}`;
            },
            err => { locationInput.placeholder = "GPS unavailable"; }
        );
    } else locationInput.placeholder = "GPS not supported";

    // Initial load
    await fetchRoutes();
}
