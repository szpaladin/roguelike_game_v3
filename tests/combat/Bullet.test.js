import Bullet from '../../js/combat/Bullet.js';

describe('Bullet', () => {
    let bullet;
    const defaultData = {
        x: 100,
        y: 100,
        vx: 5,
        vy: 0,
        damage: 10,
        radius: 5,
        color: '#ff0',
        lifetime: 60
    };

    beforeEach(() => {
        bullet = new Bullet(defaultData);
    });

    test('initializes with correct values', () => {
        expect(bullet.x).toBe(100);
        expect(bullet.y).toBe(100);
        expect(bullet.vx).toBe(5);
        expect(bullet.vy).toBe(0);
        expect(bullet.damage).toBe(10);
        expect(bullet.radius).toBe(5);
        expect(bullet.active).toBe(true);
    });

    test('update moves bullet', () => {
        bullet.update();
        expect(bullet.x).toBe(105);
        expect(bullet.y).toBe(100);
        expect(bullet.lifetime).toBe(59);
    });

    test('bullet deactivates when lifetime expires', () => {
        bullet.lifetime = 1;
        bullet.update();
        expect(bullet.active).toBe(false);
    });

    test('reset reuses bullet correctly', () => {
        bullet.active = false;
        bullet.reset({ ...defaultData, x: 200 });
        expect(bullet.active).toBe(true);
        expect(bullet.x).toBe(200);
    });

    test('reset clears stale extra properties', () => {
        bullet.canSplit = true;
        bullet.splitCount = 2;
        bullet.reset({ ...defaultData, x: 150 });
        expect(bullet.canSplit).toBeUndefined();
        expect(bullet.splitCount).toBeUndefined();
    });
});
