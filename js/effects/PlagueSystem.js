import { getStatusEffect } from '../enemies/StatusEffects.js';
import { wrapDeltaX, worldToScreen } from '../utils.js';

const PLAGUE_ID = 'plagued';

export default class PlagueSystem {
    constructor() {
        this.clouds = [];
    }

    update(enemies, worldWidth = null) {
        if (!Array.isArray(enemies)) return;
        this.updateSpread(enemies, worldWidth);
        this.updateClouds(enemies, worldWidth);
    }

    updateSpread(enemies, worldWidth = null) {
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

            this.spreadFrom(enemy, effect, enemies, radius, stacks, definition, worldWidth);
        }
    }

    spreadFrom(source, effect, enemies, radius, stacks, definition, worldWidth = null) {
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
            const dx = Number.isFinite(worldWidth) ? wrapDeltaX(target.x - source.x, worldWidth) : (target.x - source.x);
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
            particles: this.createCloudParticles(radius),
            mistLayers: this.createMistLayers(radius),
            mistPhase: Math.random() * Math.PI * 2
        });
    }

    updateClouds(enemies, worldWidth = null) {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.life -= 1;
            cloud.tick -= 1;

            if (cloud.tick <= 0) {
                cloud.tick = cloud.interval;
                this.spreadFromPoint(cloud, enemies, worldWidth);
            }

            this.updateCloudParticles(cloud);

            if (cloud.life <= 0) {
                this.clouds.splice(i, 1);
            }
        }
    }

    spreadFromPoint(cloud, enemies, worldWidth = null) {
        if (!Array.isArray(enemies) || enemies.length === 0) return;

        const radiusSq = cloud.radius * cloud.radius;
        for (const target of enemies) {
            if (!target || target.hp <= 0 || target.isDead) continue;
            const dx = Number.isFinite(worldWidth) ? wrapDeltaX(target.x - cloud.x, worldWidth) : (target.x - cloud.x);
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

    createMistLayers(radius) {
        const count = Math.max(4, Math.min(8, Math.round(radius / 35)));
        const layers = [];
        for (let i = 0; i < count; i++) {
            layers.push({
                angle: Math.random() * Math.PI * 2,
                distance: radius * (0.15 + Math.random() * 0.65),
                radius: radius * (0.5 + Math.random() * 0.5),
                alpha: 0.08 + Math.random() * 0.12,
                drift: (Math.random() * 0.01 + 0.005) * (Math.random() < 0.5 ? -1 : 1),
                wobble: radius * (0.03 + Math.random() * 0.05),
                phase: Math.random() * Math.PI * 2
            });
        }
        return layers;
    }

    updateCloudParticles(cloud) {
        for (const particle of cloud.particles) {
            particle.angle += particle.drift;
            particle.sway += 0.02;
        }
        if (cloud.mistLayers) {
            cloud.mistPhase += 0.012;
            for (const layer of cloud.mistLayers) {
                layer.phase += layer.drift;
            }
        }
    }

    draw(ctx, view) {
        if (!ctx || this.clouds.length === 0) return;

        ctx.save();
        for (const cloud of this.clouds) {
            const lifeRatio = cloud.maxLife > 0 ? cloud.life / cloud.maxLife : 1;
            const baseAlpha = Math.max(0, Math.min(1, lifeRatio));
            const screen = view ? worldToScreen(cloud.x, cloud.y, view) : { x: cloud.x, y: cloud.y };

            this.drawSoftBlob(ctx, screen.x, screen.y, cloud.radius * 0.9, baseAlpha * 0.12, cloud.color);

            if (cloud.mistLayers) {
                for (const layer of cloud.mistLayers) {
                    const sway = Math.sin(cloud.mistPhase + layer.phase) * layer.wobble;
                    const x = screen.x + Math.cos(layer.angle) * (layer.distance + sway);
                    const y = screen.y + Math.sin(layer.angle) * (layer.distance * 0.7) + sway * 0.4;
                    this.drawSoftBlob(ctx, x, y, layer.radius, baseAlpha * layer.alpha, cloud.color);
                }
            }

            for (const particle of cloud.particles) {
                const sway = Math.sin(particle.sway) * cloud.radius * 0.05;
                const x = screen.x + Math.cos(particle.angle) * particle.distance + sway;
                const y = screen.y + Math.sin(particle.angle) * particle.distance + sway * 0.5;
                const alpha = particle.alpha * baseAlpha;

                this.drawSoftBlob(ctx, x, y, particle.size, alpha, cloud.color);
            }
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
