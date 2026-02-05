import Weapon from '../../js/weapons/Weapon.js';
import { WEAPONS } from '../../js/weapons/WeaponsData.js';

describe('Weapon', () => {
    let weapon;

    beforeEach(() => {
        weapon = new Weapon(WEAPONS.FIRE);
    });

    test('initializes with correct definition', () => {
        expect(weapon.def.id).toBe('fire');
        expect(weapon.cooldown).toBe(0);
    });

    test('update reduces cooldown', () => {
        weapon.cooldown = 10;
        weapon.update();
        expect(weapon.cooldown).toBe(9);
    });

    test('canFire returns true when cooldown is 0', () => {
        weapon.cooldown = 0;
        expect(weapon.canFire()).toBe(true);
    });

    test('canFire returns false when cooldown > 0', () => {
        weapon.cooldown = 10;
        expect(weapon.canFire()).toBe(false);
    });

    test('fire sets cooldown based on interval and returns bullet data', () => {
        const bulletData = weapon.fire(0, 0, { x: 100, y: 0 });
        expect(weapon.cooldown).toBe(WEAPONS.FIRE.interval);
        expect(bulletData.vx).toBeGreaterThan(0);
        // damage = damageRatio * (playerAttack + 45) / 10 = 1.0 * 50 / 10 = 5
        expect(bulletData.damage).toBeCloseTo(5);
    });
});
