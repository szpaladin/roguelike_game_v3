import { GAME_CONFIG } from '../config.js';
import { log } from '../utils.js';
import { WEAPON_ID_MAP, WEAPON_TIER } from '../weapons/WeaponsData.js';
import { executeFusion } from '../weapons/FusionSystem.js';
import { executeEvolution, getAvailableEvolutions } from '../weapons/EvolutionSystem.js';

const ORDER_MAP = {};
Object.values(WEAPON_ID_MAP || {}).forEach((info) => {
    if (info && info.id) ORDER_MAP[info.id] = info.order ?? 9999;
});

const CHEST_MOTION = {
    topSafeMargin: 80,
    spawnOffsetYMin: 20,
    spawnOffsetYMax: 60,
    spawnOffsetX: 60,
    dropSpeedMultiplier: 2.0,
    dropDecay: 0.94,
    minSpeedMultiplier: 0.7,
    dropMaxFrames: 45,
    dropJitter: 0.06,
    dropVxDecay: 0.95,
    dropMaxVx: 1.0,
    driftAttract: 0.002,
    driftJitter: 0.03,
    driftMaxSpeedMultiplier: 0.8,
    driftTargetYRatio: 0.55
};

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function sortWeaponsByOrder(weapons) {
    return weapons
        .slice()
        .sort((a, b) => {
            const idA = a && a.def ? a.def.id : '';
            const idB = b && b.def ? b.def.id : '';
            const orderA = ORDER_MAP[idA] ?? 9999;
            const orderB = ORDER_MAP[idB] ?? 9999;
            if (orderA !== orderB) return orderA - orderB;
            return idA.localeCompare(idB);
        });
}

/**
 * ChestManager - 宝箱管理器
 * 处理宝箱的生成、掉落、更新和绘制
 */
export default class ChestManager {
    /**
     * @param {Object} chestUI - 宝箱UI实例
     */
    constructor(chestUI, view = {}) {
        this.chestUI = chestUI;
        this.chests = [];
        this.viewWidth = Number.isFinite(view.width) ? view.width : 600;
        this.viewHeight = Number.isFinite(view.height) ? view.height : 600;
        this.lastScrollY = 0;
        this.lastScrollDelta = GAME_CONFIG.AUTO_SCROLL_SPEED;

        // 宝箱掉落系统
        this.pendingChests = 0;      // 待掉落的宝箱数量
        this.lastChestDistance = 0;  // 上次计算宝箱的距离
        this.chestInterval = 100;    // 每100米可掉落一个宝箱
        this.artifactCounter = 0;
        this.nextArtifactThreshold = this.rollArtifactThreshold();
        this.artifactSystem = view.artifactSystem || null;
    }

    setArtifactSystem(system) {
        this.artifactSystem = system;
    }

    rollArtifactThreshold() {
        return Math.random() < 0.5 ? 3 : 4;
    }

    getChestInterval() {
        const multiplier = this.artifactSystem && typeof this.artifactSystem.getChestIntervalMultiplier === 'function'
            ? this.artifactSystem.getChestIntervalMultiplier()
            : 1;
        return this.chestInterval * multiplier;
    }

    getScrollSpeedHint() {
        return this.lastScrollDelta > 0 ? this.lastScrollDelta : GAME_CONFIG.AUTO_SCROLL_SPEED;
    }

    getGoldMultiplier(distanceMeters, riskSystem) {
        if (!riskSystem || typeof riskSystem.getCurrentZone !== 'function') return 1;
        const zone = riskSystem.getCurrentZone(distanceMeters);
        const name = zone && zone.name;
        const table = {
            '舒适区': 1.0,
            '危险区': 1.1,
            '高危区': 1.25,
            '极限区': 1.4
        };
        return table[name] ?? 1;
    }

    getGoldReward(distanceMeters, riskSystem) {
        const min = 75;
        const max = 100;
        const base = Math.floor(Math.random() * (max - min + 1)) + min;
        const multiplier = this.getGoldMultiplier(distanceMeters, riskSystem);
        const artifactMultiplier = this.artifactSystem && typeof this.artifactSystem.getGoldRewardMultiplier === 'function'
            ? this.artifactSystem.getGoldRewardMultiplier()
            : 1;
        return Math.round(base * multiplier * artifactMultiplier);
    }

    /**
     * 更新待掉落宝箱数量（基于距离）
     * @param {number} distance - 当前距离（像素）
     */
    updatePendingChests(distance) {
        const distanceInMeters = distance / 10;  // 10像素 = 1米
        const interval = this.getChestInterval();
        const expectedChests = Math.floor(distanceInMeters / interval);
        const newPendingChests = expectedChests - Math.floor(this.lastChestDistance / interval);

        if (newPendingChests > 0) {
            this.pendingChests += newPendingChests;
            this.lastChestDistance = distanceInMeters;
        }
    }

