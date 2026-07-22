import { appState } from '../core/AppState.js';

/**
 * GridRenderer - Renders crisp 1px grid lines on screen-resolution overlay canvas
 */
export class GridRenderer {
    static render(ctx, gridWidth, gridHeight, zoom, panX, panY) {
        // Render grid lines when cell size in screen pixels is >= 4px
        if (zoom < 4) return;

        const isLight = this.isLightColor(appState.backgroundColor);
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.2)';
        const outlineColor = isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';

        ctx.save();
        ctx.lineWidth = 1; // Native 1px screen line width!
        ctx.strokeStyle = gridColor;

        ctx.beginPath();
        // Vertical lines
        for (let x = 0; x <= gridWidth; x++) {
            const screenX = Math.floor(panX + x * zoom) + 0.5; // Offset 0.5 for crisp 1px line
            ctx.moveTo(screenX, panY);
            ctx.lineTo(screenX, panY + gridHeight * zoom);
        }
        // Horizontal lines
        for (let y = 0; y <= gridHeight; y++) {
            const screenY = Math.floor(panY + y * zoom) + 0.5;
            ctx.moveTo(panX, screenY);
            ctx.lineTo(panX + gridWidth * zoom, screenY);
        }
        ctx.stroke();

        // Canvas boundary outline
        ctx.strokeStyle = outlineColor;
        ctx.strokeRect(
            Math.floor(panX) + 0.5,
            Math.floor(panY) + 0.5,
            gridWidth * zoom,
            gridHeight * zoom
        );

        ctx.restore();
    }

    static isLightColor(colorHex) {
        if (!colorHex || colorHex === 'transparent') return false; // Default checkerboard is dark
        let hex = colorHex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
        if (hex.length !== 6) return false;

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Standard relative luminance formula
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 140; // > 140 is considered light background
    }
}
