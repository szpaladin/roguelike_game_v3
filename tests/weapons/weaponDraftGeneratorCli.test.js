import fs from 'fs';
import os from 'os';
import path from 'path';
import { runDraftGeneration } from '../../tools/generate-weapon-drafts.js';

const CSV_TEXT = `组合,材料A_ID,材料A_名称,材料A_参数,材料A_特殊效果,材料B_ID,材料B_名称,材料B_参数,材料B_特殊效果,进化武器_ID,进化武器_名称,进化武器_参数,进化武器_特殊效果,状态,备注
fire+swift,fire,火焰,,,swift,疾风,,,inferno,炼狱,,穿透 + 燃烧DOT,现有,
cell+dark,cell,细胞,,,dark,黑暗,,,,暗孢群,,分裂子弹 + 易伤,建议,`;

describe('weapon draft CLI', () => {
    test('writes fusion/evolution draft files from csv', () => {
        const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'weapon-drafts-'));
        const csvPath = path.join(workdir, 'weapon_fusion_suggestions.csv');
        const fusionOutPath = path.join(workdir, 'WEAPON_EVOLUTION_TABLE_DRAFT.js');
        const evolutionOutPath = path.join(workdir, 'weapon_evolution_draft.js');

        try {
            fs.writeFileSync(csvPath, CSV_TEXT, 'utf8');

            const result = runDraftGeneration({
                csvPath,
                fusionOutPath,
                evolutionOutPath
            });

            expect(result.fusionCount).toBeGreaterThan(0);
            expect(result.evolutionCount).toBeGreaterThan(0);
            expect(fs.existsSync(fusionOutPath)).toBe(true);
            expect(fs.existsSync(evolutionOutPath)).toBe(true);
            expect(fs.readFileSync(fusionOutPath, 'utf8')).toContain('WEAPON_EVOLUTION_TABLE_DRAFT');
            expect(fs.readFileSync(evolutionOutPath, 'utf8')).toContain('WEAPON_EVOLUTION_DRAFT');
        } finally {
            fs.rmSync(workdir, { recursive: true, force: true });
        }
    });
});
