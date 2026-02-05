import { circleCollision } from '../utils.js';
import AOEHandler from './AOEHandler.js';
import { applyBulletStatusEffects } from '../enemies/StatusEffects.js';

/**
 * CollisionManager - 碰撞管理器
 * 处理游戏内实体的碰撞检测
 * AOE效果处理已移至 AOEHandler.js
 * 状态效果应用已移至 StatusEffects.js
 */
export default class CollisionManager {
    constructor() {
        // AOE 效果处理器
        this.aoeHandler = new AOEHandler();
        this.effectsManager = null;
        // 玩家引用（用于吸血等效果）
        this.player = null;
        this.terrainEffects = null;
    }

    /**
     * 设置依赖
     * @param {EffectsManager} effectsManager - 特效管理器
     * @param {BulletPool} bulletPool - 子弹池
     * @param {Player} player - 玩家对象
     */
    setDependencies(effectsManager, bulletPool, player, terrainEffects = null) {
        this.aoeHandler.setDependencies(effectsManager, bulletPool);
        this.effectsManager = effectsManager;
        this.player = player;
        this.terrainEffects = terrainEffects;
    }

    /**
     * 敌人-敌人碰撞分离（避免重叠）
     * @param {Array<Enemy>} enemies - 敌人列表
     * @param {Object} bounds - 边界（可选）{ left, right }
     */
    resolveEnemyCollisions(enemies, bounds = null) {
        if (!Array.isArray(enemies) || enemies.length < 2) return;

        const left = bounds && Number.isFinite(bounds.left) ? bounds.left : null;
        const right = bounds && Number.isFinite(bounds.right) ? bounds.right : null;

        for (let i = 0; i < enemies.length; i++) {
            const a = enemies[i];
            if (!a || a.hp <= 0) continue;

            for (let j = i + 1; j < enemies.length; j++) {
                const b = enemies[j];
                if (!b || b.hp <= 0) continue;

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const minDist = (a.radius || 0) + (b.radius || 0);
                const minDistSq = minDist * minDist;
                const distSq = dx * dx + dy * dy;

                if (distSq >= minDistSq || minDist <= 0) continue;

                let dist = Math.sqrt(distSq);
                let nx = 0;
                let ny = 0;

                if (dist === 0) {
                    nx = 1;
                    ny = 0;
                } else {
                    nx = dx / dist;
                    ny = dy / dist;
                }

                const overlap = minDist - dist;
                const push = overlap * 0.5;

                a.x -= nx * push;
                a.y -= ny * push;
                b.x += nx * push;
                b.y += ny * push;

                if (left !== null && right !== null) {
                    const aMin = left + (a.radius || 0);
                    const aMax = right - (a.radius || 0);
                    const bMin = left + (b.radius || 0);
                    const bMax = right - (b.radius || 0);
                    a.x = Math.max(aMin, Math.min(aMax, a.x));
                    b.x = Math.max(bMin, Math.min(bMax, b.x));
                }
            }
        }
    }

    /**
     * 子弹与屏幕边界碰撞（左右/下反弹，上方出界消失）
     * @param {Array<Bullet>} bullets - 子弹列表
     * @param {Object} bounds - 边界 { left, right, top, bottom }
     */
    checkBulletWallCollisions(bullets, bounds) {
        if (!Array.isArray(bullets) || !bounds) return;

        const left = Number.isFinite(bounds.left) ? bounds.left : 0;
        const right = Number.isFinite(bounds.right) ? bounds.right : 0;
        const top = Number.isFinite(bounds.top) ? bounds.top : 0;
        const bottom = Number.isFinite(bounds.bottom) ? bounds.bottom : 0;

        for (const bullet of bullets) {
            if (!bullet || !bullet.active) continue;

            // 上方出界：仅当持续向上飞行时移除（避免天降子弹被立刻清除）
            if (bullet.y + bullet.radius < top && bullet.vy <= 0) {
                bullet.active = false;
                continue;
            }

            if (bullet.bounceOnWall === false) continue;

            if (bullet.x - bullet.radius <= left) {
                bullet.x = left + bullet.radius;
                bullet.vx = Math.abs(bullet.vx);
            } else if (bullet.x + bullet.radius >= right) {
                bullet.x = right - bullet.radius;
                bullet.vx = -Math.abs(bullet.vx);
            }

            if (bullet.y + bullet.radius >= bottom) {
                bullet.y = bottom - bullet.radius;
                bullet.vy = -Math.abs(bullet.vy);
            }
        }
    }

