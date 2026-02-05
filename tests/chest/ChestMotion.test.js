import ChestManager from '../../js/chest/ChestManager.js';
import { jest } from '@jest/globals';

describe('ChestManager motion', () => {
    test('spawn clamps to top safe margin', () => {
        const manager = new ChestManager({ showChestMenu: jest.fn() }, { width: 600, height: 600 });
        manager.lastScrollY = 100;
        manager.lastScrollDelta = 1;

        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
        manager.spawnChest(200, 120);
        const chest = manager.chests[0];

        expect(chest.y).toBeGreaterThanOrEqual(180);
        randomSpy.mockRestore();
    });

    test('chest transitions to drift after drop phase', () => {
        const manager = new ChestManager({ showChestMenu: jest.fn() }, { width: 600, height: 600 });
        manager.lastScrollY = 100;
        manager.lastScrollDelta = 1;

        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        manager.spawnChest(200, 220);
        const chest = manager.chests[0];

        const player = { x: 9999, y: 9999, radius: 1 };
        for (let i = 0; i < 80; i++) {
            manager.update(player, 100, () => { });
        }

        expect(chest.phase).toBe('drift');
        randomSpy.mockRestore();
    });
});
