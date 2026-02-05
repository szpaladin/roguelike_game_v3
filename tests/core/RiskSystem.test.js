/**
 * RiskSystem 单元测试
 */
import RiskSystem from '../../js/core/RiskSystem.js';

describe('RiskSystem', () => {
    let riskSystem;

    beforeEach(() => {
        riskSystem = new RiskSystem();
    });

    describe('风险区域配置', () => {
        test('getCurrentZone 应该在0-300m返回舒适区', () => {
            const zone = riskSystem.getCurrentZone(0);
            expect(zone.name).toBe('舒适区');
            expect(zone.enemyMultiplier).toBe(1.0);
            expect(zone.deathPenalty).toBe(0.40);

            const zone2 = riskSystem.getCurrentZone(299);
            expect(zone2.name).toBe('舒适区');
        });

        test('getCurrentZone 应该在300-500m返回危险区', () => {
            const zone = riskSystem.getCurrentZone(300);
            expect(zone.name).toBe('危险区');
            expect(zone.enemyMultiplier).toBe(1.5);
            expect(zone.deathPenalty).toBe(0.50);
        });

        test('getCurrentZone 应该在500-800m返回高危区', () => {
            const zone = riskSystem.getCurrentZone(500);
            expect(zone.name).toBe('高危区');
            expect(zone.enemyMultiplier).toBe(2.5);
            expect(zone.deathPenalty).toBe(0.65);
        });

        test('getCurrentZone 应该在800m+返回极限区', () => {
            const zone = riskSystem.getCurrentZone(800);
            expect(zone.name).toBe('极限区');
            expect(zone.enemyMultiplier).toBe(4.0);
            expect(zone.deathPenalty).toBe(0.80);
        });
    });

    describe('敌人强度计算', () => {
        test('getEnemyMultiplier 应该返回当前区域的敌人倍率', () => {
            expect(riskSystem.getEnemyMultiplier(200)).toBe(1.0);
            expect(riskSystem.getEnemyMultiplier(400)).toBe(1.5);
            expect(riskSystem.getEnemyMultiplier(600)).toBe(2.5);
            expect(riskSystem.getEnemyMultiplier(1000)).toBe(4.0);
        });

        test('getSpawnIntervalMultiplier 应该返回生成间隔倍率', () => {
            expect(riskSystem.getSpawnIntervalMultiplier(200)).toBe(1.0);
            expect(riskSystem.getSpawnIntervalMultiplier(800)).toBeLessThan(1.0);
        });
    });

    describe('死亡惩罚计算', () => {
        test('getDeathPenalty 应该返回当前区域的死亡惩罚', () => {
            expect(riskSystem.getDeathPenalty(200)).toBe(0.40);
            expect(riskSystem.getDeathPenalty(400)).toBe(0.50);
            expect(riskSystem.getDeathPenalty(600)).toBe(0.65);
            expect(riskSystem.getDeathPenalty(1000)).toBe(0.80);
        });

        test('getGoldRetention 应该返回金币保留比例', () => {
            expect(riskSystem.getGoldRetention(200)).toBeCloseTo(0.60, 2);
            expect(riskSystem.getGoldRetention(1000)).toBeCloseTo(0.20, 2);
        });
    });

    describe('氧气参数', () => {
        test('getOxygenInterval 应该返回当前区域的氧气间隔', () => {
            expect(riskSystem.getOxygenInterval(200)).toBe(4.0);
            expect(riskSystem.getOxygenInterval(400)).toBe(2.5);
            expect(riskSystem.getOxygenInterval(600)).toBe(1.5);
            expect(riskSystem.getOxygenInterval(1000)).toBe(0.8);
        });
    });

    describe('光照参数', () => {
        test('getLightingAlpha 应该返回当前区域的遮罩透明度', () => {
            expect(riskSystem.getLightingAlpha(200)).toBe(0.0);
            expect(riskSystem.getLightingAlpha(400)).toBe(0.2);
            expect(riskSystem.getLightingAlpha(600)).toBe(0.45);
            expect(riskSystem.getLightingAlpha(1000)).toBe(0.7);
        });
    });

    describe('围攻参数', () => {
        test('getSiegeConfig 应该返回围攻配置', () => {
            const siege1 = riskSystem.getSiegeConfig(200);
            expect(siege1.waves).toBe(1);
            expect(siege1.enemyCount).toBe(6);

            const siege4 = riskSystem.getSiegeConfig(1000);
            expect(siege4.waves).toBe(4);
            expect(siege4.enemyCount).toBe(30);
        });
    });
});
