import { worldToScreen } from '../utils.js';

const MIN_PARTICLES = 6;
const MAX_PARTICLES = 14;

export default class PlagueVFX {
    constructor(enemy, color) {
        const radius = enemy && Number.isFinite(enemy.radius) ? enemy.radius : 10;
        this.radius = radius;
        this.color = color || '#6f7a66';
        this.intensity = 1;
        this.mistPhase = Math.random() * Math.PI * 2;
        this.mistLayers = this.createMistLayers(radius);
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
        if (needsReset) {
            this.mistLayers = this.createMistLayers(this.radius);
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
        const size = radius * (0.18 + Math.random() * 0.22);
        const baseAlpha = 0.16 + Math.random() * 0.18;
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

    createMistLayers(radius) {
        const count = Math.max(3, Math.min(6, Math.round(radius / 12)));
        const layers = [];
        for (let i = 0; i < count; i++) {
            layers.push({
                angle: Math.random() * Math.PI * 2,
                distance: radius * (0.2 + Math.random() * 0.6),
                radius: radius * (0.45 + Math.random() * 0.45),
                alpha: 0.08 + Math.random() * 0.1,
                drift: 0.015 + Math.random() * 0.02,
                wobble: radius * (0.02 + Math.random() * 0.05),
                phase: Math.random() * Math.PI * 2
            });
        }
        return layers;
    }

    update(enemy, effect) {
        this.sync(enemy, effect);

        this.mistPhase += 0.015;

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

    draw(ctx, view, enemy) {
        if (!ctx || !enemy) return;

        const screen = view ? worldToScreen(enemy.x, enemy.y, view) : { x: enemy.x, y: enemy.y };
        ctx.save();
        this.drawSoftBlob(ctx, screen.x, screen.y, this.radius * 0.9, 0.12 * this.intensity, this.color);

        for (const layer of this.mistLayers) {
            const sway = Math.sin(this.mistPhase + layer.phase) * layer.wobble;
            const x = screen.x + Math.cos(layer.angle) * (layer.distance + sway);
            const y = screen.y + Math.sin(layer.angle) * (layer.distance * 0.7) + sway * 0.4;
            this.drawSoftBlob(ctx, x, y, layer.radius, layer.alpha * this.intensity, this.color);
        }

        for (const particle of this.particles) {
            const lifeRatio = particle.maxLife > 0 ? particle.life / particle.maxLife : 1;
            const alpha = Math.max(0, Math.min(1, particle.baseAlpha * lifeRatio * this.intensity));
            const x = screen.x + particle.x;
            const y = screen.y + particle.y;

            this.drawSoftBlob(ctx, x, y, particle.size, alpha, this.color);
            this.drawSoftBlob(ctx, x - particle.size * 0.2, y - particle.size * 0.2, particle.size * 0.4, alpha * 0.35, '#cfd5c9');
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    drawSoftBlob(ctx, x, y, radius, alpha, color) {
        if (alpha <= 0 || radius <= 0) return;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = alpha;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
