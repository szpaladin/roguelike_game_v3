import { WEAPONS, WEAPON_ID_MAP, getWeaponInfo, getWeaponIdByOrder } from '../../js/weapons/WeaponsData.js';

describe('WeaponsData', () => {
    test('WEAPONS contains basic weapons', () => {
        expect(WEAPONS.BASIC).toBeDefined();
        expect(WEAPONS.FIRE).toBeDefined();
        expect(WEAPONS.FROST).toBeDefined();
        expect(WEAPONS.BASIC.name).toBe('普通弹珠');
    });

    test('WEAPONS contains evolution weapons', () => {
        expect(WEAPONS.BOMB).toBeDefined();
        expect(WEAPONS.STORM).toBeDefined();
    });

    test('getWeaponInfo returns correct info', () => {
        const info = getWeaponInfo('fire');
        expect(info.name).toBe('火焰');
        expect(info.id).toBe('fire');
    });

    test('getWeaponIdByOrder returns correct id', () => {
        expect(getWeaponIdByOrder(0)).toBe('basic');
        expect(getWeaponIdByOrder(1)).toBe('fire');
    });

    test('abyss wraith and updated ghost fire definitions', () => {
        expect(WEAPONS.ABYSS_WRAITH).toBeDefined();
        expect(WEAPONS.ABYSS_WRAITH.abyssSacrificeDuration).toBe(600);
        expect(WEAPONS.ABYSS_WRAITH.abyssSacrificeHeal).toBe(2);
        expect(WEAPONS.ABYSS_WRAITH.piercing).toBe(true);

        expect(WEAPONS.GHOST_FIRE.damage).toBe(0.5);
        expect(WEAPONS.GHOST_FIRE.darkFlameDuration).toBe(1800);
        expect(WEAPONS.GHOST_FIRE.burnDuration).toBeUndefined();
    });

    test('soul drain includes abyss sacrifice fields', () => {
        expect(WEAPONS.SOUL_DRAIN.abyssSacrificeDuration).toBe(600);
        expect(WEAPONS.SOUL_DRAIN.abyssSacrificeHeal).toBe(2);
    });

    test('high temperature ray definition is updated', () => {
        expect(WEAPONS.HIGH_TEMPERATURE_RAY).toBeDefined();
        expect(WEAPONS.HIGH_TEMPERATURE_RAY.id).toBe('high_temperature_ray');
        expect(WEAPONS.HIGH_TEMPERATURE_RAY.damage).toBe(3.5);
        expect(WEAPONS.HIGH_TEMPERATURE_RAY.interval).toBe(45);
        expect(WEAPONS.HIGH_TEMPERATURE_RAY.radius).toBe(6);
        expect(WEAPONS.HIGH_TEMPERATURE_RAY.burnDuration).toBeUndefined();
    });

    test('holy heal definition is updated', () => {
        expect(WEAPONS.HOLY_HEAL).toBeDefined();
        expect(WEAPONS.HOLY_HEAL.id).toBe('holy_heal');
        expect(WEAPONS.HOLY_HEAL.damage).toBe(0.1);
        expect(WEAPONS.HOLY_HEAL.lifeStealChance).toBe(0.21);
        expect(WEAPONS.HOLY_HEAL.blindChance).toBeUndefined();
    });
});
