import { referenceImageManager } from '../data/ReferenceImageManager.js';
import { globalEventBus } from '../core/EventBus.js';

export class ReferencePanel {
    constructor() {
        this.btnLoad = document.getElementById('btn-load-ref');
        this.btnRemove = document.getElementById('btn-remove-ref');
        this.fileInput = document.getElementById('file-input-ref');
        this.controlsArea = document.getElementById('ref-controls');
        this.opacityInput = document.getElementById('input-ref-opacity');
        this.opacityLabel = document.getElementById('label-ref-opacity');
        this.sizeInput = document.getElementById('input-ref-size');
        this.sizeLabel = document.getElementById('label-ref-size');
        this.btnResetPos = document.getElementById('btn-reset-ref-pos');

        this.bindEvents();
    }

    bindEvents() {
        if (this.btnLoad && this.fileInput) {
            this.btnLoad.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await referenceImageManager.loadImage(file);
                    globalEventBus.emit('canvas:requestRender');
                }
            });
        }

        if (this.btnRemove) {
            this.btnRemove.addEventListener('click', () => {
                referenceImageManager.removeImage();
                globalEventBus.emit('canvas:requestRender');
            });
        }

        if (this.opacityInput) {
            this.opacityInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10) / 100;
                referenceImageManager.setOpacity(val);
                if (this.opacityLabel) this.opacityLabel.textContent = `${Math.round(val * 100)}%`;
                globalEventBus.emit('canvas:requestRender');
            });
        }

        if (this.sizeInput) {
            this.sizeInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                referenceImageManager.setDisplaySize(val);
                if (this.sizeLabel) this.sizeLabel.textContent = `${val}`;
                globalEventBus.emit('canvas:requestRender');
            });
        }

        if (this.btnResetPos) {
            this.btnResetPos.addEventListener('click', () => {
                referenceImageManager.resetPosition();
                globalEventBus.emit('canvas:requestRender');
            });
        }

        const updateUI = (summary) => {
            if (this.controlsArea) {
                this.controlsArea.classList.toggle('hidden', !summary.hasImage);
            }
            if (this.btnRemove) {
                this.btnRemove.classList.toggle('hidden', !summary.hasImage);
            }
            if (this.sizeInput) {
                this.sizeInput.value = summary.displaySize;
            }
            if (this.sizeLabel) {
                this.sizeLabel.textContent = `${summary.displaySize}`;
            }
        };

        globalEventBus.on('refImage:changed', updateUI);
        globalEventBus.on('refImage:updated', updateUI);
    }
}
