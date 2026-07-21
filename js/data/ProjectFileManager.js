import { globalEventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';

const AUTOSAVE_KEY = 'dotcanvas_autosave_data_v1';

/**
 * ProjectFileManager - Project export/import & localStorage autosave
 */
export class ProjectFileManager {
    constructor() {
        this.layerManager = null;
        this.autoSaveTimer = null;
    }

    init(layerManager) {
        this.layerManager = layerManager;

        // Auto-save on layer change, color change, or size change
        globalEventBus.on('layers:changed', () => this.scheduleAutoSave());
        globalEventBus.on('layers:updated', () => this.scheduleAutoSave());
        globalEventBus.on('history:restored', () => this.scheduleAutoSave());
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => this.saveToLocalStorage(), 1000);
    }

    saveToLocalStorage() {
        if (!this.layerManager) return;
        try {
            const projectData = this.generateProjectJSON();
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(projectData));
            globalEventBus.emit('project:autosaved', new Date());
        } catch (e) {
            console.warn('Auto-save failed (localStorage limit reached?):', e);
        }
    }

    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem(AUTOSAVE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            this.loadProjectJSON(data);
            return true;
        } catch (e) {
            console.error('Failed to load auto-saved data:', e);
            return false;
        }
    }

    generateProjectJSON() {
        return {
            version: '1.0',
            appName: 'DotCanvas',
            created: new Date().toISOString(),
            canvas: {
                width: appState.width,
                height: appState.height
            },
            palette: appState.palette,
            layers: this.layerManager.toJSON()
        };
    }

    exportProjectFile(filename = 'artwork.dotcanvas') {
        const json = this.generateProjectJSON();
        const str = JSON.stringify(json, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.dotcanvas') ? filename : `${filename}.dotcanvas`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importProjectFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.loadProjectJSON(data);
                    resolve(data);
                } catch (err) {
                    reject(new Error('無効なプロジェクトファイルです。'));
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    loadProjectJSON(data) {
        if (!data || !data.canvas || !data.layers) {
            throw new Error('Project data format error');
        }

        // Set canvas size
        appState.setCanvasSize(data.canvas.width, data.canvas.height);

        // Set palette if available
        if (Array.isArray(data.palette)) {
            appState.palette = data.palette;
            globalEventBus.emit('state:paletteChanged', appState.palette);
        }

        // Load layers
        this.layerManager.fromJSON(data.layers);
        globalEventBus.emit('project:loaded');
    }
}

export const projectFileManager = new ProjectFileManager();
