import AssetManager from '../../js/assets/AssetManager.js';

describe('AssetManager', () => {
    const OriginalImage = global.Image;

    beforeEach(() => {
        class FakeImage {
            constructor() {
                this._src = '';
                this.onload = null;
                this.onerror = null;
            }

            set src(value) {
                this._src = value;
                if (this.onload) this.onload();
            }

            get src() {
                return this._src;
            }
        }

        global.Image = FakeImage;
    });

    afterEach(() => {
        global.Image = OriginalImage;
    });

    test('loadImages stores images by id', async () => {
        const manager = new AssetManager();
        const results = await manager.loadImages([
            { id: 'player', src: 'assets/player_placeholder.svg' }
        ]);

        expect(results[0].ok).toBe(true);
        expect(manager.getImage('player')).not.toBeNull();
    });
});
