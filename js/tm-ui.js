import { handleGoogleSignIn, handleEmailSignUp, handleSignOut } from './tm-auth.js';
import { updateTokenPosition, pushChatMessage } from './tm-db.js';
import { rollD20 } from './utils/tm-dice.js';
import { getMode, setMode, getLocalUserId, setLocalUserId, saveProject, loadProject, getSavedProjects, clearProjects } from './tm-local-storage.js';

const loginContainer = document.getElementById('login-container-wrapper');
const vttContainer = document.getElementById('vtt-app-wrapper');

export const showLoginScreen = () => {
  loginContainer.innerHTML = `
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

  vttContainer.classList.add('hidden');
  loginContainer.classList.remove('hidden');

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

export const showVTT = (user) => {
  loginContainer.classList.add('hidden');
  vttContainer.classList.remove('hidden');
  initializeVTTEventListeners(user);
};

const initializeVTTEventListeners = (user) => {
  // Settings Modal Logic
  const settingsButton = document.getElementById('settings-button');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsButton = document.getElementById('close-settings-button');
  const modeToggle = document.getElementById('mode-toggle');
  const localUserIdInput = document.getElementById('local-user-id');

  settingsButton.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  closeSettingsButton.addEventListener('click', () => settingsModal.classList.add('hidden'));

  // Populate settings
  modeToggle.value = getMode();
  localUserIdInput.value = getLocalUserId() || '';

  // Handle mode change
  modeToggle.addEventListener('change', (e) => {
    const newMode = e.target.value;
    setMode(newMode);
    alert('Mode changed. The application will now reload.');
    window.location.reload();
  });

  // Handle User ID change
  localUserIdInput.addEventListener('change', (e) => {
    setLocalUserId(e.target.value);
  });


  // File Menu Logic
  const fileMenuButton = document.getElementById('file-menu-button');
  const fileMenuDropdown = document.getElementById('file-menu-dropdown');

  fileMenuButton.addEventListener('click', () => {
    fileMenuDropdown.classList.toggle('hidden');
  });

  // --- Save/Load Functionality ---
  document.getElementById('save-button').addEventListener('click', (e) => {
    e.preventDefault();
    fileMenuDropdown.classList.add('hidden');
    if (getMode() === 'local') {
        const projectTitle = prompt("Enter a title for your project:", "My Scenario");
        if (projectTitle) {
            const tokens = {};
            document.querySelectorAll('.token').forEach(tokenEl => {
                tokens[tokenEl.id] = {
                    name: tokenEl.textContent,
                    x: tokenEl.style.left,
                    y: tokenEl.style.top
                };
            });
            const projectState = { tokens }; // Can be expanded later
            if (saveProject(projectTitle, projectState)) {
                alert(`Project "${projectTitle}" saved.`);
            } else {
                alert(`Failed to save project.`);
            }
        }
    } else {
        alert("Save/Load is only available in local mode.");
    }
  });

  document.getElementById('load-button').addEventListener('click', (e) => {
    e.preventDefault();
    fileMenuDropdown.classList.add('hidden');
    if (getMode() === 'local') {
        const savedProjects = getSavedProjects();
        if (savedProjects.length === 0) {
            alert("No local projects found.");
            return;
        }
        const projectTitle = prompt(`Enter the title of the project to load:\n\nAvailable projects:\n- ${savedProjects.join('\n- ')}`);
        if (projectTitle) {
            const projectState = loadProject(projectTitle);
            if (projectState) {
                const mapContainer = document.getElementById('map-container');
                // Clear existing tokens
                mapContainer.innerHTML = '';
                // Render loaded tokens
                if (projectState.tokens) {
                    Object.keys(projectState.tokens).forEach(tokenId => {
                        renderToken(tokenId, projectState.tokens[tokenId], mapContainer);
                    });
                }
                alert(`Project "${projectTitle}" loaded.`);
            } else {
                alert(`Could not find a project named "${projectTitle}".`);
            }
        }
    } else {
        alert("Save/Load is only available in local mode.");
    }
  });


  // Existing event listeners (Sign out, chat, etc.)
  if (getMode() === 'cloud') {
    document.getElementById('sign-out').addEventListener('click', handleSignOut);
  } else {
    // In local mode, 'sign out' is meaningless, so we can hide it.
    const signOutButton = document.getElementById('sign-out');
    if(signOutButton) signOutButton.style.display = 'none';
  }

  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const chatInput = document.getElementById('chat-input');
    const messageText = chatInput.value.trim();
    chatInput.value = '';

    if (messageText) {
      let messageData;
      if (messageText.startsWith('/roll')) {
        const result = rollD20(); // Simplified for now
        messageData = {
          displayName: 'System',
          text: `You rolled a d20: ${result}`,
        };
      } else {
        messageData = {
          displayName: user.displayName || user.email.split('@')[0],
          text: messageText,
        };
      }

      if (getMode() === 'cloud') {
        pushChatMessage('defaultCampaign', messageData);
      } else {
        // In local mode, just render the message directly for now.
        renderMessage(messageData, document.getElementById('message-log'));
      }
    }
  });

  // Add event listeners for collapsible headers for "one at a time" accordion behavior
  const allHeaders = document.querySelectorAll('.collapsible-header');
  allHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isCollapsed = header.classList.contains('collapsed');

      // First, close all accordions
      allHeaders.forEach(h => {
        h.classList.add('collapsed');
        h.nextElementSibling.classList.add('hidden');
      });

      // Then, if the clicked one was collapsed, open it
      if (isCollapsed) {
        header.classList.remove('collapsed');
        content.classList.remove('hidden');
      }
    });
  });

  // Add Token Button
  document.getElementById('add-token').addEventListener('click', () => {
    const tokenName = document.getElementById('token-name').value || 'New Token';
    const tokenId = `token-${Date.now()}`;
    const tokenData = {
        name: tokenName,
        x: '100px', // Default position
        y: '100px'
    };
    renderToken(tokenId, tokenData, document.getElementById('map-container'));
  });

  // Clear Map Button
  document.getElementById('clear-map').addEventListener('click', () => {
    if (getMode() === 'local') {
        if (confirm("Are you sure you want to clear the map and ALL saved local projects? This action cannot be undone.")) {
            clearProjects();
            window.location.reload();
        }
    } else {
        // Existing cloud mode functionality would go here
        document.getElementById('map-container').innerHTML = '';
    }
  });
}


const makeTokenDraggable = (tokenElement) => {
  // This function logic can remain largely the same, but DB updates need to be conditional
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
      name: tokenElement.textContent,
    };
    const tokenId = tokenElement.dataset.id;

    if (getMode() === 'cloud') {
      await updateTokenPosition('defaultCampaign', tokenId, finalPos);
    } else {
      // Logic for local persistence will be added here later
      console.log(`Local Token Moved: ${tokenId} to (${finalPos.x}, ${finalPos.y})`);
    }
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
    tokenEl.className = 'token'; // You'll need to define this class in your CSS
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
    msgEl.className = 'chat-message'; // Define in CSS
    msgEl.innerHTML = `<strong>${msgData.displayName}:</strong> ${msgData.text}`;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight; // Auto-scroll
};
