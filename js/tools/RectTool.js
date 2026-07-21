import { BaseTool } from './BaseTool.js';
import { historyManager } from '../data/HistoryManager.js';
import { globalEventBus } from '../core/EventBus.js';

export class RectTool extends BaseTool {
    constructor() {
        super('rect');
        this.startPos = null;
    }

    onPointerDown(e) {
        if (e.outOfBounds) return;
        this.isDrawing = true;
        this.startPos = { x: e.gridX, y: e.gridY };
    }

    getRectPixels(x0, y0, x1, y1) {
        const pixels = [];
        const minX = Math.min(x0, x1);
        const maxX = Math.max(x0, x1);
        const minY = Math.min(y0, y1);
        const maxY = Math.max(y0, y1);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                // Outline rect
                if (x === minX || x === maxX || y === minY || y === maxY) {
                    pixels.push({ x, y });
                }
            }
        }
        return pixels;
    }

    onPointerMove(e, layerManager, appState) {
        if (!this.isDrawing || !this.startPos) return;

        const pixels = this.getRectPixels(this.startPos.x, this.startPos.y, e.gridX, e.gridY);
        globalEventBus.emit('tool:preview', {
            color: appState.primaryColor,
            pixels
        });
    }

    onPointerUp(e, layerManager, appState) {
        if (!this.isDrawing || !this.startPos) return;

        historyManager.saveState();
        const layer = layerManager.getActiveLayer();
        if (layer && layer.visible && !layer.locked) {
            const pixels = this.getRectPixels(this.startPos.x, this.startPos.y, e.gridX, e.gridY);
            const [r, g, b, a] = this.hexToRGBA(appState.primaryColor);

            for (const pt of pixels) {
                layer.setPixel(pt.x, pt.y, r, g, b, a);
            }
        }

        this.isDrawing = false;
        this.startPos = null;
        globalEventBus.emit('tool:preview', null);
    }
}