    /**
     * 计算子弹与圆形敌人的反弹
     */
    bounceBulletOffEnemy(bullet, enemy) {
        if (!bullet || !enemy) return;

        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let nx = 0;
        let ny = 0;

        if (dist > 0) {
            nx = dx / dist;
            ny = dy / dist;
        } else {
            const vLen = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
            if (vLen > 0) {
                nx = bullet.vx / vLen;
                ny = bullet.vy / vLen;
            } else {
                nx = 1;
                ny = 0;
            }
        }

        const dot = bullet.vx * nx + bullet.vy * ny;
        bullet.vx = bullet.vx - 2 * dot * nx;
        bullet.vy = bullet.vy - 2 * dot * ny;

        // 把子弹推出敌人体外，避免连续判定
        const targetDist = (enemy.radius || 0) + (bullet.radius || 0) + 0.1;
        bullet.x = enemy.x + nx * targetDist;
        bullet.y = enemy.y + ny * targetDist;
    }

    /**
     * 检查玩家与所有敌人的碰撞
     * @param {Player} player - 玩家对象
     * @param {Array<Enemy>} enemies - 敌人列表
     * @param {number} scrollY - 滚动偏移
     * @returns {Array<Enemy>} - 与玩家碰撞的敌人列表
     */
    checkPlayerEnemyCollisions(player, enemies, scrollY = 0) {
        const collisions = [];

        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;

            const enemyScreenY = enemy.y - scrollY;
            if (circleCollision(player.x, player.y, player.radius, enemy.x, enemyScreenY, enemy.radius)) {
                collisions.push(enemy);
            }
        }

