const MIN_PARTICLES = 6;
const MAX_PARTICLES = 14;

export default class PlagueVFX {
    constructor(enemy, color) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : 10;
        this.radius = radius;
        this.color = color || '#6f7a66';
        this.intensity = 1;
        this.maxParticles = PlagueVFX.getParticleCount(radius, 1);
        this.particles = [];
        this.resetParticles(enemy);
    }

    static getParticleCount(radius, stacks = 1) {
        const base = Math.round(radius * 0.55 + 2);
        const stackBonus = Math.min(4, Math.floor(Math.max(0, stacks - 1) / 6));
        const count = base + stackBonus;
        return Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, count));
    }

    sync(enemy, effect) {
        const cloudRadius = effect && effect.params && Number.isFinite(effect.params.cloudRadius)
            ? effect.params.cloudRadius
            : null;
        const radius = Number.isFinite(cloudRadius)
            ? cloudRadius
            : (enemy && Number.isFinite(enemy.radius) ? enemy.radius : this.radius);
        const stacks = effect && Number.isFinite(effect.stacks) ? effect.stacks : 1;
        const maxParticles = PlagueVFX.getParticleCount(radius, stacks);
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
        const distance = radius * (0.1 + Math.random() * 0.8);
        const size = radius * (0.14 + Math.random() * 0.16);
        const baseAlpha = 0.18 + Math.random() * 0.22;
        const maxLife = 40 + Math.floor(Math.random() * 50);

        return {
            baseX: Math.cos(angle) * distance,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            vy: 0.08 + Math.random() * 0.2,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 0.02 + Math.random() * 0.03,
            swayAmplitude: radius * (0.04 + Math.random() * 0.06),
            size,
            baseAlpha,
            life: maxLife,
            maxLife
        };
    }

    update(enemy, effect) {
        this.sync(enemy, effect);

        const maxY = -this.radius * 1.05;
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

    draw(ctx, scrollY, enemy) {
        if (!ctx || !enemy) return;

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.15 * this.intensity;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - scrollY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        for (const particle of this.particles) {
            const lifeRatio = particle.maxLife > 0 ? particle.life / particle.maxLife : 1;
            const alpha = Math.max(0, Math.min(1, particle.baseAlpha * lifeRatio * this.intensity));
            const x = enemy.x + particle.x;
            const y = enemy.y - scrollY + particle.y;

            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = '#cfd5c9';
            ctx.beginPath();
            ctx.arc(x - particle.size * 0.2, y - particle.size * 0.2, particle.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}
