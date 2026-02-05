const MIN_PARTICLES = 6;
const MAX_PARTICLES = 16;

export default class BurningVFX {
    constructor(enemy, color) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : 10;
        this.radius = radius;
        this.color = color || '#ff4500';
        this.maxParticles = BurningVFX.getParticleCount(radius);
        this.particles = [];
        this.resetParticles(enemy);
    }

    static getParticleCount(radius) {
        const count = Math.round(radius * 0.6 + 1);
        return Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, count));
    }

    sync(enemy, color) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : this.radius;
        const maxParticles = BurningVFX.getParticleCount(radius);
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
        const size = radius * (0.12 + Math.random() * 0.08);
        const baseAlpha = 0.45 + Math.random() * 0.35;
        const maxLife = 20 + Math.floor(Math.random() * 40);

        return {
            baseX: Math.cos(angle) * distance,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            vy: 0.3 + Math.random() * 0.6,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 0.05 + Math.random() * 0.05,
            swayAmplitude: radius * (0.03 + Math.random() * 0.05),
            size,
            baseAlpha,
            life: maxLife,
            maxLife
        };
    }

    update(enemy, effect) {
        const color = effect && effect.color ? effect.color : this.color;
        this.sync(enemy, color);

        const maxY = -this.radius * 1.2;
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
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - scrollY, this.radius, 0, Math.PI * 2);
        ctx.clip();

        for (const particle of this.particles) {
            const lifeRatio = particle.maxLife > 0 ? particle.life / particle.maxLife : 1;
            const alpha = Math.max(0, Math.min(1, particle.baseAlpha * lifeRatio));
            const x = enemy.x + particle.x;
            const y = enemy.y - scrollY + particle.y;
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
            x, y + size * 1.4
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
