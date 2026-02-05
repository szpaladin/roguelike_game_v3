import { WEAPONS, WEAPON_TIER, WEAPON_EVOLUTION_TABLE } from './WeaponsData.js';

export function getAvailableEvolutions(playerWeapons, evolutionTable = WEAPON_EVOLUTION_TABLE) {
    const available = [];
    const list = Array.isArray(playerWeapons) ? playerWeapons : [];
    const playerWeaponIds = list
        .filter(w => w && w.def && !(w.def.isFusion || w.def.tier === WEAPON_TIER.FUSION))
        .map(w => w.def.id);

    for (const recipe of evolutionTable || []) {
        if (!recipe || !Array.isArray(recipe.materials)) continue;
        const hasAllMaterials = recipe.materials.every(materialId => playerWeaponIds.includes(materialId));
        if (!hasAllMaterials) continue;

        // 合成限制：合成后武器数不超过4个(原逻辑)
        const afterCount = list.length - recipe.materials.length + 1;
        if (afterCount <= 4) {
            available.push(recipe);
        }
    }

    return available;
}

export function performEvolution(playerWeapons, recipe) {
    if (!recipe || !Array.isArray(recipe.materials)) {
        return { success: false, message: '配方不存在', newWeapon: null };
    }

    const playerWeaponIds = playerWeapons.map(w => w.def.id);
    const hasAllMaterials = recipe.materials.every(materialId => playerWeaponIds.includes(materialId));

    if (!hasAllMaterials) {
        return { success: false, message: '材料不足', newWeapon: null };
    }

    const materialsToRemove = [...recipe.materials];
    for (let i = playerWeapons.length - 1; i >= 0; i--) {
        const weaponId = playerWeapons[i].def.id;
        const materialIndex = materialsToRemove.indexOf(weaponId);
        if (materialIndex !== -1) {
            playerWeapons.splice(i, 1);
            materialsToRemove.splice(materialIndex, 1);
            if (materialsToRemove.length === 0) break;
        }
    }

    const resultWeaponKey = Object.keys(WEAPONS).find(
        key => WEAPONS[key].id === recipe.result
    );

    if (!resultWeaponKey) {
        return { success: false, message: '合成结果武器不存在', newWeapon: null };
    }

    const resultWeaponDef = WEAPONS[resultWeaponKey];
    const newWeapon = {
        def: resultWeaponDef,
        name: resultWeaponDef.name,
        color: resultWeaponDef.color,
        cooldown: 0
    };

    playerWeapons.push(newWeapon);

    return {
        success: true,
        message: `成功合成 ${resultWeaponDef.name}！`,
        newWeapon
    };
}

export function evolveWeaponByResultId(playerWeapons, resultId, evolutionTable = WEAPON_EVOLUTION_TABLE) {
    const recipe = (evolutionTable || []).find(r => r.result === resultId);
    if (!recipe) {
        return { success: false, message: '配方不存在', newWeapon: null };
    }
    return performEvolution(playerWeapons, recipe);
}

export function executeEvolution(weaponSystem, recipe) {
    if (!weaponSystem || !recipe) {
        return { success: false, message: '配方不存在', newWeapon: null };
    }

    const weapons = weaponSystem.getWeapons();
    const available = getAvailableEvolutions(weapons);
    if (!available.some(r => r.id === recipe.id)) {
        return { success: false, message: '材料不足', newWeapon: null };
    }

    for (const materialId of recipe.materials) {
        weaponSystem.removeWeapon(materialId);
    }

    const resultWeaponKey = Object.keys(WEAPONS).find(
        key => WEAPONS[key].id === recipe.result
    );

    if (!resultWeaponKey) {
        return { success: false, message: '合成结果武器不存在', newWeapon: null };
    }

    const newWeapon = weaponSystem.addWeapon(WEAPONS[resultWeaponKey]);
    return {
        success: true,
        message: `成功合成 ${WEAPONS[resultWeaponKey].name}！`,
        newWeapon
    };
}

/**
 * EvolutionSystem - 武器进化系统
 * 负责管理武器的进化逻辑
 */
export default class EvolutionSystem {
    getAvailableEvolutions(playerWeapons) {
        return getAvailableEvolutions(playerWeapons);
    }

    evolveWeapon(playerWeapons, resultId) {
        return evolveWeaponByResultId(playerWeapons, resultId);
    }

    executeEvolution(weaponSystem, recipe) {
        return executeEvolution(weaponSystem, recipe);
    }
}
