import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, RecaptchaVerifier, signInWithPhoneNumber, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const auth = getAuth();

const googleSigninOptionButton = document.getElementById('google-signin-option');
const anonymousSigninOptionButton = document.getElementById('anonymous-signin-option');
const phoneSigninOptionButton = document.getElementById('phone-signin-option');
const emailSigninOptionButton = document.getElementById('email-signin-option');

const phoneAuthContainer = document.getElementById('phone-auth-container');
const emailPasswordContainer = document.getElementById('email-password-container');

const phoneNumberInput = document.getElementById('phone-number');
const sendVerificationCodeButton = document.getElementById('send-verification-code');
const recaptchaContainer = document.getElementById('recaptcha-container');
const verificationCodeInput = document.getElementById('verification-code');
const verifyCodeButton = document.getElementById('verify-code');
const emailSigninButton = document.getElementById('email-signin');
const emailSignupButton = document.getElementById('email-signup');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Option buttons
googleSigninOptionButton.addEventListener('click', () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .catch((error) => {
      console.error(error);
    });
});

anonymousSigninOptionButton.addEventListener('click', () => {
  signInAnonymously(auth)
    .catch((error) => {
      console.error(error);
    });
});

phoneSigninOptionButton.addEventListener('click', () => {
  phoneAuthContainer.classList.remove('hidden');
  emailPasswordContainer.classList.add('hidden');
});

emailSigninOptionButton.addEventListener('click', () => {
  emailPasswordContainer.classList.remove('hidden');
  phoneAuthContainer.classList.add('hidden');
});


// Phone Sign-in
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
  'size': 'invisible'
}, auth);

sendVerificationCodeButton.addEventListener('click', () => {
  const phoneNumber = phoneNumberInput.value;
  const appVerifier = window.recaptchaVerifier;
  signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    .then((confirmationResult) => {
      // SMS sent. Prompt user to type the code from the message, then sign the
      // user in with confirmationResult.confirm(code).
      window.confirmationResult = confirmationResult;
    }).catch((error) => {
      // Error; SMS not sent
      console.error(error);
    });
});

verifyCodeButton.addEventListener('click', () => {
  const code = verificationCodeInput.value;
  confirmationResult.confirm(code).then((result) => {
    // User signed in successfully.
    const user = result.user;
    // ...
  }).catch((error) => {
    // User couldn't sign in (bad verification code?)
    console.error(error);
  });
});


// Email/Password Sign-up
emailSignupButton.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  createUserWithEmailAndPassword(auth, email, password)
    .catch((error) => {
      console.error(error);
    });
});

// Email/Password Sign-in
emailSigninButton.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password)
    .catch((error) => {
      console.error(error);
    });
});

// Auth state observer
onAuthStateChanged(auth, user => {
  if (user) {
    // User is signed in.
    window.location.href = 'pages/Tangent-Matrix.html';
  }
});
