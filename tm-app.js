// app.js - Main application controller

import { init as initCanvas, draw as drawCanvas } from './tm-canvas.js';

// --- STATE ---
let selectedItem = null;

// --- DOM ELEMENT CACHE ---
const ui = {};

/**
 * Caches all the DOM elements needed for the application.
 */
function cacheDOMElements() {
    // User Name
    ui.userName = document.getElementById('user-name');

    // Canvas
    ui.canvasEl = document.getElementById('vtt-canvas');
    ui.canvasContainer = document.getElementById('canvas-container');

    // Map Controls
    ui.mapUpload = document.getElementById('map-upload');
    ui.clearMapButton = document.getElementById('clear-map');

    // Grid Controls
    ui.gridType = document.getElementById('grid-type');
    ui.gridSize = document.getElementById('grid-size');
    ui.gridColor = document.getElementById('grid-color');

    // Create Tools
    ui.addTokenButton = document.getElementById('add-token');
    ui.tokenNameInput = document.getElementById('token-name');
    ui.tokenColorInput = document.getElementById('token-color');
    ui.addTextButton = document.getElementById('add-text');
    ui.textContentInput = document.getElementById('text-content');

    // Dice Roller
    ui.diceInput = document.getElementById('dice-input');
    ui.rollDiceButton = document.getElementById('roll-dice');

    // Editor Panel
    ui.editorPanel = document.getElementById('editor-panel');

    // Token Editor
    ui.tokenEditor = document.getElementById('token-editor');
    ui.tokenNameEdit = document.getElementById('token-name-edit');
    ui.tokenColorEdit = document.getElementById('token-color-edit');
    ui.deleteTokenButton = document.getElementById('delete-token');

    // Text Editor
    ui.textEditor = document.getElementById('text-editor');
    ui.textContentEdit = document.getElementById('text-content-edit');
    ui.deleteTextButton = document.getElementById('delete-text');

    // Accordions
    ui.accordionHeaders = document.querySelectorAll('.collapsible-header');

    // Message Log
    ui.messageDisplay = document.getElementById('message-display');
    ui.messageInput = document.getElementById('message-input');
    ui.sendMessageButton = document.getElementById('send-message');
}

/**
 * Attaches all the event listeners for the application UI.
 */
function attachEventListeners() {
    // Accordions
    ui.accordionHeaders.forEach(clickedHeader => {
        clickedHeader.addEventListener('click', () => {
            const contentToShow = clickedHeader.nextElementSibling;
            const isAlreadyOpen = !contentToShow.classList.contains('hidden');

            // First, close all accordions
            ui.accordionHeaders.forEach(header => {
                header.nextElementSibling.classList.add('hidden');
                header.classList.add('collapsed');
            });

            // If the clicked one wasn't already open, open it.
            if (!isAlreadyOpen) {
                contentToShow.classList.remove('hidden');
                clickedHeader.classList.remove('collapsed');
            }
        });
    });


    // Map Layer
    ui.mapUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setMap(event.target.result);
        reader.readAsDataURL(file);
    });
    ui.clearMapButton.addEventListener('click', () => {
        setMap(null);
        ui.mapUpload.value = null; // Reset file input
    });

    // Grid Controls (these are read by canvas.js, but need to trigger redraw)
    ui.gridType.addEventListener('change', () => drawCanvas());
    ui.gridSize.addEventListener('input', () => drawCanvas());
    ui.gridColor.addEventListener('input', () => drawCanvas());


    // Create Tools
    ui.addTokenButton.addEventListener('click', () => {
        addToken({
            name: ui.tokenNameInput.value || 'Token',
            color: ui.tokenColorInput.value
        });
    });
    ui.addTextButton.addEventListener('click', () => {
        addText({ content: ui.textContentInput.value || 'Text' });
    });

    // Dice Roller
    ui.rollDiceButton.addEventListener('click', handleDiceRoll);

    // Editor Panel (driven by canvas selection events)
    ui.canvasEl.addEventListener('selectionchange', (e) => {
        selectedItem = e.detail;
        updateEditorUI();
    });

    // Token Editor Listeners
    ui.tokenNameEdit.addEventListener('input', (e) => updateSelectedItem({ name: e.target.value }));
    ui.tokenColorEdit.addEventListener('input', (e) => updateSelectedItem({ color: e.target.value }));
    ui.deleteTokenButton.addEventListener('click', () => {
        selectedItem = deleteSelectedItem();
        updateEditorUI();
    });

    // Text Editor Listeners
    ui.textContentEdit.addEventListener('input', (e) => updateSelectedItem({ content: e.target.value }));
    ui.deleteTextButton.addEventListener('click', () => {
        selectedItem = deleteSelectedItem();
        updateEditorUI();
    });

    // Message Log
    ui.sendMessageButton.addEventListener('click', handleSendMessage);
    ui.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
}

