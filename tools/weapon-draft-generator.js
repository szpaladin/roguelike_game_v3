import fs from 'fs';
import { WEAPONS, WEAPON_TIER, WEAPON_EVOLUTION_TABLE } from '../js/weapons/WeaponsData.js';

export const NAME_TO_ID = {
    '冰屑群': 'ice_shard_swarm',
    '冰川震': 'glacier',
    '冰毒': 'ice_toxin',
    '冰电链': 'ice_chain',
    '吸毒': 'leech_toxin',
    '雷汲脉冲': 'leech_arc',
    '圣灵': 'holy_wisp',
    '圣锤': 'holy_hammer',
    '夜刃': 'night_blade',
    '高温射线': 'high_temperature_ray',
    '寒束': 'cold_beam',
    '寒魄吸': 'frost_leech',
    '蔓延': 'overgrowth',
    '幽刃': 'phantom_blade',
    '电魂': 'electric_soul',
    '幽群': 'wraith_swarm',
    '恶灵': 'shadow_wraith',
    '影疾': 'shadow_rush',
    '日光矛': 'sun_lance',
    '闪烁': 'eclipse',
    '晶格束': 'lattice_beam',
    '暗孢群': 'dark_spore_swarm',
    '暗焰': 'dark_flame',
    '棱光群': 'prism_swarm',
    '毒孢群': 'toxic_spore_swarm',
    '毒灵': 'toxic_wraith',
    '硫磺': 'toxic_flame',
    '毒爆': 'swamp',
    '毒电链': 'venom_arc',
    '毒眩': 'toxic_daze',
    '毒钉': 'toxic_spike',
    '血咒': 'soul_drain',
    '灵岩': 'nether_stone',
    '炎孢群': 'flame_spore_swarm',
    '熔岩爆': 'lava',
    '电孢群': 'spark_spore_swarm',
    '疫咒': 'plague_curse',
    '疾光束': 'rapid_beam',
    '疾枪': 'rapid_lance',
    '白晕': 'white_halo',
    '相位束': 'phase_beam',
    '眩光焰': 'dazzle_flame',
    '砂暴': 'sandstorm',
    '破冰锤': 'icebreaker_hammer',
    '破片核': 'shrapnel_core',
    '避雷针': 'mag_rail',
    '离子束': 'ion_beam',
    '等离火链': 'plasma_chain',
    '虚空射线': 'void_beam',
    '虚雷': 'void_thunder',
    '血孢群': 'blood_spore_swarm',
    '血影': 'blood_wraith',
    '血束': 'blood_beam',
    '血槌': 'blood_hammer',
    '血焰': 'blood_flame',
    '圣愈': 'holy_heal',
    '血震': 'blood_quake',
    '裂地锤': 'rift_hammer',
    '裂风群': 'split_wind_swarm',
    '暗蚀地带': 'cursed_stone',
    '轨道束': 'rail_beam',
    '迅吸': 'swift_leech',
    '酸束': 'acid_beam',
    '闪光弹': 'crystal_glow',
    '闪耀电弧': 'radiant_arc',
    '闪袭': 'flash_strike',
    '雷震': 'thunder_grit',
    '震荡束': 'ley_beam',
    '霜灵': 'frost_wraith',
    '怨灵': 'frost_corrosion',
    '鬼火': 'ghost_fire',
    '手里剑': 'dark_steel'
};

const REQUIRED_COLUMNS = [
    '材料A_ID', '材料A_名称',
    '材料B_ID', '材料B_名称',
    '进化武器_ID', '进化武器_名称',
    '进化武器_特殊效果', '状态'
];

const OPTIONAL_FIELDS = [
    'burnDuration', 'burnDamagePerFrame', 'burnColor',
    'freezeChance', 'freezeDuration', 'vulnerability',
    'lifeStealChance', 'lifeStealAmount',
    'poisonDuration', 'poisonDamagePerStack',
    'chainCount', 'chainRange', 'chainCooldown',
    'blindChance', 'blindDuration',
    'aoeRadius', 'aoeDamage',
    'rayRange', 'rayLength', 'rayWidth',
    'canSplit', 'splitCount', 'splitRange',
    'explosionRadius', 'explosionDamage',
    'overgrowthDuration', 'overgrowthTriggerStacks',
    'overgrowthExplosionRadius', 'overgrowthExplosionMultiplier'
];

function stripBom(value) {
    return value.startsWith('\ufeff') ? value.slice(1) : value;
}

function parseCsvLine(line) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            const next = line[i + 1];
            if (inQuotes && next === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            out.push(cur);
            cur = '';
        } else {
            cur += ch;
        }
    }
    out.push(cur);
    return out;
}

