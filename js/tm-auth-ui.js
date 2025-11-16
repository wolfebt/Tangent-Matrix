// This script is now a standard, deferred script and has no module dependencies.

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAMpS56HSVunbo4PxPOFHAm9pFq_pXEDM8",
  authDomain: "tangentsffrpg-db.firebaseapp.com",
  projectId: "tangentsffrpg-db",
  storageBucket: "tangentsffrpg-db.firebasestorage.app",
  messagingSenderId: "583360037097",
  appId: "1:583360037097:web:2ea3f057bf51d54fd8b078",
  measurementId: "G-JVE9ZMKSRL"
};

// --- Initialize Firebase (v8 Compat Mode) ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// --- Get DOM Elements ---
const authContainer = document.getElementById('auth-container');
const firebaseuiContainer = document.getElementById('firebaseui-auth-container');
const navigationMenu = document.getElementById('navigation-menu');
const logoutButtonId = 'logout-trigger-button';

// --- Initialize FirebaseUI ---
const ui = new firebaseui.auth.AuthUI(auth);
const uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      return false;
    }
  },
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
  ],
};

// --- Auth State Logic ---
auth.onAuthStateChanged((user) => {
  if (user) {
    firebaseuiContainer.classList.add('hidden');
    navigationMenu.classList.remove('hidden');
    authContainer.innerHTML = `<div class="flex items-center gap-4"><span class="text-sm text-gray-300">${user.isAnonymous ? 'Guest' : (user.displayName || user.email)}</span><button id="${logoutButtonId}" class="auth-button">Logout</button></div>`;
    document.getElementById(logoutButtonId).addEventListener('click', () => {
      auth.signOut();
    });
  } else {
    navigationMenu.classList.add('hidden');
    firebaseuiContainer.classList.remove('hidden');
    authContainer.innerHTML = '';
    ui.start('#firebaseui-auth-container', uiConfig);
  }
});
