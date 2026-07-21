/**
 * BackgroundRenderer - Renders transparent checkerboard pattern onto bottom-most bgCanvas
 */
export class BackgroundRenderer {
    static render(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        const tileSize = 4;
        for (let y = 0; y < height; y += tileSize) {
            for (let x = 0; x < width; x += tileSize) {
                const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
                ctx.fillStyle = isEven ? '#18181b' : '#27272a'; // neutral-900 / neutral-800
                const w = Math.min(tileSize, width - x);
                const h = Math.min(tileSize, height - y);
                ctx.fillRect(x, y, w, h);
            }
        }
    }
}
