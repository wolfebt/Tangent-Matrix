// Imports from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// These global variables are expected to be injected by the environment.
// Fallbacks are provided for local development.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'vtt-prototype';

let app;
let storage;

/**
 * Initializes the Firebase application, handles authentication, and returns Firestore and Auth instances.
 * Prioritizes signing in with a custom token if provided (__initial_auth_token),
 * otherwise falls back to anonymous sign-in.
 * @returns {Promise<{auth: Auth, db: Firestore, userId: string}>}
 */
export async function initFirebase() {
    if (!Object.keys(firebaseConfig).length) {
        console.error("Firebase config is missing. Cannot initialize Firebase.");
        // Return dummy objects to prevent the app from crashing.
        return { auth: null, db: null, userId: 'offline-user' };
    }

    app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    storage = getStorage(app);

    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Firebase Auth Error:", error);
        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }
    }

    const userId = auth.currentUser ? auth.currentUser.uid : crypto.randomUUID();

    return { auth, db, userId };
}

/**
 * Creates a new game document in Firestore with a default state.
 * @param {Firestore} db The Firestore database instance.
 * @param {string} userId The ID of the user creating the game.
 * @returns {Promise<string>} The ID of the newly created game.
 */
export async function createGame(db, userId) {
    const defaultGameState = {
        mapUrl: null,
        tokens: [],
        activeModules: ["CampaignConsole"],
        ownerId: userId,
    };
    const gameCollection = collection(db, `artifacts/${appId}/public/data/games`);
    const gameDocRef = await addDoc(gameCollection, defaultGameState);
    return gameDocRef.id;
}

/**
 * Subscribes to real-time updates for a specific game document.
 * @param {Firestore} db The Firestore database instance.
 * @param {string} gameId The ID of the game to subscribe to.
 * @param {Function} onStateChangeCallback The callback function to execute with the new game state.
 * @returns {Function} The unsubscribe function from onSnapshot.
 */
export function subscribeToGame(db, gameId, onStateChangeCallback) {
    const gameDocRef = doc(db, `artifacts/${appId}/public/data/games/${gameId}`);
    const unsubscribe = onSnapshot(gameDocRef, (doc) => {
        if (doc.exists()) {
            onStateChangeCallback(doc.data());
        } else {
            console.error("Game document not found!");
            onStateChangeCallback(null); // Handle case where game is deleted
        }
    });
    return unsubscribe;
}

/**
 * Updates a game document in Firestore with a given payload.
 * Merges the payload with the existing document data.
 * @param {Firestore} db The Firestore database instance.
 * @param {string} gameId The ID of the game to update.
 * @param {object} payload The data object to merge into the document.
 * @returns {Promise<void>}
 */
export async function updateGame(db, gameId, payload) {
    const gameDocRef = doc(db, `artifacts/${appId}/public/data/games/${gameId}`);
    await setDoc(gameDocRef, payload, { merge: true });
}

/**
 * Uploads a file to Firebase Storage.
 * @param {File} file The file to upload.
 * @param {string} userId The user's ID to associate the file with.
 * @returns {Promise<string>} The public download URL of the uploaded file.
 */
export async function uploadFile(file, userId) {
    if (!file || !userId) {
        throw new Error("File and userId must be provided for upload.");
    }
    const storageRef = ref(storage, `users/${userId}/uploads/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}
