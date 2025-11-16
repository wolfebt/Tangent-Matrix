AGENTS.md for Tangent Matrix VTT (Matrix)


1. Project Overview

You are helping to build "Tangent Matrix VTT," a real-time, lightweight Virtual Tabletop application.
Stack: Vanilla JavaScript (ES Modules).
Core Principle: Simplicity and high performance. We are NOT using any frontend frameworks (React, Vue, Angular, etc.). All code must be strict, modular Vanilla JS. This is a primary project constraint.

2. Core Architecture & File Conventions

Adhere strictly to this Separation of Concerns (SoC) model. This is non-negotiable and provides architectural context to guide file placement.

- **`index.html`**: The landing page, which immediately redirects to the main VTT application.
- **`/pages/Tangent-Matrix.html`**: The main HTML file for the VTT application.
- **`/css/tm-style.css`**: All CSS styles for the application.
- **`/js/`**: This directory contains all the JavaScript modules.
  - **`tm-app.js`**: The main application orchestrator. Orchestrates calls between the ui and other modules.
  - **`tm-ui.js`**: Manages all DOM interactions (`document.getElementById`, `addEventListener`, etc.). Contains functions like `showVTT`, `renderToken`, and `renderMessage`.
  - **`/utils/tm-dice.js`**: Utility functions, such as dice rolling logic.

3. Coding Standards

Module Format: Use ES6 Modules (import/export) for all JavaScript files.
Frameworks: PROHIBITED. Do not use React, Vue, jQuery, or any other UI framework.
Style: Use single quotes, no semicolons.
Patterns: Use functional patterns where possible. Avoid classes.
