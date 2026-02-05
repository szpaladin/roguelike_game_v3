export default class AssetManager {
    constructor() {
        this.images = new Map();
    }

    loadImage(entry) {
        if (!entry || !entry.id || !entry.src) {
            return Promise.resolve({ ok: false, id: entry ? entry.id : null });
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(entry.id, img);
                resolve({ ok: true, id: entry.id, img });
            };
            img.onerror = () => {
                resolve({ ok: false, id: entry.id, img: null });
            };
            img.src = entry.src;
        });
    }

    async loadImages(entries = []) {
        const list = Array.isArray(entries) ? entries : [];
        const results = await Promise.all(list.map((entry) => this.loadImage(entry)));
        return results;
    }

    getImage(id) {
        return this.images.get(id) || null;
    }
}

export const ASSET_MANAGER = new AssetManager();
