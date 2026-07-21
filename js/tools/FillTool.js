import { BaseTool } from './BaseTool.js';
import { historyManager } from '../data/HistoryManager.js';

export class FillTool extends BaseTool {
    constructor() {
        super('fill');
    }

    onPointerDown(e, layerManager, appState) {
        if (e.outOfBounds) return;

        const layer = layerManager.getActiveLayer();
        if (!layer || !layer.visible || layer.locked) return;

        const startPixel = layer.getPixel(e.gridX, e.gridY);
        if (!startPixel) return;

        const fillColor = this.hexToRGBA(appState.primaryColor);

        // Don't fill if color is identical
        if (startPixel[0] === fillColor[0] &&
            startPixel[1] === fillColor[1] &&
            startPixel[2] === fillColor[2] &&
            startPixel[3] === fillColor[3]) {
            return;
        }

        historyManager.saveState();
        this.floodFill(layer, e.gridX, e.gridY, startPixel, fillColor);
    }

    floodFill(layer, startX, startY, targetColor, fillColor) {
        const width = layer.width;
        const height = layer.height;
        const queue = [{ x: startX, y: startY }];
        const visited = new Uint8Array(width * height);

        const isSameColor = (x, y) => {
            const p = layer.getPixel(x, y);
            if (!p) return false;
            return p[0] === targetColor[0] &&
                   p[1] === targetColor[1] &&
                   p[2] === targetColor[2] &&
                   p[3] === targetColor[3];
        };

        while (queue.length > 0) {
            const { x, y } = queue.pop();
            const idx = y * width + x;

            if (visited[idx]) continue;
            visited[idx] = 1;

            if (!isSameColor(x, y)) continue;

            layer.setPixel(x, y, fillColor[0], fillColor[1], fillColor[2], fillColor[3]);

            if (x > 0) queue.push({ x: x - 1, y });
            if (x < width - 1) queue.push({ x: x + 1, y });
            if (y > 0) queue.push({ x, y: y - 1 });
            if (y < height - 1) queue.push({ x, y: y + 1 });
        }
    }
}
