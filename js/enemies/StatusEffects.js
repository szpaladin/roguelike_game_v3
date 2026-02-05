/**
 * StatusEffects - 状态效果定义和注册表
 * 集中管理所有游戏中的状态效果
 */

/**
 * 状态效果类型枚举
 */
export const STATUS_TYPE = {
    DOT: 'dot',       // 持续伤害 (Damage Over Time)
    DEBUFF: 'debuff', // 减益效果
    CC: 'cc'          // 控制效果 (Crowd Control)
};

/**
 * 所有状态效果的定义
 */
export const STATUS_EFFECTS = {
    // 燃烧 - 持续火焰伤害
    BURNING: {
        id: 'burning',
        name: '燃烧',
        type: STATUS_TYPE.DOT,
        color: '#ff4500',
        icon: '🔥',
        maxStacks: 1,
        description: '每帧造成持续火焰伤害',
        // 默认参数（可被武器覆盖）
        defaultDuration: 180,
        defaultDamagePerFrame: 5 / 60
    },

    // 黑焰 - 超长持续与接触传播
    DARK_FLAME: {
        id: 'dark_flame',
        name: '黑焰',
        type: STATUS_TYPE.DOT,
        color: '#2b153a',
        icon: '🖤',
        maxStacks: 1,
        description: '超长持续黑焰，可接触传播',
        defaultDuration: 1800,
        defaultDamagePerFrame: 0.04,
        spreadInterval: 60,
        contactPadding: 6
    },

    // 冰冻 - 减速/定身
    FROZEN: {
        id: 'frozen',
        name: '冰冻',
        type: STATUS_TYPE.CC,
        color: '#00ffff',
        icon: '❄️',
        maxStacks: 1,
        description: '无法移动，受到额外10%伤害',
        defaultDuration: 60,
        defaultSlowAmount: 1.0 // 1.0 = 完全冻结
    },

    // 中毒 - 可叠加的持续伤害
    POISONED: {
        id: 'poisoned',
        name: '中毒',
        type: STATUS_TYPE.DOT,
        color: '#00ff00',
        icon: '☠️',
        maxStacks: 100,
        stackBehavior: 'independent',
        description: '持续毒性伤害，可叠加',
        defaultDuration: 300,
        defaultDamagePerStack: 5 / 60
    },

    // 瘟疫 - 可扩散的持续伤害
    PLAGUED: {
        id: 'plagued',
        name: '瘟疫',
        type: STATUS_TYPE.DOT,
        color: '#6f7a66',
        icon: '🦠',
        maxStacks: 40,
        stackBehavior: 'independent',
        description: '持续瘟疫伤害，可扩散',
        defaultDuration: 600,
        defaultDamagePerStack: 2 / 60,
        cloudRadius: 140,
        spreadInterval: 30,
        spreadRadius: 140,
        spreadStacks: 1,
        deathCloudDuration: 120,
        deathCloudInterval: 30,
        deathCloudRadius: 140,
        deathCloudStacks: 1
    },

    // 蔓延 - 叠层爆发
    OVERGROWTH: {
        id: 'overgrowth',
        name: '蔓延',
        type: STATUS_TYPE.DEBUFF,
        color: '#6ccf6d',
        icon: '🌱',
        maxStacks: 3,
        description: '叠层至3层后爆发',
        defaultDuration: 300,
        defaultTriggerStacks: 3,
        defaultExplosionRadius: 60,
        defaultExplosionMultiplier: 2.5
    },

    // 诅咒 - 受伤触发额外伤害
    CURSED: {
        id: 'cursed',
        name: '诅咒',
        type: STATUS_TYPE.DEBUFF,
        color: '#7b3f8c',
        icon: '🧿',
        maxStacks: 100,
        stackBehavior: 'independent',
        description: '受到非诅咒伤害时消耗层数并触发额外伤害',
        defaultDuration: 1800,
        defaultConsumeStacks: 1,
        defaultDamageMultiplier: 1.5
    },

    // 海渊献祭 - 敌人死亡时回复氧气
    ABYSS_SACRIFICE: {
        id: 'abyss_sacrifice',
        name: '海渊献祭',
        type: STATUS_TYPE.DEBUFF,
        color: '#3a4b6a',
        icon: '🪬',
        maxStacks: 1,
        description: '目标在状态持续期间死亡时，回复玩家氧气',
        defaultDuration: 600,
        defaultHeal: 2
    },

    // 引雷 - 周期触发闪电打击
    LIGHTNING_ROD: {
        id: 'lightning_rod',
        name: '引雷',
        type: STATUS_TYPE.DEBUFF,
        color: '#ffe066',
        icon: '🗼',
        maxStacks: 1,
        description: '周期触发闪电打击，命中刷新次数',
        defaultDuration: 180,
        defaultInterval: 60,
        defaultStrikes: 3
    },

    // 秒杀 - 概率处决
    EXECUTE: {
        id: 'execute',
        name: '秒杀',
        type: STATUS_TYPE.DEBUFF,
        color: '#ff8a8a',
        icon: '⚔️',
        maxStacks: 1,
        description: '命中有概率直接秒杀非Boss目标；连锁/范围为直接命中的1/10；冰锥需碎冰触发'
    },

    // 岩脊带控场 - 地形减速
    RIDGE_CONTROL: {
        id: 'ridge_control',
        name: '岩脊带控场',
        type: STATUS_TYPE.DEBUFF,
        color: '#6b5a4a',
        icon: '⛰️',
        maxStacks: 1,
        description: '生成岩脊带，范围内敌人持续减速',
        defaultDuration: 120,
        defaultLength: 90,
        defaultWidth: 18,
        defaultSlowAmount: 0.3,
        defaultSlowDuration: 120
    },

    // 易伤 - 增加受到的伤害
    VULNERABLE: {
        id: 'vulnerable',
        name: '易伤',
        type: STATUS_TYPE.DEBUFF,
        color: '#ff00ff',
        icon: '💔',
        maxStacks: 1,
        description: '受到的伤害增加',
        defaultDuration: 180,
        defaultVulnerabilityAmount: 0.5 // 50% 额外伤害
    },

    // 辐射易伤 - 可叠加的易伤
    RADIATION_VULNERABLE: {
        id: 'radiation_vulnerable',
        name: '辐射易伤',
        type: STATUS_TYPE.DEBUFF,
        color: '#7CFC00',
        icon: '☢️',
        maxStacks: 5,
        stackBehavior: 'independent',
        description: '由辐射造成易伤，可叠加',
        defaultDuration: 600,
        defaultVulnerabilityAmount: 0.1 // 每层 +10% 易伤
    },

    // 致盲 - 无法攻击玩家
    BLINDED: {
        id: 'blinded',
        name: '致盲',
        type: STATUS_TYPE.CC,
        color: '#000000',
        icon: '👁️',
        maxStacks: 1,
        description: '无法对玩家造成伤害',
        defaultDuration: 180
    },

    // 减速 - 移动速度降低
    SLOWED: {
        id: 'slowed',
        name: '减速',
        type: STATUS_TYPE.DEBUFF,
        color: '#4169e1',
        icon: '🐌',
        maxStacks: 1,
        description: '移动速度降低',
        defaultDuration: 120,
        defaultSlowAmount: 0.5 // 50% 减速
    }
};

