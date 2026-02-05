import { GAME_CONFIG } from '../config.js';
import { log } from '../utils.js';

/**
 * EvacuationManager - 撤离点管理器
 * 负责撤离点的生成、检测和撤离倒计时
 */
export default class EvacuationManager {
    constructor() {
        // 撤离点配置
        this.spawnInterval = GAME_CONFIG.EVACUATION?.SPAWN_INTERVAL || 5000; // 5000像素=500米
        this.evacuationTime = GAME_CONFIG.EVACUATION?.EVACUATION_TIME || 3000; // 3秒
        this.summonDelay = GAME_CONFIG.EVACUATION?.SUMMON_DELAY || 5.0; // 召唤延迟5秒

        // 撤离点列表
        this.evacuationPoints = [];
        this.lastSpawnDistance = 0;

        // 待处理撤离召唤队列
        this.pendingEvacuations = [];

        // 撤离状态
        this.isEvacuating = false;
        this.evacuationProgress = 0; // 0-1
        this.currentEvacPoint = null;

        // 回调
        this.onEvacuationComplete = null;
        this.onSiegeTriggered = null; // 围攻触发回调

        // 围攻配置（从外部设置）
        this.siegeConfig = { waves: 1, enemyCount: 6 };
    }

    setSiegeConfig(config) {
        this.siegeConfig = config;
    }

    /**
     * 设置撤离完成回调
     * @param {Function} callback
     */
    setEvacuationCallback(callback) {
        this.onEvacuationComplete = callback;
    }

    /**
     * 设置围攻触发回调
     * @param {Function} callback - 回调函数，接收 siegeConfig 参数
     */
    setSiegeCallback(callback) {
        this.onSiegeTriggered = callback;
    }

    /**
     * 基于距离更新撤离点生成
     * @param {number} distance - 当前距离（像素）
     */
    updateSpawning(distance) {
        const nextSpawnDistance = this.lastSpawnDistance + this.spawnInterval;

        if (distance >= nextSpawnDistance) {
            this.spawnEvacuationPoint(distance);
            this.lastSpawnDistance = nextSpawnDistance;
        }
    }

    /**
     * 生成撤离点
     * @param {number} distance - 当前距离
     * @param {number} screenHeight - 屏幕高度
     */
    spawnEvacuationPoint(distance, screenHeight = 800) {
        // 在屏幕水平随机位置，玩家前方较远位置生成（屏幕下方）
        const mapWidth = GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE;
        const margin = 60; // 距离边缘的安全边距
        const x = margin + Math.random() * (mapWidth - margin * 2);
        const y = distance + screenHeight + 200; // 在当前滚动位置 + 屏幕高度 + 200，让撤离点出现在屏幕下方

        this.evacuationPoints.push({
            x,
            y,
            radius: 40,
            active: true,
            pulsePhase: 0
        });

        log('🚀 前方发现撤离点！', 'important');
    }

    /**
     * 召唤撤离点（消耗能源，5秒后生成）
     * @param {number} scrollY - 当前滚动偏移
     * @param {number} screenHeight - 屏幕高度
     */
    requestEvacuation(scrollY, screenHeight = 800) {
        // 在屏幕水平随机位置，玩家前方较远位置生成（屏幕下方）
        const mapWidth = GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE;
        const margin = 60; // 距离边缘的安全边距
        const x = margin + Math.random() * (mapWidth - margin * 2);
        const y = scrollY + screenHeight + 200;

        this.pendingEvacuations.push({
            timer: this.summonDelay,
            x: x,
            y: y
        });
        log('📡 撤离信号已发送，队友5秒后抵达！', 'important');
    }

    /**
     * 检查是否有待处理的撤离召唤
     * @returns {boolean}
     */
    hasPendingEvacuation() {
        return this.pendingEvacuations.length > 0;
    }

    /**
     * 更新撤离点状态
     * @param {Object} player - 玩家对象
     * @param {number} scrollY - 滚动偏移
     * @param {number} dt - 帧间隔（秒）
     */
    update(player, scrollY, dt) {
        // 处理待处理撤离召唤
        this.pendingEvacuations = this.pendingEvacuations.filter(pending => {
            pending.timer -= dt;
            if (pending.timer <= 0) {
                // 生成撤离点
                this.evacuationPoints.push({
                    x: pending.x,
                    y: pending.y,
                    radius: 40,
                    active: true,
                    pulsePhase: 0,
                    summoned: true // 标记为召唤的撤离点
                });
                log('🚁 撤离点已到达！', 'important');
                return false; // 移除已处理的
            }
            return true; // 保留未完成的
        });

        // 更新动画
        for (const point of this.evacuationPoints) {
            point.pulsePhase += dt * 2;
        }

        // 移除过期的撤离点（玩家已经过去了）
        this.evacuationPoints = this.evacuationPoints.filter(point => {
            return point.y > scrollY - 100;
        });

        // 检测玩家是否在撤离点内
        const playerWorldY = player.y + scrollY;
        let inEvacZone = false;

        for (const point of this.evacuationPoints) {
            const dx = player.x - point.x;
            const dy = playerWorldY - point.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < point.radius) {
                inEvacZone = true;
                this.currentEvacPoint = point;
                break;
            }
        }

