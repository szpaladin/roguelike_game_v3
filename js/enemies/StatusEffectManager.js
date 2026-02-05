import StatusEffect from './StatusEffect.js';
import { getStatusEffect, STATUS_EFFECTS } from './StatusEffects.js';

/**
 * StatusEffectManager - 管理敌人身上的所有状态效果
 */
export default class StatusEffectManager {
    constructor() {
        this.effects = new Map(); // effectId -> StatusEffect
    }

    /**
     * 应用状态效果
     * @param {string} effectId - 效果ID
     * @param {number} duration - 持续时间
     * @param {Object} params - 效果参数
     */
    applyEffect(effectId, duration, params = {}) {
        const definition = getStatusEffect(effectId);
        if (!definition) {
            console.warn(`Unknown status effect: ${effectId}`);
            return;
        }

        // 如果效果已存在
        if (this.effects.has(effectId)) {
            const existingEffect = this.effects.get(effectId);
            const stackBehavior = definition.stackBehavior || 'refresh';

            if (params && typeof params === 'object') {
                existingEffect.params = { ...existingEffect.params, ...params };
                if (params.color) {
                    existingEffect.color = params.color;
                }
            }

            // 可叠加效果（如中毒）
            if (definition.maxStacks > 1) {
                if (stackBehavior === 'independent') {
                    existingEffect.addStacks(params.stacks || 1, duration);
                } else {
                    existingEffect.stack(params.stacks || 1, duration);
                }
            } else {
                // 不可叠加效果，刷新持续时间
                existingEffect.duration = Math.max(existingEffect.duration, duration);
                existingEffect.maxDuration = Math.max(existingEffect.maxDuration, duration);
            }
        } else {
            // 创建新效果
            const effect = new StatusEffect(definition, duration, params);
            this.effects.set(effectId, effect);
        }
    }

    /**
     * 更新所有效果
     * @param {Enemy} enemy - 敌人实例
     * @returns {number} - 总伤害
     */
    update(enemy) {
        let totalDamage = 0;

        // 更新所有效果并累计伤害
        for (const [effectId, effect] of this.effects.entries()) {
            const damage = effect.update(enemy);
            totalDamage += damage;

            // 移除过期效果
            if (effect.isExpired()) {
                this.effects.delete(effectId);
            }
        }

        return totalDamage;
    }

    /**
     * 检查是否有某个效果
     * @param {string} effectId - 效果ID
     */
    hasEffect(effectId) {
        return this.effects.has(effectId);
    }

    /**
     * 获取某个效果
     * @param {string} effectId - 效果ID
     */
    getEffect(effectId) {
        return this.effects.get(effectId);
    }

    /**
     * 移除某个效果
     * @param {string} effectId - 效果ID
     */
    removeEffect(effectId) {
        this.effects.delete(effectId);
    }

    /**
     * 清除所有效果
     */
    clearAll() {
        this.effects.clear();
    }

    /**
     * 获取所有激活的效果
     */
    getAllEffects() {
        return Array.from(this.effects.values());
    }

    /**
     * 检查是否被冰冻
     */
    isFrozen() {
        return this.hasEffect('frozen');
    }

    /**
     * 检查是否被致盲
     */
    isBlinded() {
        return this.hasEffect('blinded');
    }

    /**
     * 获取移动速度倍率
     */
    getSpeedMultiplier() {
        let multiplier = 1.0;

        // 冰冻完全停止移动
        if (this.hasEffect('frozen')) {
            return 0;
        }

        // 减速效果
        if (this.hasEffect('slowed')) {
            const effect = this.getEffect('slowed');
            multiplier *= (1 - effect.params.slowAmount);
        }

        return multiplier;
    }

    /**
     * 获取易伤倍率
     * 注：冰冻效果本身不增加易伤，冰霜武器会同时施加冰冻+易伤两个独立效果
     */
    getVulnerabilityMultiplier() {
        let multiplier = 1.0;

        for (const effect of this.effects.values()) {
            const amount = effect.params ? effect.params.vulnerabilityAmount : 0;
            if (amount > 0) {
                const stackCount = typeof effect.getStackCount === 'function' ? effect.getStackCount() : (effect.stacks || 1);
                multiplier += amount * stackCount;
            }
        }

        return multiplier;
    }
}
