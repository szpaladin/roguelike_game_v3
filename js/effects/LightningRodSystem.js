import AOEHandler from '../combat/AOEHandler.js';
import { applyBulletStatusEffects, STATUS_EFFECTS } from '../enemies/StatusEffects.js';

const LIGHTNING_ROD_ID = 'lightning_rod';

export default class LightningRodSystem {
    constructor(effectsManager = null) {
        this.aoeHandler = new AOEHandler(effectsManager);
    }

    setDependencies(effectsManager) {
        this.aoeHandler.setDependencies(effectsManager, null);
    }

    update(enemies, playerStats = null) {
        if (!Array.isArray(enemies) || enemies.length === 0) return;

        const baseAttack = playerStats ? playerStats.strength : 0;
        const effectiveAttack = (Number.isFinite(baseAttack) ? baseAttack : 0) + 45;
        const intMultiplier = playerStats ? (playerStats.intelligence + 45) / 50 : 1;

        const triggerOvergrowthExplosion = (target, statusResult) => {
            if (!statusResult || !statusResult.overgrowth) return;
            const { radius, multiplier, color } = statusResult.overgrowth;
            const damage = effectiveAttack * multiplier * intMultiplier;
            this.aoeHandler.handleStatusExplosion(target, enemies, damage, radius, color);
        };

        for (const enemy of enemies) {
            if (!enemy || enemy.hp <= 0 || enemy.isDead || !enemy.statusEffects) continue;
            const effect = enemy.statusEffects.getEffect(LIGHTNING_ROD_ID);
            if (!effect) continue;

            const interval = Number.isFinite(effect.params.interval)
                ? effect.params.interval
                : STATUS_EFFECTS.LIGHTNING_ROD.defaultInterval;

            if (!Number.isFinite(effect.strikeCooldown)) {
                effect.strikeCooldown = interval;
            }

            effect.strikeCooldown -= 1;
            if (effect.strikeCooldown > 0) continue;
            effect.strikeCooldown = interval;

            if (!Number.isFinite(effect.params.strikesRemaining)) {
                effect.params.strikesRemaining = 0;
            }

            if (effect.params.strikesRemaining <= 0) {
                enemy.statusEffects.removeEffect(LIGHTNING_ROD_ID);
                continue;
            }

            effect.params.strikesRemaining -= 1;

            this.triggerStrike(enemy, effect, enemies, playerStats, triggerOvergrowthExplosion);

            if (effect.params.strikesRemaining <= 0) {
                enemy.statusEffects.removeEffect(LIGHTNING_ROD_ID);
            }
        }
    }

    triggerStrike(enemy, effect, enemies, playerStats, triggerOvergrowthExplosion) {
        const strikeDamage = Number.isFinite(effect.params.damage) ? effect.params.damage : 0;
        if (strikeDamage > 0) {
            enemy.takeDamage(strikeDamage);
        }

        const statusPayload = effect.params.statusPayload || null;
        const applyStatuses = (target) => {
            if (!statusPayload) return;
            const result = applyBulletStatusEffects(
                statusPayload,
                target,
                playerStats,
                { suppressLightningRod: true }
            );
            triggerOvergrowthExplosion(target, result);
        };

        applyStatuses(enemy);

        const chainCount = Number.isFinite(effect.params.chainCount) ? effect.params.chainCount : 0;
        const chainRange = Number.isFinite(effect.params.chainRange) ? effect.params.chainRange : 0;

        if (chainCount > 0 && chainRange > 0) {
            const chainBullet = {
                chainCount,
                chainRange,
                damage: strikeDamage
            };
            this.aoeHandler.handleChainLightning(chainBullet, enemy, enemies, strikeDamage, applyStatuses);
        }
    }
}
