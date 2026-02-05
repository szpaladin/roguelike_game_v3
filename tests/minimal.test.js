import { circleCollision } from '../js/utils.js';
import CollisionManager from '../js/combat/CollisionManager.js';

describe('Minimal Collision Check', () => {
    test('direct utility call', () => {
        expect(circleCollision(0, 0, 10, 5, 0, 10)).toBe(true);
    });

    test('manager call', () => {
        const manager = new CollisionManager();
        const p = { x: 0, y: 0, radius: 10 };
        const e = { x: 5, y: 0, radius: 10, hp: 100 };
        const hits = manager.checkPlayerEnemyCollisions(p, [e]);
        expect(hits.length).toBe(1);
    });
});
