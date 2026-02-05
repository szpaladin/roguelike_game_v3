import Game from '../../js/core/Game.js';
import Enemy from '../../js/enemies/Enemy.js';
import { STATUS_EFFECTS } from '../../js/enemies/StatusEffects.js';

describe('Game', () => {
    let game;

    beforeEach(() => {
        // Mock canvas context
        const mockCtx = {
            clearRect: () => { },
            save: () => { },
            restore: () => { },
            fillRect: () => { },
            beginPath: () => { },
            arc: () => { },
            fill: () => { }
        };

        game = new Game(mockCtx, 800, 600);
    });

    test('initializes all sub-systems', () => {
        expect(game.player).toBeDefined();
        expect(game.mapManager).toBeDefined();
        expect(game.enemySpawner).toBeDefined();
        expect(game.bulletPool).toBeDefined();
        expect(game.collisionManager).toBeDefined();
        expect(game.hud).toBeDefined();
    });

    test('update increments gameTime and distance', () => {
        const initialTime = game.gameTime;
        game.update(1 / 60);
        expect(game.gameTime).toBeGreaterThan(initialTime);
        expect(game.distance).toBeGreaterThan(0);
    });

    test('pause toggles game state', () => {
        game.togglePause();
        expect(game.paused).toBe(true);
        game.togglePause();
        expect(game.paused).toBe(false);
    });

    test('abyss sacrifice heals player when marked enemy dies', () => {
        game.enemySpawner.spawn = () => null;
        game.player.stats.hp = 50;

        const enemy = new Enemy(0, 0, {
            name: 'Test',
            maxHp: 10,
            hp: 0,
            attack: 0,
            defense: 0,
            speed: 0,
            radius: 5,
            color: '#ffffff',
            exp: 0,
            gold: 0
        });
        enemy.applyStatusEffect('abyss_sacrifice', STATUS_EFFECTS.ABYSS_SACRIFICE.defaultDuration, {
            healAmount: STATUS_EFFECTS.ABYSS_SACRIFICE.defaultHeal
        });

        game.enemies.push(enemy);
        game.update(1 / 60);

        expect(game.player.stats.hp).toBe(52);
        expect(enemy.isDead).toBe(true);
    });
});
