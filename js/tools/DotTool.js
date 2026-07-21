import { BaseTool } from './BaseTool.js';
import { historyManager } from '../data/HistoryManager.js';

/**
 * DotTool - Single dot/pixel placement tool.
 * Draws only on initial pointer down, ignores dragging across grid.
 */
export class DotTool extends BaseTool {
    constructor() {
        super('dot');
    }

    onPointerDown(e, layerManager, appState) {
        if (e.outOfBounds) return;
        historyManager.saveState();
        this.drawPoint(e.gridX, e.gridY, layerManager, appState);
    }

    onPointerMove(e, layerManager, appState) {
        // Explicitly ignore move events so dragging does not draw continuous lines
    }

    onPointerUp() {
        // No special state cleanup needed
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
