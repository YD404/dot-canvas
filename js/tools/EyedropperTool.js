import { BaseTool } from './BaseTool.js';

export class EyedropperTool extends BaseTool {
    constructor() {
        super('eyedropper');
    }

    onPointerDown(e, layerManager, appState) {
        if (e.outOfBounds) return;
        this.pickColor(e.gridX, e.gridY, layerManager, appState);
    }

    onPointerMove(e, layerManager, appState) {
        if (e.outOfBounds) return;
        if (e.originalEvent && e.originalEvent.buttons === 1) {
            this.pickColor(e.gridX, e.gridY, layerManager, appState);
        }
    }

    pickColor(x, y, layerManager, appState) {
        // Pick top-most non-transparent pixel across all visible layers
        for (const layer of layerManager.layers) {
            if (!layer.visible) continue;
            const p = layer.getPixel(x, y);
            if (p && p[3] > 0) {
                const hex = '#' + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1);
                appState.setPrimaryColor(hex);
                return;
            }
        }
    }
}
