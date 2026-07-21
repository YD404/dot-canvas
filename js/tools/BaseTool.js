/**
 * BaseTool - Abstract Base Class for Canvas Tools
 */
export class BaseTool {
    constructor(name) {
        this.name = name;
        this.isDrawing = false;
        this.lastGridPos = null;
    }

    onPointerDown(e, layerManager, appState) {}
    onPointerMove(e, layerManager, appState) {}
    onPointerUp(e, layerManager, appState) {}

    // Bresenham's Line Algorithm to prevent gaps when dragging quickly
    getLinePixels(x0, y0, x1, y1) {
        const pixels = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let currX = x0;
        let currY = y0;

        while (true) {
            pixels.push({ x: currX, y: currY });
            if (currX === x1 && currY === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                currX += sx;
            }
            if (e2 < dx) {
                err += dx;
                currY += sy;
            }
        }
        return pixels;
    }

    // Apply brush size offset around a target point
    getBrushPixels(centerX, centerY, size) {
        const pixels = [];
        const half = Math.floor(size / 2);
        const startX = centerX - half;
        const startY = centerY - half;

        for (let y = startY; y < startY + size; y++) {
            for (let x = startX; x < startX + size; x++) {
                pixels.push({ x, y });
            }
        }
        return pixels;
    }

    hexToRGBA(hex, alpha = 255) {
        let c = hex.replace('#', '');
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        return [
            (num >> 16) & 255,
            (num >> 8) & 255,
            num & 255,
            alpha
        ];
    }
}
