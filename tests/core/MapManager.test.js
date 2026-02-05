import MapManager from '../../js/core/MapManager.js';
import { GAME_CONFIG, TILE } from '../../js/config.js';

describe('MapManager', () => {
    let manager;

    beforeEach(() => {
        manager = new MapManager();
    });

    test('initializes with a set of map chunks', () => {
        manager.initMap();
        expect(manager.mapChunks.length).toBeGreaterThan(0);
        expect(manager.mapChunks[0].tiles.length).toBe(GAME_CONFIG.CHUNK_SIZE);
    });

    test('generates new chunks as player scrolls', () => {
        manager.initMap();
        const initialLastY = manager.lastChunkY;

        // Use a value that triggers generation but NOT aggressive cleanup
        // Threshold is (40 + 20) * 30 = 1800.
        // Cleanup threshold for chunk 0 is scale dependent.
        // If we scroll to 1500, top is 50, chunk at 0 is removed.
        // Let's scroll just enough: 1300 + 600 = 1900.
        manager.update(1300, 600);

        expect(manager.lastChunkY).toBeGreaterThan(initialLastY);
    });

    test('cleanup removes old chunks when scrolling far', () => {
        manager.initMap();
        manager.update(5000, 600); // 5000/30 = 166. Chunks at 0, 20, 40 should be gone.

        const hasOldChunk = manager.mapChunks.some(c => c.y < 100);
        expect(hasOldChunk).toBe(false);
    });

    test('getTileAt returns correct tile type', () => {
        manager.initMap();
        const chunk = manager.mapChunks[0];
        const tile = manager.getTileAt(0, chunk.y);
        expect(tile).toBeDefined();
        expect([TILE.FLOOR, TILE.WALL]).toContain(tile);
    });
});
