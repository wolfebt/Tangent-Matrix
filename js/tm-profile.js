import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const auth = getAuth();
const database = getDatabase();

const profileModal = document.getElementById('profile-modal');
const handleInput = document.getElementById('handle-input');
const saveProfileButton = document.getElementById('save-profile-button');
const settingsButton = document.getElementById('settings-button');
const handleEditInput = document.getElementById('handle-edit-input');
const saveHandleButton = document.getElementById('save-handle-button');

let currentUser = null;
let userHandle = null;

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    const userRef = ref(database, `users/${user.uid}`);
    get(userRef).then(snapshot => {
      if (snapshot.exists() && snapshot.val().handle) {
        userHandle = snapshot.val().handle;
        handleEditInput.value = userHandle;
      } else {
        // User profile doesn't exist or has no handle, show the creation modal.
        profileModal.classList.remove('hidden');
      }
    });
  } else {
      // Not logged in, hide profile settings
      document.getElementById('profile-settings').classList.add('hidden');
  }
});

const saveOrUpdateHandle = (handle, onComplete) => {
    if (currentUser && handle) {
        const userRef = ref(database, `users/${currentUser.uid}`);
        // Use `get` to safely merge data without overwriting other fields
        get(userRef).then(snapshot => {
            const existingData = snapshot.val() || {};
            const profileData = {
                ...existingData,
                handle: handle,
                email: currentUser.email || existingData.email, // Preserve email if it exists
                provider: currentUser.providerData[0]?.providerId || existingData.provider,
            };
            set(userRef, profileData).then(() => {
                userHandle = handle;
                if(onComplete) onComplete();
            }).catch(error => {
                console.error("Error saving profile: ", error);
                alert("Failed to save handle.");
            });
        });
    }
};


saveProfileButton.addEventListener('click', () => {
  const newHandle = handleInput.value.trim();
  saveOrUpdateHandle(newHandle, () => {
      profileModal.classList.add('hidden');
      handleEditInput.value = newHandle; // Also update the settings modal input
      alert("Profile created!");
  });
});

saveHandleButton.addEventListener('click', () => {
    const newHandle = handleEditInput.value.trim();
    saveOrUpdateHandle(newHandle, () => {
        alert("Handle updated!");
        document.getElementById('settings-modal').classList.add('hidden');
    });
});

// Populate handle in settings modal when opened
settingsButton.addEventListener('click', () => {
    if(userHandle) {
        handleEditInput.value = userHandle;
    }
});
