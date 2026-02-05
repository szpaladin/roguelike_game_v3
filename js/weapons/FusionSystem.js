import { WEAPONS, WEAPON_ID_MAP, WEAPON_TIER } from './WeaponsData.js';
import { WEAPON_FUSION_RECIPES, FUSION_SOURCE_SIGNATURE } from './FusionRecipes.js';
import { buildFusionSignature } from './FusionSignature.js';
import { log } from '../utils.js';

let syncWarningShown = false;

const ORDER_MAP = {};
Object.values(WEAPON_ID_MAP || {}).forEach((info) => {
    if (info && info.id) ORDER_MAP[info.id] = info.order ?? 9999;
});

function sortWeaponIds(ids) {
    return ids
        .filter(Boolean)
        .slice()
        .sort((a, b) => {
            const orderA = ORDER_MAP[a] ?? 9999;
            const orderB = ORDER_MAP[b] ?? 9999;
            if (orderA !== orderB) return orderA - orderB;
            return a.localeCompare(b);
        });
}

function warnIfFusionRecipesOutdated() {
    if (syncWarningShown) return;
    syncWarningShown = true;

    if (!FUSION_SOURCE_SIGNATURE || !FUSION_SOURCE_SIGNATURE.hash) {
        console.warn('[Fusion] 融合表缺少签名，请运行 npm run generate:fusion-recipes');
        log('⚠️ 融合表缺少签名，请运行 npm run generate:fusion-recipes', 'important');
        return;
    }

    const current = buildFusionSignature();
    if (current.hash !== FUSION_SOURCE_SIGNATURE.hash || current.count !== FUSION_SOURCE_SIGNATURE.count) {
        console.warn('[Fusion] 融合表未同步，请运行 npm run generate:fusion-recipes');
        log('⚠️ 融合表未同步，请运行 npm run generate:fusion-recipes', 'important');
    }
}

function isNumber(value) {
    return typeof value === 'number' && !Number.isNaN(value);
}

function pickMin(a, b) {
    if (isNumber(a) && isNumber(b)) return Math.min(a, b);
    if (isNumber(a)) return a;
    if (isNumber(b)) return b;
    return undefined;
}

function pickMax(a, b) {
    if (isNumber(a) && isNumber(b)) return Math.max(a, b);
    if (isNumber(a)) return a;
    if (isNumber(b)) return b;
    return undefined;
}

function sumValues(a, b) {
    if (!isNumber(a) && !isNumber(b)) return undefined;
    return (isNumber(a) ? a : 0) + (isNumber(b) ? b : 0);
}

function rangeCombine(a, b) {
    if (isNumber(a) && isNumber(b)) {
        const max = Math.max(a, b);
        const min = Math.min(a, b);
        return max + 0.5 * min;
    }
    if (isNumber(a)) return a;
    if (isNumber(b)) return b;
    return undefined;
}

function setIfDefined(target, key, value) {
    if (value === undefined || value === null) return;
    target[key] = value;
}

function mergeBoolOr(a, b) {
    return !!(a || b);
}

function mergeShatterFlag(a, b) {
    if (a === false || b === false) return false;
    if (a === true || b === true) return true;
    return undefined;
}

function mergeTerrainOnHit(defA, defB) {
    const a = defA && defA.terrainOnHit;
    const b = defB && defB.terrainOnHit;
    if (!a && !b) return undefined;
    const type = (a && a.type) || (b && b.type);
    if (type !== 'ridge') return a || b;
    const merged = {
        type: 'ridge'
    };
    setIfDefined(merged, 'length', rangeCombine(a && a.length, b && b.length));
    setIfDefined(merged, 'width', rangeCombine(a && a.width, b && b.width));
    setIfDefined(merged, 'duration', pickMax(a && a.duration, b && b.duration));
    setIfDefined(merged, 'slowAmount', sumValues(a && a.slowAmount, b && b.slowAmount));
    setIfDefined(merged, 'slowDuration', pickMax(a && a.slowDuration, b && b.slowDuration));
    setIfDefined(merged, 'angle', pickMax(a && a.angle, b && b.angle));
    return merged;
}

