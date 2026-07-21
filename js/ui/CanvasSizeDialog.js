import { appState } from '../core/AppState.js';
import { globalEventBus } from '../core/EventBus.js';

export class CanvasSizeDialog {
    constructor(layerManager) {
        this.layerManager = layerManager;
        this.modalEl = document.getElementById('modal-canvas-size');
        this.btnOpen = document.getElementById('btn-canvas-size');
        this.btnCancel = document.getElementById('btn-cancel-canvas-size');
        this.btnApply = document.getElementById('btn-apply-canvas-size');
        this.inputWidth = document.getElementById('input-canvas-width');
        this.inputHeight = document.getElementById('input-canvas-height');
        this.labelCanvasSize = document.getElementById('label-canvas-size');

        this.bindEvents();
    }

    show() {
        if (!this.modalEl) return;
        if (this.inputWidth) this.inputWidth.value = appState.width;
        if (this.inputHeight) this.inputHeight.value = appState.height;
        this.modalEl.classList.remove('hidden');
    }

    hide() {
        if (this.modalEl) this.modalEl.classList.add('hidden');
    }

    apply() {
        const w = parseInt(this.inputWidth.value, 10);
        const h = parseInt(this.inputHeight.value, 10);

        if (isNaN(w) || isNaN(h) || w < 8 || w > 1024 || h < 8 || h > 1024) {
            alert('キャンバスサイズは8から1024の範囲で指定してください。');
            return;
        }

        const confirmMessage = `キャンバスサイズを ${w} × ${h} に変更しますか？\n※現在の描画内容・全レイヤー・履歴はすべてクリア（リセット）されます。`;
        if (!confirm(confirmMessage)) {
            return;
        }

        appState.setCanvasSize(w, h);
        this.layerManager.setSize(w, h);
        if (this.labelCanvasSize) this.labelCanvasSize.textContent = `${w} × ${h}`;

        this.hide();
        globalEventBus.emit('canvas:sizeApplied', { width: w, height: h });
    }

    bindEvents() {
        if (this.btnOpen) this.btnOpen.addEventListener('click', () => this.show());
        if (this.btnCancel) this.btnCancel.addEventListener('click', () => this.hide());
        if (this.btnApply) this.btnApply.addEventListener('click', () => this.apply());

        // Preset size buttons
        const presets = document.querySelectorAll('.btn-preset-size');
        presets.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = parseInt(e.target.dataset.size, 10);
                if (this.inputWidth) this.inputWidth.value = size;
                if (this.inputHeight) this.inputHeight.value = size;
            });
        });

        globalEventBus.on('state:canvasSizeChanged', ({ width, height }) => {
            if (this.labelCanvasSize) this.labelCanvasSize.textContent = `${width} × ${height}`;
        });
    }
}
