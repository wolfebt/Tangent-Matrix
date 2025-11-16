import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const auth = getAuth();
const database = getDatabase();

document.addEventListener('DOMContentLoaded', () => {
  const profileModal = document.getElementById('profile-modal');
  const handleInput = document.getElementById('handle-input');
  const saveProfileButton = document.getElementById('save-profile-button');

  onAuthStateChanged(auth, user => {
    if (user) {
      const userRef = ref(database, 'users/' + user.uid);
      get(userRef).then(snapshot => {
        if (!snapshot.exists()) {
          // User profile doesn't exist, show the modal.
          profileModal.classList.remove('hidden');
        }
      });
    }
  });

  saveProfileButton.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
      const handle = handleInput.value;
      if (handle) {
        const userRef = ref(database, 'users/' + user.uid);
        set(userRef, {
          handle: handle,
          email: user.email,
          provider: user.providerData[0].providerId
        }).then(() => {
          profileModal.classList.add('hidden');
        }).catch(error => {
          console.error("Error saving profile: ", error);
        });
      }
    }
  });
});
