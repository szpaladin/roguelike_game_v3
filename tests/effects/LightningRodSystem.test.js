import LightningRodSystem from '../../js/effects/LightningRodSystem.js';
import Enemy from '../../js/enemies/Enemy.js';

const createEnemy = (x, y) => new Enemy(x, y, {
    name: 'Test',
    hp: 100,
    maxHp: 100,
    attack: 1,
    defense: 0,
    speed: 1,
    radius: 10,
    color: '#888888',
    exp: 1,
    gold: 1
});

describe('LightningRodSystem', () => {
    test('triggers strikes on interval and removes effect after last strike', () => {
        const system = new LightningRodSystem();
        const enemy = createEnemy(0, 0);

        enemy.applyStatusEffect('lightning_rod', 180, {
            interval: 1,
            strikesRemaining: 3,
            damage: 1,
            chainCount: 0,
            chainRange: 0,
            statusPayload: {}
        });

        const enemies = [enemy];

        system.update(enemies);
        system.update(enemies);
        system.update(enemies);

        expect(enemy.hp).toBe(97);
        expect(enemy.statusEffects.hasEffect('lightning_rod')).toBe(false);
    });

    test('chains lightning and applies other statuses without reapplying lightning rod', () => {
        const system = new LightningRodSystem();
        const source = createEnemy(0, 0);
        const target = createEnemy(50, 0);

        source.applyStatusEffect('lightning_rod', 180, {
            interval: 1,
            strikesRemaining: 1,
            damage: 1,
            chainCount: 1,
            chainRange: 200,
            statusPayload: {
                burnDuration: 60,
                burnDamagePerFrame: 0.1,
                lightningRodDuration: 60,
                lightningRodInterval: 1,
                lightningRodStrikes: 3
            }
        });

        const enemies = [source, target];
        system.update(enemies);

        expect(target.statusEffects.hasEffect('burning')).toBe(true);
        expect(target.statusEffects.hasEffect('lightning_rod')).toBe(false);
    });
});
