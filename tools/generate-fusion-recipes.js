import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFusionSignatureCandidates, buildFusionSignature } from '../js/weapons/FusionSignature.js';

export function getFusionCandidates() {
    return getFusionSignatureCandidates();
}

export function buildFusionRecipes(candidates = getFusionCandidates()) {
    const recipes = [];
    for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
            const a = candidates[i];
            const b = candidates[j];
            recipes.push({
                id: `fusion_${a.id}_${b.id}`,
                materials: [a.id, b.id],
                name: `${a.name} × ${b.name}`,
                status: '自动',
                icon: '🔗'
            });
        }
    }
    const signature = buildFusionSignature(candidates);
    return { recipes, candidates, signature };
}

export function generateFusionRecipes(outputPath = null) {
    const { recipes, signature } = buildFusionRecipes();
    const lines = [
        '// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.',
        '// Run `node tools/generate-fusion-recipes.js` to regenerate.',
        '',
        `export const FUSION_SOURCE_SIGNATURE = ${JSON.stringify(signature)};`,
        '',
        'export const WEAPON_FUSION_RECIPES = [',
        ...recipes.map((recipe) => {
            const materials = recipe.materials.map(id => `'${id}'`).join(', ');
            return `    { id: '${recipe.id}', materials: [${materials}], name: '${recipe.name}', status: '${recipe.status}', icon: '${recipe.icon}' },`;
        }),
        '];',
        ''
    ];

    const output = outputPath || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../js/weapons/FusionRecipes.js');
    fs.writeFileSync(output, lines.join('\n'), 'utf8');
    return { output, count: recipes.length };
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedFile && path.resolve(currentFile) === invokedFile) {
    const result = generateFusionRecipes();
    console.log(`Generated ${result.count} fusion recipes at ${result.output}`);
}
