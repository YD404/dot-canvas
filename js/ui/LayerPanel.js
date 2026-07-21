import { globalEventBus } from '../core/EventBus.js';
import { Icons } from './Icons.js';

export class LayerPanel {
    constructor(layerManager) {
        this.layerManager = layerManager;
        this.listContainer = document.getElementById('layer-list');
        this.addBtn = document.getElementById('btn-add-layer');
        this.mergeBtn = document.getElementById('btn-merge-layer');
        this.opacityInput = document.getElementById('input-layer-opacity');
        this.opacityLabel = document.getElementById('label-layer-opacity');

        this.init();
        this.bindEvents();
    }

    init() {
        this.renderList();
        this.updateActiveLayerControls();
    }

    renderList() {
        if (!this.listContainer) return;
        this.listContainer.innerHTML = '';

        const layers = this.layerManager.layers; // Ordered top to bottom

        layers.forEach((layer, index) => {
            const item = document.createElement('div');
            const isActive = layer.id === this.layerManager.activeLayerId;

            item.className = `flex items-center justify-between p-2 border ${
                isActive
                    ? 'bg-neutral-800 border-neutral-600 text-neutral-100 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
            } cursor-pointer`;

            item.innerHTML = `
                <div class="flex items-center space-x-2 flex-1 truncate">
                    <button class="btn-toggle-vis p-1 hover:text-neutral-100" data-id="${layer.id}" title="表示/非表示">
                        ${layer.visible ? Icons.eye : Icons.eyeOff}
                    </button>
                    <span class="truncate text-xs">${this.escapeHtml(layer.name)}</span>
                </div>
                <div class="flex items-center space-x-1">
                    <button class="btn-move-up p-1 hover:text-neutral-100 ${index === 0 ? 'opacity-30 pointer-events-none' : ''}" data-id="${layer.id}" title="手前（上）に移動">
                        ${Icons.arrowUp}
                    </button>
                    <button class="btn-move-down p-1 hover:text-neutral-100 ${index === layers.length - 1 ? 'opacity-30 pointer-events-none' : ''}" data-id="${layer.id}" title="奥（下）に移動">
                        ${Icons.arrowDown}
                    </button>
                    <button class="btn-delete-layer p-1 hover:text-red-400 ${layers.length <= 1 ? 'opacity-30 pointer-events-none' : ''}" data-id="${layer.id}" title="削除">
                        ${Icons.trash}
                    </button>
                </div>
            `;

            // Click to select layer
            item.addEventListener('click', (e) => {
                if (e.target.closest('.btn-toggle-vis') || e.target.closest('.btn-delete-layer') || e.target.closest('.btn-move-up') || e.target.closest('.btn-move-down')) return;
                this.layerManager.setActiveLayer(layer.id);
            });

            // Toggle visibility button
            const visBtn = item.querySelector('.btn-toggle-vis');
            visBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.layerManager.setLayerVisibility(layer.id, !layer.visible);
                globalEventBus.emit('canvas:requestRender');
            });

            // Move Up button
            const moveUpBtn = item.querySelector('.btn-move-up');
            moveUpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (index > 0) {
                    this.layerManager.moveLayer(index, index - 1);
                    globalEventBus.emit('canvas:requestRender');
                }
            });

            // Move Down button
            const moveDownBtn = item.querySelector('.btn-move-down');
            moveDownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (index < layers.length - 1) {
                    this.layerManager.moveLayer(index, index + 1);
                    globalEventBus.emit('canvas:requestRender');
                }
            });

            // Delete layer button
            const delBtn = item.querySelector('.btn-delete-layer');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.layerManager.removeLayer(layer.id);
                globalEventBus.emit('canvas:requestRender');
            });

            this.listContainer.appendChild(item);
        });

        this.updateActiveLayerControls();
    }

    updateActiveLayerControls() {
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer) return;

        if (this.opacityInput) {
            this.opacityInput.value = Math.round(activeLayer.opacity * 100);
        }
        if (this.opacityLabel) {
            this.opacityLabel.textContent = `${Math.round(activeLayer.opacity * 100)}%`;
        }
    }

    bindEvents() {
        if (this.addBtn) {
            this.addBtn.addEventListener('click', () => {
                this.layerManager.addLayer();
                globalEventBus.emit('canvas:requestRender');
            });
        }

        if (this.mergeBtn) {
            this.mergeBtn.addEventListener('click', () => {
                const active = this.layerManager.getActiveLayer();
                if (active) {
                    this.layerManager.mergeDown(active.id);
                    globalEventBus.emit('canvas:requestRender');
                }
            });
        }

        if (this.opacityInput) {
            this.opacityInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10) / 100;
                const active = this.layerManager.getActiveLayer();
                if (active) {
                    this.layerManager.setLayerOpacity(active.id, val);
                    if (this.opacityLabel) this.opacityLabel.textContent = `${Math.round(val * 100)}%`;
                    globalEventBus.emit('canvas:requestRender');
                }
            });
        }

        globalEventBus.on('layers:changed', () => this.renderList());
        globalEventBus.on('layers:activeChanged', () => this.renderList());
        globalEventBus.on('layers:updated', () => this.renderList());
    }

    escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}
