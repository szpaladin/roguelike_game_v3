export const UPGRADE_TABLE = {
    maxHp: {
        key: 'maxHp',
        label: '氧气上限',
        perLevel: 5,
        maxLevel: 5,
        costs: [50, 100, 150, 200, 300]
    },
    strength: {
        key: 'strength',
        label: '力量',
        perLevel: 1,
        maxLevel: 5,
        costs: [80, 160, 240, 320, 450]
    },
    intelligence: {
        key: 'intelligence',
        label: '智力',
        perLevel: 1,
        maxLevel: 5,
        costs: [80, 160, 240, 320, 450]
    }
};

export function getUpgradeLevel(meta, key) {
    if (!meta || !meta.upgrades) return 0;
    return meta.upgrades[key] ?? 0;
}

export function getUpgradeCost(meta, key) {
    const config = UPGRADE_TABLE[key];
    if (!config) return null;
    const level = getUpgradeLevel(meta, key);
    if (level >= config.maxLevel) return null;
    return config.costs[level] ?? null;
}

export function canPurchase(meta, key) {
    const cost = getUpgradeCost(meta, key);
    if (cost === null) return false;
    return (meta && typeof meta.gold === 'number' ? meta.gold : 0) >= cost;
}

export function purchaseUpgrade(meta, key) {
    if (!meta || !meta.upgrades) return false;
    if (!canPurchase(meta, key)) return false;
    const cost = getUpgradeCost(meta, key);
    if (cost === null) return false;
    meta.gold -= cost;
    meta.upgrades[key] = getUpgradeLevel(meta, key) + 1;
    return true;
}

export function getUpgradeSummary(meta, key) {
    const config = UPGRADE_TABLE[key];
    if (!config) return null;
    const level = getUpgradeLevel(meta, key);
    const cost = getUpgradeCost(meta, key);
    const maxed = level >= config.maxLevel;
    return {
        key,
        label: config.label,
        level,
        maxLevel: config.maxLevel,
        perLevel: config.perLevel,
        cost,
        maxed
    };
}
