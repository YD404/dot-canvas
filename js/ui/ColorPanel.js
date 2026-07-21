import { appState } from '../core/AppState.js';
import { globalEventBus } from '../core/EventBus.js';

export class ColorPanel {
    constructor() {
        this.previewEl = document.getElementById('color-preview');
        this.hexInputEl = document.getElementById('input-color-hex');
        this.nativePickerEl = document.getElementById('native-color-picker');
        this.paletteGridEl = document.getElementById('palette-grid');
        this.addSwatchBtn = document.getElementById('btn-add-swatch');

        this.init();
        this.bindEvents();
    }

    init() {
        this.updateUI(appState.primaryColor);
        this.renderPalette(appState.palette);
    }

    updateUI(hex) {
        if (this.previewEl) this.previewEl.style.backgroundColor = hex;
        if (this.hexInputEl && document.activeElement !== this.hexInputEl) {
            this.hexInputEl.value = hex;
        }
        if (this.nativePickerEl) this.nativePickerEl.value = hex.slice(0, 7);
    }

    renderPalette(paletteList) {
        if (!this.paletteGridEl) return;
        this.paletteGridEl.innerHTML = '';

        paletteList.forEach(hex => {
            const swatch = document.createElement('button');
            swatch.className = 'w-7 h-7 border border-neutral-700 hover:scale-105 transition-transform shrink-0 relative';
            swatch.style.backgroundColor = hex;
            swatch.title = hex;

            if (hex.toUpperCase() === appState.primaryColor.toUpperCase()) {
                swatch.classList.add('ring-2', 'ring-neutral-100', 'z-10');
            }

            swatch.addEventListener('click', () => appState.setPrimaryColor(hex));
            this.paletteGridEl.appendChild(swatch);
        });
    }

    bindEvents() {
        // HEX text input
        if (this.hexInputEl) {
            this.hexInputEl.addEventListener('change', (e) => {
                let val = e.target.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-FA-F]{6}$/.test(val)) {
                    appState.setPrimaryColor(val);
                } else {
                    this.hexInputEl.value = appState.primaryColor;
                }
            });
        }

        // Native Color Picker
        if (this.nativePickerEl) {
            this.nativePickerEl.addEventListener('input', (e) => {
                appState.setPrimaryColor(e.target.value);
            });
        }

        // Add Swatch button
        if (this.addSwatchBtn) {
            this.addSwatchBtn.addEventListener('click', () => {
                appState.addSwatch(appState.primaryColor);
            });
        }

        globalEventBus.on('state:colorChanged', (hex) => {
            this.updateUI(hex);
            this.renderPalette(appState.palette);
        });

        globalEventBus.on('state:paletteChanged', (palette) => {
            this.renderPalette(palette);
        });
    }
}
