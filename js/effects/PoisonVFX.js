import { worldToScreen } from '../utils.js';

const MIN_PARTICLES = 5;
const MAX_PARTICLES = 16;

export default class PoisonVFX {
    constructor(enemy, color) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : 10;
        this.radius = radius;
        this.color = color || '#00ff00';
        this.intensity = 1;
        this.maxParticles = PoisonVFX.getParticleCount(radius, 1);
        this.particles = [];
        this.resetParticles(enemy);
    }

    static getParticleCount(radius, stacks = 1) {
        const base = Math.round(radius * 0.5 + 2);
        const stackBonus = Math.min(4, Math.floor(Math.max(0, stacks - 1) / 5));
        const count = base + stackBonus;
        return Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, count));
    }

    sync(enemy, effect) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : this.radius;
        const stacks = effect && Number.isFinite(effect.stacks) ? effect.stacks : 1;
        const maxParticles = PoisonVFX.getParticleCount(radius, stacks);
        const nextColor = effect && effect.color ? effect.color : this.color;
        const nextIntensity = effect && typeof effect.getProgress === 'function' ? effect.getProgress() : 1;
        const needsReset = radius !== this.radius || maxParticles !== this.maxParticles;

        this.radius = radius;
        this.maxParticles = maxParticles;
        this.color = nextColor;
        this.intensity = Math.max(0.2, Math.min(1, nextIntensity));

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
        const distance = radius * (0.15 + Math.random() * 0.75);
        const size = radius * (0.06 + Math.random() * 0.08);
        const baseAlpha = 0.25 + Math.random() * 0.4;
        const maxLife = 30 + Math.floor(Math.random() * 50);

        return {
            baseX: Math.cos(angle) * distance,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            vy: 0.2 + Math.random() * 0.4,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 0.04 + Math.random() * 0.05,
            swayAmplitude: radius * (0.02 + Math.random() * 0.05),
            size,
            baseAlpha,
            life: maxLife,
            maxLife
        };
    }

    update(enemy, effect) {
        this.sync(enemy, effect);

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
            const alpha = Math.max(0, Math.min(1, particle.baseAlpha * lifeRatio * this.intensity));
            const x = screen.x + particle.x;
            const y = screen.y + particle.y;

            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = alpha * 0.4;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x - particle.size * 0.3, y - particle.size * 0.3, particle.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}
