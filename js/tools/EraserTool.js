import { BaseTool } from './BaseTool.js';
import { historyManager } from '../data/HistoryManager.js';

export class EraserTool extends BaseTool {
    constructor() {
        super('eraser');
    }

    onPointerDown(e, layerManager, appState) {
        if (e.outOfBounds) return;
        historyManager.saveState();
        this.isDrawing = true;
        this.lastGridPos = { x: e.gridX, y: e.gridY };
        this.erasePoint(e.gridX, e.gridY, layerManager, appState);
    }

    onPointerMove(e, layerManager, appState) {
        if (!this.isDrawing) return;
        if (this.lastGridPos && (this.lastGridPos.x !== e.gridX || this.lastGridPos.y !== e.gridY)) {
            const line = this.getLinePixels(this.lastGridPos.x, this.lastGridPos.y, e.gridX, e.gridY);
            for (const pt of line) {
                this.erasePoint(pt.x, pt.y, layerManager, appState);
            }
            this.lastGridPos = { x: e.gridX, y: e.gridY };
        }
    }

    onPointerUp() {
        this.isDrawing = false;
        this.lastGridPos = null;
    }

    erasePoint(x, y, layerManager, appState) {
        const layer = layerManager.getActiveLayer();
        if (!layer || !layer.visible || layer.locked) return;

        const brushPts = this.getBrushPixels(x, y, appState.brushSize);
        for (const pt of brushPts) {
            layer.setPixel(pt.x, pt.y, 0, 0, 0, 0); // Clear to transparent
        }
    }
}
