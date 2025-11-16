import { 
  auth 
} from './tm-firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// --- Google Sign-In ---
export const handleGoogleSignIn = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch((error) => {
    console.error('Google Sign-In Error:', error);
    alert(`Google Sign-In Failed: ${error.message}`);
  });
};

// --- Anonymous Sign-In ---
export const handleAnonymousSignIn = () => {
  signInAnonymously(auth).catch((error) => {
    console.error('Anonymous Sign-In Error:', error);
    alert(`Anonymous Sign-In Failed: ${error.message}`);
  });
};

// --- Email/Password Sign-Up ---
export const handleEmailSignUp = (email, password) => {
  createUserWithEmailAndPassword(auth, email, password).catch((error) => {
    console.error('Email Sign-Up Error:', error);
    alert(`Email Sign-Up Failed: ${error.message}`);
  });
};

// --- Email/Password Sign-In ---
export const handleEmailSignIn = (email, password) => {
  signInWithEmailAndPassword(auth, email, password).catch((error) => {
    console.error('Email Sign-In Error:', error);
    alert(`Email Sign-In Failed: ${error.message}`);
  });
};

// --- Phone Sign-In ---
export const initializeRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log("reCAPTCHA solved");
        }
      }
    );
  }
};


export const handlePhoneSignIn = (phoneNumber) => {
  const appVerifier = window.recaptchaVerifier;
  signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    .then((confirmationResult) => {
      window.confirmationResult = confirmationResult;
      alert('Verification code sent to your phone.');
    })
    .catch((error) => {
      console.error('Phone Sign-In Error:', error);
      alert(`Phone Sign-In Failed: ${error.message}`);
    });
};

export const verifyPhoneCode = (code) => {
  if (window.confirmationResult) {
    window.confirmationResult.confirm(code)
      .catch((error) => {
        console.error('Phone Verification Error:', error);
        alert(`Verification Failed: ${error.message}`);
      });
  } else {
    alert('Please send the verification code first.');
  }
};


// --- Sign Out ---
export const handleSignOut = () => {
  signOut(auth).catch((error) => {
    console.error('Sign Out Error:', error);
    alert(`Sign Out Failed: ${error.message}`);
  });
};

// --- Auth State Observer ---
onAuthStateChanged(auth, user => {
  if (user) {
    // User is signed in, redirect to the main application.
    window.location.href = 'pages/Tangent-Matrix.html';
  }
});
