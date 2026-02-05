import Enemy from '../../js/enemies/Enemy.js';

describe('Enemy', () => {
    let enemyData;
    let enemy;

    beforeEach(() => {
        enemyData = {
            name: '测试敌人',
            hp: 100,
            maxHp: 100,
            attack: 10,
            defense: 2,
            speed: 1,
            radius: 10,
            color: '#ff0000'
        };
        enemy = new Enemy(50, 50, enemyData);
    });

    test('initializes with correct data', () => {
        expect(enemy.x).toBe(50);
        expect(enemy.y).toBe(50);
        expect(enemy.name).toBe('测试敌人');
        expect(enemy.hp).toBe(100);
        expect(enemy.attack).toBe(10);
    });

    test('takeDamage reduces hp correctly', () => {
        enemy.takeDamage(20);
        expect(enemy.hp).toBe(82); // 100 - (20 - 2)
    });

    test('applyStatusEffects updates status flags', () => {
        enemy.applyBurn(100, 5);
        expect(enemy.burning).toBe(true);
        // statusEffects managed by StatusEffectManager

        enemy.applyFreeze(60);
        expect(enemy.frozen).toBe(true);
    });

    test('update moves enemy towards player if not frozen', () => {
        const playerPos = { x: 100, y: 100 };
        const initialX = enemy.x;
        const initialY = enemy.y;

        enemy.update(playerPos, 0, false);

        expect(enemy.x).toBeGreaterThan(initialX);
        expect(enemy.y).toBeGreaterThan(initialY);
    });

    test('update does not move enemy if frozen', () => {
        enemy.applyFreeze(60);
        const initialX = enemy.x;

        enemy.update({ x: 100, y: 100 }, 0, false);
        expect(enemy.x).toBe(initialX);
    });

    test('poison deals damage over time', () => {
        // Poison now managed by StatusEffectManager
        // It deals damage per update based on stacks
        enemy.applyPoison(60, 1); // 1 damage per stack per frame 

        const initialHp = enemy.hp;
        enemy.update({ x: 50, y: 50 }, 0, false);

        // Poison deals damage (exact amount depends on StatusEffect implementation)
        expect(enemy.hp).toBeLessThan(initialHp);
    });

    test('poison stacks have independent durations', () => {
        enemy.applyPoison(3, 1);
        enemy.update({ x: 50, y: 50 }, 0, false);
        enemy.applyPoison(3, 1);

        enemy.update({ x: 50, y: 50 }, 0, false);
        enemy.update({ x: 50, y: 50 }, 0, false);

        const effect = enemy.statusEffects.getEffect('poisoned');
        expect(effect.getStackCount()).toBe(1);
    });

    test('radiation vulnerability stacks up to cap', () => {
        enemy.applyStatusEffect('radiation_vulnerable', 600, { vulnerabilityAmount: 0.1, stacks: 1 });
        for (let i = 0; i < 10; i++) {
            enemy.applyStatusEffect('radiation_vulnerable', 600, { vulnerabilityAmount: 0.1, stacks: 1 });
        }

        const multiplier = enemy.statusEffects.getVulnerabilityMultiplier();
        expect(multiplier).toBeCloseTo(1 + 0.1 * 5);
    });

    test('curse consumes stacks and triggers bonus damage on hit', () => {
        enemy.applyStatusEffect('cursed', 1800, {
            stacks: 2,
            consumeStacks: 1,
            damageMultiplier: 1.5,
            intMultiplier: 2
        });

        enemy.takeDamage(10);

        expect(enemy.hp).toBe(68); // (10-2)=8; bonus 8*1.5*2=24; total 32
        const curse = enemy.statusEffects.getEffect('cursed');
        expect(curse.getStackCount()).toBe(1);
    });

    test('curse does not trigger on curse damage and triggers on dot', () => {
        enemy.applyStatusEffect('cursed', 1800, {
            stacks: 1,
            consumeStacks: 1,
            damageMultiplier: 1.5,
            intMultiplier: 2
        });

        enemy.takeDamage(10, { source: 'curse' });
        const remainingAfterCurseHit = enemy.statusEffects.getEffect('cursed');
        expect(remainingAfterCurseHit.getStackCount()).toBe(1);

        enemy.applyBurn(10, 1);
        const hpBeforeDot = enemy.hp;
        enemy.update({ x: 50, y: 50 }, 0, false);
        expect(enemy.hp).toBeLessThan(hpBeforeDot);
        expect(enemy.statusEffects.hasEffect('cursed')).toBe(false);
    });
});
