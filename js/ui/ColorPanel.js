import { appState } from '../core/AppState.js';
import { globalEventBus } from '../core/EventBus.js';
import { Icons } from './Icons.js';

export class ColorPanel {
    constructor() {
        this.previewEl = document.getElementById('color-preview');
        this.hexInputEl = document.getElementById('input-color-hex');
        this.nativePickerEl = document.getElementById('native-color-picker');
        this.paletteGridEl = document.getElementById('palette-grid');
        this.colorHistoryGridEl = document.getElementById('color-history-grid');

        // Background Color elements
        this.bgColorInput = document.getElementById('input-bg-color');
        this.bgColorHexInput = document.getElementById('input-bg-color-hex');
        this.bgCheckerboardBtn = document.getElementById('btn-bg-checkerboard');

        // Color Harmonies elements
        this.harmonyMonoEl = document.getElementById('harmony-monochromatic');
        this.harmonyAnalogousEl = document.getElementById('harmony-analogous');
        this.harmonySplitEl = document.getElementById('harmony-split');
        this.harmonyTriadicEl = document.getElementById('harmony-triadic');

        this.init();
        this.bindEvents();
    }

    init() {
        this.updateUI(appState.primaryColor);
        this.updateBgUI(appState.backgroundColor);
        this.renderPalette(appState.palette);
        this.renderColorHistory(appState.colorHistory);
        this.renderHarmonies(appState.primaryColor);
    }

    updateUI(hex) {
        if (this.previewEl) this.previewEl.style.backgroundColor = hex;
        if (this.hexInputEl && document.activeElement !== this.hexInputEl) {
            this.hexInputEl.value = hex;
        }
        if (this.nativePickerEl) this.nativePickerEl.value = hex.slice(0, 7);
        this.renderHarmonies(hex);
        this.renderPalette(appState.palette);
        this.renderColorHistory(appState.colorHistory);
    }

    updateBgUI(color) {
        if (!this.bgColorInput || !this.bgColorHexInput) return;
        if (!color || color === 'transparent') {
            this.bgColorHexInput.value = '透明 (格子)';
            this.bgColorInput.value = '#18181b';
        } else {
            this.bgColorHexInput.value = color.toUpperCase();
            this.bgColorInput.value = color.slice(0, 7);
        }
    }

