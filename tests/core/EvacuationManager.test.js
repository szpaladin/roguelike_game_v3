/**
 * EvacuationManager 单元测试
 */
import EvacuationManager from '../../js/core/EvacuationManager.js';

describe('EvacuationManager', () => {
    let manager;

    beforeEach(() => {
        manager = new EvacuationManager();
    });

    describe('撤离点生成', () => {
        test('应该在达到间距时生成撤离点', () => {
            manager.updateSpawning(5000); // 达到第一个撤离点距离

            expect(manager.evacuationPoints.length).toBe(1);
        });

        test('不应该在未达到间距时生成撤离点', () => {
            manager.updateSpawning(4999);

            expect(manager.evacuationPoints.length).toBe(0);
        });

        test('应该正确生成多个撤离点', () => {
            manager.updateSpawning(5000);
            manager.updateSpawning(10000);
            manager.updateSpawning(15000);

            expect(manager.evacuationPoints.length).toBe(3);
        });
    });

    describe('撤离检测', () => {
        test('玩家进入撤离点应该开始撤离', () => {
            manager.spawnEvacuationPoint(0);
            const point = manager.evacuationPoints[0];

            // 模拟玩家在撤离点内
            const player = { x: point.x, y: point.y, radius: 10 };
            manager.update(player, 0, 0.1);

            expect(manager.isEvacuating).toBe(true);
        });

        test('玩家离开撤离点应该重置进度', () => {
            manager.spawnEvacuationPoint(0);
            const point = manager.evacuationPoints[0];

            // 进入撤离点
            const player = { x: point.x, y: point.y, radius: 10 };
            manager.update(player, 0, 0.1);
            expect(manager.isEvacuating).toBe(true);

            // 离开撤离点
            player.x = 9999;
            manager.update(player, 0, 0.1);
            expect(manager.isEvacuating).toBe(false);
            expect(manager.evacuationProgress).toBe(0);
        });

        test('停留足够时间应该触发撤离完成', () => {
            manager.spawnEvacuationPoint(0);
            const point = manager.evacuationPoints[0];
            const player = { x: point.x, y: point.y, radius: 10 };

            let evacuationCompleted = false;
            manager.setEvacuationCallback(() => {
                evacuationCompleted = true;
            });

            // 模拟3秒（每帧0.1秒，需要30帧）
            for (let i = 0; i < 35; i++) {
                manager.update(player, 0, 0.1);
            }

            expect(evacuationCompleted).toBe(true);
            expect(manager.evacuationProgress).toBe(1);
        });
    });

    describe('获取下一个撤离点距离', () => {
        test('应该正确计算到下一撤离点的距离', () => {
            const distanceToNext = manager.getDistanceToNextEvac(3000);

            // 下一个撤离点在5000，当前3000，差2000像素 = 200米
            expect(distanceToNext).toBe(200);
        });

        test('刚经过撤离点后应该显示到下一个的距离', () => {
            manager.updateSpawning(5000);
            const distanceToNext = manager.getDistanceToNextEvac(5500);

            // 下一个撤离点在10000，当前5500，差4500像素 = 450米
            expect(distanceToNext).toBe(450);
        });
    });

    describe('重置', () => {
        test('重置应该清空所有状态', () => {
            manager.updateSpawning(5000);
            manager.isEvacuating = true;
            manager.evacuationProgress = 0.5;

            manager.reset();

            expect(manager.evacuationPoints.length).toBe(0);
            expect(manager.isEvacuating).toBe(false);
            expect(manager.evacuationProgress).toBe(0);
            expect(manager.lastSpawnDistance).toBe(0);
        });
    });

    describe('撤离召唤机制', () => {
        test('requestEvacuation 应该添加待处理撤离请求', () => {
            manager.requestEvacuation(1000, 800);

            expect(manager.pendingEvacuations.length).toBe(1);
            expect(manager.pendingEvacuations[0].timer).toBe(5.0);
        });

        test('待处理撤离应该在5秒后生成撤离点', () => {
            manager.requestEvacuation(1000, 800);
            const player = { x: 0, y: 0 };

            // 模拟5.1秒过去（51次*0.1秒），避免浮点数精度问题
            for (let i = 0; i < 51; i++) {
                manager.update(player, 2000, 0.1);
            }

            expect(manager.pendingEvacuations.length).toBe(0);
            expect(manager.evacuationPoints.length).toBe(1);
        });

        test('待处理撤离在5秒前不应生成撤离点', () => {
            manager.requestEvacuation(1000, 800);
            const player = { x: 0, y: 0 };

            // 模拟4秒
            for (let i = 0; i < 40; i++) {
                manager.update(player, 0, 0.1);
            }

            expect(manager.pendingEvacuations.length).toBe(1);
            expect(manager.evacuationPoints.length).toBe(0);
        });

        test('可以同时存在多个待处理撤离', () => {
            manager.requestEvacuation(1000, 800);
            manager.requestEvacuation(2000, 800);

            expect(manager.pendingEvacuations.length).toBe(2);
        });

        test('重置应该清空待处理撤离', () => {
            manager.requestEvacuation(1000, 800);
            manager.reset();

            expect(manager.pendingEvacuations.length).toBe(0);
        });

        test('hasPendingEvacuation 应该正确返回状态', () => {
            expect(manager.hasPendingEvacuation()).toBe(false);

            manager.requestEvacuation(1000, 800);
            expect(manager.hasPendingEvacuation()).toBe(true);
        });
    });

    describe('撤离围攻机制', () => {
        test('setSiegeCallback 应该设置围攻回调', () => {
            let siegeTriggered = false;
            manager.setSiegeCallback(() => { siegeTriggered = true; });
            expect(manager.onSiegeTriggered).toBeDefined();
        });

        test('进入撤离区域首次应该触发围攻回调', () => {
            let siegeConfig = null;
            manager.setSiegeCallback((config) => { siegeConfig = config; });

            // 手动添加一个撤离点
            manager.evacuationPoints.push({
                x: 100, y: 100, radius: 40, active: true, pulsePhase: 0
            });

            const player = { x: 100, y: 100 };
            manager.update(player, 0, 0.1);

            expect(siegeConfig).not.toBeNull();
            expect(siegeConfig.waves).toBeDefined();
            expect(siegeConfig.enemyCount).toBeDefined();
        });

        test('离开再进入撤离区域应该重新触发围攻', () => {
            let triggerCount = 0;
            manager.setSiegeCallback(() => { triggerCount++; });

            manager.evacuationPoints.push({
                x: 100, y: 100, radius: 40, active: true, pulsePhase: 0
            });

            const playerIn = { x: 100, y: 100 };
            const playerOut = { x: 300, y: 300 };

            // 进入 -> 触发一次
            manager.update(playerIn, 0, 0.1);
            expect(triggerCount).toBe(1);

            // 离开
            manager.update(playerOut, 0, 0.1);

            // 重新进入 -> 再触发一次
            manager.update(playerIn, 0, 0.1);
            expect(triggerCount).toBe(2);
        });

        test('待在撤离区域内不应重复触发围攻', () => {
            let triggerCount = 0;
            manager.setSiegeCallback(() => { triggerCount++; });

            manager.evacuationPoints.push({
                x: 100, y: 100, radius: 40, active: true, pulsePhase: 0
            });

            const player = { x: 100, y: 100 };

            // 多次更新但不离开
            for (let i = 0; i < 10; i++) {
                manager.update(player, 0, 0.1);
            }

            expect(triggerCount).toBe(1); // 只触发一次
        });
    });
});