function parseCsv(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
        throw new Error('CSV is empty.');
    }
    const header = parseCsvLine(stripBom(lines[0]));
    const rows = lines.slice(1).map(parseCsvLine).map(row => {
        while (row.length < header.length) {
            row.push('');
        }
        return row;
    });
    return { header, rows };
}

function buildColumnIndex(header) {
    const index = new Map(header.map((name, i) => [name, i]));
    for (const key of REQUIRED_COLUMNS) {
        if (!index.has(key)) {
            throw new Error(`Missing column: ${key}`);
        }
    }
    return index;
}

function buildExistingMaps(fusionTable) {
    const byResult = new Map();
    const byPair = new Map();
    for (const recipe of fusionTable) {
        if (!recipe) continue;
        if (recipe.result) byResult.set(recipe.result, recipe);
        if (Array.isArray(recipe.materials) && recipe.materials.length === 2) {
            const key = [...recipe.materials].sort().join('+');
            byPair.set(key, recipe);
        }
    }
    return { byResult, byPair };
}

function ensureUniqueNameMapping(nameToId, existingWeapons) {
    const values = Object.values(nameToId);
    const unique = new Set(values);
    if (unique.size !== values.length) {
        throw new Error('Duplicate IDs in NAME_TO_ID mapping.');
    }
}

function ensureResultId(nameToId, name) {
    const id = nameToId[name];
    if (!id) {
        throw new Error(`Missing english ID mapping for name: ${name}`);
    }
    return id;
}

function pickIcon(name, effects) {
    const text = `${name} ${effects}`;
    if (/[火焰炎燃烧]/.test(text)) return '🔥';
    if (/[冰霜雪冻结]/.test(text)) return '❄️';
    if (/[毒瘟疫中毒]/.test(text)) return '☠️';
    if (/[雷电闪链]/.test(text)) return '⚡';
    if (/[光耀日辉眩致盲]/.test(text)) return '✨';
    if (/[血吸血]/.test(text)) return '🩸';
    if (/[爆炸]/.test(text)) return '💥';
    if (/[岩石震]/.test(text)) return '🪨';
    if (/[影暗虚诅]/.test(text)) return '🌑';
    if (/[灵魂鬼幽]/.test(text)) return '👻';
    if (/[射线束矛]/.test(text)) return '🔦';
    if (/[裂孢群分裂]/.test(text)) return '🧬';
    if (/[穿透]/.test(text)) return '🗡️';
    return '✨';
}

function hexToRgb(hex) {
    const value = hex.replace('#', '').trim();
    if (value.length !== 6) return null;
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    return { r, g, b };
}

