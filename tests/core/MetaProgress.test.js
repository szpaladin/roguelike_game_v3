/**
 * MetaProgress 单元测试（基于新的持久化结构）
 */

// 简单的 localStorage mock
const mockStorage = {};
global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => { mockStorage[key] = value; },
    clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); },
    removeItem: (key) => { delete mockStorage[key]; }
};

import MetaProgress from '../../js/core/MetaProgress.js';

describe('MetaProgress', () => {
    let metaProgress;

    beforeEach(() => {
        localStorage.clear();
        metaProgress = new MetaProgress();
    });

    describe('初始化', () => {
        test('应该创建默认数据结构', () => {
            const progress = metaProgress.getProgress();
            expect(progress.gold).toBe(0);
            expect(progress.upgrades).toEqual({ maxHp: 0, strength: 0, intelligence: 0 });
            expect(progress.stats.runs).toBe(0);
            expect(progress.stats.bestDepth).toBe(0);
            expect(progress.unlockedWeapons).toEqual([]);
            expect(progress.inventory).toBeDefined();
            expect(progress.loadout).toBeDefined();
            expect(progress.pendingLoot).toEqual([]);
        });
    });

    describe('撤离成功', () => {
        test('应该100%保留金币', () => {
            const result = metaProgress.processEvacuation({ gold: 100, distance: 1000 });

            expect(result.goldEarned).toBe(100);
            expect(result.penaltyApplied).toBe(false);
            expect(metaProgress.getProgress().gold).toBe(100);
        });

        test('应该更新最远距离记录', () => {
            metaProgress.processEvacuation({ gold: 50, distance: 500 });
            metaProgress.processEvacuation({ gold: 50, distance: 800 });

            expect(metaProgress.getProgress().stats.bestDepth).toBe(800);
        });

        test('应该解锁新武器', () => {
            metaProgress.processEvacuation({
                gold: 100,
                distance: 1000,
                weapons: ['燃霜', '毒雾']
            });

            expect(metaProgress.getProgress().unlockedWeapons).toContain('燃霜');
            expect(metaProgress.getProgress().unlockedWeapons).toContain('毒雾');
        });

        test('应该增加成功撤离次数', () => {
            metaProgress.processEvacuation({ gold: 100, distance: 1000 });
            metaProgress.processEvacuation({ gold: 100, distance: 1000 });

            expect(metaProgress.getProgress().stats.successfulEvacuations).toBe(2);
            expect(metaProgress.getProgress().stats.runs).toBe(2);
        });
    });

    describe('死亡惩罚', () => {
        test('应该损失50%金币', () => {
            const result = metaProgress.processDeath({ gold: 100, distance: 1000 }, 0.5);

            expect(result.goldEarned).toBe(50);
            expect(result.goldLost).toBe(50);
            expect(result.penaltyApplied).toBe(true);
        });

        test('死亡时不应该解锁武器', () => {
            metaProgress.processDeath({
                gold: 100,
                distance: 1000,
                weapons: ['燃霜']
            }, 0.5);

            expect(metaProgress.getProgress().unlockedWeapons).toEqual([]);
        });

        test('死亡仍应更新最远距离', () => {
            metaProgress.processDeath({ gold: 100, distance: 2000 }, 0.5);

            expect(metaProgress.getProgress().stats.bestDepth).toBe(2000);
        });

        test('死亡不应增加成功撤离次数', () => {
            metaProgress.processDeath({ gold: 100, distance: 1000 }, 0.5);

            expect(metaProgress.getProgress().stats.successfulEvacuations).toBe(0);
            expect(metaProgress.getProgress().stats.runs).toBe(1);
        });
    });

    describe('重置', () => {
        test('重置应该清空所有数据', () => {
            metaProgress.processEvacuation({ gold: 100, distance: 1000 });
            metaProgress.reset();

            expect(metaProgress.getProgress().gold).toBe(0);
        });
    });
});
