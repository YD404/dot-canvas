/**
 * PixelRenderer - Renders layered pixel art data onto the main DOM canvas
 */
export class PixelRenderer {
    static render(ctx, layerManager, width, height) {
        ctx.clearRect(0, 0, width, height);

        if (!layerManager || !layerManager.layers.length) return;

        // 2. Create offscreen composite buffer
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const offCtx = offscreen.getContext('2d');
        const imgData = offCtx.createImageData(width, height);
        const data = imgData.data;

        // Render from bottom layer to top layer (layers array is ordered top-to-bottom, so reverse it)
        const reversedLayers = [...layerManager.layers].reverse();

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let outR = 0, outG = 0, outB = 0, outA = 0;

                for (const layer of reversedLayers) {
                    if (!layer.visible || layer.opacity <= 0) continue;

                    const p = layer.getPixel(x, y);
                    if (!p || p[3] === 0) continue;

                    const srcA = (p[3] / 255) * layer.opacity;
                    if (srcA <= 0) continue;

                    const destA = outA;
                    outA = srcA + destA * (1 - srcA);

                    if (outA > 0) {
                        outR = (p[0] * srcA + outR * destA * (1 - srcA)) / outA;
                        outG = (p[1] * srcA + outG * destA * (1 - srcA)) / outA;
                        outB = (p[2] * srcA + outB * destA * (1 - srcA)) / outA;
                    }
                }

                const idx = (y * width + x) * 4;
                data[idx] = Math.round(outR);
                data[idx + 1] = Math.round(outG);
                data[idx + 2] = Math.round(outB);
                data[idx + 3] = Math.round(outA * 255);
            }
        }

        offCtx.putImageData(imgData, 0, 0);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreen, 0, 0);
    }
}
