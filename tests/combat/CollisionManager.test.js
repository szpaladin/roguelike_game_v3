import CollisionManager from '../../js/combat/CollisionManager.js';
import Enemy from '../../js/enemies/Enemy.js';
import Bullet from '../../js/combat/Bullet.js';
import { jest } from '@jest/globals';

describe('CollisionManager', () => {
    let manager;
    let player;
    let enemies;
    let bullets;

    beforeEach(() => {
        manager = new CollisionManager();
        player = { x: 0, y: 0, radius: 10, stats: { takeDamage: () => { } } };

        // Overlapping: distance 15 < radius 10 + 10
        enemies = [
            new Enemy(15, 0, {
                name: 'E1', hp: 100, maxHp: 100, attack: 10, defense: 2, speed: 1, radius: 10, color: 'red', exp: 10, gold: 10
            })
        ];
        // Overlapping: distance 5 < radius 2 + 10
        bullets = [
            new Bullet({ x: 10, y: 0, vx: 1, vy: 0, damage: 10, radius: 2, lifetime: 60, active: true })
        ];
    });

    test('detects collision between player and enemies', () => {
        const collisions = manager.checkPlayerEnemyCollisions(player, enemies);
        expect(collisions.length).toBe(1);
        expect(collisions[0]).toBe(enemies[0]);
    });

    test('detects no collision when far apart', () => {
        enemies[0].x = 100;
        const collisions = manager.checkPlayerEnemyCollisions(player, enemies);
        expect(collisions.length).toBe(0);
    });

    test('detects collision between bullets and enemies', () => {
        const hits = manager.checkBulletEnemyCollisions(bullets, enemies);
        expect(hits.length).toBe(1);
        expect(hits[0].bullet).toBe(bullets[0]);
        expect(hits[0].enemy).toBe(enemies[0]);
    });

    test('bullets already hitting enemies are ignored', () => {
        bullets[0].hitEntities.add(enemies[0]);
        const hits = manager.checkBulletEnemyCollisions(bullets, enemies);
        expect(hits.length).toBe(0);
    });

    test('shatter doubles damage and removes frozen without refreeze', () => {
        const shatterEnemy = new Enemy(15, 0, {
            name: 'E2', hp: 100, maxHp: 100, attack: 10, defense: 0, speed: 1, radius: 10, color: 'blue', exp: 10, gold: 10
        });
        shatterEnemy.applyFreeze(60);

        const shatterBullet = new Bullet({
            x: 10,
            y: 0,
            vx: 1,
            vy: 0,
            damage: 10,
            radius: 2,
            lifetime: 60,
            active: true,
            shatterMultiplier: 2,
            shatterConsumesFrozen: true,
            shatterPreventRefreeze: true,
            freezeChance: 1,
            freezeDuration: 120
        });

        const hits = manager.checkBulletEnemyCollisions([shatterBullet], [shatterEnemy]);
        expect(hits.length).toBe(1);
        expect(hits[0].damage).toBe(20);
        expect(shatterEnemy.statusEffects.hasEffect('frozen')).toBe(false);
    });

    test('overgrowth detonates at 3 stacks and damages nearby enemies with int scaling', () => {
        manager.setDependencies(null, null, { stats: { intelligence: 55 } });

        const overgrowthTarget = new Enemy(15, 0, {
            name: 'E3', hp: 500, maxHp: 500, attack: 10, defense: 0, speed: 1, radius: 10, color: 'green', exp: 10, gold: 10
        });
        const nearbyEnemy = new Enemy(60, 0, {
            name: 'E4', hp: 300, maxHp: 300, attack: 10, defense: 0, speed: 1, radius: 10, color: 'gray', exp: 10, gold: 10
        });

        const makeBullet = () => new Bullet({
            x: 10,
            y: 0,
            vx: 1,
            vy: 0,
            damage: 10,
            radius: 2,
            lifetime: 60,
            active: true,
            overgrowthDuration: 300,
            overgrowthTriggerStacks: 3,
            overgrowthExplosionRadius: 60,
            overgrowthExplosionMultiplier: 2.5
        });

        manager.checkBulletEnemyCollisions([makeBullet()], [overgrowthTarget, nearbyEnemy], 5);
        manager.checkBulletEnemyCollisions([makeBullet()], [overgrowthTarget, nearbyEnemy], 5);
        expect(nearbyEnemy.hp).toBe(300);

        manager.checkBulletEnemyCollisions([makeBullet()], [overgrowthTarget, nearbyEnemy], 5);
        expect(nearbyEnemy.hp).toBe(50);
    });

    test('terrainOnHit creates ridge on direct hit', () => {
        const terrainManager = { addRidge: jest.fn() };
        manager.setDependencies(null, null, { stats: { intelligence: 50 } }, terrainManager);

        const target = new Enemy(15, 0, {
            name: 'E5', hp: 100, maxHp: 100, attack: 10, defense: 0, speed: 1, radius: 10, color: 'gray', exp: 10, gold: 10
        });

        const bullet = new Bullet({
            x: 10,
            y: 0,
            vx: 1,
            vy: 0,
            damage: 10,
            radius: 2,
            lifetime: 60,
            active: true,
            terrainOnHit: {
                type: 'ridge',
                length: 120,
                width: 24,
                duration: 240,
                slowAmount: 0.3,
                slowDuration: 240
            }
        });

        manager.checkBulletEnemyCollisions([bullet], [target], 10);
        expect(terrainManager.addRidge).toHaveBeenCalledWith(target.x, target.y, bullet.terrainOnHit);
    });

    test('execute triggers on direct hit', () => {
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
        const target = new Enemy(15, 0, {
            name: 'E6', hp: 100, maxHp: 100, attack: 10, defense: 0, speed: 1, radius: 10, color: 'red', exp: 10, gold: 10
        });

        const bullet = new Bullet({
            x: 10,
            y: 0,
            vx: 1,
            vy: 0,
            damage: 1,
            radius: 2,
            lifetime: 60,
            active: true,
            executeChance: 1
        });

        manager.checkBulletEnemyCollisions([bullet], [target], 5);
        expect(target.hp).toBeLessThanOrEqual(0);
        randomSpy.mockRestore();
    });

    test('execute on shatter requires frozen target', () => {
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
        const target = new Enemy(15, 0, {
            name: 'E7', hp: 100, maxHp: 100, attack: 10, defense: 0, speed: 1, radius: 10, color: 'blue', exp: 10, gold: 10
        });

        const shatterBullet = new Bullet({
            x: 10,
            y: 0,
            vx: 1,
            vy: 0,
            damage: 10,
            radius: 2,
            lifetime: 60,
            active: true,
            shatterMultiplier: 2,
            executeOnShatterChance: 1
        });

        manager.checkBulletEnemyCollisions([shatterBullet], [target], 5);
        expect(target.hp).toBeGreaterThan(0);

        const frozenTarget = new Enemy(15, 0, {
            name: 'E8', hp: 100, maxHp: 100, attack: 10, defense: 0, speed: 1, radius: 10, color: 'cyan', exp: 10, gold: 10
        });
        frozenTarget.applyFreeze(60);

        const shatterBullet2 = new Bullet({
            x: 10,
            y: 0,
            vx: 1,
            vy: 0,
            damage: 10,
            radius: 2,
            lifetime: 60,
            active: true,
            shatterMultiplier: 2,
            executeOnShatterChance: 1
        });

        manager.checkBulletEnemyCollisions([shatterBullet2], [frozenTarget], 5);
        expect(frozenTarget.hp).toBeLessThanOrEqual(0);
        randomSpy.mockRestore();
    });

    test('execute chain chance applies to secondary targets', () => {
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
        const hitEnemy = new Enemy(15, 0, {
            name: 'E9', hp: 100, maxHp: 100, attack: 10, defense: 0, speed: 1, radius: 10, color: 'purple', exp: 10, gold: 10
        });
        const chainEnemy = new Enemy(40, 0, {
            name: 'E10', hp: 100, maxHp: 100, attack: 10, defense: 0, speed: 1, radius: 10, color: 'orange', exp: 10, gold: 10
        });

        const chainBullet = new Bullet({
            x: 10,
            y: 0,
            vx: 1,
            vy: 0,
            damage: 1,
            radius: 2,
            lifetime: 60,
            active: true,
            chainCount: 1,
            chainRange: 100,
            executeChance: 0,
            executeChainChance: 1
        });

        manager.checkBulletEnemyCollisions([chainBullet], [hitEnemy, chainEnemy], 5);
        expect(hitEnemy.hp).toBeGreaterThan(0);
        expect(chainEnemy.hp).toBeLessThanOrEqual(0);
        randomSpy.mockRestore();
    });
});
