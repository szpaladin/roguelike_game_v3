import { GAME_CONFIG, TILE, ENTITY } from '../js/config.js';

describe('Game Configuration', () => {
    test('contains required game parameters', () => {
        expect(GAME_CONFIG.TILE_SIZE).toBeDefined();
        expect(GAME_CONFIG.CHUNK_SIZE).toBeDefined();
        expect(GAME_CONFIG.MAP_WIDTH).toBeDefined();
        expect(GAME_CONFIG.AUTO_SCROLL_SPEED).toBeDefined();
    });

    test('has correct tile types', () => {
        expect(TILE.WALL).toBe(0);
        expect(TILE.FLOOR).toBe(1);
    });

    test('has correct entity types', () => {
        expect(ENTITY.PLAYER).toBe('player');
        expect(ENTITY.ENEMY).toBe('enemy');
        expect(ENTITY.CHEST).toBe('chest');
    });
});
