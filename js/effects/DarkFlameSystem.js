import { getStatusEffect } from '../enemies/StatusEffects.js';

const DARK_FLAME_ID = 'dark_flame';

export default class DarkFlameSystem {
    update(enemies) {
        if (!Array.isArray(enemies)) return;

        const definition = getStatusEffect(DARK_FLAME_ID);
        if (!definition) return;

        const defaultInterval = definition.spreadInterval || 60;
        const defaultPadding = definition.contactPadding || 6;

        for (const enemy of enemies) {
            if (!enemy || enemy.hp <= 0 || enemy.isDead || !enemy.statusEffects) continue;
            const effect = enemy.statusEffects.getEffect(DARK_FLAME_ID);
            if (!effect) continue;

            if (!Number.isFinite(effect.spreadCooldown)) {
                effect.spreadCooldown = effect.params.spreadInterval || defaultInterval;
            }

            effect.spreadCooldown -= 1;
            if (effect.spreadCooldown > 0) continue;
            effect.spreadCooldown = effect.params.spreadInterval || defaultInterval;

            this.spreadFrom(enemy, effect, enemies, defaultPadding, definition);
        }
    }

    spreadFrom(source, effect, enemies, defaultPadding, definition) {
        if (!source || !effect || !Array.isArray(enemies)) return;

        const padding = Number.isFinite(effect.params.contactPadding)
            ? effect.params.contactPadding
            : defaultPadding;
        const baseDuration = effect.params.baseDuration || definition.defaultDuration || effect.duration || 0;
        const damagePerFrame = effect.params.damagePerFrame || definition.defaultDamagePerFrame || 0;
        const spreadInterval = effect.params.spreadInterval || definition.spreadInterval || 60;
        const color = effect.color || effect.params.color || definition.color;

        let closestTarget = null;
        let closestDistSq = Infinity;

        for (const target of enemies) {
            if (!target || target === source || target.hp <= 0 || target.isDead || !target.statusEffects) continue;
            if (target.statusEffects.hasEffect(DARK_FLAME_ID)) continue;

            const contactDistance = (source.radius || 0) + (target.radius || 0) + padding;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= contactDistance * contactDistance && distSq < closestDistSq) {
                closestDistSq = distSq;
                closestTarget = target;
            }
        }

        if (closestTarget) {
            closestTarget.applyStatusEffect(DARK_FLAME_ID, baseDuration, {
                damagePerFrame,
                baseDuration,
                spreadInterval,
                contactPadding: padding,
                color
            });
        }
    }
}
