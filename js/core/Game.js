import { GAME_CONFIG, TILE, ENTITY } from '../config.js';
import { log } from '../utils.js';
import MapManager from './MapManager.js';
import Player from './Player.js';
import OxygenSystem from './OxygenSystem.js';
import LightingSystem from './LightingSystem.js';
import RiskSystem from './RiskSystem.js';
import EvacuationManager from './EvacuationManager.js';
import MetaProgress from './MetaProgress.js';
import EnemySpawner from '../enemies/EnemySpawner.js';
import Enemy from '../enemies/Enemy.js';
import { getRandomEnemyType } from '../enemies/EnemiesData.js';
import BulletPool from '../combat/BulletPool.js';
import CollisionManager from '../combat/CollisionManager.js';
import EffectsManager from '../effects/EffectsManager.js';
import StatusVFXManager from '../effects/StatusVFXManager.js';
import PlagueSystem from '../effects/PlagueSystem.js';
import DarkFlameSystem from '../effects/DarkFlameSystem.js';
import LightningRodSystem from '../effects/LightningRodSystem.js';
import TerrainEffectManager from '../effects/TerrainEffectManager.js';
import SeaweedManager from '../environment/SeaweedManager.js';
import ChestManager from '../chest/ChestManager.js';
import HUD from '../ui/HUD.js';
import DebugOverlay from '../ui/DebugOverlay.js';
import UpgradeUI from '../ui/UpgradeUI.js';
import ChestUI from '../ui/ChestUI.js';
import GameOverUI from '../ui/GameOverUI.js';
import EvacuationResultUI from '../ui/EvacuationResultUI.js';
import WeaponCodexUI from '../ui/WeaponCodexUI.js';
import ArtifactCodexUI from '../ui/ArtifactCodexUI.js';
import BaseScreen from '../meta/BaseScreen.js';
import { STATUS_EFFECTS } from '../enemies/StatusEffects.js';
import ArtifactSystem from '../artifacts/ArtifactSystem.js';

/**
 * Game - 游戏主控类
 * 整合所有子系统并驱动游戏运行
 */
export default class Game {
    /**
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     */
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;

        // 状态
        this.paused = false;
        this.gameOver = false;
        this.gameTime = 0;
        this.distance = 0;
        this.scrollY = 0;
        this.keys = {};

        // 氧气系统（基础间隔：每4秒扣1点HP；实际间隔由 RiskSystem 动态调整）
        this.oxygenSystem = new OxygenSystem(4, 1);

        // 光照系统
        this.lightingSystem = new LightingSystem();

        // 风险系统
        this.riskSystem = new RiskSystem();

        // 撤离系统
        this.evacuationManager = new EvacuationManager();
        this.metaProgress = new MetaProgress();
        this.evacuationResultUI = new EvacuationResultUI();

        // 初始化子系统
        this.mapManager = new MapManager();
        this.player = new Player(this.width / 2, this.height * 0.3);
        this.metaProgress.applyUpgrades(this.player.stats);

        // 道具系统（局内）
        this.artifactSystem = new ArtifactSystem();
        this.player.artifactSystem = this.artifactSystem;
        const metaSnapshot = this.metaProgress.getProgress();
        const artifactSlots = metaSnapshot.artifacts ? metaSnapshot.artifacts.maxSlots : 4;
        this.artifactSystem.setMaxSlots(artifactSlots);
        const runArtifacts = this.metaProgress.prepareArtifactsForRun(artifactSlots);
        this.artifactSystem.setArtifacts(runArtifacts);
        this.enemySpawner = new EnemySpawner();
        this.bulletPool = new BulletPool();
        this.collisionManager = new CollisionManager();
        this.effectsManager = new EffectsManager();
        this.statusVFXManager = new StatusVFXManager();
        this.plagueSystem = new PlagueSystem();
        this.darkFlameSystem = new DarkFlameSystem();
        this.lightningRodSystem = new LightningRodSystem(this.effectsManager);
        this.terrainEffects = new TerrainEffectManager();
        this.seaweedManager = new SeaweedManager(this.width, this.height);

