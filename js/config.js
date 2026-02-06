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
    HORIZONTAL_WRAP_BUFFER_SCREENS: 1,
    BACKGROUND: {
        LOW_POLY_CELL: 80,
        BEAM_COUNT: 5,
        DUST_COUNT: 70,
        FLOOR_OVERLAY_COLOR: 'rgba(8, 14, 28, 0.25)',
        SHOW_WALL_TILES: false
    },
    DIRECTION_RANDOM: {
        ANGLE_MIN: -Math.PI / 2,
        ANGLE_MAX: Math.PI / 2,
        TURN_SPEED: 4.0,
        HORIZONTAL_THRESHOLD: 0.15,
        MID_THRESHOLD: 0.35,
        HORIZONTAL_DURATION: [1, 2],
        MID_DURATION: [2, 4],
        DEFAULT_DURATION: [3, 6]
    },
    SPAWN_INTERVAL: 200,
    ENEMY_SPAWN_MULTIPLIER: 3,
    SEAWEED: {
        REVEAL_RADIUS: 140,
        PATCH_MIN_SIZE: 240,
        PATCH_MAX_SIZE: 360,
        SPAWN_INTERVAL_MIN: 800,
        SPAWN_INTERVAL_MAX: 1200,
        SPAWN_OFFSET_MIN: 80,
        SPAWN_OFFSET_MAX: 180,
        COLOR: 'rgba(18, 80, 60, 0.75)',
        EDGE_COLOR: 'rgba(20, 120, 90, 0.2)'
    },
    FOG: {
        REVEAL_RADIUS: 260,
        PATCH_MIN_SIZE: 420,
        PATCH_MAX_SIZE: 620,
        SPAWN_INTERVAL_MIN: 1100,
        SPAWN_INTERVAL_MAX: 1600,
        SPAWN_OFFSET_MIN: 120,
        SPAWN_OFFSET_MAX: 220,
        COLOR: 'rgba(190, 185, 150, 0.5)',
        BLOCK_BULLETS: true
    },
    WATER_INERTIA: {
        PLAYER_ACCEL: 0.22,
        PLAYER_DECEL: 0.14,
        PLAYER_STOP: 0.03,
        ENEMY_ACCEL: 0.14,
        ENEMY_DECEL: 0.12,
        ENEMY_STOP: 0.02
    },
    PLAYER_INVULNERABLE_TIME: 60,
    BULLET_LIFETIME_MULTIPLIER: 2,
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
