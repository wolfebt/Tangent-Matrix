AGENTS.md for Tangent Matrix VTT (Matrix)


1. Project Overview

You are helping to build "Tangent Matrix VTT," a real-time, lightweight Virtual Tabletop application.
Stack: Vanilla JavaScript (ES Modules), Firebase v9 (Authentication, Realtime Database, Hosting).
Core Principle: Simplicity and high performance. We are NOT using any frontend frameworks (React, Vue, Angular, etc.). All code must be strict, modular Vanilla JS. This is a primary project constraint.

2. Setup, Development & Deployment

Use the Firebase CLI for all hosting and development.
Install Dependencies: This is a Vanilla JS project; there are no npm install steps for the frontend. All Firebase libraries will be imported via CDN ES modules in index.html.
Run Dev Server: firebase serve --only hosting
Deploy: firebase deploy --only hosting,database

3. Core Architecture & File Conventions

Adhere strictly to this Separation of Concerns (SoC) model. This is non-negotiable and provides architectural context to guide file placement.

- **`index.html`**: The landing page, which immediately redirects to the main VTT application.
- **`/pages/Tangent-Matrix.html`**: The main HTML file for the VTT application.
- **`/css/tm-style.css`**: All CSS styles for the application.
- **`/js/`**: This directory contains all the JavaScript modules.
  - **`tm-firebase-config.js`**: Initializes and exports the single `auth` and `db` instances.
  - **`tm-app.js`**: The main application orchestrator. Initializes the `onAuthStateChanged` listener, which is the primary driver of application state. Orchestrates calls between the auth, db, and ui modules.
  - **`tm-auth.js`**: Manages all Firebase Authentication logic. Exports functions like `handleGoogleSignIn`, `handleEmailSignUp`, and `handleSignOut`. Does NOT contain any DOM manipulation code.
  - **`tm-db.js`**: Manages all Firebase Realtime Database (RTDB) interactions. Exports functions like `updateTokenPosition`, `pushChatMessage`, and `streamChatMessages`. Does NOT contain any DOM manipulation code.
  - **`tm-ui.js`**: Manages all DOM interactions (`document.getElementById`, `addEventListener`, etc.). Contains functions like `showLoginScreen`, `showVTT`, `renderToken`, and `renderMessage`. Imports functions from `auth.js` and `db.js` to wire up event listeners.
  - **`/utils/tm-dice.js`**: Utility functions, such as dice rolling logic.

4. Coding Standards

Module Format: Use ES6 Modules (import/export) for all JavaScript files.
SDK Version: Use the Firebase v9+ modular (tree-shakeable) SDK.
Frameworks: PROHIBITED. Do not use React, Vue, jQuery, or any other UI framework.
Style: Use single quotes, no semicolons.
Patterns: Use functional patterns where possible. Avoid classes.

5. Firebase Realtime Database (RTDB) Policy

This is the most critical architectural constraint.
CRITICAL: Maintain a flat, denormalized data structure..
NEVER NEST DATA. Fetching a parent node downloads all children.
Schema:
/users/{uid}
/campaigns/{campaignId}/meta
/campaigns/{campaignId}/tokens/{tokenId}
/campaigns/{campaignId}/chat
/campaignMembers/{campaignId}/{uid}
Writing Data:
Use set() for specific-key objects (e.g., token positions).
Use push() for chronological lists (e.g., chat messages).

6. Security & Testing

All database access must be secured via database.rules.json.
The primary security model is checking root.child('campaignMembers/'+$campaignId+'/'+auth.uid).exists().
Test features manually by running firebase serve and verifying functionality in the browser.
