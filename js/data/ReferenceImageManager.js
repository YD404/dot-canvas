import { globalEventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';

/**
 * ReferenceImageManager - Direct Screen-Space Renderer for High-Res Reference Images
 */
export class ReferenceImageManager {
    constructor() {
        this.imageObj = null; // Memory-only HTMLImageElement
        this.imageLoaded = false;
        this.visible = true;
        this.opacity = 0.5;
        this.displaySize = 32; // Longest side size in canvas grid units
        this.x = 0;
        this.y = 0;
        this.src = null;
        this.naturalWidth = 0;
        this.naturalHeight = 0;
    }

    initDOM() {
        // Deprecated DOM initialization (kept for backward compatibility)
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.imageObj = img;
                    this.imageLoaded = true;
                    this.src = e.target.result;
                    this.naturalWidth = img.naturalWidth;
                    this.naturalHeight = img.naturalHeight;
                    this.visible = true;

                    // Auto-fit to current canvas size
                    this.displaySize = Math.max(appState.width, appState.height);
                    this.resetPosition();

                    globalEventBus.emit('refImage:changed', this.getSummary());
                    resolve();
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    removeImage() {
        this.src = null;
        this.imageObj = null;
        this.imageLoaded = false;
        this.naturalWidth = 0;
        this.naturalHeight = 0;
        globalEventBus.emit('refImage:changed', this.getSummary());
    }

    toggleVisibility() {
        this.visible = !this.visible;
        globalEventBus.emit('refImage:updated', this.getSummary());
        return this.visible;
    }

    setOpacity(val) {
        this.opacity = Math.max(0, Math.min(1, val));
        globalEventBus.emit('refImage:updated', this.getSummary());
    }

    setDisplaySize(size) {
        this.displaySize = Math.max(1, Math.min(1024, size));
        globalEventBus.emit('refImage:updated', this.getSummary());
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        globalEventBus.emit('refImage:updated', this.getSummary());
    }

    resetPosition() {
        this.x = 0;
        this.y = 0;
        globalEventBus.emit('refImage:updated', this.getSummary());
    }

    render(ctx, panX, panY, zoom) {
        if (!ctx || !ctx.canvas) return;

        // Always clear ref screen canvas first
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (!this.visible || !this.imageLoaded || !this.imageObj || this.naturalWidth === 0) return;

        // Calculate aspect ratio display dimensions
        let displayW = this.displaySize;
        let displayH = this.displaySize;

        if (this.naturalWidth >= this.naturalHeight) {
            displayH = this.displaySize * (this.naturalHeight / this.naturalWidth);
        } else {
            displayW = this.displaySize * (this.naturalWidth / this.naturalHeight);
        }

        // Convert grid cells to exact screen pixel coordinates
        const screenX = panX + this.x * zoom;
        const screenY = panY + this.y * zoom;
        const screenW = displayW * zoom;
        const screenH = displayH * zoom;

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(this.imageObj, screenX, screenY, screenW, screenH);
        ctx.restore();
    }

    getSummary() {
        return {
            hasImage: !!this.src && this.imageLoaded,
            visible: this.visible,
            opacity: this.opacity,
            displaySize: this.displaySize,
            x: this.x,
            y: this.y,
            naturalWidth: this.naturalWidth,
            naturalHeight: this.naturalHeight
        };
    }
}

export const referenceImageManager = new ReferenceImageManager();
