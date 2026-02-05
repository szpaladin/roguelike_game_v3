import { WEAPONS, WEAPON_EVOLUTION_TABLE } from '../../js/weapons/WeaponsData.js';
import { generateDraftsFromCsv } from '../../tools/weapon-draft-generator.js';

const CSV_TEXT = `组合,材料A_ID,材料A_名称,材料A_参数,材料A_特殊效果,材料B_ID,材料B_名称,材料B_参数,材料B_特殊效果,进化武器_ID,进化武器_名称,进化武器_参数,进化武器_特殊效果,状态,备注
fire+swift,fire,火焰,,,swift,疾风,,,inferno,炼狱,,穿透 + 燃烧DOT,现有,
cell+poison,cell,细胞,,,poison,剧毒,,,plague,瘟疫,,瘟疫扩散 + 持续DOT,现有,`;

describe('weapon draft generator', () => {
    test('keeps existing evolution IDs for known recipes', () => {
        const { fusionDraft } = generateDraftsFromCsv({
            csvText: CSV_TEXT,
            weapons: WEAPONS,
            fusionTable: WEAPON_EVOLUTION_TABLE
        });

        const inferno = fusionDraft.find(entry => entry.result === 'inferno');
        expect(inferno).toBeDefined();
        expect(inferno.status).toBe('现有');
    });

    test('uses existing recipe when evolution already defined and keeps key properties', () => {
        const { fusionDraft, evolutionDraft } = generateDraftsFromCsv({
            csvText: CSV_TEXT,
            weapons: WEAPONS,
            fusionTable: WEAPON_EVOLUTION_TABLE
        });

        const expectedId = 'plague';
        const fusion = fusionDraft.find(entry => entry.name === '瘟疫');
        expect(fusion).toBeDefined();
        expect(fusion.result).toBe(expectedId);
        expect(fusion.status).toBe('现有');

        const evolution = evolutionDraft.find(entry => entry.id === expectedId);
        expect(evolution).toBeDefined();
        expect(evolution.plagueDuration).toBe(600);
        expect(evolution.plagueCloudRadius).toBe(140);
        expect(evolution.status).toBe('现有');
    });
});