const LIGHTNING_ROD_STATUS_FIELDS = [
    'burnDuration',
    'burnDamagePerFrame',
    'burnColor',
    'freezeChance',
    'freezeDuration',
    'vulnerability',
    'vulnerabilityDuration',
    'radiationVulnerability',
    'radiationVulnerabilityDuration',
    'darkFlameDuration',
    'darkFlameDamagePerFrame',
    'darkFlameSpreadInterval',
    'darkFlameContactPadding',
    'darkFlameColor',
    'abyssSacrificeDuration',
    'abyssSacrificeHeal',
    'plagueDuration',
    'plagueDamagePerStack',
    'plagueColor',
    'plagueCloudRadius',
    'poisonDuration',
    'poisonDamagePerStack',
    'overgrowthDuration',
    'overgrowthTriggerStacks',
    'overgrowthExplosionRadius',
    'overgrowthExplosionMultiplier',
    'overgrowthExplosionColor',
    'curseDuration',
    'curseConsumeStacks',
    'curseDamageMultiplier',
    'blindChance',
    'blindDuration',
    'lifeStealChance',
    'lifeStealAmount',
    'lightningRodDuration',
    'lightningRodInterval',
    'lightningRodStrikes'
];

function buildLightningRodStatusPayload(bulletData) {
    const payload = {};
    for (const field of LIGHTNING_ROD_STATUS_FIELDS) {
        if (bulletData[field] !== undefined) {
            payload[field] = bulletData[field];
        }
    }
    return payload;
}

