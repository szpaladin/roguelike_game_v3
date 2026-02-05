/**
 * RiskSystem - 风险曲线系统（统一深度配置中心）
 * 管理基于深度的所有难度参数
 * 风险区域阈值：300m / 500m / 800m / 1200m（测试配置）
 * 
 * 所有深度相关系统（氧气、光照、敌人、围攻）都从此处获取配置
 */

// 统一深度区间配置（唯一数据源）
const DEPTH_ZONES = [
    {
        minDepth: 0,
        maxDepth: 300,
        name: '舒适区',
        // 敌人相关
        enemyMultiplier: 1.0,     // 敌人强度/生成频率倍率
        deathPenalty: 0.40,       // 死亡惩罚（损失金币比例）
        // 氧气相关
        oxygenInterval: 4.0,      // 氧气消耗间隔（秒）
        // 光照相关
        lightingAlpha: 0.00,      // 光照遮罩透明度
        // 围攻相关（P3 预留）
        siegeWaves: 1,            // 围攻波次
        siegeEnemyCount: 6        // 每波敌人数量
    },
    {
        minDepth: 300,
        maxDepth: 500,
        name: '危险区',
        enemyMultiplier: 1.5,
        deathPenalty: 0.50,
        oxygenInterval: 2.5,
        lightingAlpha: 0.20,
        siegeWaves: 2,
        siegeEnemyCount: 12
    },
    {
        minDepth: 500,
        maxDepth: 800,
        name: '高危区',
        enemyMultiplier: 2.5,
        deathPenalty: 0.65,
        oxygenInterval: 1.5,
        lightingAlpha: 0.45,
        siegeWaves: 3,
        siegeEnemyCount: 22
    },
    {
        minDepth: 800,
        maxDepth: Infinity,
        name: '极限区',
        enemyMultiplier: 4.0,
        deathPenalty: 0.80,
        oxygenInterval: 0.8,
        lightingAlpha: 0.70,
        siegeWaves: 4,
        siegeEnemyCount: 30
    }
];

export default class RiskSystem {
    constructor() {
        this.zones = DEPTH_ZONES;
        this.lastZoneName = null; // 用于检测区域变化
    }

    /**
     * 检查是否进入新的深度区域
     * @param {number} distance - 当前距离（米）
     * @returns {Object|null} - 如果进入新区域返回区域信息，否则返回null
     */
    checkZoneChange(distance) {
        const currentZone = this.getCurrentZone(distance);
        if (this.lastZoneName !== currentZone.name) {
            const isNotFirst = this.lastZoneName !== null;
            this.lastZoneName = currentZone.name;
            // 跳过第一次（游戏开始时）
            if (isNotFirst) {
                return currentZone;
            }
        }
        return null;
    }

    /**
     * 获取当前深度对应的风险区域
     * @param {number} distance - 当前距离（米）
     * @returns {Object} - 风险区域配置
     */
    getCurrentZone(distance) {
        for (const zone of this.zones) {
            if (distance >= zone.minDepth && distance < zone.maxDepth) {
                return zone;
            }
        }
        return this.zones[this.zones.length - 1];
    }

    // ========== 敌人相关 ==========

    /**
     * 获取敌人强度倍率
     */
    getEnemyMultiplier(distance) {
        return this.getCurrentZone(distance).enemyMultiplier;
    }

    /**
     * 获取生成间隔倍率（与强度成反比）
     */
    getSpawnIntervalMultiplier(distance) {
        return 1.0 / this.getEnemyMultiplier(distance);
    }

    /**
     * 获取死亡惩罚比例
     */
    getDeathPenalty(distance) {
        return this.getCurrentZone(distance).deathPenalty;
    }

    /**
     * 获取金币保留比例
     */
    getGoldRetention(distance) {
        return 1 - this.getDeathPenalty(distance);
    }

    // ========== 氧气相关 ==========

    /**
     * 获取氧气消耗间隔（秒）
     */
    getOxygenInterval(distance) {
        return this.getCurrentZone(distance).oxygenInterval;
    }

    // ========== 光照相关 ==========

    /**
     * 获取光照遮罩透明度
     */
    getLightingAlpha(distance) {
        return this.getCurrentZone(distance).lightingAlpha;
    }

    // ========== 围攻相关（P3 预留）==========

    /**
     * 获取围攻配置
     */
    getSiegeConfig(distance) {
        const zone = this.getCurrentZone(distance);
        return {
            waves: zone.siegeWaves,
            enemyCount: zone.siegeEnemyCount
        };
    }
}
