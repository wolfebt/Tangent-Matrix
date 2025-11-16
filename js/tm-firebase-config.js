import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js"
import { getMode } from './tm-local-storage.js'

// This configuration is intentionally left blank.
// The application should either be used in 'local' mode or the user must provide their own firebaseConfig.js.
const firebaseConfig = {
  // apiKey: "...",
  // authDomain: "...",
  // databaseURL: "...",
  // projectId: "...",
  // storageBucket: "...",
  // messagingSenderId: "...",
  // appId: "..."
};


let app
let auth = null
let db = null

if (getMode() === 'cloud') {
  try {
    // Only initialize Firebase if in cloud mode and the config has keys.
    if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
        app = initializeApp(firebaseConfig)
        auth = getAuth(app)
        db = getDatabase(app)
    } else {
        console.warn('Firebase config is missing. Running in a degraded cloud mode. Please provide a valid firebaseConfig object.')
        // Setting mode to local to prevent further Firebase-related errors.
        // setMode('local')
    }
  } catch (error) {
    console.error("Failed to initialize Firebase. Ensure your firebaseConfig is correct.", error)
    // Fallback to local mode if initialization fails
    // setMode('local')
  }
} else {
    console.info('Application is running in local mode. No connection to Firebase will be established.')
}


export { auth, db }