function rgbToHex({ r, g, b }) {
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function blendColor(aColor, bColor) {
    const a = hexToRgb(aColor || '#ffffff');
    const b = hexToRgb(bColor || '#ffffff');
    if (!a || !b) return aColor || bColor || '#ffffff';
    return rgbToHex({
        r: Math.round((a.r + b.r) / 2),
        g: Math.round((a.g + b.g) / 2),
        b: Math.round((a.b + b.b) / 2)
    });
}

function roundNumber(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function getWeaponById(weapons, id) {
    return Object.values(weapons).find(weapon => weapon.id === id) || null;
}

function applyIfMissing(target, key, value) {
    if (target[key] === undefined) {
        target[key] = value;
    }
}

function buildSuggestedWeaponDefinition(aWeapon, bWeapon, effects, name, id) {
    const has = (keyword) => effects.includes(keyword);
    const avg = (a, b) => (a + b) / 2;

    let damage = avg(aWeapon.damage, bWeapon.damage);
    let interval = Math.round(avg(aWeapon.interval, bWeapon.interval));
    let speed = roundNumber(avg(aWeapon.speed, bWeapon.speed), 2);
    let radius = Math.max(aWeapon.radius, bWeapon.radius);
    let lifetime = Math.max(aWeapon.lifetime, bWeapon.lifetime);
    let piercing = aWeapon.piercing || bWeapon.piercing || has('穿透');

    if (has('高速')) {
        speed = Math.max(aWeapon.speed, bWeapon.speed) + 2;
        interval = Math.max(10, Math.round(interval * 0.9));
    }

    if (has('高伤')) {
        damage = Math.max(aWeapon.damage, bWeapon.damage);
        interval = Math.max(aWeapon.interval, bWeapon.interval);
    }

    if (has('爆炸AOE') || has('圆形AOE') || has('射线AOE') || has('连锁闪电') || has('分裂子弹')) {
        radius = Math.max(radius, 12);
    }

    const def = {
        id,
        name,
        tier: WEAPON_TIER.EVOLUTION,
        damage: roundNumber(damage, 2),
        interval,
        speed: roundNumber(speed, 2),
        radius,
        color: blendColor(aWeapon.color, bWeapon.color),
        lifetime,
        piercing
    };

    if (has('燃烧')) {
        applyIfMissing(def, 'burnDuration', 300);
        applyIfMissing(def, 'burnDamagePerFrame', roundNumber(5 / 60, 6));
    }

    if (has('冻结')) {
        applyIfMissing(def, 'freezeChance', 0.3);
        applyIfMissing(def, 'freezeDuration', 120);
    }

    if (has('中毒')) {
        applyIfMissing(def, 'poisonDuration', 900);
        applyIfMissing(def, 'poisonDamagePerStack', roundNumber(3 / 60, 6));
    }

    if (has('致盲')) {
        applyIfMissing(def, 'blindChance', 0.5);
        applyIfMissing(def, 'blindDuration', 180);
    }

    if (has('易伤')) {
        applyIfMissing(def, 'vulnerability', 0.25);
    }

    if (has('吸血')) {
        applyIfMissing(def, 'lifeStealChance', 0.06);
        applyIfMissing(def, 'lifeStealAmount', 1);
    }

    if (has('连锁闪电')) {
        applyIfMissing(def, 'chainCount', 3);
        applyIfMissing(def, 'chainRange', 150);
        applyIfMissing(def, 'chainCooldown', 10);
    }

    if (has('爆炸AOE')) {
        applyIfMissing(def, 'explosionRadius', 100);
        applyIfMissing(def, 'explosionDamage', 2.0);
    }

    if (has('圆形AOE')) {
        applyIfMissing(def, 'aoeRadius', 80);
        applyIfMissing(def, 'aoeDamage', 0.8);
    }

    if (has('射线AOE')) {
        applyIfMissing(def, 'rayRange', 300);
        applyIfMissing(def, 'rayLength', 600);
        applyIfMissing(def, 'rayWidth', 10);
    }

    if (has('分裂子弹')) {
        applyIfMissing(def, 'canSplit', true);
        applyIfMissing(def, 'splitCount', 2);
        applyIfMissing(def, 'splitRange', 200);
    }

    return def;
}

function escapeString(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, '\\\'');
}

function formatFusionDraftModule(fusionDraft) {
    const lines = [];
    lines.push('// 自动生成：weapon_fusion_suggestions.csv -> WEAPON_EVOLUTION_TABLE 草案');
    lines.push('// 说明：result 为新武器 ID 时，请在 WEAPONS 中补充定义');
    lines.push('export const WEAPON_EVOLUTION_TABLE_DRAFT = [');
    for (const item of fusionDraft) {
        lines.push('    {');
        lines.push(`        id: '${escapeString(item.id)}',`);
        lines.push(`        name: '${escapeString(item.name)}',`);
        lines.push(`        materials: ['${item.materials[0]}', '${item.materials[1]}'],`);
        lines.push(`        result: '${escapeString(item.result)}',`);
        lines.push(`        description: '${escapeString(item.description)}',`);
        lines.push(`        tier: ${item.tier},`);
        lines.push(`        icon: '${escapeString(item.icon)}',`);
        lines.push(`        status: '${escapeString(item.status)}'`);
        lines.push('    },');
    }
    lines.push('];');
    return lines.join('\n');
}

function formatEvolutionDraftModule(evolutionDraft) {
    const lines = [];
    lines.push('// 自动生成：weapon_fusion_suggestions.csv -> Evolution 武器草案');
    lines.push('// 说明：status=建议 的条目是根据材料和效果的草案参数');
    lines.push('// 提示：tier 当前为数值 2，对应 WEAPON_TIER.EVOLUTION');
    lines.push('export const WEAPON_EVOLUTION_DRAFT = [');
    for (const weapon of evolutionDraft) {
        lines.push('    {');
        lines.push(`        id: '${escapeString(weapon.id)}',`);
        lines.push(`        name: '${escapeString(weapon.name)}',`);
        lines.push(`        tier: ${weapon.tier},`);
        lines.push(`        damage: ${weapon.damage},`);
        lines.push(`        interval: ${weapon.interval},`);
        lines.push(`        speed: ${weapon.speed},`);
        lines.push(`        radius: ${weapon.radius},`);
        lines.push(`        color: '${escapeString(weapon.color)}',`);
        lines.push(`        lifetime: ${weapon.lifetime},`);
        lines.push(`        piercing: ${weapon.piercing ? 'true' : 'false'},`);

        for (const field of OPTIONAL_FIELDS) {
            if (weapon[field] !== undefined) {
                const value = typeof weapon[field] === 'string' ? `'${escapeString(weapon[field])}'` : weapon[field];
                lines.push(`        ${field}: ${value},`);
            }
        }

        lines.push(`        effects: '${escapeString(weapon.effects)}',`);
        lines.push(`        sources: ['${weapon.sources[0]}', '${weapon.sources[1]}'],`);
        lines.push(`        status: '${escapeString(weapon.status)}'`);
        lines.push('    },');
    }
    lines.push('];');
    return lines.join('\n');
}

export function generateDraftsFromCsv({
    csvText,
    weapons = WEAPONS,
    fusionTable = WEAPON_EVOLUTION_TABLE,
    nameToId = NAME_TO_ID
}) {
    const { header, rows } = parseCsv(csvText);
    const columnIndex = buildColumnIndex(header);
    const { byResult, byPair } = buildExistingMaps(fusionTable);
    const weaponsArray = Object.values(weapons);

    ensureUniqueNameMapping(nameToId, weaponsArray);

    const fusionDraft = [];
    const evolutionDraft = new Map();

    for (const row of rows) {
        const aId = row[columnIndex.get('材料A_ID')]?.trim();
        const aName = row[columnIndex.get('材料A_名称')]?.trim();
        const bId = row[columnIndex.get('材料B_ID')]?.trim();
        const bName = row[columnIndex.get('材料B_名称')]?.trim();
        const csvResultId = row[columnIndex.get('进化武器_ID')]?.trim();
        const resultName = row[columnIndex.get('进化武器_名称')]?.trim();
        const resultEffects = row[columnIndex.get('进化武器_特殊效果')]?.trim();
        const csvStatus = row[columnIndex.get('状态')]?.trim();

        if (!aId || !bId) continue;

        const pairKey = [aId, bId].sort().join('+');
        const existing = byPair.get(pairKey) || (csvResultId ? byResult.get(csvResultId) : null);
        const materials = existing?.materials ?? [aId, bId].sort();

        const finalResultId = existing?.result || csvResultId || ensureResultId(nameToId, resultName);
        const finalName = existing?.name || resultName || `${aName}+${bName}`;
        const finalEffects = resultEffects || '';
        const finalDesc = existing?.description || `由${aName}与${bName}融合而成，效果：${finalEffects}`;
        const finalIcon = existing?.icon || pickIcon(finalName, finalEffects);
        const status = existing ? '现有' : (csvStatus || '建议');

        const fusionId = existing?.id || `fusion_${materials.join('_')}`;

        fusionDraft.push({
            id: fusionId,
            name: finalName,
            materials,
            result: finalResultId,
            description: finalDesc,
            tier: existing?.tier ?? 1,
            icon: finalIcon,
            status
        });

        if (!evolutionDraft.has(finalResultId)) {
            const existingWeapon = getWeaponById(weapons, finalResultId);
            if (existingWeapon) {
                evolutionDraft.set(finalResultId, {
                    ...existingWeapon,
                    effects: finalEffects,
                    sources: materials,
                    status: '现有'
                });
            } else {
                const aWeapon = getWeaponById(weapons, aId);
                const bWeapon = getWeaponById(weapons, bId);
                if (!aWeapon || !bWeapon) {
                    throw new Error(`Missing material definition for ${aId} or ${bId}`);
                }
                const definition = buildSuggestedWeaponDefinition(
                    aWeapon,
                    bWeapon,
                    finalEffects,
                    finalName,
                    finalResultId
                );
                evolutionDraft.set(finalResultId, {
                    ...definition,
                    effects: finalEffects,
                    sources: materials,
                    status: '建议'
                });
            }
        }
    }

    return {
        fusionDraft,
        evolutionDraft: Array.from(evolutionDraft.values())
    };
}

export function generateDraftFiles({
    csvPath = 'weapon_fusion_suggestions.csv',
    fusionOutPath = 'WEAPON_EVOLUTION_TABLE_DRAFT.js',
    evolutionOutPath = 'weapon_evolution_draft.js',
    weapons = WEAPONS,
    fusionTable = WEAPON_EVOLUTION_TABLE,
    nameToId = NAME_TO_ID
} = {}) {
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const { fusionDraft, evolutionDraft } = generateDraftsFromCsv({
        csvText,
        weapons,
        fusionTable,
        nameToId
    });

    fs.writeFileSync(fusionOutPath, formatFusionDraftModule(fusionDraft), 'utf8');
    fs.writeFileSync(evolutionOutPath, formatEvolutionDraftModule(evolutionDraft), 'utf8');

    return {
        fusionCount: fusionDraft.length,
        evolutionCount: evolutionDraft.length
    };
}
