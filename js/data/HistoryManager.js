import { globalEventBus } from '../core/EventBus.js';

/**
 * HistoryManager - Handles Undo/Redo stack with a max limit of 50 steps
 */
export class HistoryManager {
    constructor(maxSteps = 50) {
        this.maxSteps = maxSteps;
        this.undoStack = [];
        this.redoStack = [];
        this.layerManager = null;
    }

    init(layerManager) {
        this.layerManager = layerManager;
        this.clear();
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.emitStatus();
    }

    // Save state snapshot before executing an action
    saveState() {
        if (!this.layerManager) return;

        const snapshot = this.layerManager.toJSON();
        this.undoStack.push(snapshot);

        if (this.undoStack.length > this.maxSteps) {
            this.undoStack.shift(); // Remove oldest
        }

        // Clear redo stack on new operation
        this.redoStack = [];
        this.emitStatus();
    }

    undo() {
        if (!this.canUndo()) return;

        // Current state to redo stack
        const currentSnapshot = this.layerManager.toJSON();
        this.redoStack.push(currentSnapshot);

        // Restore previous state
        const previousSnapshot = this.undoStack.pop();
        this.layerManager.fromJSON(previousSnapshot);

        this.emitStatus();
        globalEventBus.emit('history:restored');
    }

    redo() {
        if (!this.canRedo()) return;

        // Current state to undo stack
        const currentSnapshot = this.layerManager.toJSON();
        this.undoStack.push(currentSnapshot);

        // Restore next state
        const nextSnapshot = this.redoStack.pop();
        this.layerManager.fromJSON(nextSnapshot);

        this.emitStatus();
        globalEventBus.emit('history:restored');
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    emitStatus() {
        globalEventBus.emit('history:statusChanged', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length
        });
    }
}

export const historyManager = new HistoryManager(50);
