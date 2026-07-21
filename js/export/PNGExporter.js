/**
 * PNGExporter - Exports canvas or layer to transparent PNG blob
 */
export class PNGExporter {
    static exportToBlob(layerManager, width, height, options = {}) {
        const { scope = 'all', scale = 1 } = options;

        const offscreen = document.createElement('canvas');
        offscreen.width = width * scale;
        offscreen.height = height * scale;
        const ctx = offscreen.getContext('2d');

        // Crisp pixel scaling
        ctx.imageSmoothingEnabled = false;

        if (scope === 'active') {
            const activeLayer = layerManager.getActiveLayer();
            if (activeLayer) {
                this.drawLayerToCtx(ctx, activeLayer, width, height, scale);
            }
        } else {
            // All visible layers from bottom to top
            const reversed = [...layerManager.layers].reverse();
            for (const layer of reversed) {
                if (layer.visible) {
                    this.drawLayerToCtx(ctx, layer, width, height, scale);
                }
            }
        }

        return new Promise((resolve) => {
            offscreen.toBlob((blob) => resolve(blob), 'image/png');
        });
    }

    static drawLayerToCtx(ctx, layer, width, height, scale) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = width;
        layerCanvas.height = height;
        const lCtx = layerCanvas.getContext('2d');
        const imgData = lCtx.createImageData(width, height);

        imgData.data.set(layer.data);
        lCtx.putImageData(imgData, 0, 0);

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layerCanvas, 0, 0, width * scale, height * scale);
        ctx.restore();
    }
}
