import { handleGoogleSignIn, handleEmailSignUp, handleSignOut } from './tm-auth.js';
import { updateTokenPosition, pushChatMessage } from './tm-db.js';
import { rollD20 } from './utils/tm-dice.js';

const app = document.getElementById('app');

export const showLoginScreen = () => {
  app.innerHTML = `
    <div class="login-container">
      <h1>Tangent Matrix VTT</h1>
      <button id="google-login">Sign In with Google</button>
      <hr>
      <h3>Or Sign Up with Email</h3>
      <form id="email-signup-form">
        <input id="signup-email" type="email" placeholder="Email" required />
        <input id="signup-password" type="password" placeholder="Password" required />
        <button id="email-signup" type="submit">Sign Up</button>
      </form>
    </div>
  `;

  document.getElementById('google-login').addEventListener('click', handleGoogleSignIn);

  document.getElementById('email-signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    if (email && password) {
      handleEmailSignUp(email, password);
    }
  });
};

const makeTokenDraggable = (tokenElement) => {
  let offsetX, offsetY;

  const onMouseMove = (e) => {
    tokenElement.style.left = `${e.clientX - offsetX}px`;
    tokenElement.style.top = `${e.clientY - offsetY}px`;
  };

  const onMouseUp = async (e) => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    const finalPos = {
      x: e.clientX - offsetX,
      y: e.clientY - offsetY,
      name: tokenElement.textContent, // Persist the name
    };
    const tokenId = tokenElement.dataset.id;
    await updateTokenPosition('defaultCampaign', tokenId, finalPos);
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    offsetX = e.clientX - tokenElement.getBoundingClientRect().left;
    offsetY = e.clientY - tokenElement.getBoundingClientRect().top;
    tokenElement.style.position = 'absolute';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  tokenElement.addEventListener('mousedown', onMouseDown);
};

export const renderToken = (tokenId, tokenData, container) => {
  let tokenEl = document.getElementById(tokenId);
  if (!tokenEl) {
    tokenEl = document.createElement('div');
    tokenEl.id = tokenId;
    tokenEl.dataset.id = tokenId;
    tokenEl.className = 'token';
    tokenEl.textContent = tokenData.name || '?';
    makeTokenDraggable(tokenEl);
    container.appendChild(tokenEl);
  }

  tokenEl.style.position = 'absolute';
  tokenEl.style.left = `${tokenData.x}px`;
  tokenEl.style.top = `${tokenData.y}px`;
};

export const renderMessage = (msgData, container) => {
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message';
    msgEl.innerHTML = `<strong>${msgData.displayName}:</strong> ${msgData.text}`;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight; // Auto-scroll
};

export const showVTT = (user, appContainer) => {
  appContainer.innerHTML = `
    <div id="vtt-container">
      <div id="map-container"></div>
      <div id="chat-container">
        <div id="message-log"></div>
        <form id="chat-form">
            <input id="chat-input" type="text" placeholder="Type message or /roll d20" autocomplete="off" />
            <button type="submit">Send</button>
        </form>
      </div>
      <div id="ui-container">
        <button id="sign-out">Sign Out</button>
      </div>
    </div>
  `;

  document.getElementById('sign-out').addEventListener('click', handleSignOut);

  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const chatInput = document.getElementById('chat-input');
    const messageText = chatInput.value.trim();
    chatInput.value = '';

    if (messageText) {
        let messageData;
        if (messageText === '/roll d20') {
            const result = rollD20();
            messageData = {
                displayName: 'System',
                text: `You rolled a d20: ${result}`,
            };
        } else {
            messageData = {
                displayName: user.email.split('@')[0], // Simple display name
                text: messageText,
            };
        }
        pushChatMessage('defaultCampaign', messageData);
    }
  });
};
