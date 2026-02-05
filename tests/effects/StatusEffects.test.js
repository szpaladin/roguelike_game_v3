import { STATUS_EFFECTS, STATUS_TYPE } from '../../js/enemies/StatusEffects.js';

describe('StatusEffects', () => {
    test('ridge control definition exists', () => {
        const ridge = STATUS_EFFECTS.RIDGE_CONTROL;
        expect(ridge).toBeDefined();
        expect(ridge.id).toBe('ridge_control');
        expect(ridge.name).toBe('岩脊带控场');
        expect(ridge.type).toBe(STATUS_TYPE.DEBUFF);
        expect(ridge.defaultDuration).toBe(120);
        expect(ridge.defaultLength).toBe(90);
        expect(ridge.defaultWidth).toBe(18);
        expect(ridge.defaultSlowAmount).toBe(0.3);
        expect(ridge.defaultSlowDuration).toBe(120);
    });

    test('abyss sacrifice definition exists', () => {
        const sacrifice = STATUS_EFFECTS.ABYSS_SACRIFICE;
        expect(sacrifice).toBeDefined();
        expect(sacrifice.id).toBe('abyss_sacrifice');
        expect(sacrifice.name).toBe('海渊献祭');
        expect(sacrifice.type).toBe(STATUS_TYPE.DEBUFF);
        expect(sacrifice.defaultDuration).toBe(600);
        expect(sacrifice.defaultHeal).toBe(2);
    });
});
