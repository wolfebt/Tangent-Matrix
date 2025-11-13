// canvas.js - Manages all rendering and user interaction on the HTML5 canvas.

// --- State Management ---
let canvas, ctx, canvasContainer;
let mapImage = null;
let tokens = []; // Token Layer
let texts = [];  // Text Layer

let selectedItem = null; // Can be a token or text object
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// View and Pan/Zoom state
let view = { zoom: 1, offsetX: 0, offsetY: 0 };
let isPanning = false;
let panStart = { x: 0, y: 0 };

let mapGrid = {}; // Holds the grid definition
let baseHexSize = 50; // Default hex size

// --- UI Elements (passed in from app.js) ---
let gridTypeSelect, gridSizeInput, gridColorInput;

// --- CORE INIT FUNCTION ---
/**
 * Initializes the canvas manager.
 * @param {object} elements - An object containing DOM elements.
 * @param {HTMLCanvasElement} elements.canvasEl - The canvas element from the DOM.
 * @param {HTMLElement} elements.containerEl - The container of the canvas element.
 * @param {object} elements.gridControls - An object with grid control elements.
 */
export function init(elements) {
    canvas = elements.canvasEl;
    ctx = canvas.getContext('2d');
    canvasContainer = elements.containerEl;

    // Assign grid controls from app.js
    gridTypeSelect = elements.gridControls.type;
    gridSizeInput = elements.gridControls.size;
    gridColorInput = elements.gridControls.color;

    // Attach canvas-specific event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseout', onMouseOut);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Initial setup
    baseHexSize = parseInt(gridSizeInput.value) || 50;
    resizeCanvas();
}


// --- EXPORTED API FOR APP.JS ---

/**
 * Sets the background map image for the canvas.
 * @param {string | null} imageUrl - The URL of the image to load, or null to clear it.
 */
export function setMap(imageUrl) {
    if (!imageUrl) {
        mapImage = null;
        draw();
        return;
    }
    mapImage = new Image();
    mapImage.onload = () => draw();
    mapImage.src = imageUrl;
}

/**
 * Adds a new token object to the token layer.
 * @param {object} tokenData - The properties of the new token.
 */
export function addToken(tokenData) {
    const worldX = (canvas.width / 2 - view.offsetX) / view.zoom;
    const worldY = (canvas.height / 2 - view.offsetY) / view.zoom;

    const newToken = {
        id: Date.now(),
        type: 'token',
        x: worldX,
        y: worldY,
        radius: 30,
        color: tokenData.color,
        name: tokenData.name,
    };
    tokens.push(newToken);
    draw();
}

/**
 * Adds a new text object to the text layer.
 * @param {object} textData - The properties of the new text object.
 */
export function addText(textData) {
    const worldX = (canvas.width / 2 - view.offsetX) / view.zoom;
    const worldY = (canvas.height / 2 - view.offsetY) / view.zoom;

    const newText = {
        id: Date.now(),
        type: 'text',
        x: worldX,
        y: worldY,
        content: textData.content,
        width: 0, // Will be calculated on draw
        height: 0 // Will be calculated on draw
    };
    texts.push(newText);
    draw();
}

/**
 * Updates the properties of the currently selected item.
 * @param {object} props - An object with properties to update.
 */
export function updateSelectedItem(props) {
    if (!selectedItem) return;
    Object.assign(selectedItem, props);
    draw();
}

/**
 * Deletes the currently selected item from its layer.
 * @returns {null} Returns null to signify no item is selected.
 */
export function deleteSelectedItem() {
    if (!selectedItem) return null;

    if (selectedItem.type === 'token') {
        tokens = tokens.filter(t => t.id !== selectedItem.id);
    } else if (selectedItem.type === 'text') {
        texts = texts.filter(t => t.id !== selectedItem.id);
    }

    selectedItem = null;
    draw();
    return null;
}