    renderPalette(paletteList) {
        if (!this.paletteGridEl) return;
        this.paletteGridEl.innerHTML = '';

        // Cell 1: Add Swatch (+) Button
        const addBtn = document.createElement('button');
        addBtn.className = 'w-7 h-7 border border-dashed border-neutral-600 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-400 text-neutral-400 hover:text-neutral-100 flex items-center justify-center shrink-0 relative transition-colors';
        addBtn.title = '現在の色を保存';
        addBtn.innerHTML = Icons.plus;
        addBtn.addEventListener('click', () => appState.addSwatch(appState.primaryColor));
        this.paletteGridEl.appendChild(addBtn);

        // Saved Swatches
        paletteList.forEach(hex => {
            const swatch = document.createElement('button');
            swatch.className = 'w-7 h-7 border border-neutral-700 hover:scale-105 transition-transform shrink-0 relative select-none touch-none';
            swatch.style.backgroundColor = hex;
            swatch.title = `${hex} (長押しで削除)`;

            if (hex.toUpperCase() === appState.primaryColor.toUpperCase()) {
                swatch.classList.add('ring-2', 'ring-neutral-100', 'z-10');
            }

            let longPressTimer = null;
            let isLongPressTriggered = false;

            const startPress = () => {
                isLongPressTriggered = false;
                longPressTimer = setTimeout(() => {
                    isLongPressTriggered = true;
                    if (confirm(`このスウォッチ (${hex}) を削除しますか？`)) {
                        appState.removeSwatch(hex);
                    }
                }, 500);
            };

            const cancelPress = () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            };

            swatch.addEventListener('pointerdown', startPress);
            swatch.addEventListener('pointerup', cancelPress);
            swatch.addEventListener('pointerleave', cancelPress);
            swatch.addEventListener('pointercancel', cancelPress);

            swatch.addEventListener('click', (e) => {
                if (isLongPressTriggered) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                appState.setPrimaryColor(hex);
            });

            this.paletteGridEl.appendChild(swatch);
        });
    }

    renderColorHistory(historyList) {
        if (!this.colorHistoryGridEl) return;
        this.colorHistoryGridEl.innerHTML = '';

        if (!historyList || historyList.length === 0) {
            const emptyLabel = document.createElement('span');
            emptyLabel.className = 'col-span-6 text-[10px] text-neutral-600 py-1 text-center block';
            emptyLabel.textContent = '描画色履歴なし';
            this.colorHistoryGridEl.appendChild(emptyLabel);
            return;
        }

        historyList.slice(0, 12).forEach(hex => {
            const swatch = document.createElement('button');
            swatch.className = 'w-7 h-7 border border-neutral-700 hover:scale-105 transition-transform shrink-0 relative';
            swatch.style.backgroundColor = hex;
            swatch.title = hex;

            if (hex.toUpperCase() === appState.primaryColor.toUpperCase()) {
                swatch.classList.add('ring-2', 'ring-neutral-100', 'z-10');
            }

            swatch.addEventListener('click', () => appState.setPrimaryColor(hex));
            this.colorHistoryGridEl.appendChild(swatch);
        });
    }

    renderHarmonies(primaryHex) {
        const [h, s, l] = this.hexToHsl(primaryHex);

        // 1. Monochromatic (5 variations of lightness)
        const monoColors = [
            this.hslToHex(h, s, Math.max(10, l - 35)),
            this.hslToHex(h, s, Math.max(15, l - 18)),
            primaryHex.toUpperCase(),
            this.hslToHex(h, s, Math.min(90, l + 18)),
            this.hslToHex(h, s, Math.min(95, l + 35))
        ];

        // 2. Analogous (-30°, 0°, +30°)
        const analogousColors = [
            this.hslToHex(h - 30, s, l),
            primaryHex.toUpperCase(),
            this.hslToHex(h + 30, s, l)
        ];

        // 3. Split-Complementary (0°, +150°, +210°)
        const splitColors = [
            primaryHex.toUpperCase(),
            this.hslToHex(h + 150, s, l),
            this.hslToHex(h + 210, s, l)
        ];

        // 4. Triadic (-120°, 0°, +120°)
        const triadicColors = [
            this.hslToHex(h - 120, s, l),
            primaryHex.toUpperCase(),
            this.hslToHex(h + 120, s, l)
        ];

        this.renderHarmonyGroup(this.harmonyMonoEl, monoColors);
        this.renderHarmonyGroup(this.harmonyAnalogousEl, analogousColors);
        this.renderHarmonyGroup(this.harmonySplitEl, splitColors);
        this.renderHarmonyGroup(this.harmonyTriadicEl, triadicColors);
    }

    renderHarmonyGroup(containerEl, colors) {
        if (!containerEl) return;
        containerEl.innerHTML = '';
        colors.forEach(hex => {
            const btn = document.createElement('button');
            btn.className = 'h-6 border border-neutral-700 hover:scale-105 transition-transform relative';
            btn.style.backgroundColor = hex;
            btn.title = hex;
            if (hex.toUpperCase() === appState.primaryColor.toUpperCase()) {
                btn.classList.add('ring-2', 'ring-neutral-100', 'z-10');
            }
            btn.addEventListener('click', () => appState.setPrimaryColor(hex));
            containerEl.appendChild(btn);
        });
    }

    bindEvents() {
        // Color Preview click -> open native picker
        if (this.previewEl) {
            this.previewEl.addEventListener('click', () => {
                if (this.nativePickerEl) {
                    if (typeof this.nativePickerEl.showPicker === 'function') {
                        this.nativePickerEl.showPicker();
                    } else {
                        this.nativePickerEl.click();
                    }
                }
            });
        }

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

        // Background Color Picker
        if (this.bgColorInput) {
            this.bgColorInput.addEventListener('input', (e) => {
                appState.setBackgroundColor(e.target.value);
            });
        }

        // Background Checkerboard (Transparent) Button
        if (this.bgCheckerboardBtn) {
            this.bgCheckerboardBtn.addEventListener('click', () => {
                appState.setBackgroundColor('transparent');
            });
        }

        globalEventBus.on('state:colorChanged', (hex) => {
            this.updateUI(hex);
        });

        globalEventBus.on('state:bgColorChanged', (color) => {
            this.updateBgUI(color);
        });

        globalEventBus.on('state:paletteChanged', (palette) => {
            this.renderPalette(palette);
        });

        globalEventBus.on('state:colorHistoryChanged', (history) => {
            this.renderColorHistory(history);
        });
    }

    // Color conversion helpers: HEX <-> HSL
    hexToHsl(hex) {
        let c = hex.replace('#', '');
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const r = parseInt(c.substring(0, 2), 16) / 255;
        const g = parseInt(c.substring(2, 4), 16) / 255;
        const b = parseInt(c.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    hslToHex(h, s, l) {
        h = (h % 360 + 360) % 360;
        s = Math.max(0, Math.min(100, s)) / 100;
        l = Math.max(0, Math.min(100, l)) / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) { r = c; g = x; b = 0; }
        else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
        else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

        const toHex = (val) => {
            const hexVal = Math.round((val + m) * 255).toString(16);
            return hexVal.length === 1 ? '0' + hexVal : hexVal;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }
}
