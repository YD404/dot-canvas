import { appState } from './core/AppState.js';
import { globalEventBus } from './core/EventBus.js';
import { LayerManager } from './data/LayerManager.js';
import { historyManager } from './data/HistoryManager.js';
import { referenceImageManager } from './data/ReferenceImageManager.js';
import { projectFileManager } from './data/ProjectFileManager.js';
import { CanvasManager } from './canvas/CanvasManager.js';
import { BackgroundRenderer } from './canvas/BackgroundRenderer.js';
import { PixelRenderer } from './canvas/PixelRenderer.js';
import { OverlayRenderer } from './canvas/OverlayRenderer.js';
import { ToolManager } from './tools/ToolManager.js';
import { UIManager } from './ui/UIManager.js';

class Application {
    constructor() {
        this.hoverGridPos = null;
        this.toolPreviewData = null;
        this.renderRequested = false;
    }

    init() {
        // 1. Data Layer Manager
        this.layerManager = new LayerManager(appState.width, appState.height);

        // 2. History & Autosave setup
        historyManager.init(this.layerManager);
        projectFileManager.init(this.layerManager);

        // 3. Canvas Manager DOM & Events
        const container = document.getElementById('canvas-container');
        this.canvasManager = new CanvasManager(container);

        // 4. Tools Manager
        this.toolManager = new ToolManager(this.layerManager);

        // 5. UI Manager
        this.uiManager = new UIManager(this.layerManager);

        // 6. Global Render Listener
        globalEventBus.on('canvas:requestRender', () => this.requestRender());
        globalEventBus.on('history:restored', () => this.requestRender());
        globalEventBus.on('project:loaded', () => this.requestRender());
        globalEventBus.on('viewport:changed', () => this.requestRender());
        globalEventBus.on('refImage:changed', () => this.requestRender());
        globalEventBus.on('refImage:updated', () => this.requestRender());

        globalEventBus.on('canvas:sizeApplied', ({ width, height }) => {
            this.canvasManager.resizeCanvases(width, height);
            historyManager.clear();
            referenceImageManager.resetPosition();
            this.requestRender();
        });

        globalEventBus.on('tool:preview', (previewData) => {
            this.toolPreviewData = previewData;
            this.requestRender();
        });

        globalEventBus.on('pointer:move', (e) => {
            this.hoverGridPos = e;
            this.requestRender();
        });

        // 7. Load auto-saved project if available
        const loaded = projectFileManager.loadFromLocalStorage();
        if (!loaded) {
            this.requestRender();
        }

        console.log('DotCanvas initialized with Direct Screen-Space Reference Rendering & High-Res Overlays.');
    }

    requestRender() {
        if (this.renderRequested) return;
        this.renderRequested = true;
        requestAnimationFrame(() => {
            this.renderRequested = false;
            this.render();
        });
    }

    render() {
        if (!this.canvasManager || !this.layerManager) return;

        const width = appState.width;
        const height = appState.height;
        const zoom = this.canvasManager.zoom;
        const panX = this.canvasManager.panX;
        const panY = this.canvasManager.panY;

        // Render 0: Transparent checkerboard background
        BackgroundRenderer.render(this.canvasManager.bgCtx, width, height);

        // Render 1: Main pixel art image composited across all layers
        PixelRenderer.render(this.canvasManager.mainCtx, this.layerManager, width, height);

        // Render 2: Direct High-Res Screen-Space Reference Image
        referenceImageManager.render(
            this.canvasManager.refCtx,
            panX,
            panY,
            zoom
        );

        // Render 3: High-res Screen Overlay (Crisp 1px Grid lines, Brush cursor & active tool preview)
        OverlayRenderer.renderOverlay(
            this.canvasManager.overlayCtx,
            width,
            height,
            zoom,
            panX,
            panY,
            this.hoverGridPos,
            this.toolPreviewData
        );
    }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.init();
});
