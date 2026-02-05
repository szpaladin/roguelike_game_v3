import DarkFlameSystem from '../../js/effects/DarkFlameSystem.js';
import Enemy from '../../js/enemies/Enemy.js';
import { STATUS_EFFECTS } from '../../js/enemies/StatusEffects.js';

const createEnemy = (x, y, radius = 10) => new Enemy(x, y, {
    name: 'Test',
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 0,
    speed: 1,
    radius,
    color: '#888888',
    exp: 1,
    gold: 1
});

const applyDarkFlame = (enemy, options = {}) => {
    enemy.applyStatusEffect('dark_flame', options.duration || 1800, {
        damagePerFrame: options.damagePerFrame || 0.04,
        baseDuration: options.duration || 1800,
        spreadInterval: options.spreadInterval || STATUS_EFFECTS.DARK_FLAME.spreadInterval,
        contactPadding: options.contactPadding || STATUS_EFFECTS.DARK_FLAME.contactPadding,
        color: options.color || '#2b153a'
    });
};

describe('DarkFlameSystem', () => {
    test('spreads dark flame on contact after interval', () => {
        const system = new DarkFlameSystem();
        const source = createEnemy(0, 0);
        const target = createEnemy(20, 0);
        applyDarkFlame(source);

        const enemies = [source, target];
        const interval = STATUS_EFFECTS.DARK_FLAME.spreadInterval;

        for (let i = 0; i < interval; i++) {
            system.update(enemies);
        }

        expect(target.statusEffects.hasEffect('dark_flame')).toBe(true);
    });

    test('does not spread dark flame beyond contact distance', () => {
        const system = new DarkFlameSystem();
        const source = createEnemy(0, 0);
        const target = createEnemy(100, 0);
        applyDarkFlame(source);

        const enemies = [source, target];
        const interval = STATUS_EFFECTS.DARK_FLAME.spreadInterval;

        for (let i = 0; i < interval; i++) {
            system.update(enemies);
        }

        expect(target.statusEffects.hasEffect('dark_flame')).toBe(false);
    });
});
