import { globalEventBus } from '../core/EventBus.js';

/**
 * HandTool - Hand / Pan tool for dragging canvas view without painting
 */
export class HandTool {
    constructor() {
        this.name = 'hand';
        this.isDragging = false;
        this.startClient = { x: 0, y: 0 };
    }

    onPointerDown(e, layerManager, state) {
        this.isDragging = true;
        this.startClient = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
    }

    onPointerMove(e, layerManager, state) {
        if (!this.isDragging) return;

        const currentClientX = e.originalEvent.clientX;
        const currentClientY = e.originalEvent.clientY;

        const dx = currentClientX - this.startClient.x;
        const dy = currentClientY - this.startClient.y;

        this.startClient = { x: currentClientX, y: currentClientY };
        globalEventBus.emit('canvas:panBy', { dx, dy });
    }

    onPointerUp(e, layerManager, state) {
        this.isDragging = false;
    }
}