        // 处理撤离进度
        if (inEvacZone) {
            if (!this.isEvacuating) {
                this.isEvacuating = true;
                this.evacuationProgress = 0;

                // 首次进入撤离区域，触发围攻
                if (this.onSiegeTriggered) {
                    this.onSiegeTriggered(this.siegeConfig);
                }
            }

            // 增加进度
            this.evacuationProgress += (dt * 1000) / this.evacuationTime;

            if (this.evacuationProgress >= 1) {
                // 撤离成功！
                this.evacuationProgress = 1;
                if (this.onEvacuationComplete) {
                    this.onEvacuationComplete();
                }
            }
        } else {
            // 离开撤离区域，重置进度
            if (this.isEvacuating) {
                this.isEvacuating = false;
                this.evacuationProgress = 0;
                this.currentEvacPoint = null;
            }
        }
    }

    /**
     * 获取到下一个撤离点的距离
     * @param {number} currentDistance - 当前距离
     * @returns {number} - 到下一撤离点的距离（米）
     */
    getDistanceToNextEvac(currentDistance) {
        const nextEvacDistance = this.lastSpawnDistance + this.spawnInterval;
        const remaining = Math.max(0, nextEvacDistance - currentDistance);
        return Math.floor(remaining / 10); // 转换为米
    }

    /**
     * 获取当前撤离状态
     * @returns {Object}
     */
    getEvacuationStatus() {
        return {
            isEvacuating: this.isEvacuating,
            progress: this.evacuationProgress,
            evacuationPoints: this.evacuationPoints.length
        };
    }

    /**
     * 生成围攻敌人的位置数据（进入撤离区时调用）
     * @returns {Array} - 敌人生成位置列表 [{ x, y }, ...]
     */
    generateSiegeEnemyPositions() {
        const { waves, enemyCount } = this.siegeConfig;

        // 获取当前撤离点位置
        if (!this.currentEvacPoint) return [];

        const centerX = this.currentEvacPoint.x;
        const centerY = this.currentEvacPoint.y;
        const spawnRadius = 200; // 在撤离点周围200像素范围内生成
        const positions = [];

        log(`⚔️ 围攻开始！${waves}波共${enemyCount}只敌人！`, 'important');

        // 生成敌人围绕撤离点的位置
        for (let i = 0; i < enemyCount; i++) {
            // 环形分布
            const angle = (i / enemyCount) * Math.PI * 2;
            const radius = spawnRadius + Math.random() * 50;
            const spawnX = centerX + Math.cos(angle) * radius;
            const spawnY = centerY + Math.sin(angle) * radius;
            positions.push({ x: spawnX, y: spawnY });
        }

        return positions;
    }

    /**
     * 绘制撤离点
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} scrollY
     */
    draw(ctx, scrollY) {
        ctx.save();
        for (const point of this.evacuationPoints) {
            const screenY = point.y - scrollY;

            // 确保在屏幕范围内才绘制
            if (screenY < -100 || screenY > ctx.canvas.height + 100) continue;

            // 脉冲动画
            const pulse = Math.sin(point.pulsePhase) * 0.2 + 1;
            const currentRadius = point.radius * pulse;

            // 绘制外圈光晕
            const gradient = ctx.createRadialGradient(
                point.x, screenY, 0,
                point.x, screenY, currentRadius * 1.5
            );
            gradient.addColorStop(0, 'rgba(0, 255, 100, 0.4)');
            gradient.addColorStop(0.6, 'rgba(0, 255, 100, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 255, 100, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, screenY, currentRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // 绘制主圆圈
            ctx.strokeStyle = '#00ff64';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(point.x, screenY, currentRadius, 0, Math.PI * 2);
            ctx.stroke();

            // 绘制内圈
            ctx.strokeStyle = 'rgba(0, 255, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(point.x, screenY, currentRadius * 0.6, 0, Math.PI * 2);
            ctx.stroke();

            // 绘制撤离文字
            ctx.fillStyle = '#00ff64';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('撤离点', point.x, screenY - currentRadius - 10);

            // 如果正在撤离，绘制进度
            if (this.isEvacuating && this.currentEvacPoint === point) {
                this.drawEvacuationProgress(ctx, point.x, screenY, currentRadius);
            }
        }
        ctx.restore();
    }

    /**
     * 绘制撤离进度条
     */
    drawEvacuationProgress(ctx, x, y, radius) {
        const progressRadius = radius + 15;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * this.evacuationProgress);

        // 背景圆
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x, y, progressRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 进度圆弧
        ctx.strokeStyle = '#00ff64';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x, y, progressRadius, startAngle, endAngle);
        ctx.stroke();

        // 进度百分比
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.floor(this.evacuationProgress * 100)}%`, x, y);
    }

    /**
     * 重置
     */
    reset() {
        this.evacuationPoints = [];
        this.pendingEvacuations = [];
        this.lastSpawnDistance = 0;
        this.isEvacuating = false;
        this.evacuationProgress = 0;
        this.currentEvacPoint = null;
    }
}
