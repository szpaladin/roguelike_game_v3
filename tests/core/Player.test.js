import Player from '../../js/core/Player.js';
import { GAME_CONFIG } from '../../js/config.js';

describe('Player', () => {
    let player;

    beforeEach(() => {
        player = new Player(300, 300);
    });

    test('initializes with correct position and sub-systems', () => {
        expect(player.x).toBe(300);
        expect(player.y).toBe(300);
        expect(player.stats).toBeDefined();
        expect(player.weaponSystem).toBeDefined();
    });

    test('move updates position based on input', () => {
        const keys = { w: true, a: false, s: false, d: false }; // Up
        player.update(keys, 1 / 60, 0);
        expect(player.y).toBeLessThan(300);
    });

    test('diagonal movement is normalized', () => {
        const keys = { w: true, d: true }; // Up-Right
        player.update(keys, 1 / 60, 0);
        // distance should be speed * dt
        const dx = player.x - 300;
        const dy = player.y - 300;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(dist).toBeCloseTo(player.stats.speed, 1);
    });

    test('takeDamage triggers invulnerability', () => {
        player.takeDamage(10);
        expect(player.invulnerable).toBe(true);
        expect(player.invulnerableTime).toBe(GAME_CONFIG.PLAYER_INVULNERABLE_TIME);
    });

    test('invulnerability counts down', () => {
        player.invulnerable = true;
        player.invulnerableTime = 10;
        player.update({}, 1 / 60, 0);
        expect(player.invulnerableTime).toBe(9);
    });
});
