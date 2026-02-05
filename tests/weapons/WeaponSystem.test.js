import { jest as jestGlobals } from '@jest/globals';
import WeaponSystem from '../../js/weapons/WeaponSystem.js';
import { WEAPONS } from '../../js/weapons/WeaponsData.js';
import Weapon from '../../js/weapons/Weapon.js';

describe('WeaponSystem', () => {
    let system;

    beforeEach(() => {
        system = new WeaponSystem();
    });

    test('initializes with empty weapons list', () => {
        expect(system.weapons.length).toBe(0);
    });

    test('addWeapon adds a new weapon', () => {
        system.addWeapon(WEAPONS.FIRE);
        expect(system.weapons.length).toBe(1);
        expect(system.weapons[0]).toBeInstanceOf(Weapon);
        expect(system.weapons[0].def.id).toBe('fire');
    });

    test('addWeapon replaces basic weapon when acquiring a new weapon', () => {
        system.addWeapon(WEAPONS.BASIC);
        expect(system.weapons.length).toBe(1);
        expect(system.weapons[0].def.id).toBe('basic');

        system.addWeapon(WEAPONS.FIRE);
        expect(system.weapons.length).toBe(1);
        expect(system.weapons[0].def.id).toBe('fire');
    });

    test('update calls update on all weapons', () => {
        system.addWeapon(WEAPONS.FIRE);
        system.weapons[0].cooldown = 10;
        system.update();
        expect(system.weapons[0].cooldown).toBe(9);
    });

    test('autoShoot fires ready weapons when enemies are in range', () => {
        system.addWeapon(WEAPONS.FIRE);
        const enemies = [{ x: 100, y: 0, radius: 10, hp: 100 }];
        const playerPos = { x: 0, y: 0 };

        let spawnedData = null;
        const bulletPool = {
            spawnBullet: (data) => {
                spawnedData = data;
            }
        };

        system.autoShoot(playerPos, 5, enemies, bulletPool, 0);
        expect(spawnedData).not.toBeNull();
        expect(spawnedData.damage).toBe(WEAPONS.FIRE.damage * 5); // (5 + 45) / 10 = 5
        expect(system.weapons[0].cooldown).toBe(WEAPONS.FIRE.interval);
    });

    test('findNearestEnemy returns the correct enemy', () => {
        const enemies = [
            { x: 100, y: 100, hp: 100 },
            { x: 50, y: 50, hp: 100 }, // Nearest
            { x: 200, y: 200, hp: 100 }
        ];
        const nearest = system.findNearestEnemy(0, 0, enemies);
        expect(nearest.x).toBe(50);
    });

    describe('Bullet Spread', () => {
        test('multiple weapons fire bullets with spread angle offset', () => {
            // Add 3 weapons
            system.addWeapon(WEAPONS.FIRE);
            system.addWeapon(WEAPONS.FROST);
            system.addWeapon(WEAPONS.SWIFT);

            const enemies = [{ x: 100, y: 0, radius: 10, hp: 100 }];
            const playerPos = { x: 0, y: 0 };

            const spawnedBullets = [];
            const bulletPool = {
                spawnBullet: (data) => {
                    spawnedBullets.push(data);
                }
            };

            system.autoShoot(playerPos, 5, enemies, bulletPool, 0);

            // All 3 weapons should fire
            expect(spawnedBullets.length).toBe(3);

            // Bullets should have different angles (different vy values due to spread)
            // Since target is at (100, 0) and player at (0, 0), base angle is 0
            // With spread, each bullet should have slightly different vy
            const vyValues = spawnedBullets.map(b => b.vy);

            // First and last bullets should have opposite spread directions
            // Middle bullet (index 1) should have minimal spread
            expect(vyValues[0]).not.toBe(vyValues[2]); // Different spread
        });

        test('single weapon has no spread', () => {
            system.addWeapon(WEAPONS.FIRE);

            const enemies = [{ x: 100, y: 0, radius: 10, hp: 100 }];
            const playerPos = { x: 0, y: 0 };

            const spawnedBullets = [];
            const bulletPool = {
                spawnBullet: (data) => {
                    spawnedBullets.push(data);
                }
            };

            system.autoShoot(playerPos, 5, enemies, bulletPool, 0);

            expect(spawnedBullets.length).toBe(1);
            // With single weapon, spread should be 0, so vy should be 0
            // (target at (100, 0) means angle is 0)
            expect(spawnedBullets[0].vy).toBeCloseTo(0, 5);
        });
    });

    test('autoShoot supports sky_drop spawn mode', () => {
        system.addWeapon({
            id: 'sky_drop_test',
            name: 'Sky Drop',
            damage: 2,
            interval: 30,
            speed: 4,
            radius: 6,
            lifetime: 90,
            spawnMode: 'sky_drop',
            dropOffsetX: 10,
            dropOffsetY: 60,
            dropSpeed: 6,
            dropLifetime: 240,
            dropRadius: 14
        });

        const enemies = [{ x: 100, y: 200, radius: 10, hp: 100 }];
        const playerPos = { x: 0, y: 0 };
        const bulletPool = {
            spawnBullet: jestGlobals.fn()
        };

        const randomSpy = jestGlobals.spyOn(Math, 'random').mockReturnValue(0.5);
        system.autoShoot(playerPos, 5, enemies, bulletPool, 300);
        randomSpy.mockRestore();

        expect(bulletPool.spawnBullet).toHaveBeenCalledTimes(1);
        const bulletData = bulletPool.spawnBullet.mock.calls[0][0];
        expect(bulletData.x).toBe(100);
        expect(bulletData.y).toBe(240);
        expect(bulletData.vx).toBe(0);
        expect(bulletData.vy).toBe(6);
        expect(bulletData.radius).toBe(14);
        expect(bulletData.lifetime).toBe(240);
        expect(bulletData.damage).toBe(2 * 5);
        expect(system.weapons[0].cooldown).toBe(30);
    });
});
