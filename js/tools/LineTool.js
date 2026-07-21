import { BaseTool } from './BaseTool.js';
import { historyManager } from '../data/HistoryManager.js';
import { globalEventBus } from '../core/EventBus.js';

export class LineTool extends BaseTool {
    constructor() {
        super('line');
        this.startPos = null;
    }

    onPointerDown(e) {
        if (e.outOfBounds) return;
        this.isDrawing = true;
        this.startPos = { x: e.gridX, y: e.gridY };
    }

    onPointerMove(e, layerManager, appState) {
        if (!this.isDrawing || !this.startPos) return;

        const pixels = this.getLinePixels(this.startPos.x, this.startPos.y, e.gridX, e.gridY);
        const expanded = [];
        for (const pt of pixels) {
            expanded.push(...this.getBrushPixels(pt.x, pt.y, appState.brushSize));
        }

        globalEventBus.emit('tool:preview', {
            color: appState.primaryColor,
            pixels: expanded
        });
    }

    onPointerUp(e, layerManager, appState) {
        if (!this.isDrawing || !this.startPos) return;

        historyManager.saveState();
        const layer = layerManager.getActiveLayer();
        if (layer && layer.visible && !layer.locked) {
            const pixels = this.getLinePixels(this.startPos.x, this.startPos.y, e.gridX, e.gridY);
            const [r, g, b, a] = this.hexToRGBA(appState.primaryColor);

            for (const pt of pixels) {
                const brushPts = this.getBrushPixels(pt.x, pt.y, appState.brushSize);
                for (const bPt of brushPts) {
                    layer.setPixel(bPt.x, bPt.y, r, g, b, a);
                }
            }
        }

        this.isDrawing = false;
        this.startPos = null;
        globalEventBus.emit('tool:preview', null);
    }
}
