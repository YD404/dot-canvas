/**
 * GridRenderer - Renders crisp 1px grid lines on screen-resolution overlay canvas
 */
export class GridRenderer {
    static render(ctx, gridWidth, gridHeight, zoom, panX, panY) {
        // Render grid lines when cell size in screen pixels is >= 4px
        if (zoom < 4) return;

        ctx.save();
        ctx.lineWidth = 1; // Native 1px screen line width!
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';

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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeRect(
            Math.floor(panX) + 0.5,
            Math.floor(panY) + 0.5,
            gridWidth * zoom,
            gridHeight * zoom
        );

        ctx.restore();
    }
}
