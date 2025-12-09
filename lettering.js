// Lettering Mode JavaScript
import { saveLettering, loadUserLetterings, getUserId } from './firebase-storage.js';

// ========================================
// CONFIGURATION
// ========================================
const SENTENCE = "Aujourd'hui, maman est morte. Ou peut-être hier.";

// ========================================
// STATE
// ========================================
let uniqueCharacters = [];
let currentCharacter = null;
let letterings = {}; // { char: imageDataURL } - current user's letterings
let userId = null; // Current user's unique ID
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'solid';
let brushSize = 5;
let pressure = 0.5;

// Canvas
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// ========================================
// INITIALIZATION
// ========================================
async function init() {
    // Get user ID
    userId = getUserId();
    console.log('User ID:', userId);

    // Extract unique alphabetic characters
    extractUniqueCharacters();

    // Load user's letterings from Firebase
    await loadLetteringsFromFirebase();

    // Render character list
    renderCharacterList();

    // Setup event listeners
    setupEventListeners();

    // Update progress
    updateProgress();

    // Setup canvas size and resize handlers
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 100);
    });

    // Use ResizeObserver for more accurate container size tracking
    if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        const container = document.querySelector('.canvas-container');
        if (container) {
            resizeObserver.observe(container);
        }
    }
}

async function loadLetteringsFromFirebase() {
    try {
        letterings = await loadUserLetterings();
        console.log(`Loaded ${Object.keys(letterings).length} letterings from Firebase`);
    } catch (error) {
        console.error('Error loading letterings from Firebase:', error);
        letterings = {};
    }
}

function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    if (!container || !container.offsetParent) return;

    const rect = container.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return;

    let currentImageData = null;
    if (currentCharacter && canvas.width > 0 && canvas.height > 0) {
        try {
            currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
            // Ignore if canvas is not ready
        }
    }

    canvas.width = rect.width;
    canvas.height = rect.height;

    if (currentImageData) {
        try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = currentImageData.width;
            tempCanvas.height = currentImageData.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(currentImageData, 0, 0);

            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        } catch (e) {
            loadCharacterDrawing();
        }
    } else if (currentCharacter) {
        loadCharacterDrawing();
    }
}

function extractUniqueCharacters() {
    const chars = new Set();
    for (let char of SENTENCE) {
        if (/[a-zA-ZÀ-ÿ]/.test(char)) {
            chars.add(char);
        }
    }
    uniqueCharacters = Array.from(chars).sort();
}

function renderCharacterList() {
    const listEl = document.getElementById('characterList');
    listEl.innerHTML = '';

    uniqueCharacters.forEach(char => {
        const item = document.createElement('div');
        item.className = 'character-item';
        if (letterings[char]) {
            item.classList.add('completed');
        }
        if (currentCharacter === char) {
            item.classList.add('active');
        }

        const charSpan = document.createElement('span');
        charSpan.textContent = char;

        const status = document.createElement('span');
        status.className = 'status';
        status.textContent = letterings[char] ? '✓' : '';

        item.appendChild(charSpan);
        item.appendChild(status);

        item.addEventListener('click', () => selectCharacter(char));

        listEl.appendChild(item);
    });
}

function selectCharacter(char) {
    currentCharacter = char;
    renderCharacterList();
    showWorkspace();
    loadCharacterDrawing();
}

function showWorkspace() {
    document.getElementById('noSelection').style.display = 'none';
    document.getElementById('workspaceContent').style.display = 'flex';
    document.getElementById('guideText').textContent = currentCharacter;

    setTimeout(() => resizeCanvas(), 0);
}

function loadCharacterDrawing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (letterings[currentCharacter]) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.onerror = (err) => {
            console.error(`Failed to load drawing for "${currentCharacter}":`, err);
            // Clear corrupted data
            delete letterings[currentCharacter];
            renderCharacterList();
            updateProgress();
        };
        img.src = letterings[currentCharacter];
    }
}

function updateProgress() {
    const completed = Object.keys(letterings).length;
    const total = uniqueCharacters.length;
    document.getElementById('progressText').textContent = `${completed}/${total} completed`;
}