// --- CORE RENDER FUNCTION ---
export function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Pan & Zoom
    ctx.save();
    ctx.translate(view.offsetX, view.offsetY);
    ctx.scale(view.zoom, view.zoom);

    // Layer 1: Background (Map)
    if (mapImage) {
        const worldWidth = canvas.width / view.zoom;
        const worldHeight = canvas.height / view.zoom;
        ctx.drawImage(mapImage, 0, 0, worldWidth, worldHeight);
    }

    // Layer 2: Grid
    drawGrid();

    // Layer 3: Tokens
    tokens.forEach(token => {
        ctx.beginPath();
        ctx.arc(token.x, token.y, token.radius, 0, Math.PI * 2);
        ctx.fillStyle = token.color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 / view.zoom;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3 / view.zoom;
        ctx.font = `${16 / view.zoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.strokeText(token.name, token.x, token.y + token.radius + (20 / view.zoom));
        ctx.fillText(token.name, token.x, token.y + token.radius + (20 / view.zoom));
    });

    // Layer 4: Text
    texts.forEach(text => {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4 / view.zoom;
        const fontSize = 24;
        ctx.font = `${fontSize / view.zoom}px Inter`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.strokeText(text.content, text.x, text.y);
        ctx.fillText(text.content, text.x, text.y);
    });

    // Layer 5: Selection Highlight
    if (selectedItem) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3 / view.zoom;
        ctx.setLineDash([10 / view.zoom, 5 / view.zoom]);

        if (selectedItem.type === 'token') {
            const r = selectedItem.radius + (5 / view.zoom);
            ctx.strokeRect(selectedItem.x - r, selectedItem.y - r, r * 2, r * 2);
        } else if (selectedItem.type === 'text') {
            const padding = 5 / view.zoom;
            ctx.font = `${24 / view.zoom}px Inter`;
            const metrics = ctx.measureText(selectedItem.content);
            const w = metrics.width;
            const h = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
            ctx.strokeRect(selectedItem.x - padding, selectedItem.y - padding, w + padding * 2, h + padding * 2);
        }
        ctx.setLineDash([]);
    }

    ctx.restore();
}

// --- GRID DRAWING LOGIC ---
function hexToPixel(q, r, size) {
    const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    const y = size * (3 / 2 * r);
    return { x, y };
}

function getHexCorner(center, size, i) {
    const angle_deg = 60 * i + 30;
    const angle_rad = Math.PI / 180 * angle_deg;
    return {
        x: center.x + size * Math.cos(angle_rad),
        y: center.y + size * Math.sin(angle_rad)
    };
}

function drawGraphGrid(size) {
    const xStart = -view.offsetX / view.zoom;
    const yStart = -view.offsetY / view.zoom;
    const xEnd = (canvas.width - view.offsetX) / view.zoom;
    const yEnd = (canvas.height - view.offsetY) / view.zoom;

    const firstCol = Math.floor(xStart / size) * size;
    const firstRow = Math.floor(yStart / size) * size;

    ctx.beginPath();
    for (let x = firstCol; x <= xEnd; x += size) {
        ctx.moveTo(x, yStart);
        ctx.lineTo(x, yEnd);
    }
    for (let y = firstRow; y <= yEnd; y += size) {
        ctx.moveTo(xStart, y);
        ctx.lineTo(xEnd, y);
    }
    ctx.stroke();
}

function generateHexGridDefinition(canvasWidth, canvasHeight, size) {
    mapGrid = {};
    if (size <= 0) return;

    const hexWidth = Math.sqrt(3) * size;
    const hexHeight = 2 * size;
    const worldWidth = canvasWidth / view.zoom;
    const worldHeight = canvasHeight / view.zoom;

    const rows = Math.ceil(worldHeight / (hexHeight * 0.75)) + 2;
    const cols = Math.ceil(worldWidth / hexWidth) + 2;

    const startRow = -Math.floor(rows / 2);
    const endRow = Math.ceil(rows / 2);
    const startCol = -Math.floor(cols / 2);
    const endCol = Math.ceil(cols / 2);

    for (let r = startRow; r < endRow; r++) {
        for (let q = startCol; q < endCol; q++) {
            mapGrid[`${q},${r}`] = true;
        }
    }
}

function drawGrid() {
    const gridType = gridTypeSelect.value;
    const gridSize = parseInt(gridSizeInput.value);
    if (gridType === 'none' || isNaN(gridSize) || gridSize <= 0) {
        return;
    }

    if (gridType === 'hex' && baseHexSize !== gridSize) {
        baseHexSize = gridSize;
        generateHexGridDefinition(canvas.width, canvas.height, baseHexSize);
    }

    ctx.strokeStyle = gridColorInput.value;
    ctx.lineWidth = 1 / view.zoom;
    ctx.globalAlpha = 0.5;

    if (gridType === 'graph') {
        drawGraphGrid(gridSize);
    } else if (gridType === 'hex') {
        const xStart = -view.offsetX / view.zoom;
        const yStart = -view.offsetY / view.zoom;
        const xEnd = (canvas.width - view.offsetX) / view.zoom;
        const yEnd = (canvas.height - view.offsetY) / view.zoom;
        const buffer = baseHexSize * 2;

        ctx.beginPath();
        for (const key in mapGrid) {
            const [q, r] = key.split(',').map(Number);
            const { x, y } = hexToPixel(q, r, baseHexSize);

            if (x >= xStart - buffer && x <= xEnd + buffer && y >= yStart - buffer && y <= yEnd + buffer) {
                for (let i = 0; i < 6; i++) {
                    const corner = getHexCorner({x, y}, baseHexSize, i);
                    if (i === 0) ctx.moveTo(corner.x, corner.y);
                    else ctx.lineTo(corner.x, corner.y);
                }
                ctx.closePath();
            }
        }
        ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
}

// --- CANVAS MOUSE HANDLERS ---
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    return {
        x: (mouseX - view.offsetX) / view.zoom,
        y: (mouseY - view.offsetY) / view.zoom
    };
}

function isMouseOverToken(token, x, y) {
    const dist = Math.hypot(x - token.x, y - token.y);
    return dist < token.radius;
}

function isMouseOverText(text, x, y) {
    const font = `${24 / view.zoom}px Inter`;
    ctx.font = font;
    const metrics = ctx.measureText(text.content);
    const w = metrics.width;
    const h = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
    return (x >= text.x && x <= text.x + w && y >= text.y && y <= text.y + h);
}

function onMouseDown(e) {
    if (e.button === 2) { // Right-click for Panning
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        return;
    }

    if (e.button === 0) { // Left-click for Selection/Dragging
        const { x, y } = getMousePos(e);
        let clickedItem = null;

        // Check text layer first (top-most)
        for (let i = texts.length - 1; i >= 0; i--) {
            if (isMouseOverText(texts[i], x, y)) {
                clickedItem = texts[i];
                break;
            }
        }
        // Then check token layer
        if (!clickedItem) {
            for (let i = tokens.length - 1; i >= 0; i--) {
                if (isMouseOverToken(tokens[i], x, y)) {
                    clickedItem = tokens[i];
                    break;
                }
            }
        }

        selectedItem = clickedItem;
        if (selectedItem) {
            isDragging = true;
            dragOffsetX = x - selectedItem.x;
            dragOffsetY = y - selectedItem.y;
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'default';
        }

        // Notify app.js of the selection change
        canvas.dispatchEvent(new CustomEvent('selectionchange', { detail: selectedItem }));
        draw();
    }
}

function onMouseMove(e) {
    if (isPanning) {
        view.offsetX += e.clientX - panStart.x;
        view.offsetY += e.clientY - panStart.y;
        panStart = { x: e.clientX, y: e.clientY };
        draw();
        return;
    }

    if (isDragging && selectedItem) {
        const { x, y } = getMousePos(e);
        selectedItem.x = x - dragOffsetX;
        selectedItem.y = y - dragOffsetY;
        draw();
    }
}

function onMouseUp(e) {
    if (e.button === 2) isPanning = false;
    if (e.button === 0) isDragging = false;
    canvas.style.cursor = 'default';
}

function onMouseOut() {
    isPanning = false;
    isDragging = false;
    canvas.style.cursor = 'default';
}

function onWheel(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - view.offsetX) / view.zoom;
    const worldY = (mouseY - view.offsetY) / view.zoom;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(5, view.zoom * zoomFactor));

    view.offsetX = mouseX - worldX * newZoom;
    view.offsetY = mouseY - worldY * newZoom;
    view.zoom = newZoom;

    draw();
}

// --- UTILITY FUNCTIONS ---
function resizeCanvas() {
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
    generateHexGridDefinition(canvas.width, canvas.height, baseHexSize);
    draw();
}
