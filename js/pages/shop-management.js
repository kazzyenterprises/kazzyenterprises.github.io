/**
 * Module for the Shop Management page logic.
 * @param {firebase.app.App} firebaseApp - The initialized Firebase App instance.
 */
export function initializeShopManagement(firebaseApp) {
    const db = firebaseApp.firestore();

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

    // -------------------- Initial Setup --------------------

    // Force contact number to digits only
    contactInput.addEventListener("input", () => {
        contactInput.value = contactInput.value.replace(/\D/g, "").slice(0, 10);
    });

    // Auto-set GPS coordinates
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                locationInput.value = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
            },
            err => {
                console.warn("GPS not available:", err);
                locationInput.placeholder = "GPS unavailable";
            }
        );
    } else {
        locationInput.placeholder = "GPS not supported by browser";
    }

    // -------------------- Utility Functions --------------------

    function normalizeId(str) {
        return String(str || "").trim().toLowerCase().replace(/\s+/g, "_");
    }

    function generatePlaceId(routeId, placeName) {
        return `${normalizeId(routeId)}_${normalizeId(placeName)}`;
    }

    function generateShopDocId(routeId, placeName, shopName) {
        return `${normalizeId(routeId)}_${normalizeId(placeName)}_${normalizeId(shopName)}`;
    }

    // -------------------- Fetch Routes & Places --------------------

    async function fetchRoutes() {
        try {
            const snap = await db.collection("routes").get();
            routeSelect.innerHTML = "<option value=''>Select Route</option>";
            snap.forEach(doc => {
                const opt = document.createElement("option");
                opt.value = doc.id; // keep original routeId
                opt.textContent = doc.data().name || doc.id;
                routeSelect.appendChild(opt);
            });
        } catch (err) {
            console.error("Error fetching routes:", err);
        }
    }

    async function fetchPlacesForSelectedRoute() {
        placesList.innerHTML = "";
        placeInput.value = ""; // Clear place input on route change
        shopsList.innerHTML = ""; // Clear shops list
        shopInput.value = ""; // Clear shop input
        if (!routeSelect.value) return;

        const snap = await db.collection("places")
            .where("routeId", "==", routeSelect.value)
            .get();

        snap.forEach(doc => {
            const data = doc.data();
            const opt = document.createElement("option");
            opt.value = data.name;          // Human readable name
            opt.dataset.id = doc.id;        // Lowercase placeId
            placesList.appendChild(opt);
        });
    }

    async function fetchShopsForSelectedPlace() {
        shopsList.innerHTML = "";
        // Check if the input place matches an existing datalist option
        const selectedPlaceOption = [...placesList.options].find(
            opt => opt.value.toLowerCase() === placeInput.value.trim().toLowerCase()
        );
        
        // If route or place is not valid, stop
        if (!routeSelect.value || !selectedPlaceOption) {
            shopInput.value = "";
            return;
        }

        const placeId = selectedPlaceOption.dataset.id;

        const snap = await db.collection("shops")
            .where("routeId", "==", routeSelect.value)
            .where("placeId", "==", placeId)
            .get();

        snap.forEach(doc => {
            const data = doc.data();
            const opt = document.createElement("option");
            opt.value = data.name;     // show shop name
            opt.dataset.id = doc.id;   // lowercased shopId
            shopsList.appendChild(opt);
        });
    }

    // -------------------- Add Place if Missing --------------------

    async function checkAndAddPlace(routeId, placeName) {
        const placeId = generatePlaceId(routeId, placeName);
        const placeRef = db.collection("places").doc(placeId);
        const placeDoc = await placeRef.get();

        if (!placeDoc.exists) {
            const confirmAdd = confirm(`Place "${placeName}" does not exist under this route. Add it?`);
            if (!confirmAdd) return null;

            // Capitalize first letter of each word (simple version for Firestore)
            const formattedPlaceName = placeName
                .split(" ")
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ");

            await placeRef.set({
                name: formattedPlaceName,
                routeId
            });
            alert("✅ Place added successfully.");
            // Re-fetch places so the new one appears in the datalist
            await fetchPlacesForSelectedRoute();
        }
        return placeId;
    }

    // -------------------- Add / Update Shop --------------------

    addShopBtn.addEventListener("click", async () => {
        try {
            const routeId = routeSelect.value;
            const placeName = placeInput.value.trim();
            const shopNameRaw = shopInput.value.trim();

            if (!routeId) return alert("Please select a route.");
            if (!placeName) return alert("Please enter a place.");
            if (!shopNameRaw) return alert("Please enter a shop name.");

            const placeId = await checkAndAddPlace(routeId, placeName);
            if (!placeId) return;

            // Title Case for Shop Name
            const shopName = shopNameRaw
                .split(" ")
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ");

            // Generate unique/consistent document ID
            const shopDocId = generateShopDocId(routeId, placeName, shopName);

            const coords = locationInput.value.split(",");
            const shopData = {
                name: shopName,
                routeId,
                placeId, 
                contactNo: contactInput.value ? `+91${contactInput.value}` : "",
                email: emailInput.value,
                coordinates: locationInput.value && coords.length === 2
                    ? new firebase.firestore.GeoPoint(parseFloat(coords[0]), parseFloat(coords[1]))
                    : null,
                locationLink: locationLinkInput.value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const shopRef = db.collection("shops").doc(shopDocId);
            const existingShop = await shopRef.get();

            if (existingShop.exists) {
                if (!confirm("Shop already exists. Update details?")) return;
                await shopRef.update(shopData);
                alert("✅ Shop updated successfully.");
            } else {
                shopData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await shopRef.set(shopData);
                alert("✅ Shop added successfully.");
            }

            // After success, reload the shops list
            fetchShopsForSelectedPlace();
            shopInput.value = shopName; // Ensure the input shows the formatted name

        } catch (err) {
            console.error("Error adding/updating shop:", err);
            alert("An error occurred while saving the shop. Check console for details.");
        }
    });
    
    // -------------------- Event Listeners --------------------

    routeSelect.addEventListener("change", fetchPlacesForSelectedRoute);
    
    // Use 'change' event on the input for a more reliable trigger after datalist selection
    placeInput.addEventListener("change", fetchShopsForSelectedPlace);

    // Initial Load
    fetchRoutes();
}