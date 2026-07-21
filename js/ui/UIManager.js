import { Toolbar } from './Toolbar.js';
import { ColorPanel } from './ColorPanel.js';
import { LayerPanel } from './LayerPanel.js';
import { ReferencePanel } from './ReferencePanel.js';
import { CanvasSizeDialog } from './CanvasSizeDialog.js';
import { ExportDialog } from './ExportDialog.js';
import { globalEventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';
import { historyManager } from '../data/HistoryManager.js';
import { projectFileManager } from '../data/ProjectFileManager.js';

export class UIManager {
    constructor(layerManager) {
        this.layerManager = layerManager;

        // Sub UI instances
        this.toolbar = new Toolbar(document.getElementById('toolbar-tools'));
        this.colorPanel = new ColorPanel();
        this.layerPanel = new LayerPanel(layerManager);
        this.referencePanel = new ReferencePanel();
        this.canvasSizeDialog = new CanvasSizeDialog(layerManager);
        this.exportDialog = new ExportDialog(layerManager);

        this.initTabs();
        this.initHeaderButtons();
        this.initStatusBar();
        this.initPanelToggle();
        this.initShortcuts();
    }

    initTabs() {
        const tabLayers = document.getElementById('tab-layers');
        const tabColor = document.getElementById('tab-color');
        const tabRef = document.getElementById('tab-ref');

        const panelLayers = document.getElementById('panel-layers-content');
        const panelColor = document.getElementById('panel-color-content');
        const panelRef = document.getElementById('panel-ref-content');

        const tabs = [
            { name: 'layers', btn: tabLayers, content: panelLayers },
            { name: 'color', btn: tabColor, content: panelColor },
            { name: 'ref', btn: tabRef, content: panelRef }
        ];

        tabs.forEach(({ name, btn, content }) => {
            btn.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.btn.className = 'flex-1 py-2 text-center text-neutral-400 hover:text-neutral-200';
                    t.content.classList.add('hidden');
                });
                btn.className = 'flex-1 py-2 text-center font-bold border-b-2 border-neutral-200 text-neutral-100 bg-neutral-900';
                content.classList.remove('hidden');
                appState.setActiveTab(name);
            });
        });
    }

    initHeaderButtons() {
        // Undo / Redo
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');

        if (btnUndo) btnUndo.addEventListener('click', () => historyManager.undo());
        if (btnRedo) btnRedo.addEventListener('click', () => historyManager.redo());

        globalEventBus.on('history:statusChanged', ({ canUndo, canRedo }) => {
            if (btnUndo) btnUndo.disabled = !canUndo;
            if (btnRedo) btnRedo.disabled = !canRedo;
        });

        // Save Project (.dotcanvas)
        const btnSaveProj = document.getElementById('btn-save-project');
        if (btnSaveProj) {
            btnSaveProj.addEventListener('click', () => {
                projectFileManager.exportProjectFile();
            });
        }

        // Load Project (.dotcanvas)
        const btnLoadProj = document.getElementById('btn-load-project');
        const inputProjFile = document.getElementById('file-input-project');
        if (btnLoadProj && inputProjFile) {
            btnLoadProj.addEventListener('click', () => inputProjFile.click());
            inputProjFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        await projectFileManager.importProjectFile(file);
                        globalEventBus.emit('canvas:requestRender');
                    } catch (err) {
                        alert(err.message);
                    }
                    inputProjFile.value = '';
                }
            });
        }
    }

    initStatusBar() {
        const coordsEl = document.getElementById('status-coords');
        const zoomEl = document.getElementById('status-zoom');
        const autosaveEl = document.getElementById('status-autosave');

        globalEventBus.on('pointer:move', (e) => {
            if (coordsEl) {
                coordsEl.textContent = e.outOfBounds ? 'X: - Y: -' : `X: ${e.gridX} Y: ${e.gridY}`;
            }
        });

        globalEventBus.on('viewport:changed', ({ zoom }) => {
            if (zoomEl) zoomEl.textContent = `${Math.round(zoom * 100)}%`;
        });

        globalEventBus.on('project:autosaved', (time) => {
            if (autosaveEl) {
                const t = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                autosaveEl.textContent = `自動保存済み (${t})`;
            }
        });
    }

    initPanelToggle() {
        const panel = document.getElementById('right-panel');
        const btnToggle = document.getElementById('btn-toggle-panel');
        const iconToggle = document.getElementById('icon-toggle-panel');
        if (!panel || !btnToggle || !iconToggle) return;

        let isCollapsed = false;

        btnToggle.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            if (isCollapsed) {
                panel.classList.remove('w-64');
                panel.classList.add('w-0', 'overflow-hidden', 'border-l-0');
                iconToggle.innerHTML = `<path stroke-linecap="square" stroke-width="2" d="M15 19l-7-7 7-7"/>`; // Chevron Left
            } else {
                panel.classList.remove('w-0', 'overflow-hidden', 'border-l-0');
                panel.classList.add('w-64');
                iconToggle.innerHTML = `<path stroke-linecap="square" stroke-width="2" d="M9 5l7 7-7 7"/>`; // Chevron Right
            }

            // Trigger canvas center re-calculation on panel toggle
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 210);
        });
    }

    initShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Ignore shortcut when typing in input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) historyManager.redo();
                else historyManager.undo();
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'p': appState.setActiveTool('pen'); break;
                case 'd': appState.setActiveTool('dot'); break;
                case 'e': appState.setActiveTool('eraser'); break;
                case 'f': appState.setActiveTool('fill'); break;
                case 'i': appState.setActiveTool('eyedropper'); break;
                case 'l': appState.setActiveTool('line'); break;
                case 'r': appState.setActiveTool('rect'); break;
                case 'h': appState.setActiveTool('hand'); break;
                case 'g': 
                    appState.toggleGrid(); 
                    globalEventBus.emit('canvas:requestRender');
                    break;
            }
        });
    }
}