        // UI 系统
        this.hud = new HUD();
        this.upgradeUI = new UpgradeUI();
        this.chestUI = new ChestUI();
        this.gameOverUI = new GameOverUI();
        this.debugOverlay = new DebugOverlay();
        this.weaponCodexUI = new WeaponCodexUI({
            getPaused: () => this.paused,
            setPaused: (v) => { this.paused = v; },
            isBlocked: () => {
                return this.upgradeUI.isOpen() ||
                    this.chestUI.isOpen() ||
                    this.gameOverUI.isVisible() ||
                    this.evacuationResultUI.isVisible() ||
                    (this.baseScreen && this.baseScreen.isOpen()) ||
                    (this.artifactCodexUI && this.artifactCodexUI.isOpen());
            }
        });
        this.artifactCodexUI = new ArtifactCodexUI({
            getPaused: () => this.paused,
            setPaused: (v) => { this.paused = v; },
            isBlocked: () => {
                return this.upgradeUI.isOpen() ||
                    this.chestUI.isOpen() ||
                    this.gameOverUI.isVisible() ||
                    this.evacuationResultUI.isVisible() ||
                    (this.baseScreen && this.baseScreen.isOpen()) ||
                    (this.weaponCodexUI && this.weaponCodexUI.isOpen());
            }
        });
        this.baseScreen = new BaseScreen(this.metaProgress, {
            onStart: () => {
                try {
                    sessionStorage.setItem('skipBaseOnce', '1');
                } catch (e) {
                    console.warn('Failed to persist base skip flag:', e);
                }
                location.reload();
            },
            onOpen: () => {
                this.paused = true;
                this.keys = {};
            },
            onClose: () => {
                this.paused = false;
            }
        });

        this.enemies = [];

        // 宝箱系统
        this.chestManager = new ChestManager(this.chestUI, {
            width: this.width,
            height: this.height,
            artifactSystem: this.artifactSystem
        });