        return collisions;
    }

    /**
     * 检查所有子弹与所有敌人的碰撞
     * @param {Array<Bullet>} bullets - 子弹列表
     * @param {Array<Enemy>} enemies - 敌人列表
     * @param {number} playerAttack - 玩家攻击力（力量值）
     * @returns {Array<Object>} - 命中记录 [{bullet, enemy, damage}]
     */
    checkBulletEnemyCollisions(bullets, enemies, playerAttack = 5) {
        const hits = [];
        const playerStats = this.player ? this.player.stats : null;
        const artifactSystem = this.player ? this.player.artifactSystem : null;
        const statusModifiers = artifactSystem && typeof artifactSystem.getStatusModifiers === 'function'
            ? artifactSystem.getStatusModifiers()
            : null;
        const intMultiplier = playerStats ? (playerStats.intelligence + 45) / 50 : 1;
        const baseAttack = Number.isFinite(playerAttack) ? playerAttack : 0;
        const baseEffectiveAttack = baseAttack + 45;
        const globalDamageMultiplier = artifactSystem && typeof artifactSystem.getDamageMultiplier === 'function'
            ? artifactSystem.getDamageMultiplier()
            : 1;

        const resolveChainChance = (baseChance, chainChance) => {
            if (Number.isFinite(chainChance)) return chainChance;
            if (Number.isFinite(baseChance)) return baseChance * 0.1;
            return 0;
        };

        const tryExecute = (target, bulletData, options = {}) => {
            if (!target || target.hp <= 0) return false;
            if (target.isBoss === true) return false;

            const isSecondary = options.isSecondary === true;
            const shatterTriggered = options.shatterTriggered === true;
            const hasShatterExecute = Number.isFinite(bulletData.executeOnShatterChance)
                || Number.isFinite(bulletData.executeOnShatterChainChance);

            if (hasShatterExecute && !shatterTriggered) return false;

            let chance = 0;
            if (hasShatterExecute) {
                chance = isSecondary
                    ? resolveChainChance(bulletData.executeOnShatterChance, bulletData.executeOnShatterChainChance)
                    : bulletData.executeOnShatterChance;
            } else {
                chance = isSecondary
                    ? resolveChainChance(bulletData.executeChance, bulletData.executeChainChance)
                    : bulletData.executeChance;
            }

            if (!Number.isFinite(chance) || chance <= 0) return false;
            if (Math.random() >= chance) return false;

            target.hp = 0;
            if (this.effectsManager) {
                const offsetY = Number.isFinite(target.radius) ? target.radius + 6 : 6;
                this.effectsManager.addFloatingText(target.x, target.y - offsetY, '\u79d2\u6740', {
                    font: '10px Arial',
                    color: '#fff2f2',
                    life: 40,
                    vy: -0.6
                });
            }
            return true;
        };

        const triggerOvergrowthExplosion = (target, statusResult, attackValue) => {
            if (!statusResult || !statusResult.overgrowth) return;
            const { radius, multiplier, color } = statusResult.overgrowth;
            const damage = attackValue * multiplier * intMultiplier;
            this.aoeHandler.handleStatusExplosion(target, enemies, damage, radius, color);
            if (artifactSystem && typeof artifactSystem.onOvergrowthExplosion === 'function') {
                artifactSystem.onOvergrowthExplosion();
            }
        };

        for (const bullet of bullets) {
            if (!bullet.active) continue;

            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;

                // 检查是否已经击中过该敌人 (防止穿透子弹重复计伤)
                if (bullet.hitEntities && bullet.hitEntities.has(enemy)) continue;

                if (circleCollision(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
                    // 计算伤害
                    const isFullScreenDamage = bullet.fullScreenDamage === true;
                    const isFrozenBeforeHit = !isFullScreenDamage && enemy.statusEffects && enemy.statusEffects.isFrozen();
                    const shatterMultiplier = Number.isFinite(bullet.shatterMultiplier) ? bullet.shatterMultiplier : 1;
                    const shatterTriggered = !isFullScreenDamage && shatterMultiplier > 1 && isFrozenBeforeHit;
                    let actualDamage = 0;

                    if (!isFullScreenDamage) {
                        const hitMultiplier = artifactSystem && typeof artifactSystem.getHitDamageMultiplier === 'function'
                            ? artifactSystem.getHitDamageMultiplier(enemy)
                            : 1;
                        const rawDamage = (bullet.damage || 0) * (shatterTriggered ? shatterMultiplier : 1) * hitMultiplier;
                        actualDamage = enemy.takeDamage(rawDamage);
                        if (shatterTriggered && bullet.shatterConsumesFrozen !== false && enemy.statusEffects) {
                            enemy.statusEffects.removeEffect('frozen');
                        }
                    }

                    // 应用状态效果（传入玩家属性用于智力倍率计算）
                    const suppressFreeze = shatterTriggered && bullet.shatterPreventRefreeze !== false;
                    const attackMultiplier = bullet.damageMultiplier ?? globalDamageMultiplier;
                    const attackValue = baseEffectiveAttack * attackMultiplier;
                    const statusResult = applyBulletStatusEffects(bullet, enemy, playerStats, {
                        suppressFreeze,
                        modifiers: statusModifiers
                    });
                    triggerOvergrowthExplosion(enemy, statusResult, attackValue);
                    tryExecute(enemy, bullet, { shatterTriggered });

                    // 应用攻击范围效果
                    const applyStatuses = (target) => {
                        const targetFrozenBefore = target.statusEffects && target.statusEffects.isFrozen();
                        const result = applyBulletStatusEffects(bullet, target, playerStats, { modifiers: statusModifiers });
                        triggerOvergrowthExplosion(target, result, attackValue);
                        const secondaryShatter = shatterMultiplier > 1 && targetFrozenBefore;
                        tryExecute(target, bullet, { isSecondary: true, shatterTriggered: secondaryShatter });
                    };
                    this.aoeHandler.handleRangeEffects(bullet, enemy, enemies, attackValue, applyStatuses);

                    if (!isFullScreenDamage && artifactSystem && typeof artifactSystem.applyOnHitEffects === 'function') {
                        artifactSystem.applyOnHitEffects(bullet, enemy, enemies, attackValue, this.aoeHandler);
                    }

                    hits.push({ bullet, enemy, damage: actualDamage });

                    if (bullet.terrainOnHit && bullet.terrainOnHit.type === 'ridge' && this.terrainEffects) {
                        this.terrainEffects.addRidge(enemy.x, enemy.y, bullet.terrainOnHit);
                    }

                    // 穿透处理
                    const bounceOnEnemy = bullet.bounceOnEnemy !== false;

                    if (bounceOnEnemy) {
                        this.bounceBulletOffEnemy(bullet, enemy);
                        if (bullet.piercing) {
                            if (!bullet.hitEntities) bullet.hitEntities = new Set();
                            bullet.hitEntities.add(enemy);
                        }
                        break;
                    }

                    if (bullet.piercing) {
                        if (!bullet.hitEntities) bullet.hitEntities = new Set();
                        bullet.hitEntities.add(enemy);
                    } else {
                        bullet.active = false;
                        break;
                    }
                }
            }
        }

        return hits;
    }
}
