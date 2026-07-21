import { GridRenderer } from './GridRenderer.js';
import { appState } from '../core/AppState.js';

/**
 * OverlayRenderer - Handles overlay UI rendering (Grid, Cursor & Tool Previews) on screen canvas
 */
export class OverlayRenderer {
    static renderOverlay(ctx, gridWidth, gridHeight, zoom, panX, panY, hoverGridPos, toolPreviewData = null) {
        if (!ctx || !ctx.canvas) return;

        // Clear full screen overlay canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 1. Render Grid (If enabled)
        if (appState.showGrid) {
            GridRenderer.render(ctx, gridWidth, gridHeight, zoom, panX, panY);
        }

        // Disable brush cursor and drawing previews when in Reference image tab or using Hand tool
        if (appState.activeTab === 'ref' || appState.activeTool === 'hand') {
            return;
        }

        // 2. Render Hover Brush Cursor
        if (hoverGridPos && !hoverGridPos.outOfBounds) {
            ctx.save();
            const size = appState.brushSize;
            const half = Math.floor(size / 2);
            const startX = hoverGridPos.gridX - half;
            const startY = hoverGridPos.gridY - half;

            const screenX = panX + startX * zoom;
            const screenY = panY + startY * zoom;
            const screenW = size * zoom;
            const screenH = size * zoom;

            ctx.lineWidth = 1;
            ctx.strokeStyle = appState.activeTool === 'eraser' ? '#ef4444' : '#ffffff';
            ctx.strokeRect(screenX, screenY, screenW, screenH);

            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.strokeRect(screenX + 1, screenY + 1, screenW - 2, screenH - 2);
            ctx.restore();
        }

        // 3. Render Tool Preview (Lines, Rectangles)
        if (toolPreviewData && toolPreviewData.pixels) {
            ctx.save();
            ctx.fillStyle = toolPreviewData.color || appState.primaryColor;
            for (const p of toolPreviewData.pixels) {
                if (p.x >= 0 && p.x < gridWidth && p.y >= 0 && p.y < gridHeight) {
                    const screenPx = panX + p.x * zoom;
                    const screenPy = panY + p.y * zoom;
                    ctx.fillRect(screenPx, screenPy, zoom, zoom);
                }
            }
            ctx.restore();
        }
    }
}
