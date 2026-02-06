import Enemy from './Enemy.js';
import { getRandomEnemyType } from './EnemiesData.js';
import { GAME_CONFIG } from '../config.js';
import { wrapX } from '../utils.js';

/**
 * EnemySpawner - 敌人生成器
 * 负责在地图上随机生成敌人
 */
export default class EnemySpawner {
    constructor() {
        this.lastSpawnY = 0;
        this.baseSpawnInterval = GAME_CONFIG.SPAWN_INTERVAL;
        this.spawnIntervalMultiplier = 1.0; // 风险系统倍率调整

        // 默认画布尺寸，实际运行速度时可以更新
        this.canvasWidth = GAME_CONFIG.TILE_SIZE * GAME_CONFIG.MAP_WIDTH;
        this.canvasHeight = 600;
    }

    /**
     * 设置生成间隔倍率（由风险系统调用）
     * @param {number} multiplier - 倍率（小于1表示生成更快）
     */
    setSpawnIntervalMultiplier(multiplier) {
        this.spawnIntervalMultiplier = multiplier;
    }

    /**
     * 获取当前有效的生成间隔
     */
    getEffectiveSpawnInterval() {
        const spawnMultiplier = Number.isFinite(GAME_CONFIG.ENEMY_SPAWN_MULTIPLIER)
            ? GAME_CONFIG.ENEMY_SPAWN_MULTIPLIER
            : 1;
        return (this.baseSpawnInterval * this.spawnIntervalMultiplier) / Math.max(1, spawnMultiplier);
    }

    /**
     * 尝试生成一个敌人
     * @param {number} scrollY - 当前滚动位置 (世界坐标 Y 的偏移)
     * @param {Object} playerPos - 玩家当前显示的坐标 (x, y)
     * @returns {Enemy|null} - 生成的敌人实例或 null
     */
    spawn(distance, playerPos, view = null, dir = null) {
        // 检查是否达到生成间隔（使用动态间隔）
        const effectiveInterval = this.getEffectiveSpawnInterval();
        if (Math.abs(distance - this.lastSpawnY) < effectiveInterval) {
            return null;
        }

        this.lastSpawnY = distance;
        const type = getRandomEnemyType(distance);

        // 生成位置：在屏幕底部下方 (scrollY + canvasHeight + 50)
        // 注意：在原项目中 distance 就是 scrollY
        if (view && dir && Number.isFinite(view.cameraX) && Number.isFinite(view.cameraY)) {
            const forward = view.height * 0.8 + 50;
            const sideRange = view.width * 0.6;
            const side = (Math.random() * 2 - 1) * sideRange;
            const perpX = -dir.y;
            const perpY = dir.x;
            const baseX = view.cameraX + dir.x * forward;
            const baseY = view.cameraY + dir.y * forward;
            const spawnX = wrapX(baseX + perpX * side, view.worldWidth);
            const spawnY = baseY + perpY * side;
            return new Enemy(spawnX, spawnY, type);
        }

        const spawnY = distance + this.canvasHeight + 50;
        const spawnX = Math.random() * this.canvasWidth;

        return new Enemy(spawnX, spawnY, type);
    }

    /**
     * 更新画布尺寸
     */
    updateCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }
}

