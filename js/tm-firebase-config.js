import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMpS56HSVunbo4PxPOFHAm9pFq_pXEDM8",
  authDomain: "tangentsffrpg-db.firebaseapp.com",
  projectId: "tangentsffrpg-db",
  storageBucket: "tangentsffrpg-db.firebasestorage.app",
  messagingSenderId: "583360037097",
  appId: "1:583360037097:web:2ea3f057bf51d54fd8b078",
  measurementId: "G-JVE9ZMKSRL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database, firebaseConfig };
