// canvas.js - Manages all rendering and user interaction on the HTML5 canvas.

// Simple cache to prevent images from being reloaded on every render cycle.
const imageCache = new Map();

// --- State Variables ---
let canvas, context;
let eventCallback; // Callback to communicate with app.js

// Viewport state for panning and zooming
let view = {
    x: 0,
    y: 0,
    scale: 1.0
};

// Interaction state
let isDragging = false;
let isPanning = false;
let selectedTokenId = null;
let lastMousePosition = { x: 0, y: 0 };

// A local copy of the game state for smooth, immediate feedback during interactions.
let localGameState = { tokens: [] };

/**
 * Initializes the canvas manager.
 * @param {HTMLCanvasElement} canvasElement The canvas element from the DOM.
 * @param {Function} callback The function to call when an interaction happens (e.g., token moved).
 * @returns {{render: Function}} An object containing the render function.
 */
export function init(canvasElement, callback) {
    canvas = canvasElement;
    context = canvas.getContext('2d');
    eventCallback = callback;

    // Set canvas dimensions
    resizeCanvas();

    // Attach event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false }); // Prevent default scroll behavior

    return { render };
}

/**
 * Main render function. Clears and redraws the entire canvas based on the game state and viewport.
 * @param {object} gameState The current state of the game from Firebase.
 */
function render(gameState) {
    if (!context) return;

    // Update local state if we receive a new state from Firebase
    if (gameState) {
        localGameState = JSON.parse(JSON.stringify(gameState)); // Deep copy for local manipulation
    }

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Apply viewport transform
    context.save();
    context.translate(view.x, view.y);
    context.scale(view.scale, view.scale);

    // --- Draw the "world" (map and tokens) ---
    drawMap();
    drawTokens();
    // --- End "world" drawing ---

    context.restore();
}

// --- Drawing Helpers ---

function drawMap() {
    if (localGameState.mapUrl) {
        const mapImg = getImage(localGameState.mapUrl, () => render(null));
        if (mapImg.complete) {
            context.drawImage(mapImg, 0, 0);
        }
    }
}

function drawTokens() {
    (localGameState.tokens || []).forEach(token => {
        const tokenImg = getImage(token.img, () => render(null));
        if (tokenImg.complete) {
            // Draw the token centered on its x/y coordinates
            const size = (token.size || 1) * 100; // Example base size
            context.drawImage(tokenImg, token.x - size / 2, token.y - size / 2, size, size);
        }
    });
}

// --- Event Handlers ---

function onMouseDown(e) {
    lastMousePosition = { x: e.clientX, y: e.clientY };
    const worldPos = screenToWorld(lastMousePosition);

    // Check if a token was clicked (iterate backwards to select top-most token)
    const clickedToken = [...localGameState.tokens].reverse().find(token => {
        const size = (token.size || 1) * 100;
        return worldPos.x >= token.x - size / 2 && worldPos.x <= token.x + size / 2 &&
               worldPos.y >= token.y - size / 2 && worldPos.y <= token.y + size / 2;
    });

    if (clickedToken) {
        isDragging = true;
        selectedTokenId = clickedToken.id;
    } else {
        isPanning = true;
    }
}

function onMouseMove(e) {
    const newMousePosition = { x: e.clientX, y: e.clientY };
    const delta = {
        x: newMousePosition.x - lastMousePosition.x,
        y: newMousePosition.y - lastMousePosition.y
    };

    if (isDragging) {
        const token = localGameState.tokens.find(t => t.id === selectedTokenId);
        if (token) {
            token.x += delta.x / view.scale;
            token.y += delta.y / view.scale;
            render(null); // Render with local state for immediate feedback
        }
    } else if (isPanning) {
        view.x += delta.x;
        view.y += delta.y;
        render(null); // Re-render immediately
    }
    lastMousePosition = newMousePosition;
}

function onMouseUp(e) {
    if (isDragging) {
        eventCallback('tokenMove', { tokens: localGameState.tokens });
    }
    isDragging = false;
    isPanning = false;
    selectedTokenId = null;
}

function onWheel(e) {
    e.preventDefault(); // Prevent page scrolling

    const mousePos = { x: e.clientX, y: e.clientY };
    const worldPosBeforeZoom = screenToWorld(mousePos);

    // Calculate new scale
    const zoomFactor = 1.1;
    const newScale = e.deltaY > 0 ? view.scale / zoomFactor : view.scale * zoomFactor;
    // Clamp scale to reasonable limits
    view.scale = Math.max(0.1, Math.min(5, newScale));

    // Adjust view position to keep the world point under the cursor
    view.x = mousePos.x - worldPosBeforeZoom.x * view.scale;
    view.y = mousePos.y - worldPosBeforeZoom.y * view.scale;

    render(null);
}

// --- Utility Functions ---

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render(null);
}

function screenToWorld(screenPos) {
    return {
        x: (screenPos.x - view.x) / view.scale,
        y: (screenPos.y - view.y) / view.scale
    };
}

function getImage(url, onLoadCallback) {
    if (imageCache.has(url)) {
        return imageCache.get(url);
    }
    const img = new Image();
    img.src = url;
    img.onload = onLoadCallback;
    imageCache.set(url, img);
    return img;
}
