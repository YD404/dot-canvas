import { ExportManager } from '../export/ExportManager.js';

export class ExportDialog {
    constructor(layerManager) {
        this.layerManager = layerManager;
        this.modalEl = document.getElementById('modal-export');
        this.btnOpen = document.getElementById('btn-export');
        this.btnCancel = document.getElementById('btn-cancel-export');
        this.btnDoExport = document.getElementById('btn-do-export');
        this.btnFmtPng = document.getElementById('btn-export-fmt-png');
        this.btnFmtSvg = document.getElementById('btn-export-fmt-svg');
        this.selectScope = document.getElementById('select-export-scope');
        this.selectScale = document.getElementById('select-export-scale');

        this.selectedFormat = 'png';
        this.bindEvents();
    }

    show() {
        if (this.modalEl) this.modalEl.classList.remove('hidden');
    }

    hide() {
        if (this.modalEl) this.modalEl.classList.add('hidden');
    }

    setFormat(fmt) {
        this.selectedFormat = fmt;
        if (fmt === 'png') {
            this.btnFmtPng.className = 'py-1.5 bg-neutral-100 text-neutral-950 font-bold border border-neutral-100';
            this.btnFmtSvg.className = 'py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700';
            this.selectScale.disabled = false;
        } else {
            this.btnFmtSvg.className = 'py-1.5 bg-neutral-100 text-neutral-950 font-bold border border-neutral-100';
            this.btnFmtPng.className = 'py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700';
            this.selectScale.disabled = true;
        }
    }

    async doExport() {
        const scope = this.selectScope.value;
        const scale = parseInt(this.selectScale.value, 10) || 1;
        await ExportManager.downloadImage(this.layerManager, this.selectedFormat, scope, scale);
        this.hide();
    }

    bindEvents() {
        if (this.btnOpen) this.btnOpen.addEventListener('click', () => this.show());
        if (this.btnCancel) this.btnCancel.addEventListener('click', () => this.hide());
        if (this.btnFmtPng) this.btnFmtPng.addEventListener('click', () => this.setFormat('png'));
        if (this.btnFmtSvg) this.btnFmtSvg.addEventListener('click', () => this.setFormat('svg'));
        if (this.btnDoExport) this.btnDoExport.addEventListener('click', () => this.doExport());
    }
}
