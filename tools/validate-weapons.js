import { WEAPONS, WEAPON_EVOLUTION_TABLE, WEAPON_ICON_MAP } from '../js/weapons/WeaponsData.js';

const errors = [];
const warnings = [];

const REQUIRED_FIELDS = [
    'id',
    'name',
    'tier',
    'damage',
    'interval',
    'speed',
    'radius',
    'color',
    'lifetime',
    'piercing'
];

function addError(message) {
    errors.push(message);
}

function addWarning(message) {
    warnings.push(message);
}

function isNumber(value) {
    return typeof value === 'number' && !Number.isNaN(value);
}

function checkRequiredFields(weapon) {
    for (const field of REQUIRED_FIELDS) {
        if (!(field in weapon)) {
            addError(`武器 ${weapon.id || '<unknown>'} 缺少字段: ${field}`);
        }
    }
}

function checkNumberField(weapon, field) {
    if (field in weapon && !isNumber(weapon[field])) {
        addError(`武器 ${weapon.id} 字段 ${field} 不是数字`);
    }
}

function checkBooleanField(weapon, field) {
    if (field in weapon && typeof weapon[field] !== 'boolean') {
        addError(`武器 ${weapon.id} 字段 ${field} 不是布尔值`);
    }
}

function checkEffectPairs(weapon) {
    if (weapon.burnDuration > 0 && !isNumber(weapon.burnDamagePerFrame)) {
        addError(`武器 ${weapon.id} 缺少 burnDamagePerFrame`);
    }
    if (weapon.poisonDuration > 0 && !isNumber(weapon.poisonDamagePerStack)) {
        addError(`武器 ${weapon.id} 缺少 poisonDamagePerStack`);
    }
    if (weapon.freezeChance > 0 && !isNumber(weapon.freezeDuration)) {
        addError(`武器 ${weapon.id} 缺少 freezeDuration`);
    }
    if (weapon.blindChance > 0 && !isNumber(weapon.blindDuration)) {
        addError(`武器 ${weapon.id} 缺少 blindDuration`);
    }
    if (weapon.lifeStealChance > 0 && !isNumber(weapon.lifeStealAmount)) {
        addError(`武器 ${weapon.id} 缺少 lifeStealAmount`);
    }
    if (weapon.chainCount > 0 && !isNumber(weapon.chainRange)) {
        addError(`武器 ${weapon.id} 缺少 chainRange`);
    }
    if (weapon.rayRange > 0 && (!isNumber(weapon.rayLength) || !isNumber(weapon.rayWidth))) {
        addError(`武器 ${weapon.id} 缺少 rayLength 或 rayWidth`);
    }
    if (weapon.aoeRadius > 0 && !isNumber(weapon.aoeDamage)) {
        addError(`武器 ${weapon.id} 缺少 aoeDamage`);
    }
    if (weapon.explosionRadius > 0 && !isNumber(weapon.explosionDamage)) {
        addError(`武器 ${weapon.id} 缺少 explosionDamage`);
    }
    if (weapon.canSplit && (!isNumber(weapon.splitCount) || !isNumber(weapon.splitRange))) {
        addError(`武器 ${weapon.id} 缺少 splitCount 或 splitRange`);
    }
}

function checkWeaponIcons(weapon) {
    if (weapon.id === 'basic') {
        return;
    }
    if (!WEAPON_ICON_MAP[weapon.id]) {
        addWarning(`武器 ${weapon.id} 缺少图标`);
    }
}

const weapons = Object.values(WEAPONS);
const weaponById = new Map();

for (const weapon of weapons) {
    if (!weapon || typeof weapon !== 'object') {
        addError('WEAPONS 内存在无效武器定义');
        continue;
    }
    if (!weapon.id) {
        addError('存在缺少 id 的武器定义');
        continue;
    }
    if (weaponById.has(weapon.id)) {
        addError(`武器 ID 重复: ${weapon.id}`);
        continue;
    }
    weaponById.set(weapon.id, weapon);

    checkRequiredFields(weapon);
    checkNumberField(weapon, 'damage');
    checkNumberField(weapon, 'interval');
    checkNumberField(weapon, 'speed');
    checkNumberField(weapon, 'radius');
    checkNumberField(weapon, 'lifetime');
    checkBooleanField(weapon, 'piercing');
    checkEffectPairs(weapon);
    checkWeaponIcons(weapon);
}

const fusionIds = new Set();
const fusionResults = new Set();

for (const recipe of WEAPON_EVOLUTION_TABLE) {
    if (!recipe || typeof recipe !== 'object') {
        addError('WEAPON_EVOLUTION_TABLE 内存在无效配方');
        continue;
    }
    if (!recipe.id) {
        addError('融合配方缺少 id');
        continue;
    }
    if (fusionIds.has(recipe.id)) {
        addError(`融合配方 ID 重复: ${recipe.id}`);
    }
    fusionIds.add(recipe.id);

    if (!Array.isArray(recipe.materials) || recipe.materials.length !== 2) {
        addError(`融合配方 ${recipe.id} materials 不是 2 个材料`);
    } else {
        for (const material of recipe.materials) {
            if (!weaponById.has(material)) {
                addError(`融合配方 ${recipe.id} 材料不存在: ${material}`);
            }
        }
    }

    if (!recipe.result) {
        addError(`融合配方 ${recipe.id} 缺少 result`);
    } else {
        if (!weaponById.has(recipe.result)) {
            addError(`融合配方 ${recipe.id} 结果武器不存在: ${recipe.result}`);
        }
        if (fusionResults.has(recipe.result)) {
            addError(`融合结果重复: ${recipe.result}`);
        }
        fusionResults.add(recipe.result);
    }
}

if (warnings.length > 0) {
    console.warn('武器校验警告:');
    for (const warning of warnings) {
        console.warn(`- ${warning}`);
    }
}

if (errors.length > 0) {
    console.error('武器校验失败:');
    for (const error of errors) {
        console.error(`- ${error}`);
    }
    process.exit(1);
}

console.log('武器数据校验通过。');
