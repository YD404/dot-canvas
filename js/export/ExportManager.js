import { PNGExporter } from './PNGExporter.js';
import { SVGExporter } from './SVGExporter.js';
import { appState } from '../core/AppState.js';

/**
 * ExportManager - Coordinates PNG and SVG export operations
 */
export class ExportManager {
    static async downloadImage(layerManager, format = 'png', scope = 'all', scale = 1) {
        const width = appState.width;
        const height = appState.height;
        let blob = null;

        if (format === 'svg') {
            blob = SVGExporter.exportToBlob(layerManager, width, height, { scope });
        } else {
            blob = await PNGExporter.exportToBlob(layerManager, width, height, { scope, scale });
        }

        if (!blob) return;

        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `dotcanvas_${width}x${height}_${timestamp}.${format}`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
