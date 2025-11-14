import { auth } from './tm-firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { showLoginScreen, showVTT, renderToken, renderMessage } from './tm-ui.js';
import { streamTokens, streamChatMessages } from './tm-db.js';

const appContainer = document.getElementById('app');

onAuthStateChanged(auth, user => {
  if (user) {
    // User is signed in.
    showVTT(user, appContainer);
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
