import FrozenVFX from '../../js/effects/FrozenVFX.js';

const createEnemy = (radius = 10) => ({
    x: 0,
    y: 0,
    radius
});

describe('FrozenVFX', () => {
    test('creates shard count based on radius', () => {
        const enemy = createEnemy(10);
        const vfx = new FrozenVFX(enemy, '#00ffff');
        expect(vfx.shards.length).toBe(8);
    });

    test('updates shard angles', () => {
        const enemy = createEnemy(10);
        const vfx = new FrozenVFX(enemy, '#00ffff');
        const before = vfx.shards[0].angle;
        vfx.update(enemy, { color: '#00ffff', getProgress: () => 1 });
        expect(vfx.shards[0].angle).not.toBe(before);
    });
});