/**
 * 根据ID获取状态效果定义
 * @param {string} effectId - 效果ID
 * @returns {Object|null} - 效果定义
 */
export function getStatusEffect(effectId) {
    const key = effectId.toUpperCase();
    return STATUS_EFFECTS[key] || null;
}

/**
 * 获取所有状态效果列表
 * @returns {Array<Object>} - 所有效果定义
 */
export function getAllStatusEffects() {
    return Object.values(STATUS_EFFECTS);
}

/**
 * 根据武器效果属性创建状态效果参数
 * @param {Object} bulletData - 子弹数据（包含武器属性）
 * @returns {Array<Object>} - 状态效果参数列表 [{effectId, duration, params}]
 */
export function extractStatusEffectsFromBullet(bulletData) {
    const effects = [];
    const hasBurn = bulletData.burnDuration > 0;
    const hasFreeze = bulletData.freezeChance > 0;
    const hasDarkFlame = bulletData.darkFlameDuration > 0;
    const hasAbyssSacrifice = bulletData.abyssSacrificeDuration > 0;
    const hasLightningRod = bulletData.lightningRodDuration > 0;

    // 燃烧效果
    if (hasBurn) {
        effects.push({
            effectId: 'burning',
            duration: bulletData.burnDuration,
            params: {
                damagePerFrame: bulletData.burnDamagePerFrame || STATUS_EFFECTS.BURNING.defaultDamagePerFrame,
                color: bulletData.burnColor
            }
        });

        // 燃烧同时施加易伤
        if (bulletData.vulnerability > 0) {
            effects.push({
                effectId: 'vulnerable',
                duration: bulletData.burnDuration,
                params: {
                    vulnerabilityAmount: bulletData.vulnerability
                }
            });
        }
    }

    // 冰冻效果
    if (hasFreeze && Math.random() < bulletData.freezeChance) {
        effects.push({
            effectId: 'frozen',
            duration: bulletData.freezeDuration || STATUS_EFFECTS.FROZEN.defaultDuration,
            params: {
                slowAmount: 1.0 // 完全冻结
            }
        });
    }

    if (bulletData.vulnerability > 0 && !hasBurn && !hasFreeze) {
        effects.push({
            effectId: 'vulnerable',
            duration: bulletData.vulnerabilityDuration || STATUS_EFFECTS.VULNERABLE.defaultDuration,
            params: {
                vulnerabilityAmount: bulletData.vulnerability
            }
        });
    }

    // 黑焰效果
    if (hasDarkFlame) {
        effects.push({
            effectId: 'dark_flame',
            duration: bulletData.darkFlameDuration,
            params: {
                damagePerFrame: bulletData.darkFlameDamagePerFrame || STATUS_EFFECTS.DARK_FLAME.defaultDamagePerFrame,
                baseDuration: bulletData.darkFlameDuration,
                spreadInterval: bulletData.darkFlameSpreadInterval || STATUS_EFFECTS.DARK_FLAME.spreadInterval,
                contactPadding: bulletData.darkFlameContactPadding || STATUS_EFFECTS.DARK_FLAME.contactPadding,
                color: bulletData.darkFlameColor
            }
        });
    }

    // 海渊献祭效果
    if (hasAbyssSacrifice) {
        effects.push({
            effectId: 'abyss_sacrifice',
            duration: bulletData.abyssSacrificeDuration,
            params: {
                healAmount: bulletData.abyssSacrificeHeal || STATUS_EFFECTS.ABYSS_SACRIFICE.defaultHeal
            }
        });
    }

    if (bulletData.radiationVulnerability > 0) {
        effects.push({
            effectId: 'radiation_vulnerable',
            duration: bulletData.radiationVulnerabilityDuration || STATUS_EFFECTS.RADIATION_VULNERABLE.defaultDuration,
            params: {
                vulnerabilityAmount: bulletData.radiationVulnerability,
                stacks: 1
            }
        });
    }

    // 瘟疫效果
    if (bulletData.plagueDuration > 0) {
        const cloudRadius = bulletData.plagueCloudRadius
            || STATUS_EFFECTS.PLAGUED.cloudRadius
            || STATUS_EFFECTS.PLAGUED.deathCloudRadius
            || STATUS_EFFECTS.PLAGUED.spreadRadius;
        effects.push({
            effectId: 'plagued',
            duration: bulletData.plagueDuration,
            params: {
                damagePerStack: bulletData.plagueDamagePerStack || STATUS_EFFECTS.PLAGUED.defaultDamagePerStack,
                stacks: 1,
                baseDuration: bulletData.plagueDuration,
                color: bulletData.plagueColor,
                cloudRadius
            }
        });
    }

    // 中毒效果
    if (bulletData.poisonDuration > 0) {
        effects.push({
            effectId: 'poisoned',
            duration: bulletData.poisonDuration,
            params: {
                damagePerStack: bulletData.poisonDamagePerStack || STATUS_EFFECTS.POISONED.defaultDamagePerStack,
                stacks: 1 // 每次命中+1层
            }
        });
    }

    // 蔓延效果
    if (bulletData.overgrowthDuration > 0) {
        effects.push({
            effectId: 'overgrowth',
            duration: bulletData.overgrowthDuration || STATUS_EFFECTS.OVERGROWTH.defaultDuration,
            params: {
                stacks: 1,
                triggerStacks: bulletData.overgrowthTriggerStacks || STATUS_EFFECTS.OVERGROWTH.defaultTriggerStacks,
                explosionRadius: bulletData.overgrowthExplosionRadius || STATUS_EFFECTS.OVERGROWTH.defaultExplosionRadius,
                explosionMultiplier: bulletData.overgrowthExplosionMultiplier || STATUS_EFFECTS.OVERGROWTH.defaultExplosionMultiplier
            }
        });
    }

    // 诅咒效果
    if (bulletData.curseDuration > 0) {
        effects.push({
            effectId: 'cursed',
            duration: bulletData.curseDuration || STATUS_EFFECTS.CURSED.defaultDuration,
            params: {
                stacks: 1,
                consumeStacks: bulletData.curseConsumeStacks || STATUS_EFFECTS.CURSED.defaultConsumeStacks,
                damageMultiplier: bulletData.curseDamageMultiplier || STATUS_EFFECTS.CURSED.defaultDamageMultiplier
            }
        });
    }

    // 致盲效果
    if (bulletData.blindChance > 0 && Math.random() < bulletData.blindChance) {
        effects.push({
            effectId: 'blinded',
            duration: bulletData.blindDuration || STATUS_EFFECTS.BLINDED.defaultDuration,
            params: {}
        });
    }

    // 引雷效果
    if (hasLightningRod) {
        const rodDuration = bulletData.lightningRodDuration || STATUS_EFFECTS.LIGHTNING_ROD.defaultDuration;
        effects.push({
            effectId: 'lightning_rod',
            duration: rodDuration,
            params: {
                interval: bulletData.lightningRodInterval || STATUS_EFFECTS.LIGHTNING_ROD.defaultInterval,
                strikesRemaining: bulletData.lightningRodStrikes || STATUS_EFFECTS.LIGHTNING_ROD.defaultStrikes,
                damage: bulletData.damage || 0,
                chainCount: bulletData.chainCount || 0,
                chainRange: bulletData.chainRange || 0,
                statusPayload: buildLightningRodStatusPayload(bulletData)
            }
        });
    }

    return effects;
}