    shouldOfferArtifact(artifactSystem) {
        this.artifactCounter += 1;
        if (this.artifactCounter < this.nextArtifactThreshold) {
            return false;
        }
        this.artifactCounter = 0;
        this.nextArtifactThreshold = this.rollArtifactThreshold();

        if (!artifactSystem || typeof artifactSystem.isFull !== 'function') {
            return false;
        }
        if (artifactSystem.isFull()) {
            return false;
        }
        return true;
    }

    /**
     * 尝试在敌人死亡位置掉落宝箱
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} - 是否成功掉落
     */
    tryDropChest(x, y) {
        if (this.pendingChests > 0) {
            this.spawnChest(x, y);
            this.pendingChests--;
            return true;
        }
        return false;
    }

    /**
     * 在指定位置生成宝箱
     */
    spawnChest(x, y) {
        const scrollSpeed = this.getScrollSpeedHint();
        const offsetY = randomRange(CHEST_MOTION.spawnOffsetYMin, CHEST_MOTION.spawnOffsetYMax);
        const minY = this.lastScrollY + CHEST_MOTION.topSafeMargin;
        const spawnY = Math.max(y + offsetY, minY);
        const spawnX = x + randomRange(-CHEST_MOTION.spawnOffsetX, CHEST_MOTION.spawnOffsetX);
        const minVy = scrollSpeed * CHEST_MOTION.minSpeedMultiplier;
        const initialVy = Math.max(scrollSpeed * CHEST_MOTION.dropSpeedMultiplier, minVy);

        this.chests.push({
            x: spawnX,
            y: spawnY,
            radius: 15,
            color: '#ffd700',
            interactionCooldown: 0,
            vx: randomRange(-CHEST_MOTION.dropMaxVx, CHEST_MOTION.dropMaxVx),
            vy: initialVy,
            minVy,
            phase: 'drop',
            dropFrames: 0
        });
        log('敌人掉落了宝箱！', 'info');
    }

