import { PenTool } from './PenTool.js';
import { DotTool } from './DotTool.js';
import { EraserTool } from './EraserTool.js';
import { FillTool } from './FillTool.js';
import { EyedropperTool } from './EyedropperTool.js';
import { LineTool } from './LineTool.js';
import { RectTool } from './RectTool.js';
import { HandTool } from './HandTool.js';
import { globalEventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';
import { referenceImageManager } from '../data/ReferenceImageManager.js';

/**
 * ToolManager - Registers tools and routes pointer events to active tool or reference image dragging
 */
export class ToolManager {
    constructor(layerManager) {
        this.layerManager = layerManager;
        this.tools = new Map();
        this.activeTool = null;

        // Ref image drag state
        this.isDraggingRef = false;
        this.refStartPos = { x: 0, y: 0 };
        this.pointerStartPos = { x: 0, y: 0 };

        this.registerTool(new PenTool());
        this.registerTool(new DotTool());
        this.registerTool(new EraserTool());
        this.registerTool(new FillTool());
        this.registerTool(new EyedropperTool());
        this.registerTool(new LineTool());
        this.registerTool(new RectTool());
        this.registerTool(new HandTool());

        this.selectTool(appState.activeTool);

        globalEventBus.on('state:toolChanged', (name) => this.selectTool(name));
        this.bindEvents();
    }

    registerTool(toolInstance) {
        this.tools.set(toolInstance.name, toolInstance);
    }

    selectTool(name) {
        if (this.tools.has(name)) {
            this.activeTool = this.tools.get(name);
        }
    }

    bindEvents() {
        globalEventBus.on('pointer:down', (e) => {
            // Disable all drawing tools when Reference tab is active
            if (appState.activeTab === 'ref') {
                if (referenceImageManager.src) {
                    this.isDraggingRef = true;
                    this.pointerStartPos = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
                    this.refStartPos = { x: referenceImageManager.x, y: referenceImageManager.y };
                }
                return; // Block drawing tool completely
            }

            if (this.activeTool) {
                this.activeTool.onPointerDown(e, this.layerManager, appState);
                globalEventBus.emit('canvas:requestRender');
            }
        });

        globalEventBus.on('pointer:move', (e) => {
            if (appState.activeTab === 'ref') {
                if (this.isDraggingRef) {
                    const dx = (e.originalEvent.clientX - this.pointerStartPos.x) / appState.zoom;
                    const dy = (e.originalEvent.clientY - this.pointerStartPos.y) / appState.zoom;
                    referenceImageManager.setPosition(
                        Math.round(this.refStartPos.x + dx),
                        Math.round(this.refStartPos.y + dy)
                    );
                }
                return; // Block drawing tool completely
            }

            if (this.activeTool) {
                this.activeTool.onPointerMove(e, this.layerManager, appState);
                globalEventBus.emit('canvas:requestRender');
            }
        });

        globalEventBus.on('pointer:up', (e) => {
            if (appState.activeTab === 'ref') {
                if (this.isDraggingRef) {
                    this.isDraggingRef = false;
                }
                return; // Block drawing tool completely
            }

            if (this.activeTool) {
                this.activeTool.onPointerUp(e, this.layerManager, appState);
                globalEventBus.emit('canvas:requestRender');
            }
        });
    }
}
