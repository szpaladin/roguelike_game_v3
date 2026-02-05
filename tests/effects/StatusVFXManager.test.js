import StatusVFXManager from '../../js/effects/StatusVFXManager.js';
import StatusEffectManager from '../../js/enemies/StatusEffectManager.js';

const createEnemy = (radius = 10) => ({
    x: 0,
    y: 0,
    radius,
    hp: 10,
    isDead: false,
    statusEffects: new StatusEffectManager()
});

describe('StatusVFXManager', () => {
    test('creates burning vfx when burning is active', () => {
        const enemy = createEnemy();
        enemy.statusEffects.applyEffect('burning', 60, { color: '#ff5500', damagePerFrame: 0.1 });

        const manager = new StatusVFXManager();
        manager.update([enemy]);

        const effects = manager.enemyEffects.get(enemy);
        expect(effects).toBeDefined();
        expect(effects.has('burning')).toBe(true);
    });

    test('dark flame overrides burning vfx when both are active', () => {
        const enemy = createEnemy();
        enemy.statusEffects.applyEffect('burning', 60, { color: '#ff5500', damagePerFrame: 0.1 });
        enemy.statusEffects.applyEffect('dark_flame', 60, { color: '#2b153a', damagePerFrame: 0.04 });

        const manager = new StatusVFXManager();
        manager.update([enemy]);

        const effects = manager.enemyEffects.get(enemy);
        expect(effects).toBeDefined();
        expect(effects.has('dark_flame')).toBe(true);
        expect(effects.has('burning')).toBe(false);
    });

    test('creates poisoned and frozen vfx when active', () => {
        const enemy = createEnemy();
        enemy.statusEffects.applyEffect('poisoned', 60, { color: '#00ff00', damagePerStack: 0.1, stacks: 1 });
        enemy.statusEffects.applyEffect('frozen', 60, { color: '#00ffff', slowAmount: 1 });

        const manager = new StatusVFXManager();
        manager.update([enemy]);

        const effects = manager.enemyEffects.get(enemy);
        expect(effects).toBeDefined();
        expect(effects.has('poisoned')).toBe(true);
        expect(effects.has('frozen')).toBe(true);
    });

    test('creates plagued vfx when active', () => {
        const enemy = createEnemy();
        enemy.statusEffects.applyEffect('plagued', 60, { color: '#6f7a66', damagePerStack: 0.1, stacks: 1 });

        const manager = new StatusVFXManager();
        manager.update([enemy]);

        const effects = manager.enemyEffects.get(enemy);
        expect(effects).toBeDefined();
        expect(effects.has('plagued')).toBe(true);
    });

    test('removes vfx when burning ends', () => {
        const enemy = createEnemy();
        enemy.statusEffects.applyEffect('burning', 60, { color: '#ff5500', damagePerFrame: 0.1 });

        const manager = new StatusVFXManager();
        manager.update([enemy]);
        enemy.statusEffects.removeEffect('burning');
        manager.update([enemy]);

        const effects = manager.enemyEffects.get(enemy);
        expect(effects).toBeUndefined();
    });

    test('prunes effects when enemy is gone', () => {
        const enemy = createEnemy();
        enemy.statusEffects.applyEffect('burning', 60, { color: '#ff5500', damagePerFrame: 0.1 });

        const manager = new StatusVFXManager();
        manager.update([enemy]);
        manager.update([]);

        expect(manager.enemyEffects.size).toBe(0);
    });

    test('removes effects when enemy is dead', () => {
        const enemy = createEnemy();
        enemy.statusEffects.applyEffect('burning', 60, { color: '#ff5500', damagePerFrame: 0.1 });

        const manager = new StatusVFXManager();
        manager.update([enemy]);
        enemy.hp = 0;
        manager.update([enemy]);

        expect(manager.enemyEffects.size).toBe(0);
    });
});
