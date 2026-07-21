import { BaseTool } from './BaseTool.js';
import { historyManager } from '../data/HistoryManager.js';

export class PenTool extends BaseTool {
    constructor() {
        super('pen');
    }

    onPointerDown(e, layerManager, appState) {
        if (e.outOfBounds) return;
        historyManager.saveState();
        this.isDrawing = true;
        this.lastGridPos = { x: e.gridX, y: e.gridY };
        this.drawPoint(e.gridX, e.gridY, layerManager, appState);
    }

    onPointerMove(e, layerManager, appState) {
        if (!this.isDrawing) return;
        if (this.lastGridPos && (this.lastGridPos.x !== e.gridX || this.lastGridPos.y !== e.gridY)) {
            const line = this.getLinePixels(this.lastGridPos.x, this.lastGridPos.y, e.gridX, e.gridY);
            for (const pt of line) {
                this.drawPoint(pt.x, pt.y, layerManager, appState);
            }
            this.lastGridPos = { x: e.gridX, y: e.gridY };
        }
    }

    onPointerUp() {
        this.isDrawing = false;
        this.lastGridPos = null;
    }

    drawPoint(x, y, layerManager, appState) {
        const layer = layerManager.getActiveLayer();
        if (!layer || !layer.visible || layer.locked) return;

        const [r, g, b, a] = this.hexToRGBA(appState.primaryColor);
        const brushPts = this.getBrushPixels(x, y, appState.brushSize);

        for (const pt of brushPts) {
            layer.setPixel(pt.x, pt.y, r, g, b, a);
        }
    }
}
