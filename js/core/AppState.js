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
        this.palette = [
            '#000000', '#FFFFFF', '#737373', '#D4D4D4',
            '#EF4444', '#F97316', '#F59E0B', '#10B981',
            '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
        ];
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
