import { Layer } from './Layer.js';
import { globalEventBus } from '../core/EventBus.js';

/**
 * LayerManager - Manages layer list, order, active selection, and composition
 */
export class LayerManager {
    constructor(width = 32, height = 32) {
        this.width = width;
        this.height = height;
        this.layers = [];
        this.activeLayerId = null;
        this.nextLayerNumber = 1;

        // Initialize with default base layer
        this.addLayer('レイヤー 1');
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.layers = [];
        this.activeLayerId = null;
        this.nextLayerNumber = 1;
        this.addLayer('レイヤー 1');
        globalEventBus.emit('layers:changed', this.getLayerListSummary());
    }

    addLayer(name = null) {
        const id = 'layer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const layerName = name || `レイヤー ${this.nextLayerNumber++}`;
        const newLayer = new Layer(id, layerName, this.width, this.height);
        
        // Add to top of stack (index 0 is top)
        this.layers.unshift(newLayer);
        this.activeLayerId = id;
        
        globalEventBus.emit('layers:changed', this.getLayerListSummary());
        globalEventBus.emit('layers:activeChanged', this.getActiveLayer());
        return newLayer;
    }

    removeLayer(id) {
        if (this.layers.length <= 1) return; // Keep at least one layer
        this.layers = this.layers.filter(l => l.id !== id);
        
        if (this.activeLayerId === id) {
            this.activeLayerId = this.layers[0].id;
        }

        globalEventBus.emit('layers:changed', this.getLayerListSummary());
        globalEventBus.emit('layers:activeChanged', this.getActiveLayer());
    }

    getActiveLayer() {
        return this.layers.find(l => l.id === this.activeLayerId) || this.layers[0];
    }

    setActiveLayer(id) {
        const found = this.layers.find(l => l.id === id);
        if (found && this.activeLayerId !== id) {
            this.activeLayerId = id;
            globalEventBus.emit('layers:activeChanged', found);
        }
    }

    moveLayer(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.layers.length || toIndex < 0 || toIndex >= this.layers.length) return;
        const [moved] = this.layers.splice(fromIndex, 1);
        this.layers.splice(toIndex, 0, moved);
        globalEventBus.emit('layers:changed', this.getLayerListSummary());
    }

    setLayerOpacity(id, opacity) {
        const layer = this.layers.find(l => l.id === id);
        if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
            globalEventBus.emit('layers:updated', layer);
        }
    }

    setLayerVisibility(id, visible) {
        const layer = this.layers.find(l => l.id === id);
        if (layer) {
            layer.visible = visible;
            globalEventBus.emit('layers:updated', layer);
        }
    }

    mergeDown(id) {
        const idx = this.layers.findIndex(l => l.id === id);
        if (idx < 0 || idx >= this.layers.length - 1) return; // Can't merge bottom layer

        const topLayer = this.layers[idx];
        const bottomLayer = this.layers[idx + 1];

        // Alpha blend topLayer onto bottomLayer
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const topP = topLayer.getPixel(x, y);
                if (!topP || topP[3] === 0) continue; // Skip transparent

                const topAlpha = (topP[3] / 255) * topLayer.opacity;
                if (topAlpha <= 0) continue;

                const botP = bottomLayer.getPixel(x, y);
                const botAlpha = (botP[3] / 255) * bottomLayer.opacity;

                const outAlpha = topAlpha + botAlpha * (1 - topAlpha);
                if (outAlpha <= 0) continue;

                const r = Math.round((topP[0] * topAlpha + botP[0] * botAlpha * (1 - topAlpha)) / outAlpha);
                const g = Math.round((topP[1] * topAlpha + botP[1] * botAlpha * (1 - topAlpha)) / outAlpha);
                const b = Math.round((topP[2] * topAlpha + botP[2] * botAlpha * (1 - topAlpha)) / outAlpha);
                const a = Math.round(outAlpha * 255);

                bottomLayer.setPixel(x, y, r, g, b, a);
            }
        }

        // Remove top layer
        this.removeLayer(topLayer.id);
        this.setActiveLayer(bottomLayer.id);
    }

    getLayerListSummary() {
        return this.layers.map(l => ({
            id: l.id,
            name: l.name,
            visible: l.visible,
            opacity: l.opacity,
            locked: l.locked,
            isActive: l.id === this.activeLayerId
        }));
    }

    toJSON() {
        return this.layers.map(l => l.toJSON());
    }

    fromJSON(jsonArray) {
        this.layers = jsonArray.map(j => Layer.fromJSON(j));
        if (this.layers.length > 0) {
            this.activeLayerId = this.layers[0].id;
            this.width = this.layers[0].width;
            this.height = this.layers[0].height;
        }
        globalEventBus.emit('layers:changed', this.getLayerListSummary());
        globalEventBus.emit('layers:activeChanged', this.getActiveLayer());
    }
}