function setupEventListeners() {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);

    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTool = e.target.dataset.tool;
        });
    });

    document.getElementById('sizeSlider').addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
    });

    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
    document.getElementById('saveBtn').addEventListener('click', saveAndNext);

    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'entry.html';
    });

    document.getElementById('toInteractionBtn').addEventListener('click', () => {
        window.location.href = 'interaction.html';
    });
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    lastX = (e.clientX - rect.left) * scaleX;
    lastY = (e.clientY - rect.top) * scaleY;
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (currentTool) {
        case 'solid':
            drawSolid(lastX, lastY, x, y);
            break;
        case 'pressure':
            drawPressure(lastX, lastY, x, y);
            break;
        case 'dot':
            drawDot(x, y);
            break;
        case 'eraser':
            drawEraser(lastX, lastY, x, y);
            break;
    }

    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    isDrawing = true;
    lastX = (touch.clientX - rect.left) * scaleX;
    lastY = (touch.clientY - rect.top) * scaleY;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;

    const touch = e.touches[0];
    draw({ clientX: touch.clientX, clientY: touch.clientY });
}

function drawSolid(x1, y1, x2, y2) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = 'source-over';

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawPressure(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = distance;

    const pressureFactor = Math.max(0.3, 1 - (speed / 30));
    const size = brushSize * pressureFactor;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size;
    ctx.globalAlpha = 0.7 + (pressureFactor * 0.3);
    ctx.globalCompositeOperation = 'source-over';

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.globalAlpha = 1.0;
}

function drawDot(x, y) {
    ctx.fillStyle = '#ffffff';
    ctx.globalCompositeOperation = 'source-over';

    const dotSize = brushSize / 3;
    for (let i = 0; i < 3; i++) {
        const offsetX = (Math.random() - 0.5) * brushSize;
        const offsetY = (Math.random() - 0.5) * brushSize;
        ctx.fillRect(x + offsetX, y + offsetY, dotSize, dotSize);
    }
}

function drawEraser(x1, y1, x2, y2) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = brushSize * 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
}

function clearCanvas() {
    if (confirm('Clear this drawing?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

async function saveAndNext() {
    // Validate that user has drawn something
    if (!currentCharacter) {
        alert('Please select a character to save.');
        return;
    }

    // Check if canvas is empty (has any non-transparent pixels)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let hasDrawing = false;

    for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 0) { // Check alpha channel
            hasDrawing = true;
            break;
        }
    }

    if (!hasDrawing) {
        const confirm = window.confirm('The canvas appears empty. Save anyway?');
        if (!confirm) return;
    }

    try {
        // Save current drawing
        const dataURL = canvas.toDataURL('image/png');
        letterings[currentCharacter] = dataURL;

        // Save to Firebase
        await saveLettering(currentCharacter, dataURL);
        console.log(`Saved "${currentCharacter}" to Firebase`);

        // Update UI
        renderCharacterList();
        updateProgress();

        // Move to next unfinished character
        const nextChar = findNextUnfinishedCharacter();
        if (nextChar) {
            selectCharacter(nextChar);
        } else {
            alert('All characters completed! You can now proceed to Interaction mode.');
        }
    } catch (error) {
        console.error('Error saving to Firebase:', error);

        // More specific error messages
        if (error.message && error.message.includes('Firebase')) {
            alert('Failed to save to Firebase. Please check your Firebase configuration.');
        } else if (!navigator.onLine) {
            alert('No internet connection. Please check your network and try again.');
        } else {
            alert('Failed to save. Error: ' + error.message);
        }

        // Keep the drawing even if save failed
        console.log('Drawing preserved in memory, you can try saving again');
    }
}

function findNextUnfinishedCharacter() {
    const currentIndex = uniqueCharacters.indexOf(currentCharacter);
    for (let i = currentIndex + 1; i < uniqueCharacters.length; i++) {
        if (!letterings[uniqueCharacters[i]]) {
            return uniqueCharacters[i];
        }
    }
    for (let i = 0; i < currentIndex; i++) {
        if (!letterings[uniqueCharacters[i]]) {
            return uniqueCharacters[i];
        }
    }
    return null;
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