    /**
     * 更新所有宝箱状态
     * @param {Object} player - 玩家对象
     * @param {number} scrollY - 滚动偏移
     * @param {Function} onOpenChest - 打开宝箱时的回调
     */
    update(player, scrollY, onOpenChest) {
        const scrollDelta = Math.max(0, scrollY - this.lastScrollY);
        if (scrollDelta > 0) {
            this.lastScrollDelta = scrollDelta;
        }
        this.lastScrollY = scrollY;

        for (let i = this.chests.length - 1; i >= 0; i--) {
            const chest = this.chests[i];

            this.updateChestMotion(chest, scrollY);

            // 更新交互冷却
            if (chest.interactionCooldown > 0) {
                chest.interactionCooldown--;
            }

            // 移除视野外的宝箱
            if (chest.y + chest.radius < scrollY - 100) {
                this.chests.splice(i, 1);
                continue;
            }

            // 检查玩家与宝箱碰撞
            const chestScreenY = chest.y - scrollY;
            const dx = player.x - chest.x;
            const dy = player.y - chestScreenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.radius + chest.radius && chest.interactionCooldown <= 0) {
                if (onOpenChest) onOpenChest(chest);
            }
        }
    }

    /**
     * 打开宝箱 - 显示可用的武器融合选项
     * @param {Object} chest - 宝箱对象
     * @param {Object} player - 玩家对象
     * @param {Function} onComplete - 完成回调 (paused: boolean)
     */
    openChest(chest, player, options = {}) {
        const resolved = typeof options === 'function' ? { onComplete: options } : options;
        const distanceMeters = resolved && Number.isFinite(resolved.distanceMeters)
            ? resolved.distanceMeters
            : 0;
        const riskSystem = resolved ? resolved.riskSystem : null;
        const onComplete = resolved ? resolved.onComplete : null;

        const playerWeapons = player.weaponSystem.getWeapons();
        const availableEvolutions = getAvailableEvolutions(playerWeapons);
        const fusionCandidates = sortWeaponsByOrder(
            playerWeapons.filter(w => w && w.def && !(w.def.isFusion || w.def.tier === WEAPON_TIER.FUSION))
        );
        const goldReward = this.getGoldReward(distanceMeters, riskSystem);
        const artifactSystem = player && player.artifactSystem ? player.artifactSystem : this.artifactSystem;
        const shouldOfferArtifact = this.shouldOfferArtifact(artifactSystem);
        const artifactReward = shouldOfferArtifact && artifactSystem && typeof artifactSystem.getRandomArtifact === 'function'
            ? artifactSystem.getRandomArtifact()
            : null;

        this.chestUI.showChestMenu(availableEvolutions, fusionCandidates, artifactReward, goldReward, (selection) => {
            if (selection && selection.type === 'evolution' && selection.recipe) {
                const result = executeEvolution(player.weaponSystem, selection.recipe);
                if (result && result.success) {
                    log(result.message, 'important');
                }
            } else if (selection && selection.type === 'fusion' && Array.isArray(selection.weaponIds)) {
                const result = executeFusion(player.weaponSystem, selection.weaponIds);
                if (result && result.success) {
                    log(result.message, 'important');
                }
            } else if (selection && selection.type === 'artifact' && selection.artifactId) {
                if (artifactSystem && typeof artifactSystem.addArtifact === 'function') {
                    const addResult = artifactSystem.addArtifact(selection.artifactId);
                    if (addResult && addResult.success) {
                        const def = artifactSystem.getArtifactDefinition
                            ? artifactSystem.getArtifactDefinition(selection.artifactId)
                            : null;
                        const name = def ? def.name : selection.artifactId;
                        log(`获得道具：${name}`, 'important');
                        if (resolved && typeof resolved.onArtifactAdded === 'function') {
                            resolved.onArtifactAdded(selection.artifactId, artifactSystem.getArtifacts());
                        }
                    }
                }
            } else {
                const amount = selection && typeof selection.amount === 'number'
                    ? selection.amount
                    : goldReward;
                if (player && player.stats && typeof player.stats.addGold === 'function') {
                    player.stats.addGold(amount);
                    log(`获得金币 +${amount}`, 'important');
                }
            }
            this.removeChest(chest);
            if (onComplete) onComplete(false);
        });
    }

    /**
     * 执行武器融合
     * @param {WeaponSystem} weaponSystem - 武器系统
     * @param {Object} recipe - 融合配方
     */
    updateChestMotion(chest, scrollY) {
        if (!chest) return;
        if (!chest.phase) {
            chest.phase = 'drift';
            chest.vx = chest.vx ?? 0;
            chest.vy = chest.vy ?? 0;
        }

        if (chest.phase === 'drop') {
            const jitter = randomRange(-CHEST_MOTION.dropJitter, CHEST_MOTION.dropJitter);
            chest.vx = (chest.vx + jitter) * CHEST_MOTION.dropVxDecay;
            chest.vx = clamp(chest.vx, -CHEST_MOTION.dropMaxVx, CHEST_MOTION.dropMaxVx);
            chest.vy = Math.max(chest.vy * CHEST_MOTION.dropDecay, chest.minVy ?? 0);

            chest.x += chest.vx;
            chest.y += chest.vy;
            chest.dropFrames = (chest.dropFrames ?? 0) + 1;

            if (chest.vy <= (chest.minVy ?? 0) || chest.dropFrames >= CHEST_MOTION.dropMaxFrames) {
                chest.phase = 'drift';
            }
            return;
        }

        const targetX = this.viewWidth * 0.5;
        const targetY = scrollY + this.viewHeight * CHEST_MOTION.driftTargetYRatio;
        chest.vx += (targetX - chest.x) * CHEST_MOTION.driftAttract +
            randomRange(-CHEST_MOTION.driftJitter, CHEST_MOTION.driftJitter);
        chest.vy += (targetY - chest.y) * CHEST_MOTION.driftAttract +
            randomRange(-CHEST_MOTION.driftJitter, CHEST_MOTION.driftJitter);

        const maxSpeed = this.getScrollSpeedHint() * CHEST_MOTION.driftMaxSpeedMultiplier;
        const speed = Math.hypot(chest.vx, chest.vy);
        if (maxSpeed > 0 && speed > maxSpeed) {
            const scale = maxSpeed / speed;
            chest.vx *= scale;
            chest.vy *= scale;
        }

        chest.x += chest.vx;
        chest.y += chest.vy;
    }

    /**
     * 移除宝箱
     */
    removeChest(chest) {
        const idx = this.chests.indexOf(chest);
        if (idx >= 0) this.chests.splice(idx, 1);
    }

    /**
     * 绘制所有宝箱
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {number} scrollY - 滚动偏移
     */
    draw(ctx, scrollY) {
        for (const chest of this.chests) {
            const screenY = chest.y - scrollY;

            // 绘制宝箱（金色方块）
            ctx.fillStyle = chest.color;
            ctx.fillRect(chest.x - 12, screenY - 10, 24, 20);

            // 绘制锁扣
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(chest.x - 4, screenY - 5, 8, 10);
        }
    }

    /**
     * 重置
     */
    reset() {
        this.chests = [];
        this.pendingChests = 0;
        this.lastChestDistance = 0;
        this.artifactCounter = 0;
        this.nextArtifactThreshold = this.rollArtifactThreshold();
    }
}
