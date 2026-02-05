/**
 * AOEHandler - 攻击范围效果处理器
 * 处理闪电连锁、爆炸、圆形AOE、射线、分裂子弹等范围攻击效果
 */
export default class AOEHandler {
    /**
     * @param {EffectsManager} effectsManager - 特效管理器
     * @param {BulletPool} bulletPool - 子弹池（用于分裂子弹）
     */
    constructor(effectsManager = null, bulletPool = null) {
        this.effectsManager = effectsManager;
        this.bulletPool = bulletPool;
    }

    /**
     * 设置依赖
     */
    setDependencies(effectsManager, bulletPool) {
        this.effectsManager = effectsManager;
        this.bulletPool = bulletPool;
    }

    /**
     * 处理攻击范围效果
     * @param {Object} bullet - 子弹对象
     * @param {Enemy} hitEnemy - 被击中的敌人
     * @param {Array<Enemy>} enemies - 所有敌人列表
     * @param {number} playerAttack - 玩家攻击力
     */
    handleRangeEffects(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects = null) {
        // 全屏伤害
        if (bullet.fullScreenDamage) {
            this.handleFullScreenDamage(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects);
        }

        // 闪电连锁
        if (bullet.chainCount > 0) {
            this.handleChainLightning(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects);
        }

        // 爆炸AOE
        if (bullet.explosionRadius > 0) {
            this.handleExplosionAOE(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects);
        }

        // 岩石/通用AOE
        if (bullet.aoeRadius > 0) {
            this.handleCircleAOE(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects);
        }

        // 射线伤害
        if (bullet.rayRange > 0) {
            this.handleRayDamage(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects);
        }

        // 分裂子弹
        if (bullet.canSplit && bullet.splitCount > 0) {
            this.handleSplitBullets(bullet, hitEnemy, enemies);
        }
    }

    /**
     * 闪电连锁效果
     */
    handleChainLightning(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects = null) {
        const cooldown = bullet.chainCooldown || 0;
        if (cooldown > 0 && bullet.chainCooldownRemaining > 0) {
            return;
        }

        const chainTargets = [];
        const hitEnemies = new Set([hitEnemy]);
        let currentSource = hitEnemy;

        for (let chain = 0; chain < bullet.chainCount; chain++) {
            let nearestEnemy = null;
            let minDist = Infinity;

            // 查找最近的未击中敌人
            for (const target of enemies) {
                if (target.hp <= 0 || hitEnemies.has(target)) continue;

                const dx = target.x - currentSource.x;
                const dy = target.y - currentSource.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < bullet.chainRange && dist < minDist) {
                    minDist = dist;
                    nearestEnemy = target;
                }
            }

            if (nearestEnemy) {
                // 造成伤害
                const chainDamage = bullet.damage || playerAttack;
                nearestEnemy.takeDamage(chainDamage);
                if (applyStatusEffects) {
                    applyStatusEffects(nearestEnemy);
                }

                // 记录连锁目标用于视觉特效
                chainTargets.push({ from: currentSource, to: nearestEnemy });

                hitEnemies.add(nearestEnemy);
                currentSource = nearestEnemy;
            } else {
                break;
            }
        }

        // 生成闪电特效
        if (chainTargets.length > 0 && this.effectsManager) {
            this.effectsManager.addLightningChain(chainTargets);
        }

