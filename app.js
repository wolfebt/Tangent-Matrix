// app.js - Main application controller

import * as firebase from './firebase.js';
import * as canvas from './canvas.js';

// --- Global State ---
let currentGameId = null;
let currentGameState = null;
let db, auth, userId;
let canvasManager;
let unsubscribeFromGame = null; // To store the unsubscribe function from Firestore

// --- Module Management ---
const moduleRegistry = {
  'CampaignConsole': './modules/CampaignConsole.js',
};
let loadedModules = new Set();

/**
 * Dynamically loads and initializes modules based on the activeModules array from the GameState.
 * @param {string[]} activeModules An array of module names to load.
 */
async function loadModules(activeModules = []) {
    for (const moduleName of activeModules) {
        if (moduleRegistry[moduleName] && !loadedModules.has(moduleName)) {
            try {
                const module = await import(moduleRegistry[moduleName]);
                if (module.init) {
                    module.init();
                    loadedModules.add(moduleName);
                    console.log(`Module ${moduleName} loaded.`);
                }
            } catch (error) {
                console.error(`Failed to load module ${moduleName}:`, error);
            }
        }
    }
}

// --- Initialization ---

/**
 * Main entry point for the application.
 */
async function init() {
    // Initialize Firebase
    const firebaseInstances = await firebase.initFirebase();
    if (!firebaseInstances.auth) {
        console.error("Application cannot start without Firebase.");
        document.body.innerHTML = "Error: Could not connect to the backend. Please try again later.";
        return;
    }
    db = firebaseInstances.db;
    auth = firebaseInstances.auth;
    userId = firebaseInstances.userId;

    // Initialize Canvas
    canvasManager = canvas.init(document.getElementById('vtt-canvas'), handleCanvasEvent);

    // Handle session from URL and attach UI listeners
    await handleUrlSession();
    attachEventListeners();

    console.log(`VTT Initialized. Game ID: ${currentGameId}, User ID: ${userId}`);
}

// --- Session Management ---

/**
 * Checks the URL hash to determine whether to create a new game or join an existing one.
 */
async function handleUrlSession() {
    const gameIdFromHash = window.location.hash.substring(1);

    if (unsubscribeFromGame) {
        unsubscribeFromGame(); // Unsubscribe from any previous game listener
    }

    if (gameIdFromHash) {
        currentGameId = gameIdFromHash;
        // Subscribe to the existing game
        unsubscribeFromGame = firebase.subscribeToGame(db, currentGameId, (newGameState) => {
            if (newGameState) {
                currentGameState = newGameState;
                canvasManager.render(currentGameState);
                // Dynamically load modules based on game state
                loadModules(currentGameState.activeModules);
            } else {
                // Handle the case where the game ID is invalid or the game is deleted
                console.error(`Game with ID ${currentGameId} not found.`);
                window.location.hash = ''; // Clear the invalid hash
                handleUrlSession(); // Attempt to create a new game
            }
        });
    } else {
        // No game ID in hash, so create a new one
        const newGameId = await firebase.createGame(db, userId);
        window.location.hash = '#' + newGameId;
        // The hash change will trigger a re-evaluation, which will then subscribe.
    }
}

// --- Event Handlers ---

/**
 * Attaches event listeners to the UI elements.
 */
function attachEventListeners() {
    // Handle URL hash changes to switch games
    window.addEventListener('hashchange', handleUrlSession);

    // Listen for custom events from modules to update the map
    window.addEventListener('vttSetMap', (e) => {
        if (currentGameId && db) {
            firebase.updateGame(db, currentGameId, { mapUrl: e.detail.url });
        }
    });

    // Map Upload
    const mapUpload = document.getElementById('map-upload');
    mapUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && currentGameId) {
            try {
                const mapUrl = await firebase.uploadFile(file, userId);
                await firebase.updateGame(db, currentGameId, { mapUrl });
            } catch (error) {
                console.error("Error uploading map:", error);
            }
        }
    });

    // Token Upload
    const tokenUpload = document.getElementById('token-upload');
    tokenUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && currentGameId && currentGameState) {
            try {
                const tokenImgUrl = await firebase.uploadFile(file, userId);
                const newToken = {
                    id: crypto.randomUUID(),
                    img: tokenImgUrl,
                    x: 100,
                    y: 100,
                    size: 1
                };
                const updatedTokens = [...currentGameState.tokens, newToken];
                await firebase.updateGame(db, currentGameId, { tokens: updatedTokens });
            } catch (error) {
                console.error("Error uploading token:", error);
            }
        }
    });
}

/**
 * Callback function passed to canvas.js to handle events from the canvas.
 * @param {string} type The type of event (e.g., 'tokenMove').
 * @param {object} payload The data associated with the event.
 */
function handleCanvasEvent(type, payload) {
    if (type === 'tokenMove') {
        if (currentGameId) {
            firebase.updateGame(db, currentGameId, { tokens: payload.tokens });
        }
    }
}


// --- Kick off the application ---
window.addEventListener('load', init);
