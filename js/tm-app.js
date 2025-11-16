import { auth } from './tm-firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { showLoginScreen, showVTT, renderToken, renderMessage } from './tm-ui.js';
import { streamTokens, streamChatMessages } from './tm-db.js';
import { getMode, getLocalUserId, setLocalUserId } from './tm-local-storage.js';

const initializeApp = () => {
  if (getMode() === 'local') {
    // --- LOCAL MODE ---
    let userId = getLocalUserId();
    if (!userId) {
      userId = prompt("Please enter a local username:", "local-user");
      if(userId) { // Check if user provided a name
        setLocalUserId(userId);
      } else {
        // If user cancels prompt, use a default
        userId = 'anonymous';
        setLocalUserId(userId);
      }
    }

    const mockUser = {
      uid: userId,
      email: `${userId}@local.host`, // Provide a mock email for display purposes
      displayName: userId
    };

    showVTT(mockUser);
    // In local mode, we don't stream from DB.
    // The UI is active, and we'll wire it up to local storage in subsequent steps.

  } else {
    // --- CLOUD MODE ---
    if (auth) {
      onAuthStateChanged(auth, user => {
        if (user) {
          // User is signed in.
          showVTT(user);
          const mapContainer = document.getElementById('map-container');
          const messageLog = document.getElementById('message-log');

          // Start streaming tokens
          streamTokens('defaultCampaign', (tokens) => {
            if (!tokens) return;
            Object.keys(tokens).forEach(tokenId => {
              renderToken(tokenId, tokens[tokenId], mapContainer);
            });
          });

          // Start streaming chat messages
          streamChatMessages('defaultCampaign', (messages) => {
              if (!messages) return;
              messageLog.innerHTML = ''; // Clear log on new message bundle
              Object.values(messages).forEach(msg => {
                  renderMessage(msg, messageLog);
              });
          });

        } else {
          // User is signed out.
          showLoginScreen();
        }
      });
    } else {
      // Firebase failed to initialize (e.g., missing config)
      console.error("Firebase is not initialized. Cannot proceed with cloud mode.");
      showLoginScreen();
      // It might be good to show an error on the login screen itself.
    }
  }
};

// Start the application
onAuthStateChanged(auth, user => {
  if (user) {
    initializeApp(user);
  } else {
    // User is signed out, redirect to login page.
    window.location.href = '../index.html';
  }
});
