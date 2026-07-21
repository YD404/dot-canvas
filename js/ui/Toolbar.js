import { Icons } from './Icons.js';
import { appState } from '../core/AppState.js';
import { globalEventBus } from '../core/EventBus.js';

export class Toolbar {
    constructor(containerEl) {
        this.container = containerEl;
        this.toolsList = [
            { id: 'pen', title: 'フリー線 (P)', icon: Icons.pen },
            { id: 'dot', title: '点打ち (D)', icon: Icons.dot },
            { id: 'eraser', title: '消しゴム (E)', icon: Icons.eraser },
            { id: 'fill', title: 'バケツ塗り (F)', icon: Icons.fill },
            { id: 'eyedropper', title: 'スポイト (I)', icon: Icons.eyedropper },
            { id: 'line', title: '直線 (L)', icon: Icons.line },
            { id: 'rect', title: '矩形 (R)', icon: Icons.rect },
            { id: 'hand', title: '手のひら / 画面移動 (H)', icon: Icons.hand }
        ];

        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = '';
        this.toolsList.forEach(t => {
            const btn = document.createElement('button');
            btn.dataset.tool = t.id;
            btn.title = t.title;
            btn.className = `w-9 h-9 flex items-center justify-center border ${
                appState.activeTool === t.id
                    ? 'bg-neutral-100 text-neutral-950 border-neutral-100 font-bold'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200'
            }`;
            btn.innerHTML = t.icon;
            btn.addEventListener('click', () => appState.setActiveTool(t.id));
            this.container.appendChild(btn);
        });

        // Grid toggle button
        const gridBtn = document.createElement('button');
        gridBtn.id = 'btn-toggle-grid';
        gridBtn.title = 'グリッド表示切替 (G)';
        gridBtn.className = `w-9 h-9 flex items-center justify-center border ${
            appState.showGrid
                ? 'bg-neutral-800 text-neutral-100 border-neutral-600'
                : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300'
        }`;
        gridBtn.innerHTML = Icons.grid;
        gridBtn.addEventListener('click', () => {
            appState.toggleGrid();
            globalEventBus.emit('canvas:requestRender');
        });
        this.container.appendChild(gridBtn);

        // Brush size slider sync (quadratic mapping)
        const brushInput = document.getElementById('input-brush-size');
        const brushLabel = document.getElementById('label-brush-size');
        if (brushInput && brushLabel) {
            brushInput.value = this.sizeToSliderValue(appState.brushSize);
            brushLabel.textContent = appState.brushSize;

            brushInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                const size = this.sliderValueToSize(val);
                appState.setBrushSize(size);
                brushLabel.textContent = size;
            });
        }
    }

    // Quadratic Curve: size = 1 + 99 * (t^2)
    sliderValueToSize(val) {
        const t = Math.max(0, Math.min(100, val)) / 100;
        return Math.round(1 + 99 * Math.pow(t, 2));
    }

    sizeToSliderValue(size) {
        const clamped = Math.max(1, Math.min(100, size));
        const t = Math.sqrt((clamped - 1) / 99);
        return Math.round(t * 100);
    }

    bindEvents() {
        globalEventBus.on('state:toolChanged', (activeTool) => {
            Array.from(this.container.children).forEach(btn => {
                const isSelected = btn.dataset.tool === activeTool;
                btn.className = `w-9 h-9 flex items-center justify-center border ${
                    isSelected
                        ? 'bg-neutral-100 text-neutral-950 border-neutral-100 font-bold'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200'
                }`;
            });
        });

        globalEventBus.on('state:brushSizeChanged', (size) => {
            const brushInput = document.getElementById('input-brush-size');
            const brushLabel = document.getElementById('label-brush-size');
            if (brushInput) brushInput.value = this.sizeToSliderValue(size);
            if (brushLabel) brushLabel.textContent = size;
        });

        globalEventBus.on('state:gridToggled', (showGrid) => {
            const gridBtn = document.getElementById('btn-toggle-grid');
            if (gridBtn) {
                gridBtn.className = `w-9 h-9 flex items-center justify-center border ${
                    showGrid
                        ? 'bg-neutral-800 text-neutral-100 border-neutral-600'
                        : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                }`;
            }
        });

        globalEventBus.on('state:tabChanged', (activeTab) => {
            if (activeTab === 'ref') {
                this.container.classList.add('opacity-40', 'pointer-events-none');
            } else {
                this.container.classList.remove('opacity-40', 'pointer-events-none');
            }
        });
    }
}
