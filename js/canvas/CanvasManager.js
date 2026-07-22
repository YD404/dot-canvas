import { globalEventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';

/**
 * CanvasManager - Handles multi-layer DOM canvases, high-res screen overlays & pan/zoom viewports
 */
export class CanvasManager {
    constructor(containerEl) {
        this.container = containerEl;

        // Viewport transform
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;

        // Elements
        this.bgCanvas = null;
        this.mainCanvas = null;
        this.refCanvas = null;
        this.overlayCanvas = null;

        // Contexts
        this.bgCtx = null;
        this.mainCtx = null;
        this.refCtx = null;
        this.overlayCtx = null;

        // Pointer & Gesture tracking
        this.activePointers = new Map();
        this.initialPinchDist = 0;
        this.initialZoom = 1;
        this.isPanning = false;
        this.lastPanPos = { x: 0, y: 0 };

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.container.innerHTML = '';

        // Wrapper for CSS transforms (pan/zoom)
        this.viewportEl = document.createElement('div');
        this.viewportEl.className = 'absolute origin-top-left transition-none will-change-transform';
        this.viewportEl.style.transform = 'translate3d(0px, 0px, 0px) scale(1)';

        // 1. Bottom-most: Checkerboard Background Canvas (scaled with viewport)
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.className = 'absolute top-0 left-0 canvas-pixelated pointer-events-none';
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.bgCtx.imageSmoothingEnabled = false;

        // 2. Middle: Main Composited Pixel Art Canvas (scaled with viewport)
        this.mainCanvas = document.createElement('canvas');
        this.mainCanvas.className = 'absolute top-0 left-0 canvas-pixelated pointer-events-none';
        this.mainCtx = this.mainCanvas.getContext('2d', { willReadFrequently: true });
        this.mainCtx.imageSmoothingEnabled = false;

        // Append canvas layers to viewport
        this.viewportEl.appendChild(this.bgCanvas);
        this.viewportEl.appendChild(this.mainCanvas);
        this.container.appendChild(this.viewportEl);

        // 3. Screen Canvas for High-Res Reference Image (Direct child of container, NOT scaled by CSS!)
        this.refCanvas = document.createElement('canvas');
        this.refCanvas.className = 'absolute top-0 left-0 w-full h-full pointer-events-none z-5';
        this.refCtx = this.refCanvas.getContext('2d');
        this.container.appendChild(this.refCanvas);

        // 4. Top-most: High-Res Screen Canvas for Grid & Cursor Overlay (Direct child of container, NOT scaled!)
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.className = 'absolute top-0 left-0 w-full h-full pointer-events-none z-10';
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.container.appendChild(this.overlayCanvas);

        this.resizeCanvases(appState.width, appState.height);
        this.centerCanvas();
    }

    resizeCanvases(width, height) {
        [this.bgCanvas, this.mainCanvas].forEach(c => {
            c.width = width;
            c.height = height;
        });

        // Ensure crisp pixel rendering on resize
        if (this.bgCtx) this.bgCtx.imageSmoothingEnabled = false;
        if (this.mainCtx) this.mainCtx.imageSmoothingEnabled = false;

        this.viewportEl.style.width = `${width}px`;
        this.viewportEl.style.height = `${height}px`;

        this.resizeOverlayScreen();
        this.centerCanvas();
    }

    resizeOverlayScreen() {
        const rect = this.container.getBoundingClientRect();
        if (rect.width && rect.height) {
            this.refCanvas.width = rect.width;
            this.refCanvas.height = rect.height;
            this.overlayCanvas.width = rect.width;
            this.overlayCanvas.height = rect.height;
        }
    }

    toggleZoomFitCenter() {
        const containerRect = this.container.getBoundingClientRect();
        if (!containerRect.width || !containerRect.height) return;

        this.resizeOverlayScreen();

        const padding = 60;
        const scaleX = (containerRect.width - padding) / appState.width;
        const scaleY = (containerRect.height - padding) / appState.height;
        const fitZoom = Math.max(1, Math.min(64, Math.floor(Math.min(scaleX, scaleY))));

        if (this.zoom === fitZoom) {
            this.zoom = 1;
        } else {
            this.zoom = fitZoom;
        }

        this.panX = Math.round((containerRect.width - appState.width * this.zoom) / 2);
        this.panY = Math.round((containerRect.height - appState.height * this.zoom) / 2);

        this.updateTransform();
    }

    centerCanvas() {
        const containerRect = this.container.getBoundingClientRect();
        if (!containerRect.width || !containerRect.height) return;

        this.resizeOverlayScreen();

        // Auto zoom to fit nicely in viewport
        const padding = 60;
        const scaleX = (containerRect.width - padding) / appState.width;
        const scaleY = (containerRect.height - padding) / appState.height;
        this.zoom = Math.max(1, Math.min(64, Math.floor(Math.min(scaleX, scaleY))));

        this.panX = Math.round((containerRect.width - appState.width * this.zoom) / 2);
        this.panY = Math.round((containerRect.height - appState.height * this.zoom) / 2);

        this.updateTransform();
    }

    updateTransform() {
        this.viewportEl.style.transform = `translate3d(${this.panX}px, ${this.panY}px, 0px) scale(${this.zoom})`;
        appState.zoom = this.zoom;
        appState.panX = this.panX;
        appState.panY = this.panY;
        globalEventBus.emit('viewport:changed', { zoom: this.zoom, panX: this.panX, panY: this.panY });
    }

    // Convert Screen (PointerEvent) coordinates to Grid (Pixel) coordinates
    screenToGridCoords(clientX, clientY) {
        const rect = this.container.getBoundingClientRect();
        const screenX = clientX - rect.left - this.panX;
        const screenY = clientY - rect.top - this.panY;

        const gridX = Math.floor(screenX / this.zoom);
        const gridY = Math.floor(screenY / this.zoom);

        return {
            x: gridX,
            y: gridY,
            outOfBounds: gridX < 0 || gridX >= appState.width || gridY < 0 || gridY >= appState.height
        };
    }

    bindEvents() {
        // Window Resize
        window.addEventListener('resize', () => this.centerCanvas());

        // Container Pointer Events (Handles Pencil & Touch)
        const el = this.container;

        el.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        el.addEventListener('pointermove', (e) => this.onPointerMove(e));
        el.addEventListener('pointerup', (e) => this.onPointerUp(e));
        el.addEventListener('pointercancel', (e) => this.onPointerUp(e));

        // Pinch Zoom via Wheel (Allowed ONLY when hand tool is active)
        el.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (appState.activeTool === 'hand') {
                const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
                this.setZoomAtPoint(this.zoom * zoomFactor, e.clientX, e.clientY);
            }
        }, { passive: false });

        globalEventBus.on('canvas:panBy', ({ dx, dy }) => this.panBy(dx, dy));
    }

    panBy(dx, dy) {
        this.panX += dx;
        this.panY += dy;
        this.updateTransform();
    }

    setZoomAtPoint(targetZoom, clientX, clientY) {
        const newZoom = Math.max(1, Math.min(128, Math.round(targetZoom * 10) / 10));
        if (newZoom === this.zoom) return;

        const rect = this.container.getBoundingClientRect();
        const cursorX = clientX - rect.left;
        const cursorY = clientY - rect.top;

        // Zoom relative to cursor point
        this.panX = cursorX - (cursorX - this.panX) * (newZoom / this.zoom);
        this.panY = cursorY - (cursorY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;

        this.updateTransform();
    }

    onPointerDown(e) {
        e.preventDefault();
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pointerType: e.pointerType });

        // Two-finger touch gesture for Pan / Pinch-Zoom (Allowed ONLY when Hand tool is active)
        if (appState.activeTool === 'hand' && this.activePointers.size === 2) {
            this.isPanning = true;
            const pts = Array.from(this.activePointers.values());
            this.initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            this.initialZoom = this.zoom;
            this.lastPanPos = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
            return;
        }

        // Single Pointer (Pencil or Finger drawing)
        if (this.activePointers.size === 1) {
            const coords = this.screenToGridCoords(e.clientX, e.clientY);
            globalEventBus.emit('pointer:down', {
                gridX: coords.x,
                gridY: coords.y,
                pointerType: e.pointerType,
                pressure: e.pressure || 0.5,
                outOfBounds: coords.outOfBounds,
                originalEvent: e
            });
        }
    }

    onPointerMove(e) {
        if (this.activePointers.has(e.pointerId)) {
            this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pointerType: e.pointerType });
        }

        // Handle Two-Finger Pinch Zoom (Allowed ONLY when Hand tool is active)
        if (appState.activeTool === 'hand' && this.isPanning && this.activePointers.size === 2) {
            const pts = Array.from(this.activePointers.values());
            const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            const centerPos = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

            // Pinch zoom delta
            if (this.initialPinchDist > 0) {
                const scale = currentDist / this.initialPinchDist;
                this.setZoomAtPoint(this.initialZoom * scale, centerPos.x, centerPos.y);
            }
            return;
        }

        // Single Pointer Move (Drawing or Hover)
        const coords = this.screenToGridCoords(e.clientX, e.clientY);
        globalEventBus.emit('pointer:move', {
            gridX: coords.x,
            gridY: coords.y,
            pointerType: e.pointerType,
            pressure: e.pressure || 0.5,
            outOfBounds: coords.outOfBounds,
            originalEvent: e
        });
    }

    onPointerUp(e) {
        this.activePointers.delete(e.pointerId);

        if (this.activePointers.size < 2) {
            this.isPanning = false;
        }

        if (this.activePointers.size === 0) {
            this.isPanning = false;
            const coords = this.screenToGridCoords(e.clientX, e.clientY);
            globalEventBus.emit('pointer:up', {
                gridX: coords.x,
                gridY: coords.y,
                pointerType: e.pointerType,
                originalEvent: e
            });
        }
    }
}
