import PoisonVFX from '../../js/effects/PoisonVFX.js';

const createEnemy = (radius = 10) => ({
    x: 0,
    y: 0,
    radius
});

describe('PoisonVFX', () => {
    test('creates particle count based on radius', () => {
        const enemy = createEnemy(10);
        const vfx = new PoisonVFX(enemy, '#00ff00');
        expect(vfx.particles.length).toBe(7);
    });

    test('applies stack bonus within cap', () => {
        const enemy = createEnemy(10);
        const vfx = new PoisonVFX(enemy, '#00ff00');
        vfx.update(enemy, { stacks: 11, color: '#00ff00', getProgress: () => 1 });
        expect(vfx.particles.length).toBeGreaterThanOrEqual(7);
        expect(vfx.particles.length).toBeLessThanOrEqual(16);
    });

    test('respawns particles that drift above head', () => {
        const enemy = createEnemy(10);
        const vfx = new PoisonVFX(enemy, '#00ff00');
        vfx.particles[0].y = -enemy.radius * 1.2;
        vfx.update(enemy, { stacks: 1, color: '#00ff00', getProgress: () => 1 });
        expect(vfx.particles[0].y).toBeGreaterThan(-enemy.radius * 1.1);
    });
});