/**
 * 应用子弹的状态效果到敌人
 * 从 CollisionManager 移动至此，集中管理状态效果应用逻辑
 * 
 * @param {Object} bullet - 子弹对象（包含武器属性）
 * @param {Enemy} enemy - 敌人对象
 * @param {PlayerStats|null} playerStats - 玩家属性（用于获取智力倍率）
 */
export function applyBulletStatusEffects(bullet, enemy, playerStats = null, options = {}) {
    const result = {};

    // 获取智力倍率（用于 DOT 伤害）
    const intMultiplier = playerStats ? (playerStats.intelligence + 45) / 50 : 1;
    const modifiers = options && options.modifiers ? options.modifiers : {};
    const dotDurationMultiplier = Number.isFinite(modifiers.dotDurationMultiplier) ? modifiers.dotDurationMultiplier : 1;
    const dotDamageMultiplier = Number.isFinite(modifiers.dotDamageMultiplier) ? modifiers.dotDamageMultiplier : 1;
    const freezeChanceMultiplier = Number.isFinite(modifiers.freezeChanceMultiplier) ? modifiers.freezeChanceMultiplier : 1;
    const freezeDurationBonus = Number.isFinite(modifiers.freezeDurationBonus) ? modifiers.freezeDurationBonus : 0;
    const curseDamageMultiplier = Number.isFinite(modifiers.curseDamageMultiplier) ? modifiers.curseDamageMultiplier : 1;
    const curseConsumeStacksBonus = Number.isFinite(modifiers.curseConsumeStacksBonus) ? modifiers.curseConsumeStacksBonus : 0;
    const curseDurationMultiplier = Number.isFinite(modifiers.curseDurationMultiplier) ? modifiers.curseDurationMultiplier : 1;
    const overgrowthExplosionMultiplier = Number.isFinite(modifiers.overgrowthExplosionMultiplier)
        ? modifiers.overgrowthExplosionMultiplier
        : 1;
    const overgrowthExplosionRadiusBonus = Number.isFinite(modifiers.overgrowthExplosionRadiusBonus)
        ? modifiers.overgrowthExplosionRadiusBonus
        : 0;
    const hasBurn = bullet.burnDuration > 0;
    const hasFreeze = bullet.freezeChance > 0;
    const hasDarkFlame = bullet.darkFlameDuration > 0;
    const hasAbyssSacrifice = bullet.abyssSacrificeDuration > 0;
    const hasLightningRod = bullet.lightningRodDuration > 0;
    const suppressFreeze = options && options.suppressFreeze === true;
    const suppressLightningRod = options && options.suppressLightningRod === true;

    // 冰冻效果（触发时同时施加易伤）
    if (hasFreeze && !suppressFreeze && Math.random() < bullet.freezeChance * freezeChanceMultiplier) {
        const freezeDuration = (bullet.freezeDuration || STATUS_EFFECTS.FROZEN.defaultDuration) + freezeDurationBonus;
        enemy.applyFreeze(freezeDuration);

        if (bullet.vulnerability > 0) {
            enemy.applyVulnerable(bullet.vulnerability, freezeDuration);
        }
    }

    // 燃烧效果（DOT 伤害 = 基础伤害 × 智力倍率）
    if (hasBurn) {
        const burnDuration = (bullet.burnDuration || STATUS_EFFECTS.BURNING.defaultDuration) * dotDurationMultiplier;
        const burnDamage = (bullet.burnDamagePerFrame || STATUS_EFFECTS.BURNING.defaultDamagePerFrame)
            * intMultiplier
            * dotDamageMultiplier;
        enemy.applyBurn(burnDuration, burnDamage, bullet.burnColor);

        if (bullet.vulnerability > 0) {
            enemy.applyVulnerable(bullet.vulnerability, burnDuration);
        }
    }

    if (bullet.vulnerability > 0 && !hasBurn && !hasFreeze) {
        const vulnDuration = bullet.vulnerabilityDuration || STATUS_EFFECTS.VULNERABLE.defaultDuration;
        enemy.applyVulnerable(bullet.vulnerability, vulnDuration);
    }

    if (bullet.radiationVulnerability > 0) {
        const radiationDuration = bullet.radiationVulnerabilityDuration || STATUS_EFFECTS.RADIATION_VULNERABLE.defaultDuration;
        enemy.applyStatusEffect('radiation_vulnerable', radiationDuration, {
            vulnerabilityAmount: bullet.radiationVulnerability,
            stacks: 1
        });
    }

    // 瘟疫效果（DOT 伤害 = 基础伤害 × 智力倍率）
    if (bullet.plagueDuration > 0) {
        const plagueDuration = (bullet.plagueDuration || STATUS_EFFECTS.PLAGUED.defaultDuration) * dotDurationMultiplier;
        const plagueDamage = (bullet.plagueDamagePerStack || STATUS_EFFECTS.PLAGUED.defaultDamagePerStack)
            * intMultiplier
            * dotDamageMultiplier;
        const cloudRadius = bullet.plagueCloudRadius
            || STATUS_EFFECTS.PLAGUED.cloudRadius
            || STATUS_EFFECTS.PLAGUED.deathCloudRadius
            || STATUS_EFFECTS.PLAGUED.spreadRadius;
        enemy.applyStatusEffect('plagued', plagueDuration, {
            damagePerStack: plagueDamage,
            stacks: 1,
            baseDuration: plagueDuration,
            color: bullet.plagueColor,
            cloudRadius
        });
    }

    // 致盲效果
    if (bullet.blindChance > 0 && Math.random() < bullet.blindChance) {
        enemy.applyBlind(bullet.blindDuration || STATUS_EFFECTS.BLINDED.defaultDuration);
    }

    // 中毒效果（DOT 伤害 = 基础伤害 × 智力倍率）
    if (bullet.poisonDuration > 0) {
        const poisonDuration = (bullet.poisonDuration || STATUS_EFFECTS.POISONED.defaultDuration) * dotDurationMultiplier;
        const poisonDamage = (bullet.poisonDamagePerStack || STATUS_EFFECTS.POISONED.defaultDamagePerStack)
            * intMultiplier
            * dotDamageMultiplier;
        enemy.applyPoison(poisonDuration, poisonDamage);
    }

    // 蔓延效果（叠层达到阈值后爆发）
    if (bullet.overgrowthDuration > 0) {
        const duration = bullet.overgrowthDuration || STATUS_EFFECTS.OVERGROWTH.defaultDuration;
        const triggerStacks = bullet.overgrowthTriggerStacks || STATUS_EFFECTS.OVERGROWTH.defaultTriggerStacks;
        const explosionRadius = (bullet.overgrowthExplosionRadius || STATUS_EFFECTS.OVERGROWTH.defaultExplosionRadius)
            + overgrowthExplosionRadiusBonus;
        const explosionMultiplier = (bullet.overgrowthExplosionMultiplier || STATUS_EFFECTS.OVERGROWTH.defaultExplosionMultiplier)
            * overgrowthExplosionMultiplier;
        enemy.applyStatusEffect('overgrowth', duration, {
            stacks: 1,
            triggerStacks,
            explosionRadius,
            explosionMultiplier
        });

        const overgrowthEffect = enemy.statusEffects ? enemy.statusEffects.getEffect('overgrowth') : null;
        const stackCount = overgrowthEffect && typeof overgrowthEffect.getStackCount === 'function'
            ? overgrowthEffect.getStackCount()
            : (overgrowthEffect ? overgrowthEffect.stacks : 0);

        if (stackCount >= triggerStacks && enemy.statusEffects) {
            enemy.statusEffects.removeEffect('overgrowth');
            result.overgrowth = {
                radius: explosionRadius,
                multiplier: explosionMultiplier,
                color: bullet.overgrowthExplosionColor || STATUS_EFFECTS.OVERGROWTH.color
            };
        }
    }

    // 黑焰效果（DOT 伤害 = 基础伤害 × 智力倍率）
    if (hasDarkFlame) {
        const darkFlameDuration = (bullet.darkFlameDuration || STATUS_EFFECTS.DARK_FLAME.defaultDuration) * dotDurationMultiplier;
        const darkFlameDamage = (bullet.darkFlameDamagePerFrame || STATUS_EFFECTS.DARK_FLAME.defaultDamagePerFrame)
            * intMultiplier
            * dotDamageMultiplier;
        const spreadInterval = bullet.darkFlameSpreadInterval || STATUS_EFFECTS.DARK_FLAME.spreadInterval;
        const contactPadding = bullet.darkFlameContactPadding || STATUS_EFFECTS.DARK_FLAME.contactPadding;
        const color = bullet.darkFlameColor || STATUS_EFFECTS.DARK_FLAME.color;
        enemy.applyStatusEffect('dark_flame', darkFlameDuration, {
            damagePerFrame: darkFlameDamage,
            baseDuration: darkFlameDuration,
            spreadInterval,
            contactPadding,
            color
        });
    }

    // 海渊献祭效果（敌人死亡时回复氧气）
    if (hasAbyssSacrifice) {
        const duration = bullet.abyssSacrificeDuration || STATUS_EFFECTS.ABYSS_SACRIFICE.defaultDuration;
        const healAmount = bullet.abyssSacrificeHeal || STATUS_EFFECTS.ABYSS_SACRIFICE.defaultHeal;
        enemy.applyStatusEffect('abyss_sacrifice', duration, {
            healAmount
        });
    }

    // 引雷效果（周期闪电，刷新次数）
    if (hasLightningRod && !suppressLightningRod) {
        const duration = bullet.lightningRodDuration || STATUS_EFFECTS.LIGHTNING_ROD.defaultDuration;
        const interval = bullet.lightningRodInterval || STATUS_EFFECTS.LIGHTNING_ROD.defaultInterval;
        const strikes = bullet.lightningRodStrikes || STATUS_EFFECTS.LIGHTNING_ROD.defaultStrikes;
        const statusPayload = buildLightningRodStatusPayload(bullet);

        enemy.applyStatusEffect('lightning_rod', duration, {
            interval,
            strikesRemaining: strikes,
            damage: bullet.damage || 0,
            chainCount: bullet.chainCount || 0,
            chainRange: bullet.chainRange || 0,
            statusPayload
        });

        const effect = enemy.statusEffects ? enemy.statusEffects.getEffect('lightning_rod') : null;
        if (effect) {
            effect.params.interval = interval;
            effect.params.strikesRemaining = strikes;
            effect.params.damage = bullet.damage || 0;
            effect.params.chainCount = bullet.chainCount || 0;
            effect.params.chainRange = bullet.chainRange || 0;
            effect.params.statusPayload = statusPayload;
            effect.strikeCooldown = interval;
        }
    }

    // 诅咒效果（叠层，受伤时触发）
    if (bullet.curseDuration > 0) {
        const duration = (bullet.curseDuration || STATUS_EFFECTS.CURSED.defaultDuration) * curseDurationMultiplier;
        const consumeStacks = (bullet.curseConsumeStacks || STATUS_EFFECTS.CURSED.defaultConsumeStacks) + curseConsumeStacksBonus;
        const damageMultiplier = (bullet.curseDamageMultiplier || STATUS_EFFECTS.CURSED.defaultDamageMultiplier)
            * curseDamageMultiplier;
        enemy.applyStatusEffect('cursed', duration, {
            stacks: 1,
            consumeStacks,
            damageMultiplier,
            intMultiplier
        });
    }

    // 吸血效果
    if (bullet.lifeStealChance > 0 && Math.random() < bullet.lifeStealChance) {
        if (playerStats) {
            playerStats.heal(bullet.lifeStealAmount || 1);
        }
    }

    return Object.keys(result).length ? result : null;
}

