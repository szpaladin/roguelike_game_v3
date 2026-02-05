/**
 * OxygenSystem 单元测试
 */
import OxygenSystem from '../../js/core/OxygenSystem.js';

describe('OxygenSystem', () => {
    let system;

    beforeEach(() => {
        system = new OxygenSystem(4, 1); // 默认4秒间隔，每次1点伤害
    });

    describe('基础消耗', () => {
        test('计时器应该正确累加', () => {
            let damageReceived = 0;
            const mockStats = { takeDamage: (dmg) => { damageReceived += dmg; } };
            system.update(1, mockStats);
            expect(system.timer).toBe(1);
        });

        test('达到间隔时应该扣除氧气', () => {
            let damageReceived = 0;
            const mockStats = { takeDamage: (dmg) => { damageReceived += dmg; } };

            // 模拟4秒过去
            for (let i = 0; i < 4; i++) {
                system.update(1, mockStats);
            }

            expect(damageReceived).toBe(1);
        });

        test('reset应该重置计时器', () => {
            system.timer = 3.5;
            system.reset();
            expect(system.timer).toBe(0);
        });
    });

    describe('外部间隔设置', () => {
        test('setInterval 应该更新消耗间隔', () => {
            system.setInterval(2.5);
            expect(system.interval).toBe(2.5);
        });

        test('更新间隔后应该按新间隔消耗', () => {
            let damageReceived = 0;
            const mockStats = { takeDamage: (dmg) => { damageReceived += dmg; } };

            system.setInterval(2);

            // 模拟2秒过去
            for (let i = 0; i < 2; i++) {
                system.update(1, mockStats);
            }

            expect(damageReceived).toBe(1);
        });
    });
});
