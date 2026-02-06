import { worldToScreen } from '../utils.js';

const MIN_PARTICLES = 6;
const MAX_PARTICLES = 16;

export default class DarkFlameVFX {
    constructor(enemy, color) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : 10;
        this.radius = radius;
        this.color = color || '#2b153a';
        this.maxParticles = DarkFlameVFX.getParticleCount(radius);
        this.particles = [];
        this.resetParticles(enemy);
    }

    static getParticleCount(radius) {
        const count = Math.round(radius * 0.5 + 1);
        return Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, count));
    }

    sync(enemy, color) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : this.radius;
        const maxParticles = DarkFlameVFX.getParticleCount(radius);
        const nextColor = color || this.color;
        const needsReset = radius !== this.radius || maxParticles !== this.maxParticles;

        this.radius = radius;
        this.maxParticles = maxParticles;
        this.color = nextColor;

        if (needsReset || this.particles.length !== this.maxParticles) {
            this.resetParticles(enemy);
        }
    }

    resetParticles(enemy) {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle(enemy));
        }
    }

    createParticle(enemy) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : this.radius;
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * (0.2 + Math.random() * 0.7);
        const size = radius * (0.11 + Math.random() * 0.07);
        const baseAlpha = 0.28 + Math.random() * 0.25;
        const maxLife = 30 + Math.floor(Math.random() * 40);

        return {
            baseX: Math.cos(angle) * distance,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            vy: 0.2 + Math.random() * 0.4,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 0.04 + Math.random() * 0.05,
            swayAmplitude: radius * (0.02 + Math.random() * 0.04),
            size,
            baseAlpha,
            life: maxLife,
            maxLife
        };
    }

    update(enemy, effect) {
        const color = effect && effect.color ? effect.color : this.color;
        this.sync(enemy, color);

        const maxY = -this.radius * 1.1;
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            particle.life -= 1;
            particle.y -= particle.vy;
            particle.swayPhase += particle.swaySpeed;
            particle.x = particle.baseX + Math.sin(particle.swayPhase) * particle.swayAmplitude;

            if (particle.y <= maxY || particle.life <= 0) {
                this.particles[i] = this.createParticle(enemy);
            }
        }
    }

    draw(ctx, view, enemy) {
        if (!ctx || !enemy) return;

        ctx.save();
        const screen = view ? worldToScreen(enemy.x, enemy.y, view) : { x: enemy.x, y: enemy.y };
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
        ctx.clip();

        for (const particle of this.particles) {
            const lifeRatio = particle.maxLife > 0 ? particle.life / particle.maxLife : 1;
            const alpha = Math.max(0, Math.min(1, particle.baseAlpha * lifeRatio));
            const x = screen.x + particle.x;
            const y = screen.y + particle.y;
            this.drawTearDrop(ctx, x, y, particle.size, alpha);
        }

        ctx.restore();
    }

    drawTearDrop(ctx, x, y, size, alpha) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.bezierCurveTo(
            x + size, y - size * 0.4,
            x + size * 0.8, y + size,
            x, y + size * 1.35
        );
        ctx.bezierCurveTo(
            x - size * 0.8, y + size,
            x - size, y - size * 0.4,
            x, y - size
        );
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
