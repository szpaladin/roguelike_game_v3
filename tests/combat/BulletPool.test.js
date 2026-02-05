import BulletPool from '../../js/combat/BulletPool.js';

describe('BulletPool', () => {
    let pool;

    beforeEach(() => {
        pool = new BulletPool(10);
    });

    test('initializes with specified size', () => {
        expect(pool.pool.length).toBe(10);
    });

    test('spawnBullet returns active bullet', () => {
        const bullet = pool.spawnBullet({
            x: 0, y: 0, vx: 1, vy: 0, damage: 10, radius: 5, lifetime: 60
        });
        expect(bullet.active).toBe(true);
    });

    test('getActiveBullets returns only active bullets', () => {
        pool.spawnBullet({ x: 0, y: 0, vx: 1, vy: 0, damage: 10, radius: 5, lifetime: 60 });
        pool.spawnBullet({ x: 0, y: 0, vx: 1, vy: 0, damage: 10, radius: 5, lifetime: 60 });
        expect(pool.getActiveBullets().length).toBe(2);
    });

    test('clear deactivates all bullets', () => {
        pool.spawnBullet({ x: 0, y: 0, vx: 1, vy: 0, damage: 10, radius: 5, lifetime: 60 });
        pool.clear();
        expect(pool.getActiveBullets().length).toBe(0);
    });

    test('pool expands when needed', () => {
        for (let i = 0; i < 15; i++) {
            pool.spawnBullet({ x: 0, y: 0, vx: 1, vy: 0, damage: 10, radius: 5, lifetime: 60 });
        }
        expect(pool.pool.length).toBeGreaterThan(10);
    });
});
