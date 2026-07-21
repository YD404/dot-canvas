/**
 * SVGExporter - Converts pixel art grid into scalable vector SVG format with transparency
 */
export class SVGExporter {
    static exportToBlob(layerManager, width, height, options = {}) {
        const { scope = 'all' } = options;

        let rectsSVG = '';

        // Get target layers
        const targetLayers = scope === 'active'
            ? [layerManager.getActiveLayer()]
            : [...layerManager.layers].reverse().filter(l => l.visible);

        for (const layer of targetLayers) {
            if (!layer) continue;
            rectsSVG += this.layerToSVG(layer, width, height);
        }

        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width * 10}" height="${height * 10}" shape-rendering="crispEdges">
${rectsSVG}</svg>`;

        return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    }

    static layerToSVG(layer, width, height) {
        let svg = `  <g opacity="${layer.opacity}" id="${this.escapeXml(layer.name)}">\n`;

        for (let y = 0; y < height; y++) {
            let startX = null;
            let currentColor = null;
            let spanWidth = 0;

            for (let x = 0; x < width; x++) {
                const p = layer.getPixel(x, y);
                const isOpaque = p && p[3] > 0;
                const hexColor = isOpaque
                    ? `rgba(${p[0]},${p[1]},${p[2]},${(p[3] / 255).toFixed(2)})`
                    : null;

                if (hexColor === currentColor && isOpaque) {
                    spanWidth++;
                } else {
                    if (currentColor && spanWidth > 0) {
                        svg += `    <rect x="${startX}" y="${y}" width="${spanWidth}" height="1" fill="${currentColor}"/>\n`;
                    }
                    startX = x;
                    currentColor = hexColor;
                    spanWidth = 1;
                }
            }

            if (currentColor && spanWidth > 0) {
                svg += `    <rect x="${startX}" y="${y}" width="${spanWidth}" height="1" fill="${currentColor}"/>\n`;
            }
        }

        svg += `  </g>\n`;
        return svg;
    }

    static escapeXml(str) {
        return str.replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }
}
