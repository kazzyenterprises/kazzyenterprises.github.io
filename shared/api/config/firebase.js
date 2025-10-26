// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  GeoPoint
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCI6ZLswuH7aZKpqt8EwGI6TWecpBQkVgo",
  authDomain: "kazzyenterprizes-c8ef7.firebaseapp.com",
  projectId: "kazzyenterprizes-c8ef7",
  storageBucket: "kazzyenterprizes-c8ef7.firebasestorage.app",
  messagingSenderId: "673988986305",
  appId: "1:673988986305:web:efbdc6283a30483f1a1b40",
  measurementId: "G-Z2W56NEGD6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  app,
  db,
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  GeoPoint
};