        // 初始设置
        this.init();
    }

    init() {
        this.mapManager.initMap();
        this.upgradeUI.init(this.player);
        this.weaponCodexUI.init();
        this.artifactCodexUI.init();

        // 注册升级菜单关闭回调
        this.upgradeUI.onClose(() => {
            this.paused = false;
        });

        // 注册撤离呼叫回调
        this.upgradeUI.setEvacuationCallback(() => {
            this.evacuationManager.requestEvacuation(
                this.scrollY,
                this.height
            );
        });

        // 设置碰撞管理器的依赖项（用于攻击范围等效果）
        this.collisionManager.setDependencies(this.effectsManager, this.bulletPool, this.player, this.terrainEffects);

        // 设置撤离完成回调
        this.evacuationManager.setEvacuationCallback(() => this.handleEvacuation());

        // 设置围攻触发回调
        this.evacuationManager.setSiegeCallback(() => this.spawnSiegeEnemies());

        // 设置结算界面回调
        this.evacuationResultUI.onContinue(() => {
            this.enterBase();
        });

        // 进入游戏先展示基地（除非从基地点击开始潜水触发重载）
        let skipBase = false;
        try {
            skipBase = sessionStorage.getItem('skipBaseOnce') === '1';
            if (skipBase) {
                sessionStorage.removeItem('skipBaseOnce');
            }
        } catch (e) {
            console.warn('Failed to read base skip flag:', e);
        }
        if (!skipBase) {
            this.enterBase();
        }
    }

    /**
     * 更新逻辑
     * @param {number} dt - 帧间隔（秒）
     */
    update(dt) {
        this.debugOverlay.update(dt);
        if (this.paused || this.gameOver) return;

        if (this.artifactSystem) {
            this.artifactSystem.update(dt, this.player.stats);
        }

        this.gameTime++;
        // distance 是像素单位的滚动距离
        this.distance += GAME_CONFIG.AUTO_SCROLL_SPEED * (dt * 60);
        this.scrollY = this.distance;

        // 1. 地图更新
        this.mapManager.update(this.scrollY, this.height);

        // 1.5 风险系统更新（影响敌人生成频率）
        const distanceInMeters = Math.floor(this.distance / 10);
        const spawnMultiplier = this.riskSystem.getSpawnIntervalMultiplier(distanceInMeters);
        this.enemySpawner.setSpawnIntervalMultiplier(spawnMultiplier);

        // 1.6 检测深度区间变化
        const newZone = this.riskSystem.checkZoneChange(distanceInMeters);
        if (newZone) {
            log('深度增加，光线变暗，危险更多，氧气消耗也加快了。', 'important');
            if (this.artifactSystem && typeof this.artifactSystem.onZoneChange === 'function') {
                this.artifactSystem.onZoneChange();
            }
        }

        // 2. 生成敌人（传入玩家世界坐标）
        const playerWorldPos = { x: this.player.x, y: this.player.y + this.scrollY };
        this.playerWorldPos = playerWorldPos;
        const newEnemy = this.enemySpawner.spawn(this.distance, playerWorldPos);
        if (newEnemy) {
            this.enemies.push(newEnemy);
        }

        // 3. 玩家更新
        this.player.update(this.keys, dt, this.scrollY);

        // 3.5 氧气消耗（从 RiskSystem 获取间隔）
        const oxygenInterval = this.riskSystem.getOxygenInterval(distanceInMeters);
        const oxygenMultiplier = this.artifactSystem && typeof this.artifactSystem.getOxygenIntervalMultiplier === 'function'
            ? this.artifactSystem.getOxygenIntervalMultiplier()
            : 1;
        this.oxygenSystem.setInterval(oxygenInterval * oxygenMultiplier);
        this.oxygenSystem.update(dt, this.player.stats);

        // 3.6 光照更新（从 RiskSystem 获取透明度）
        const lightingAlpha = this.riskSystem.getLightingAlpha(distanceInMeters);
        const lightingOffset = this.artifactSystem && typeof this.artifactSystem.getLightingAlphaOffset === 'function'
            ? this.artifactSystem.getLightingAlphaOffset()
            : 0;
        const finalLighting = Math.max(0, Math.min(0.9, lightingAlpha + lightingOffset));
        this.lightingSystem.setTargetAlpha(finalLighting);
        this.lightingSystem.update(dt);

        this.seaweedManager.update(this.scrollY, this.width, this.height);
        this.seaweedManager.updateEnemyVisibility(this.enemies, playerWorldPos);

        // 4. 自动攻击（子弹生成）
        this.player.weaponSystem.autoShoot(
            { x: this.player.x, y: this.player.y },
            this.player.stats.strength,
            this.enemies,
            this.bulletPool,
            this.scrollY,
            this.artifactSystem
        );

        // 5. 子弹/特效更新
        this.bulletPool.update();
        this.effectsManager.update();

        // 6. 更新待掉落宝箱数量
        this.chestManager.updatePendingChests(this.distance);

        // 6.5 撤离系统更新
        if (this.artifactSystem && typeof this.artifactSystem.getEvacuationSpawnIntervalMultiplier === 'function') {
            const baseInterval = GAME_CONFIG.EVACUATION?.SPAWN_INTERVAL || 5000;
            this.evacuationManager.spawnInterval = baseInterval
                * this.artifactSystem.getEvacuationSpawnIntervalMultiplier();
        }
        this.evacuationManager.updateSpawning(this.distance);
        // 更新围攻配置（根据当前深度）
        const siegeConfig = this.riskSystem.getSiegeConfig(distanceInMeters);
        this.evacuationManager.setSiegeConfig(siegeConfig);
        this.evacuationManager.update(this.player, this.scrollY, dt);

        // 6.8 地形效果更新（影响敌人移动）
        this.terrainEffects.update(this.enemies);

        // 7. 更新敌人位置和状态
        const playerPos = { x: this.player.x, y: this.player.y };
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(playerPos, this.scrollY, this.height, this.width);
            if (enemy.hp <= 0 && !enemy.isDead) {
                const sacrifice = enemy.statusEffects ? enemy.statusEffects.getEffect('abyss_sacrifice') : null;
                if (sacrifice) {
                    const healAmount = Number.isFinite(sacrifice.params.healAmount)
                        ? sacrifice.params.healAmount
                        : STATUS_EFFECTS.ABYSS_SACRIFICE.defaultHeal;
                    if (healAmount > 0) {
                        this.player.stats.heal(healAmount);
                    }
                }

                // 处理敌人死亡（经验、金币等）
                this.player.stats.gainExp(enemy.exp || 1);
                this.player.stats.addGold(enemy.gold || 1);
                enemy.isDead = true;
                if (this.artifactSystem && typeof this.artifactSystem.onEnemyKilled === 'function') {
                    this.artifactSystem.onEnemyKilled();
                }

                this.plagueSystem.spawnDeathCloud(enemy);

                // 尝试掉落宝箱
                this.chestManager.tryDropChest(enemy.x, enemy.y);
            }
            // 移除视野外的敌人
            if (enemy.y + enemy.radius < this.scrollY - 100) {
                this.enemies.splice(i, 1);
            }
        }

        this.collisionManager.resolveEnemyCollisions(this.enemies, { left: 0, right: this.width });
        this.seaweedManager.updateEnemyVisibility(this.enemies, playerWorldPos);
        if (this.chestManager && this.chestManager.chests) {
            this.seaweedManager.updateChestVisibility(this.chestManager.chests, playerWorldPos);
        }

        // 7.5 Floating text for random level-up bonuses
        const levelUpBonuses = this.player.stats.consumeLevelUpBonuses();
        if (levelUpBonuses.length > 0) {
            const baseX = this.player.x;
            const baseY = this.player.y + this.scrollY - this.player.radius - 8;
            levelUpBonuses.forEach((bonus, index) => {
                const isStrength = bonus.stat === 'strength';
                const text = isStrength ? '力量+1' : '智力+1';
                const color = isStrength ? '#ff9f1a' : '#5db2ff';
                this.effectsManager.addFloatingText(baseX, baseY - index * 14, text, { color });
            });
        }

        // 8. 碰撞检测
        const playerCollisions = this.collisionManager.checkPlayerEnemyCollisions(this.player, this.enemies, this.scrollY);

        // 处理玩家与敌人的碰撞（玩家受伤）
        for (const enemy of playerCollisions) {
            if (enemy.harmless || (enemy.attack ?? 0) <= 0) continue;
            if (!enemy.blinded) {
                const damage = this.player.takeDamage(enemy.attack);
                if (damage > 0) {
                    log(`${enemy.name} 对你造成了 ${damage} 点伤害！`, 'damage');
                }
            }
        }

        const activeBullets = this.bulletPool.getActiveBullets();
        this.seaweedManager.resolveBulletInteractions(activeBullets, playerWorldPos);
        this.collisionManager.checkBulletEnemyCollisions(activeBullets, this.enemies, this.player.stats.strength);
        this.collisionManager.checkBulletWallCollisions(this.bulletPool.getActiveBullets(), {
            left: 0,
            right: this.width,
            top: this.scrollY,
            bottom: this.scrollY + this.height
        });

        this.statusVFXManager.update(this.enemies);
        this.plagueSystem.update(this.enemies);
        this.darkFlameSystem.update(this.enemies);
        this.lightningRodSystem.update(this.enemies, this.player.stats);

        // 9. 检查游戏结束
        if (!this.player.stats.isAlive()) {
            this.handleGameOver();
        }

        // 10. 更新宝箱
        this.chestManager.update(this.player, this.scrollY, (chest) => {
            this.paused = true;
            this.chestManager.openChest(chest, this.player, {
                distanceMeters: Math.floor(this.distance / 10),
                riskSystem: this.riskSystem,
                onArtifactAdded: () => {
                    if (this.artifactSystem) {
                        this.metaProgress.updateRunArtifacts(this.artifactSystem.getArtifacts());
                    }
                },
                onComplete: () => {
                    this.paused = false;
                }
            });
        });

        // 11. 更新 HUD
        this.hud.update(this.player, this.distance);
    }

    /**
     * 绘制
     */
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 绘制地图
        this.mapManager.draw(this.ctx, this.scrollY, this.width, this.height);

        // 绘制地形效果（敌人下方）
        this.terrainEffects.draw(this.ctx, this.scrollY);

        // 绘制敌人
        this.enemies.forEach(enemy => {
            enemy.draw(this.ctx, this.scrollY);
        });

        this.statusVFXManager.draw(this.ctx, this.scrollY);
        this.plagueSystem.draw(this.ctx, this.scrollY);

        // 绘制宝箱
        this.chestManager.draw(this.ctx, this.scrollY);

        // 绘制子弹
        this.bulletPool.draw(this.ctx, this.scrollY);

        // 绘制视觉特效
        this.effectsManager.draw(this.ctx, this.scrollY);

        // 绘制撤离点
        this.evacuationManager.draw(this.ctx, this.scrollY);

        const playerWorldPos = this.playerWorldPos || { x: this.player.x, y: this.player.y + this.scrollY };
        this.seaweedManager.draw(this.ctx, this.scrollY, playerWorldPos);

        // 绘制玩家
        this.player.draw(this.ctx);

        // Draw level-up floating texts
        this.effectsManager.drawFloatingTexts(this.ctx, this.scrollY);

        // 绘制光照遮罩（最后绘制）
        this.lightingSystem.draw(this.ctx, this.width, this.height);

        this.debugOverlay.draw(this.ctx, this);
    }

    togglePause() {
        this.paused = !this.paused;
    }

    handleGameOver() {
        this.gameOver = true;
        // 死亡结算（惩罚比例根据深度动态变化）
        const distanceInMeters = Math.floor(this.distance / 10);
        const deathPenalty = this.riskSystem.getDeathPenalty(distanceInMeters);
        const goldRetentionPercent = Math.round(this.riskSystem.getGoldRetention(distanceInMeters) * 100);
        if (this.artifactSystem) {
            this.metaProgress.completeRunArtifacts(this.artifactSystem.getArtifacts(), false);
        }
        const result = this.metaProgress.processDeath({
            gold: this.player.stats.gold,
            distance: distanceInMeters,
            weapons: this.player.weaponSystem.getEvolutionWeaponIds()
        }, deathPenalty);
        this.evacuationResultUI.showDeath(result, goldRetentionPercent);
    }

    handleEvacuation() {
        this.gameOver = true;
        // 撤离成功结算（100%收益）
        if (this.artifactSystem) {
            this.metaProgress.completeRunArtifacts(this.artifactSystem.getArtifacts(), true);
        }
        const result = this.metaProgress.processEvacuation({
            gold: this.player.stats.gold,
            distance: Math.floor(this.distance / 10),
            weapons: this.player.weaponSystem.getEvolutionWeaponIds()
        });
        this.evacuationResultUI.showSuccess(result);
        log('撤离成功！', 'important');
    }

    handleInput(e, isDown) {
        if (this.baseScreen && this.baseScreen.isOpen()) {
            return;
        }
        const key = e.key.toLowerCase();
        this.keys[key] = isDown;

        if (isDown) {
            if (key === '`' || key === '~') {
                const enabled = this.debugOverlay.toggle();
                log(`调试模式已${enabled ? '开启' : '关闭'}`);
            }
            if (key === 'e') {
                // 打开/关闭升级菜单
                if (this.upgradeUI.isOpen()) {
                    this.upgradeUI.close();
                    this.paused = false;
                } else if (this.player.stats.skillPoints > 0) {
                    this.upgradeUI.open();
                    this.paused = true;
                }
            }
            if (key === 'escape') {
                // 优先关闭图鉴（避免后续逻辑强制把 paused 设置为 false）
                if (this.weaponCodexUI && this.weaponCodexUI.handleEscape()) {
                    return;
                }
                if (this.artifactCodexUI && this.artifactCodexUI.handleEscape()) {
                    return;
                }
                if (this.chestUI.isOpen()) {
                    const handled = this.chestUI.handleEscape();
                    if (handled) {
                        return;
                    }
                }
                this.upgradeUI.close();
                this.chestUI.close();
                this.paused = false;
            }
        }
    }

    enterBase() {
        if (this.baseScreen) {
            this.baseScreen.open();
        }
    }

    /**
     * 生成围攻敌人（进入撤离区域时触发）
     * 位置计算由 EvacuationManager 处理
     */
    spawnSiegeEnemies() {
        const positions = this.evacuationManager.generateSiegeEnemyPositions();

        for (const pos of positions) {
            const type = getRandomEnemyType(this.distance);
            const enemy = new Enemy(pos.x, pos.y, type);
            this.enemies.push(enemy);
        }
    }
}

