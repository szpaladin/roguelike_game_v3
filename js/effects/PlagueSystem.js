import { getStatusEffect } from '../enemies/StatusEffects.js';

const PLAGUE_ID = 'plagued';

export default class PlagueSystem {
    constructor() {
        this.clouds = [];
    }

    update(enemies) {
        if (!Array.isArray(enemies)) return;
        this.updateSpread(enemies);
        this.updateClouds(enemies);
    }

    updateSpread(enemies) {
        const definition = getStatusEffect(PLAGUE_ID);
        if (!definition) return;

        const interval = definition.spreadInterval || 30;
        const radius = definition.spreadRadius || 0;
        const stacks = definition.spreadStacks || 1;
        if (radius <= 0 || interval <= 0) return;

        for (const enemy of enemies) {
            if (!enemy || enemy.hp <= 0 || enemy.isDead || !enemy.statusEffects) continue;
            const effect = enemy.statusEffects.getEffect(PLAGUE_ID);
            if (!effect) continue;

            if (!Number.isFinite(effect.spreadCooldown)) {
                effect.spreadCooldown = interval;
            }

            effect.spreadCooldown -= 1;
            if (effect.spreadCooldown > 0) continue;
            effect.spreadCooldown = interval;

            this.spreadFrom(enemy, effect, enemies, radius, stacks, definition);
        }
    }

    spreadFrom(source, effect, enemies, radius, stacks, definition) {
        const radiusSq = radius * radius;
        const baseDuration = effect.params.baseDuration || definition.defaultDuration || effect.duration || 0;
        const damagePerStack = effect.params.damagePerStack || definition.defaultDamagePerStack || 0;
        const color = effect.color || definition.color;
        const cloudRadius = effect.params.cloudRadius
            || definition.cloudRadius
            || definition.deathCloudRadius
            || definition.spreadRadius
            || radius;

        for (const target of enemies) {
            if (!target || target === source || target.hp <= 0 || target.isDead) continue;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            if (dx * dx + dy * dy > radiusSq) continue;

            target.applyStatusEffect(PLAGUE_ID, baseDuration, {
                damagePerStack,
                stacks,
                baseDuration,
                color,
                cloudRadius
            });
        }
    }

    spawnDeathCloud(enemy) {
        if (!enemy || !enemy.statusEffects) return;
        const effect = enemy.statusEffects.getEffect(PLAGUE_ID);
        if (!effect) return;

        const definition = getStatusEffect(PLAGUE_ID);
        if (!definition) return;

        const duration = definition.deathCloudDuration || 120;
        const radius = (effect.params && Number.isFinite(effect.params.cloudRadius))
            ? effect.params.cloudRadius
            : (definition.deathCloudRadius || definition.spreadRadius || 140);
        const interval = definition.deathCloudInterval || definition.spreadInterval || 30;
        const stacks = definition.deathCloudStacks || definition.spreadStacks || 1;
        const baseDuration = effect.params.baseDuration || definition.defaultDuration || effect.duration || 0;
        const damagePerStack = effect.params.damagePerStack || definition.defaultDamagePerStack || 0;
        const color = effect.color || definition.color;

        this.clouds.push({
            x: enemy.x,
            y: enemy.y,
            radius,
            interval,
            tick: interval,
            stacks,
            baseDuration,
            damagePerStack,
            color,
            life: duration,
            maxLife: duration,
            particles: this.createCloudParticles(radius)
        });
    }

    updateClouds(enemies) {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.life -= 1;
            cloud.tick -= 1;

            if (cloud.tick <= 0) {
                cloud.tick = cloud.interval;
                this.spreadFromPoint(cloud, enemies);
            }

            this.updateCloudParticles(cloud);

            if (cloud.life <= 0) {
                this.clouds.splice(i, 1);
            }
        }
    }

    spreadFromPoint(cloud, enemies) {
        if (!Array.isArray(enemies) || enemies.length === 0) return;

        const radiusSq = cloud.radius * cloud.radius;
        for (const target of enemies) {
            if (!target || target.hp <= 0 || target.isDead) continue;
            const dx = target.x - cloud.x;
            const dy = target.y - cloud.y;
            if (dx * dx + dy * dy > radiusSq) continue;

            target.applyStatusEffect(PLAGUE_ID, cloud.baseDuration, {
                damagePerStack: cloud.damagePerStack,
                stacks: cloud.stacks,
                baseDuration: cloud.baseDuration,
                color: cloud.color,
                cloudRadius: cloud.radius
            });
        }
    }

    createCloudParticles(radius) {
        const count = Math.max(6, Math.min(16, Math.round(radius * 0.25)));
        const particles = [];

        for (let i = 0; i < count; i++) {
            particles.push({
                angle: Math.random() * Math.PI * 2,
                distance: radius * (0.15 + Math.random() * 0.7),
                size: radius * (0.18 + Math.random() * 0.18),
                alpha: 0.12 + Math.random() * 0.18,
                drift: (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? -1 : 1),
                sway: Math.random() * Math.PI * 2
            });
        }

        return particles;
    }

    updateCloudParticles(cloud) {
        for (const particle of cloud.particles) {
            particle.angle += particle.drift;
            particle.sway += 0.02;
        }
    }

    draw(ctx, scrollY) {
        if (!ctx || this.clouds.length === 0) return;

        ctx.save();
        for (const cloud of this.clouds) {
            const lifeRatio = cloud.maxLife > 0 ? cloud.life / cloud.maxLife : 1;
            const baseAlpha = Math.max(0, Math.min(1, lifeRatio));

            ctx.globalAlpha = baseAlpha * 0.15;
            ctx.fillStyle = cloud.color;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y - scrollY, cloud.radius, 0, Math.PI * 2);
            ctx.fill();

            for (const particle of cloud.particles) {
                const sway = Math.sin(particle.sway) * cloud.radius * 0.05;
                const x = cloud.x + Math.cos(particle.angle) * particle.distance + sway;
                const y = cloud.y - scrollY + Math.sin(particle.angle) * particle.distance + sway * 0.5;
                const alpha = particle.alpha * baseAlpha;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = cloud.color;
                ctx.beginPath();
                ctx.arc(x, y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}
