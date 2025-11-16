import {
  handleGoogleSignIn,
  handleAnonymousSignIn,
  handleEmailSignUp,
  handleEmailSignIn,
  initializeRecaptcha,
  handlePhoneSignIn,
  verifyPhoneCode
} from './tm-auth.js';

// --- Get DOM Elements ---
const googleSignInBtn = document.getElementById('google-signin-btn');
const anonymousSignInLink = document.getElementById('anonymous-signin-link');
const phoneSignInLink = document.getElementById('phone-signin-link');
const emailSignInLink = document.getElementById('email-signin-link');

const phoneAuthContainer = document.getElementById('phone-auth-container');
const emailPasswordContainer = document.getElementById('email-password-container');

const sendVerificationCodeBtn = document.getElementById('send-verification-code-btn');
const verifyCodeBtn = document.getElementById('verify-code-btn');
const emailSignInBtn = document.getElementById('email-signin-btn');
const emailSignUpBtn = document.getElementById('email-signup-btn');

// --- Attach Main Event Listeners ---
googleSignInBtn.addEventListener('click', handleGoogleSignIn);
anonymousSignInLink.addEventListener('click', (e) => {
  e.preventDefault();
  handleAnonymousSignIn();
});


// --- Logic to Show/Hide Secondary Auth Methods ---
emailSignInLink.addEventListener('click', (e) => {
  e.preventDefault();
  phoneAuthContainer.classList.add('hidden');
  emailPasswordContainer.classList.toggle('hidden');
});

phoneSignInLink.addEventListener('click', (e) => {
  e.preventDefault();
  emailPasswordContainer.classList.add('hidden');
  phoneAuthContainer.classList.toggle('hidden');
  // Initialize reCAPTCHA verifier if it's not already there
  initializeRecaptcha();
});


// --- Attach Event Listeners for Secondary Auth Methods ---

// Email/Password
emailSignUpBtn.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  handleEmailSignUp(email, password);
});

emailSignInBtn.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  handleEmailSignIn(email, password);
});

// Phone
sendVerificationCodeBtn.addEventListener('click', () => {
  const phoneNumber = document.getElementById('phone-number').value;
  handlePhoneSignIn(phoneNumber);
});

verifyCodeBtn.addEventListener('click', () => {
  const code = document.getElementById('verification-code').value;
  verifyPhoneCode(code);
});
