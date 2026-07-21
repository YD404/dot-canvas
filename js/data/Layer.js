/**
 * Layer - Represents a single raster layer with ImageData pixel buffer
 */
export class Layer {
    constructor(id, name, width, height) {
        this.id = id;
        this.name = name;
        this.width = width;
        this.height = height;
        this.visible = true;
        this.opacity = 1.0; // 0.0 ~ 1.0
        this.locked = false;
        
        // Pixel data buffer (RGBA uint8 array: width * height * 4)
        this.data = new Uint8ClampedArray(width * height * 4);
    }

    getPixel(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        const idx = (y * this.width + x) * 4;
        return [
            this.data[idx],
            this.data[idx + 1],
            this.data[idx + 2],
            this.data[idx + 3]
        ];
    }

    setPixel(x, y, r, g, b, a = 255) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        const idx = (y * this.width + x) * 4;
        this.data[idx] = r;
        this.data[idx + 1] = g;
        this.data[idx + 2] = b;
        this.data[idx + 3] = a;
    }

    clear() {
        this.data.fill(0);
    }

    clone() {
        const copy = new Layer(this.id, this.name, this.width, this.height);
        copy.visible = this.visible;
        copy.opacity = this.opacity;
        copy.locked = this.locked;
        copy.data.set(this.data);
        return copy;
    }

    // Exportable JSON format
    toJSON() {
        // Convert Uint8ClampedArray to base64 string safely using chunking to avoid stack overflow
        const CHUNK_SIZE = 8192;
        let binary = '';
        for (let i = 0; i < this.data.length; i += CHUNK_SIZE) {
            const chunk = this.data.subarray(i, i + CHUNK_SIZE);
            binary += String.fromCharCode.apply(null, chunk);
        }
        const base64 = btoa(binary);
        return {
            id: this.id,
            name: this.name,
            width: this.width,
            height: this.height,
            visible: this.visible,
            opacity: this.opacity,
            locked: this.locked,
            dataBase64: base64
        };
    }

    static fromJSON(json) {
        const layer = new Layer(json.id, json.name, json.width, json.height);
        layer.visible = json.visible;
        layer.opacity = json.opacity;
        layer.locked = json.locked;
        
        if (json.dataBase64) {
            const binary = atob(json.dataBase64);
            const len = binary.length;
            for (let i = 0; i < len; i++) {
                layer.data[i] = binary.charCodeAt(i);
            }
        }
        return layer;
    }
}
