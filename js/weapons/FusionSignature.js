import { WEAPONS, WEAPON_ID_MAP, WEAPON_TIER } from './WeaponsData.js';

function hashDjb2(value) {
    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) + hash) + value.charCodeAt(i);
        hash >>>= 0;
    }
    return `djb2-${hash.toString(16)}`;
}

export function getFusionSignatureCandidates() {
    const orderMap = {};
    Object.values(WEAPON_ID_MAP || {}).forEach((info) => {
        if (info && info.id) orderMap[info.id] = info.order ?? 9999;
    });

    return Object.values(WEAPONS)
        .filter((def) => {
            if (!def || !def.id) return false;
            if (def.isFusion || def.tier === WEAPON_TIER.FUSION) return false;
            return def.tier === WEAPON_TIER.BASIC || def.tier === WEAPON_TIER.EVOLUTION;
        })
        .map((def) => ({
            id: def.id,
            name: def.name || def.id,
            tier: def.tier,
            order: orderMap[def.id] ?? 9999
        }))
        .sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.id.localeCompare(b.id);
        });
}

export function buildFusionSignature(candidates = getFusionSignatureCandidates()) {
    const signature = candidates
        .map((item) => `${item.id}|${item.name}|${item.tier}|${item.order}`)
        .join(';');
    return {
        hash: hashDjb2(signature),
        count: candidates.length
    };
}
