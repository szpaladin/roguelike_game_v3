import { buildFusionRecipes, getFusionCandidates } from '../../tools/generate-fusion-recipes.js';
import { WEAPONS } from '../../js/weapons/WeaponsData.js';

describe('fusion recipe generator', () => {
    test('buildFusionRecipes generates all pair combinations', () => {
        const nameById = {};
        Object.values(WEAPONS).forEach((def) => {
            if (def && def.id) nameById[def.id] = def.name;
        });

        const candidates = getFusionCandidates();
        const { recipes, signature } = buildFusionRecipes(candidates);

        const expectedCount = (candidates.length * (candidates.length - 1)) / 2;
        expect(recipes.length).toBe(expectedCount);

        const ids = new Set();
        for (const recipe of recipes) {
            expect(recipe.materials.length).toBe(2);
            const [a, b] = recipe.materials;
            expect(a).not.toBe(b);
            expect(recipe.id).toBe(`fusion_${a}_${b}`);
            expect(recipe.name).toBe(`${nameById[a]} × ${nameById[b]}`);
            ids.add(recipe.id);
        }
        expect(ids.size).toBe(recipes.length);
        expect(signature.count).toBe(candidates.length);
        expect(signature.hash).toMatch(/^djb2-/);
    });
});