        if (chainTargets.length > 0 && cooldown > 0) {
            bullet.chainCooldownRemaining = cooldown;
        }
    }

    /**
     * 爆炸AOE效果（炸弹类武器）
     */
    handleExplosionAOE(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects = null) {
        // 生成爆炸特效
        if (this.effectsManager) {
            this.effectsManager.addExplosion(hitEnemy.x, hitEnemy.y, bullet.explosionRadius, '#ff4500');
        }

        // 对范围内所有敌人造成伤害
        for (const target of enemies) {
            if (target.hp <= 0 || target === hitEnemy) continue;

            const dx = target.x - hitEnemy.x;
            const dy = target.y - hitEnemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bullet.explosionRadius) {
                const aoeDamage = playerAttack * (bullet.explosionDamage || 1);
                target.takeDamage(aoeDamage);
                if (applyStatusEffects) {
                    applyStatusEffects(target);
                }
            }
        }
    }

    /**
     * 圆形AOE效果（岩石类武器）
     */
    handleCircleAOE(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects = null) {
        // 生成碎土特效
        if (this.effectsManager) {
            this.effectsManager.addExplosion(hitEnemy.x, hitEnemy.y, bullet.aoeRadius, '#8B4513');
        }

        // 对范围内所有敌人造成伤害
        for (const target of enemies) {
            if (target.hp <= 0 || target === hitEnemy) continue;

            const dx = target.x - hitEnemy.x;
            const dy = target.y - hitEnemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bullet.aoeRadius) {
                const aoeDamage = playerAttack * (bullet.aoeDamage || 0.5);
                target.takeDamage(aoeDamage);
                if (applyStatusEffects) {
                    applyStatusEffects(target);
                }
            }
        }
    }

    /**
     * 状态爆发AOE效果（如蔓延叠层）
     */
    handleStatusExplosion(origin, enemies, damage, radius, color = '#6ccf6d') {
        if (!origin || !Array.isArray(enemies)) return;
        if (radius <= 0 || damage <= 0) return;

        if (this.effectsManager) {
            this.effectsManager.addExplosion(origin.x, origin.y, radius, color);
        }

        for (const target of enemies) {
            if (target.hp <= 0) continue;

            const dx = target.x - origin.x;
            const dy = target.y - origin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius) {
                target.takeDamage(damage);
            }
        }
    }

    /**
     * 射线AOE效果
     */
    handleRayDamage(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects = null) {
        let rayDirX, rayDirY;

        // 寻找范围内最近的敌人作为射线目标
        let closestTarget = null;
        let closestDist = Infinity;

        for (const target of enemies) {
            if (target.hp <= 0 || target === hitEnemy) continue;

            const dx = target.x - hitEnemy.x;
            const dy = target.y - hitEnemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bullet.rayRange && dist < closestDist) {
                closestTarget = target;
                closestDist = dist;
            }
        }

        // 确定射线方向
        if (closestTarget) {
            const rayDx = closestTarget.x - hitEnemy.x;
            const rayDy = closestTarget.y - hitEnemy.y;
            const rayLen = Math.sqrt(rayDx * rayDx + rayDy * rayDy);
            rayDirX = rayDx / rayLen;
            rayDirY = rayDy / rayLen;
        } else {
            // 无目标：随机方向
            const randomAngle = Math.random() * Math.PI * 2;
            rayDirX = Math.cos(randomAngle);
            rayDirY = Math.sin(randomAngle);
        }

        // 生成射线特效
        if (this.effectsManager) {
            const rayLength = bullet.rayLength || 100;
            this.effectsManager.addRay(
                hitEnemy.x - rayDirX * rayLength,
                hitEnemy.y - rayDirY * rayLength,
                hitEnemy.x + rayDirX * rayLength,
                hitEnemy.y + rayDirY * rayLength,
                '#FFA500'
            );
        }

        // 对射线路径上的敌人造成伤害
        const rayLength = bullet.rayLength || 100;
        const rayWidth = bullet.rayWidth || 20;

        for (const target of enemies) {
            if (target.hp <= 0) continue;

            // 计算点到射线的距离
            const px = target.x - hitEnemy.x;
            const py = target.y - hitEnemy.y;
            const dot = px * rayDirX + py * rayDirY;

            // 检查是否在射线范围内（双向）
            if (Math.abs(dot) < rayLength) {
                const perpX = px - dot * rayDirX;
                const perpY = py - dot * rayDirY;
                const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);

                // 如果敌人在射线宽度范围内
                if (perpDist < rayWidth) {
                    const rayDmg = bullet.damage || playerAttack;
                    target.takeDamage(rayDmg);
                    if (applyStatusEffects && target !== hitEnemy) {
                        applyStatusEffects(target);
                    }
                }
            }
        }
    }

    /**
     * 全屏伤害
     */
    handleFullScreenDamage(bullet, hitEnemy, enemies, playerAttack, applyStatusEffects = null) {
        if (!Array.isArray(enemies) || enemies.length === 0) return;
        if (bullet.fullScreenDamageTriggered) return;
        bullet.fullScreenDamageTriggered = true;

        const screenDamage = bullet.damage || playerAttack;
        for (const target of enemies) {
            if (target.hp <= 0) continue;
            target.takeDamage(screenDamage);
            if (applyStatusEffects && target !== hitEnemy) {
                applyStatusEffects(target);
            }
        }
    }

    /**
     * 分裂子弹效果
     */
    handleSplitBullets(bullet, hitEnemy, enemies) {
        if (!this.bulletPool) return;

        // 寻找分裂目标
        const splitTargets = [];
        for (const target of enemies) {
            if (target.hp <= 0 || target === hitEnemy) continue;

            const dx = target.x - hitEnemy.x;
            const dy = target.y - hitEnemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bullet.splitRange) {
                splitTargets.push({ enemy: target, distance: dist });
            }
        }

        // 按距离排序
        splitTargets.sort((a, b) => a.distance - b.distance);
        const selectedTargets = splitTargets.slice(0, Math.min(bullet.splitCount, splitTargets.length));

        // 为每个目标生成分裂子弹
        const splitMultiplier = Number.isFinite(bullet.splitDamageMultiplier) ? bullet.splitDamageMultiplier : 1;
        const splitDamage = (bullet.damage || 0) * splitMultiplier;

        for (const { enemy } of selectedTargets) {
            const dx = enemy.x - hitEnemy.x;
            const dy = enemy.y - hitEnemy.y;
            const angle = Math.atan2(dy, dx);

            // 从被击中敌人外围偏移生成
            const offsetDistance = hitEnemy.radius + bullet.radius + 5;
            const startX = hitEnemy.x + Math.cos(angle) * offsetDistance;
            const startY = hitEnemy.y + Math.sin(angle) * offsetDistance;

            // 创建分裂子弹（继承父弹属性但禁用分裂）
            this.bulletPool.spawnBullet({
                ...bullet,
                x: startX,
                y: startY,
                vx: Math.cos(angle) * bullet.speed,
                vy: Math.sin(angle) * bullet.speed,
                lifetime: 120,
                piercing: false,
                canSplit: false,
                splitCount: 0,
                splitDamageMultiplier: undefined,
                aoeRadius: 0,
                aoeDamage: 0,
                damage: splitDamage
            });
        }
    }
}
