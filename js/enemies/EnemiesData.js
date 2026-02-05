/**
 * 敌人数据定义
 */
export const ENEMY_TYPES = [
    {
        name: '狮子鱼',
        tier: 0,
        hp: 50,
        maxHp: 50,
        attack: 2,
        defense: 0,
        exp: 5,
        gold: 2,
        color: '#00ff00',
        speed: 0.6,
        radius: 10,
        shapeSides: 3,
        spawnWeight: 1
    },
    {
        name: '海马',
        tier: 0,
        hp: 10,
        maxHp: 10,
        attack: 0,
        defense: 0,
        exp: 5,
        gold: 0,
        color: '#F6E6A6',
        speed: 0.5,
        radius: 5,
        shapeSides: 4,
        moveType: 'patrol_horizontal',
        patrolWaveAmplitude: 6,
        patrolWaveSpeed: 0.08,
        harmless: true,
        spawnWeight: 2
    },
    {
        name: '泰坦扳机鱼',
        tier: 1,
        hp: 150,
        maxHp: 150,
        attack: 5,
        defense: 1,
        exp: 10,
        gold: 5,
        color: '#00aa00',
        speed: 0.8,
        radius: 12,
        shapeSides: 5
    },
    {
        name: '鳗鲶',
        tier: 2,
        hp: 300,
        maxHp: 300,
        attack: 8,
        defense: 2,
        exp: 20,
        gold: 10,
        color: '#cccccc',
        speed: 0.9,
        radius: 13,
        shapeSides: 6
    },
    {
        name: '毒刺水母',
        tier: 3,
        hp: 600,
        maxHp: 600,
        attack: 10,
        defense: 2,
        exp: 28,
        gold: 15,
        color: '#6600cc',
        speed: 1.0,
        radius: 14,
        shapeSides: 3
    },
    {
        name: '三齿鲨',
        tier: 4,
        hp: 1000,
        maxHp: 1000,
        attack: 12,
        defense: 3,
        exp: 35,
        gold: 20,
        color: '#ff0000',
        speed: 1.0,
        radius: 14,
        shapeSides: 4
    }
];

/**
 * 敌人生成配置
 * 根据距离逐步解锁更强的敌人
 */
export const ENEMY_SPAWN_CONFIG = {
    // 正式模式：循序渐进解锁敌人
    unlockThresholds: [
        { distance: 0, maxTier: 0 },      // 0距离：狮子鱼 / 海马
        { distance: 500, maxTier: 1 },    // 500距离：解锁泰坦扳机鱼
        { distance: 1500, maxTier: 2 },   // 1500距离：解锁鳗鲶
        { distance: 3000, maxTier: 3 },   // 3000距离：解锁毒刺水母
        { distance: 5000, maxTier: 4 }    // 5000距离：解锁三齿鲨
    ]

    // 🧪 测试模式：快速解锁（调试时取消注释）
    // unlockThresholds: [
    //     { distance: 0, maxTier: 0 },
    //     { distance: 20, maxTier: 1 },
    //     { distance: 50, maxTier: 2 },
    //     { distance: 70, maxTier: 3 },
    //     { distance: 100, maxTier: 4 }
    // ]
};

/**
 * 根据索引获取敌人类型
 */
export function getEnemyType(index) {
    if (index >= 0 && index < ENEMY_TYPES.length) {
        return { ...ENEMY_TYPES[index] };
    }
    return null;
}

/**
 * 根据名称获取敌人类型
 */
export function getEnemyTypeByName(name) {
    const enemy = ENEMY_TYPES.find(e => e.name === name);
    return enemy ? { ...enemy } : null;
}

/**
 * 获取当前距离下可生成的最大敌人等级
 */
export function getMaxEnemyTier(distance) {
    for (let i = ENEMY_SPAWN_CONFIG.unlockThresholds.length - 1; i >= 0; i--) {
        if (distance >= ENEMY_SPAWN_CONFIG.unlockThresholds[i].distance) {
            return ENEMY_SPAWN_CONFIG.unlockThresholds[i].maxTier;
        }
    }
    return 0;
}

/**
 * 根据距离随机获取敌人类型
 */
export function getRandomEnemyType(distance) {
    const maxTier = getMaxEnemyTier(distance);
    const candidates = ENEMY_TYPES.filter((enemy, index) => {
        if (!enemy) return false;
        const tier = Number.isFinite(enemy.tier) ? enemy.tier : index;
        return tier <= maxTier;
    });
    if (!candidates.length) return null;
    const totalWeight = candidates.reduce((sum, enemy) => {
        const weight = Number.isFinite(enemy.spawnWeight) ? enemy.spawnWeight : 1;
        return sum + Math.max(0, weight);
    }, 0);
    if (totalWeight <= 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        return { ...candidates[randomIndex] };
    }
    let roll = Math.random() * totalWeight;
    for (const enemy of candidates) {
        const weight = Number.isFinite(enemy.spawnWeight) ? Math.max(0, enemy.spawnWeight) : 1;
        if (roll < weight) return { ...enemy };
        roll -= weight;
    }
    return { ...candidates[candidates.length - 1] };
}