export function getAvailableWeaponFusions(playerWeapons, recipes = WEAPON_FUSION_RECIPES) {
    warnIfFusionRecipesOutdated();
    const available = [];
    const usableWeapons = playerWeapons.filter(w => {
        const def = w && w.def;
        if (!def) return false;
        return !(def.isFusion || def.tier === WEAPON_TIER.FUSION);
    });
    const weaponIds = usableWeapons.map(w => w.def.id);

    for (const recipe of recipes) {
        if (!recipe || !Array.isArray(recipe.materials) || recipe.materials.length < 2) {
            continue;
        }
        const [matA, matB] = recipe.materials;
        if (!matA || !matB) continue;
        if (matA === matB) {
            continue;
        }
        if (weaponIds.includes(matA) && weaponIds.includes(matB)) {
            available.push(recipe);
        }
    }

    return available;
}

export function buildFusionDefinition(defA, defB, recipe = null) {
    warnIfFusionRecipesOutdated();
    if (!defA || !defB) return null;
    const id = (recipe && recipe.id) ? recipe.id : `fusion_${defA.id}_${defB.id}`;
    const name = `${defA.name || defA.id} × ${defB.name || defB.id}`;

    const def = {
        id,
        name,
        tier: WEAPON_TIER.FUSION,
        isFusion: true,
        fusionMaterials: [defA.id, defB.id],
        color: defA.color || defB.color
    };

    setIfDefined(def, 'damage', pickMax(defA.damage, defB.damage));
    setIfDefined(def, 'interval', pickMin(defA.interval, defB.interval));
    setIfDefined(def, 'speed', pickMax(defA.speed, defB.speed));
    setIfDefined(def, 'radius', pickMax(defA.radius, defB.radius));
    setIfDefined(def, 'lifetime', pickMax(defA.lifetime, defB.lifetime));

    def.piercing = mergeBoolOr(defA.piercing, defB.piercing);

    const spawnMode = (defA.spawnMode === 'sky_drop' || defB.spawnMode === 'sky_drop')
        ? 'sky_drop'
        : (defA.spawnMode || defB.spawnMode);
    if (spawnMode) {
        def.spawnMode = spawnMode;
    }

    setIfDefined(def, 'dropOffsetX', rangeCombine(defA.dropOffsetX, defB.dropOffsetX));
    setIfDefined(def, 'dropOffsetY', rangeCombine(defA.dropOffsetY, defB.dropOffsetY));
    setIfDefined(def, 'dropSpeed', pickMax(defA.dropSpeed, defB.dropSpeed));
    setIfDefined(def, 'dropLifetime', pickMax(defA.dropLifetime, defB.dropLifetime));
    setIfDefined(def, 'dropRadius', pickMax(defA.dropRadius, defB.dropRadius));

    setIfDefined(def, 'rayRange', rangeCombine(defA.rayRange, defB.rayRange));
    setIfDefined(def, 'rayLength', rangeCombine(defA.rayLength, defB.rayLength));
    setIfDefined(def, 'rayWidth', rangeCombine(defA.rayWidth, defB.rayWidth));

    setIfDefined(def, 'aoeRadius', rangeCombine(defA.aoeRadius, defB.aoeRadius));
    setIfDefined(def, 'aoeDamage', pickMax(defA.aoeDamage, defB.aoeDamage));
    setIfDefined(def, 'explosionRadius', rangeCombine(defA.explosionRadius, defB.explosionRadius));
    setIfDefined(def, 'explosionDamage', pickMax(defA.explosionDamage, defB.explosionDamage));

    setIfDefined(def, 'chainCount', pickMax(defA.chainCount, defB.chainCount));
    setIfDefined(def, 'chainRange', rangeCombine(defA.chainRange, defB.chainRange));
    setIfDefined(def, 'chainCooldown', pickMin(defA.chainCooldown, defB.chainCooldown));

    const canSplit = mergeBoolOr(defA.canSplit, defB.canSplit);
    if (canSplit) {
        def.canSplit = true;
        setIfDefined(def, 'splitCount', pickMax(defA.splitCount, defB.splitCount));
        setIfDefined(def, 'splitRange', rangeCombine(defA.splitRange, defB.splitRange));
        setIfDefined(def, 'splitDamageMultiplier', pickMin(defA.splitDamageMultiplier, defB.splitDamageMultiplier));
    }

    setIfDefined(def, 'burnDuration', pickMax(defA.burnDuration, defB.burnDuration));
    setIfDefined(def, 'burnDamagePerFrame', sumValues(defA.burnDamagePerFrame, defB.burnDamagePerFrame));
    if (defA.burnColor || defB.burnColor) def.burnColor = defA.burnColor || defB.burnColor;

    setIfDefined(def, 'darkFlameDuration', pickMax(defA.darkFlameDuration, defB.darkFlameDuration));
    setIfDefined(def, 'darkFlameDamagePerFrame', sumValues(defA.darkFlameDamagePerFrame, defB.darkFlameDamagePerFrame));
    setIfDefined(def, 'darkFlameSpreadInterval', pickMin(defA.darkFlameSpreadInterval, defB.darkFlameSpreadInterval));
    setIfDefined(def, 'darkFlameContactPadding', pickMax(defA.darkFlameContactPadding, defB.darkFlameContactPadding));
    if (defA.darkFlameColor || defB.darkFlameColor) def.darkFlameColor = defA.darkFlameColor || defB.darkFlameColor;

    setIfDefined(def, 'abyssSacrificeDuration', pickMax(defA.abyssSacrificeDuration, defB.abyssSacrificeDuration));
    setIfDefined(def, 'abyssSacrificeHeal', pickMax(defA.abyssSacrificeHeal, defB.abyssSacrificeHeal));

    setIfDefined(def, 'poisonDuration', pickMax(defA.poisonDuration, defB.poisonDuration));
    setIfDefined(def, 'poisonDamagePerStack', sumValues(defA.poisonDamagePerStack, defB.poisonDamagePerStack));

    setIfDefined(def, 'plagueDuration', pickMax(defA.plagueDuration, defB.plagueDuration));
    setIfDefined(def, 'plagueDamagePerStack', sumValues(defA.plagueDamagePerStack, defB.plagueDamagePerStack));
    setIfDefined(def, 'plagueCloudRadius', rangeCombine(defA.plagueCloudRadius, defB.plagueCloudRadius));
    if (defA.plagueColor || defB.plagueColor) def.plagueColor = defA.plagueColor || defB.plagueColor;

    setIfDefined(def, 'overgrowthDuration', pickMax(defA.overgrowthDuration, defB.overgrowthDuration));
    setIfDefined(def, 'overgrowthTriggerStacks', pickMax(defA.overgrowthTriggerStacks, defB.overgrowthTriggerStacks));
    setIfDefined(def, 'overgrowthExplosionRadius', rangeCombine(defA.overgrowthExplosionRadius, defB.overgrowthExplosionRadius));
    setIfDefined(def, 'overgrowthExplosionMultiplier', sumValues(defA.overgrowthExplosionMultiplier, defB.overgrowthExplosionMultiplier));
    if (defA.overgrowthExplosionColor || defB.overgrowthExplosionColor) {
        def.overgrowthExplosionColor = defA.overgrowthExplosionColor || defB.overgrowthExplosionColor;
    }

    setIfDefined(def, 'curseDuration', pickMax(defA.curseDuration, defB.curseDuration));
    setIfDefined(def, 'curseConsumeStacks', pickMax(defA.curseConsumeStacks, defB.curseConsumeStacks));
    setIfDefined(def, 'curseDamageMultiplier', sumValues(defA.curseDamageMultiplier, defB.curseDamageMultiplier));

    setIfDefined(def, 'freezeChance', pickMax(defA.freezeChance, defB.freezeChance));
    setIfDefined(def, 'freezeDuration', pickMax(defA.freezeDuration, defB.freezeDuration));
    setIfDefined(def, 'shatterMultiplier', pickMax(defA.shatterMultiplier, defB.shatterMultiplier));
    const shatterConsumesFrozen = mergeShatterFlag(defA.shatterConsumesFrozen, defB.shatterConsumesFrozen);
    if (shatterConsumesFrozen !== undefined) def.shatterConsumesFrozen = shatterConsumesFrozen;
    const shatterPreventRefreeze = mergeShatterFlag(defA.shatterPreventRefreeze, defB.shatterPreventRefreeze);
    if (shatterPreventRefreeze !== undefined) def.shatterPreventRefreeze = shatterPreventRefreeze;

    setIfDefined(def, 'blindChance', pickMax(defA.blindChance, defB.blindChance));
    setIfDefined(def, 'blindDuration', pickMax(defA.blindDuration, defB.blindDuration));

    setIfDefined(def, 'lifeStealChance', pickMax(defA.lifeStealChance, defB.lifeStealChance));
    setIfDefined(def, 'lifeStealAmount', pickMax(defA.lifeStealAmount, defB.lifeStealAmount));

    setIfDefined(def, 'vulnerability', sumValues(defA.vulnerability, defB.vulnerability));
    setIfDefined(def, 'vulnerabilityDuration', pickMax(defA.vulnerabilityDuration, defB.vulnerabilityDuration));

    setIfDefined(def, 'radiationVulnerability', sumValues(defA.radiationVulnerability, defB.radiationVulnerability));
    setIfDefined(def, 'radiationVulnerabilityDuration', pickMax(defA.radiationVulnerabilityDuration, defB.radiationVulnerabilityDuration));

    setIfDefined(def, 'terrainOnHit', mergeTerrainOnHit(defA, defB));

    return def;
}

