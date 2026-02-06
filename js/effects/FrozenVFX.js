import { worldToScreen } from '../utils.js';

const MIN_SHARDS = 6;
const MAX_SHARDS = 12;

export default class FrozenVFX {
    constructor(enemy, color) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : 10;
        this.radius = radius;
        this.color = color || '#00ffff';
        this.intensity = 1;
        this.maxShards = FrozenVFX.getShardCount(radius);
        this.shards = [];
        this.resetShards(enemy);
    }

    static getShardCount(radius) {
        const count = Math.round(radius * 0.35 + 4);
        return Math.max(MIN_SHARDS, Math.min(MAX_SHARDS, count));
    }

    sync(enemy, effect) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : this.radius;
        const maxShards = FrozenVFX.getShardCount(radius);
        const nextColor = effect && effect.color ? effect.color : this.color;
        const nextIntensity = effect && typeof effect.getProgress === 'function' ? effect.getProgress() : 1;
        const needsReset = radius !== this.radius || maxShards !== this.maxShards;

        this.radius = radius;
        this.maxShards = maxShards;
        this.color = nextColor;
        this.intensity = Math.max(0.2, Math.min(1, nextIntensity));

        if (needsReset || this.shards.length !== this.maxShards) {
            this.resetShards(enemy);
        }
    }

    resetShards(enemy) {
        this.shards = [];
        for (let i = 0; i < this.maxShards; i++) {
            this.shards.push(this.createShard(enemy));
        }
    }

    createShard(enemy) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : this.radius;
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * (0.75 + Math.random() * 0.4);
        const size = radius * (0.08 + Math.random() * 0.08);

        return {
            angle,
            distance,
            size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: 0.01 + Math.random() * 0.02,
            orbitSpeed: 0.002 + Math.random() * 0.006,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.03 + Math.random() * 0.04
        };
    }

    update(enemy, effect) {
        this.sync(enemy, effect);

        for (const shard of this.shards) {
            shard.angle += shard.orbitSpeed;
            shard.rotation += shard.rotationSpeed;
            shard.pulsePhase += shard.pulseSpeed;
        }
    }

    draw(ctx, view, enemy) {
        if (!ctx || !enemy) return;

        const screen = view ? worldToScreen(enemy.x, enemy.y, view) : { x: enemy.x, y: enemy.y };
        for (const shard of this.shards) {
            const pulse = 0.6 + Math.sin(shard.pulsePhase) * 0.4;
            const alpha = Math.max(0, Math.min(1, 0.35 * pulse * this.intensity));
            const distance = shard.distance + Math.sin(shard.pulsePhase) * this.radius * 0.05;
            const x = screen.x + Math.cos(shard.angle) * distance;
            const y = screen.y + Math.sin(shard.angle) * distance;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(shard.rotation);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -shard.size);
            ctx.lineTo(shard.size * 0.7, 0);
            ctx.lineTo(0, shard.size);
            ctx.lineTo(-shard.size * 0.7, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.globalAlpha = 1;
    }
}
