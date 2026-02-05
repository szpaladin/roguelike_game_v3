// 检测移动设备
const isMobile = typeof navigator !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth <= 768)
);

/**
 * 游戏配置常量
 */
export const GAME_CONFIG = {
    TILE_SIZE: isMobile ? 20 : 30,
    CHUNK_SIZE: 20,
    MAP_WIDTH: 20,
    AUTO_SCROLL_SPEED: 0.8,
    SPAWN_INTERVAL: 200,
    PLAYER_INVULNERABLE_TIME: 60,
    // 撤离系统配置
    EVACUATION: {
        SPAWN_INTERVAL: 5000,    // 每5000像素(500米)生成撤离点
        EVACUATION_TIME: 3000,   // 撤离需要3秒（毫秒）
        DEATH_PENALTY: 0.5       // 死亡损失50%收益
    }
};

/**
 * 地图瓦片类型
 */
export const TILE = {
    WALL: 0,
    FLOOR: 1
};

/**
 * 实体类型
 */
export const ENTITY = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    CHEST: 'chest'
};
