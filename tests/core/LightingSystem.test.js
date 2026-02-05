/**
 * LightingSystem 单元测试
 */
import LightingSystem from '../../js/core/LightingSystem.js';

describe('LightingSystem', () => {
    let lighting;

    beforeEach(() => {
        lighting = new LightingSystem();
    });

    describe('外部透明度设置', () => {
        test('setTargetAlpha 应该设置目标透明度', () => {
            lighting.setTargetAlpha(0.5);
            expect(lighting.targetAlpha).toBe(0.5);
        });
    });

    describe('平滑过渡', () => {
        test('update 应该向目标透明度过渡', () => {
            lighting.setTargetAlpha(0.7);
            lighting.update(1); // 1秒，过渡速度0.5
            expect(lighting.currentAlpha).toBe(0.5);
        });

        test('currentAlpha 不应超过 targetAlpha', () => {
            lighting.setTargetAlpha(0.3);
            lighting.update(2); // 2秒，过渡1.0
            expect(lighting.currentAlpha).toBe(0.3);
        });

        test('reset 应该重置所有状态', () => {
            lighting.currentAlpha = 0.5;
            lighting.targetAlpha = 0.7;
            lighting.reset();
            expect(lighting.currentAlpha).toBe(0);
            expect(lighting.targetAlpha).toBe(0);
        });
    });
});
