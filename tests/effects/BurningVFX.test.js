import BurningVFX from '../../js/effects/BurningVFX.js';

const createEnemy = (radius = 10) => ({
    x: 0,
    y: 0,
    radius
});

describe('BurningVFX', () => {
    test('creates particle count based on radius', () => {
        const enemy = createEnemy(10);
        const vfx = new BurningVFX(enemy, '#ff5500');
        expect(vfx.particles.length).toBe(7);
    });

    test('caps particle count at 16', () => {
        const enemy = createEnemy(50);
        const vfx = new BurningVFX(enemy, '#ff5500');
        expect(vfx.particles.length).toBe(16);
    });

    test('respawns particles that drift above head', () => {
        const enemy = createEnemy(10);
        const vfx = new BurningVFX(enemy, '#ff5500');
        vfx.particles[0].y = -enemy.radius * 1.3;
        vfx.update(enemy, { color: '#ff5500' });
        expect(vfx.particles[0].y).toBeGreaterThan(-enemy.radius * 1.2);
    });
});
