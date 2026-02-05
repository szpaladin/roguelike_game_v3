import PlagueSystem from '../../js/effects/PlagueSystem.js';
import Enemy from '../../js/enemies/Enemy.js';
import { STATUS_EFFECTS } from '../../js/enemies/StatusEffects.js';

const createEnemy = (x, y) => new Enemy(x, y, {
    name: 'Test',
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 0,
    speed: 1,
    radius: 10,
    color: '#888888',
    exp: 1,
    gold: 1
});

const applyPlague = (enemy) => {
    enemy.applyStatusEffect('plagued', 600, {
        damagePerStack: 2 / 60,
        stacks: 1,
        baseDuration: 600,
        color: '#6f7a66'
    });
};

describe('PlagueSystem', () => {
    test('spreads plague to nearby enemies on interval', () => {
        const system = new PlagueSystem();
        const source = createEnemy(0, 0);
        const target = createEnemy(100, 0);
        applyPlague(source);

        const enemies = [source, target];
        const interval = STATUS_EFFECTS.PLAGUED.spreadInterval;

        for (let i = 0; i < interval; i++) {
            system.update(enemies);
        }

        expect(target.statusEffects.hasEffect('plagued')).toBe(true);
    });

    test('does not spread plague beyond radius', () => {
        const system = new PlagueSystem();
        const source = createEnemy(0, 0);
        const target = createEnemy(300, 0);
        applyPlague(source);

        const enemies = [source, target];
        const interval = STATUS_EFFECTS.PLAGUED.spreadInterval;

        for (let i = 0; i < interval; i++) {
            system.update(enemies);
        }

        expect(target.statusEffects.hasEffect('plagued')).toBe(false);
    });

    test('death cloud spreads plague after death', () => {
        const system = new PlagueSystem();
        const source = createEnemy(0, 0);
        const target = createEnemy(80, 0);
        applyPlague(source);

        system.spawnDeathCloud(source);
        const interval = STATUS_EFFECTS.PLAGUED.deathCloudInterval;

        for (let i = 0; i < interval; i++) {
            system.update([target]);
        }

        expect(target.statusEffects.hasEffect('plagued')).toBe(true);
    });

    test('death cloud respects cloud radius from effect params', () => {
        const system = new PlagueSystem();
        const source = createEnemy(0, 0);
        source.applyStatusEffect('plagued', 600, {
            damagePerStack: 2 / 60,
            stacks: 1,
            baseDuration: 600,
            color: '#6f7a66',
            cloudRadius: 120
        });

        system.spawnDeathCloud(source);
        expect(system.clouds.length).toBe(1);
        expect(system.clouds[0].radius).toBe(120);
    });
});