/**
 * Adds a formatted message to the message log.
 * @param {string} source - The source of the message (e.g., user name, "SYSTEM").
 * @param {string} message - The message content.
 */
function addMessageToLog(source, message) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const formattedMessage = `[${timestamp}] [${source}] ${message}`;

    const messageEl = document.createElement('div');
    messageEl.innerHTML = formattedMessage; // Use innerHTML to render the <s> tag from dice rolls
    ui.messageDisplay.appendChild(messageEl);

    // Scroll to the bottom
    ui.messageDisplay.scrollTop = ui.messageDisplay.scrollHeight;
}

/**
 * Handles sending a user message.
 */
function handleSendMessage() {
    const message = ui.messageInput.value.trim();
    if (message === '') return;

    const userName = ui.userName.value || 'Anonymous';
    addMessageToLog(userName, message);

    ui.messageInput.value = '';
    ui.messageInput.focus();
}


/**
 * Updates the editor panel based on the currently selected item.
 */
function updateEditorUI() {
    if (!selectedItem) {
        ui.editorPanel.classList.add('hidden');
        ui.tokenEditor.classList.add('hidden');
        ui.textEditor.classList.add('hidden');
        return;
    }

    ui.editorPanel.classList.remove('hidden');

    if (selectedItem.type === 'token') {
        ui.tokenEditor.classList.remove('hidden');
        ui.textEditor.classList.add('hidden');
        ui.tokenNameEdit.value = selectedItem.name;
        ui.tokenColorEdit.value = selectedItem.color;
    } else if (selectedItem.type === 'text') {
        ui.textEditor.classList.remove('hidden');
        ui.tokenEditor.classList.add('hidden');
        ui.textContentEdit.value = selectedItem.content;
    }
}

/**
 * Handles the logic for parsing and displaying dice roll results.
 */
function handleDiceRoll() {
    const notation = ui.diceInput.value;
    const result = parseDiceNotation(notation);

    if (result.error) {
        addMessageToLog('SYSTEM', `<span class="text-red-400">${result.error}</span>`);
    } else {
        addMessageToLog('SYSTEM', result.resultString);
    }
}

/**
 * Parses a dice notation string (e.g., "2d20kh1+5").
 * @param {string} notation - The dice notation string.
 * @returns {object} An object containing the result or an error.
 */
function parseDiceNotation(notation) {
    const diceRegex = /(\d+)?d(\d+)(k[hl]\d+)?([+-]\d+)?/i;
    const match = notation.trim().match(diceRegex);

    if (!match) {
        const numMatch = notation.trim().match(/^[+-]?\d+$/);
        if (numMatch) {
            const modifier = parseInt(notation.trim());
            return { total: modifier, resultString: `Total: ${modifier}` };
        }
        return { error: "Invalid notation" };
    }

    const numDice = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);
    const keep = match[3];
    const modifier = match[4] ? parseInt(match[4]) : 0;

    if (sides === 0) return { error: "Cannot roll a d0" };
    if (numDice > 100) return { error: "Max 100 dice" };

    let rolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * sides) + 1);

    let keptRolls = [...rolls];
    let droppedRolls = [];

    if (keep) {
        const keepType = keep.substring(0, 2).toLowerCase();
        const numToKeep = parseInt(keep.substring(2));

        if (numToKeep > numDice) return { error: "Cannot keep more dice than rolled" };

        const sortedRolls = [...rolls].sort((a, b) => a - b);

        if (keepType === 'kh') {
            keptRolls = sortedRolls.slice(-numToKeep);
            droppedRolls = sortedRolls.slice(0, numDice - numToKeep);
        } else if (keepType === 'kl') {
            keptRolls = sortedRolls.slice(0, numToKeep);
            droppedRolls = sortedRolls.slice(numToKeep);
        }
    }

    const total = keptRolls.reduce((sum, roll) => sum + roll, 0) + modifier;

    // Build result string
    let resultString = `Total: ${total}`;
    if (numDice > 1) {
        const allRollsStr = rolls.map(r =>
            keptRolls.includes(r) ? r : `<s>${r}</s>`
        ).join(', ');
        resultString += ` (Rolls: [${allRollsStr}])`;
    }
    if (modifier !== 0) {
        resultString += ` (Mod: ${modifier > 0 ? '+' : ''}${modifier})`;
    }

    return { total, resultString };
}

/**
 * Bundles canvas elements for passing to canvas.js.
 * @returns {object}
 */
function getCanvasElements() {
    return {
        canvasEl: ui.canvasEl,
        containerEl: ui.canvasContainer,
        gridControls: {
            type: ui.gridType,
            size: ui.gridSize,
            color: ui.gridColor
        }
    };
}


/**
 * Main entry point for the application.
 */
function main() {
    cacheDOMElements();
    attachEventListeners();
    initCanvas(getCanvasElements());
}

// --- Kick off the application ---
window.addEventListener('load', main);
