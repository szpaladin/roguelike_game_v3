import { ENEMY_TYPES, ENEMY_SPAWN_CONFIG, getEnemyType, getEnemyTypeByName, getMaxEnemyTier, getRandomEnemyType } from '../../js/enemies/EnemiesData.js';

describe('EnemiesData', () => {
    test('ENEMY_TYPES is an array', () => {
        expect(Array.isArray(ENEMY_TYPES)).toBe(true);
        expect(ENEMY_TYPES.length).toBeGreaterThan(0);
    });

    test('getEnemyType returns correct type by index', () => {
        const type = getEnemyType(0);
        expect(type.name).toBe('狮子鱼');
        expect(type.hp).toBeDefined();
    });

    test('getEnemyType returns null for invalid index', () => {
        expect(getEnemyType(-1)).toBeNull();
        expect(getEnemyType(999)).toBeNull();
    });

    test('getEnemyTypeByName returns correct type by name', () => {
        const type = getEnemyTypeByName('狮子鱼');
        expect(type.name).toBe('狮子鱼');
    });

    test('getEnemyTypeByName returns sea horse', () => {
        const type = getEnemyTypeByName('海马');
        expect(type.name).toBe('海马');
    });

    test('getEnemyTypeByName returns null for invalid name', () => {
        expect(getEnemyTypeByName('不存在的敌人')).toBeNull();
    });

    test('getMaxEnemyTier returns correct tier based on distance', () => {
        // Using production thresholds: 0->0, 500->1, 1500->2, 3000->3, 5000->4
        expect(getMaxEnemyTier(0)).toBe(0);
        // 泰坦扳机鱼 available at 500 distance
        expect(getMaxEnemyTier(500)).toBe(1);
        // 三齿鲨 available at 5000 distance
        expect(getMaxEnemyTier(5000)).toBe(4);
        // Large distance still returns max tier
        expect(getMaxEnemyTier(10000)).toBe(4);
    });

    test('getRandomEnemyType returns a valid enemy type', () => {
        const type = getRandomEnemyType(0);
        expect(['狮子鱼', '海马']).toContain(type.name);

        const typeHigh = getRandomEnemyType(100);
        expect(ENEMY_TYPES).toContainEqual(expect.objectContaining({ name: typeHigh.name }));
    });
});
