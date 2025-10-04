// js/app.js

import { 
    renderSidebar, 
    initializeMenuToggle, 
    initializeSidebarAccordion 
} from './components/sidebar.js'; 

// Import the router component
import { initializeRouter } from './components/router.js'; 

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyCI6ZLswuH7aZKpqt8EwGI6TWecpBQkVgo",
    authDomain: "kazzyenterprizes-c8ef7.firebaseapp.com",
    projectId: "kazzyenterprizes-c8ef7",
    storageBucket: "kazzyenterprizes-c8ef7.firebasestorage.app",
    messagingSenderId: "673988986305",
    appId: "1:673988986305:web:efbdc6283a30483f1a1b40",
    measurementId: "G-Z2W56NEGD6"
};

let firebaseApp;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Firebase
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        window.db = firebase.firestore(); // Still sets window.db for legacy compatibility
        console.log("Firebase Initialized Successfully.");
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
        document.getElementById('main-content-area').innerHTML = 
            `<h1>Firebase Error</h1><p>Failed to initialize Firebase. Check your network and configuration.</p>`;
        return;
    }
    // 2. Initialize UI Components
    renderSidebar();
    initializeMenuToggle();
    initializeSidebarAccordion();

    // 3. Initialize Router 
    // Pass the initialized firebaseApp object to the router (though only the DB is needed now)
    initializeRouter(firebaseApp); 
});