export function executeFusion(weaponSystem, weaponIds, recipe = null) {
    if (!weaponSystem || !Array.isArray(weaponIds) || weaponIds.length < 2) {
        return { success: false, message: '材料不足', newWeapon: null };
    }

    const [materialA, materialB] = sortWeaponIds(weaponIds);
    if (!materialA || !materialB || materialA === materialB) {
        return { success: false, message: '材料不足', newWeapon: null };
    }

    const weapons = weaponSystem.getWeapons();
    const weaponA = weapons.find(w => w && w.def && w.def.id === materialA);
    const weaponB = weapons.find(w => w && w.def && w.def.id === materialB);
    if (!weaponA || !weaponB) {
        return { success: false, message: '材料不足', newWeapon: null };
    }
    if (weaponA.def.isFusion || weaponB.def.isFusion || weaponA.def.tier === WEAPON_TIER.FUSION || weaponB.def.tier === WEAPON_TIER.FUSION) {
        return { success: false, message: '材料不足', newWeapon: null };
    }

    const fusedDef = buildFusionDefinition(weaponA.def, weaponB.def, recipe);
    if (!fusedDef) {
        return { success: false, message: '融合失败', newWeapon: null };
    }

    weaponSystem.removeWeapon(materialA);
    weaponSystem.removeWeapon(materialB);

    const newWeapon = weaponSystem.addWeapon(fusedDef);
    return {
        success: true,
        message: `成功融合 ${fusedDef.name}！`,
        newWeapon
    };
}

export function resolveWeaponDefinition(weaponId) {
    const key = Object.keys(WEAPONS).find(k => WEAPONS[k].id === weaponId);
    return key ? WEAPONS[key] : null;
}
