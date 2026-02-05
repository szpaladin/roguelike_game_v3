import EnemySpawner from '../../js/enemies/EnemySpawner.js';
import { GAME_CONFIG } from '../../js/config.js';

describe('EnemySpawner', () => {
    let spawner;

    beforeEach(() => {
        spawner = new EnemySpawner();
    });

    test('initializes with default values', () => {
        expect(spawner.lastSpawnY).toBe(0);
        expect(spawner.baseSpawnInterval).toBe(GAME_CONFIG.SPAWN_INTERVAL);
    });

    test('spawn returns null if interval not reached', () => {
        spawner.lastSpawnY = 100;
        const enemy = spawner.spawn(150, { x: 0, y: 0 }); // distance 150, player at 0
        expect(enemy).toBeNull();
    });

    test('spawn returns enemy if interval reached', () => {
        spawner.lastSpawnY = 0;
        const enemy = spawner.spawn(300, { x: 300, y: 300 }); // interval is 200
        expect(enemy).not.toBeNull();
        expect(spawner.lastSpawnY).toBe(300);
    });

    test('spawned enemy is at appropriate position', () => {
        const playerPos = { x: 300, y: 300 };
        const scrollY = 0;
        const enemy = spawner.spawn(300, playerPos);

        // Enemy should be spawned ahead of player (higher Y value in world space)
        // In this game, Y increases downwards, but scroll is negative/positive?
        // Let's check original game.js spawn logic:
        // const spawnY = state.scrollY + canvas.height + 50;
        // const spawnX = Math.random() * canvas.width;

        expect(enemy.y).toBeGreaterThan(scrollY);
    });
});
