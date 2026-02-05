import TerrainEffectManager from '../../js/effects/TerrainEffectManager.js';
import Enemy from '../../js/enemies/Enemy.js';

describe('TerrainEffectManager', () => {
    test('applies slowed when enemy is inside ridge', () => {
        const manager = new TerrainEffectManager();
        const enemy = new Enemy(0, 0, {
            name: 'E1',
            hp: 100,
            maxHp: 100,
            attack: 10,
            defense: 0,
            speed: 1,
            radius: 10,
            color: 'gray',
            exp: 1,
            gold: 1
        });

        manager.addRidge(0, 0, {
            length: 120,
            width: 24,
            duration: 240,
            slowAmount: 0.3,
            slowDuration: 240
        });

        manager.update([enemy]);

        const slow = enemy.statusEffects.getEffect('slowed');
        expect(slow).toBeTruthy();
        expect(slow.params.slowAmount).toBeCloseTo(0.3, 5);
    });

    test('ridge expires after duration', () => {
        const manager = new TerrainEffectManager();
        manager.addRidge(0, 0, { duration: 2 });

        manager.update([]);
        expect(manager.ridges.length).toBe(1);

        manager.update([]);
        expect(manager.ridges.length).toBe(0);
    });

    test('rotated ridge uses local bounds for detection', () => {
        const manager = new TerrainEffectManager();
        const enemyInside = new Enemy(0, 40, {
            name: 'E2',
            hp: 100,
            maxHp: 100,
            attack: 10,
            defense: 0,
            speed: 1,
            radius: 10,
            color: 'gray',
            exp: 1,
            gold: 1
        });
        const enemyOutside = new Enemy(60, 0, {
            name: 'E3',
            hp: 100,
            maxHp: 100,
            attack: 10,
            defense: 0,
            speed: 1,
            radius: 10,
            color: 'gray',
            exp: 1,
            gold: 1
        });

        manager.addRidge(0, 0, {
            length: 100,
            width: 20,
            duration: 120,
            slowAmount: 0.3,
            slowDuration: 120,
            angle: Math.PI / 2
        });

        manager.update([enemyInside, enemyOutside]);

        expect(enemyInside.statusEffects.getEffect('slowed')).toBeTruthy();
        expect(enemyOutside.statusEffects.getEffect('slowed')).toBeFalsy();
    });
});
