import { globalEventBus } from './EventBus.js';

/**
 * AppState - Central State Management
 */
export class AppState {
    constructor() {
        this.width = 32;
        this.height = 32;
        this.activeTool = 'pen';
        this.activeTab = 'layers';
        this.primaryColor = '#000000';
        this.brushSize = 1;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.showGrid = true;
        this.backgroundColor = 'transparent'; // 'transparent' (checkerboard) or HEX color string
        this.palette = [];
        this.colorHistory = [];
    }

    addColorHistory(hex) {
        if (!hex || hex === 'transparent') return;
        const formatted = hex.toUpperCase();
        // Remove existing occurrence if any
        this.colorHistory = this.colorHistory.filter(c => c !== formatted);
        // Prepend new color
        this.colorHistory.unshift(formatted);
        // Limit to max 12 colors
        if (this.colorHistory.length > 12) {
            this.colorHistory = this.colorHistory.slice(0, 12);
        }
        globalEventBus.emit('state:colorHistoryChanged', this.colorHistory);
    }

    setBackgroundColor(color) {
        if (this.backgroundColor === color) return;
        this.backgroundColor = color;
        globalEventBus.emit('state:bgColorChanged', this.backgroundColor);
    }

    setCanvasSize(width, height) {
        if (this.width === width && this.height === height) return;
        this.width = width;
        this.height = height;
        globalEventBus.emit('state:canvasSizeChanged', { width, height });
    }

    setActiveTool(toolName) {
        if (this.activeTool === toolName) return;
        this.activeTool = toolName;
        globalEventBus.emit('state:toolChanged', toolName);
    }

    setActiveTab(tabName) {
        if (this.activeTab === tabName) return;
        this.activeTab = tabName;
        globalEventBus.emit('state:tabChanged', tabName);
    }

    setPrimaryColor(hex) {
        if (this.primaryColor === hex) return;
        this.primaryColor = hex.toUpperCase();
        globalEventBus.emit('state:colorChanged', this.primaryColor);
    }

    setBrushSize(size) {
        const clampedSize = Math.max(1, Math.min(100, parseInt(size, 10) || 1));
        if (this.brushSize === clampedSize) return;
        this.brushSize = clampedSize;
        globalEventBus.emit('state:brushSizeChanged', this.brushSize);
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        globalEventBus.emit('state:gridToggled', this.showGrid);
    }

    addSwatch(hex) {
        const formatted = hex.toUpperCase();
        if (!this.palette.includes(formatted)) {
            this.palette.push(formatted);
            globalEventBus.emit('state:paletteChanged', this.palette);
        }
    }

    removeSwatch(hex) {
        this.palette = this.palette.filter(c => c !== hex);
        globalEventBus.emit('state:paletteChanged', this.palette);
    }
}

export const appState = new AppState();
