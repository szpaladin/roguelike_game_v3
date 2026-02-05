import { buildFusionDefinition, getAvailableWeaponFusions } from '../../js/weapons/FusionSystem.js';
import { WEAPON_TIER } from '../../js/weapons/WeaponsData.js';

describe('FusionSystem', () => {
    test('getAvailableWeaponFusions filters invalid recipes', () => {
        const weapons = [
            { def: { id: 'fire' } },
            { def: { id: 'frost' } }
        ];
        const recipes = [
            { id: 'fusion_fire_frost', materials: ['fire', 'frost'] },
            { id: 'fusion_fire_fire', materials: ['fire', 'fire'] }
        ];

        const available = getAvailableWeaponFusions(weapons, recipes);
        expect(available.map(r => r.id)).toEqual(['fusion_fire_frost']);
    });

    test('buildFusionDefinition merges core stats and effects', () => {
        const defA = {
            id: 'a',
            name: 'A',
            damage: 1,
            interval: 30,
            speed: 6,
            radius: 4,
            lifetime: 100,
            aoeRadius: 60,
            aoeDamage: 0.5,
            rayRange: 200,
            rayLength: 300,
            rayWidth: 8,
            chainCount: 2,
            chainRange: 120,
            chainCooldown: 20,
            burnDuration: 120,
            burnDamagePerFrame: 0.1,
            freezeChance: 0.2,
            freezeDuration: 60,
            terrainOnHit: {
                type: 'ridge',
                length: 80,
                width: 10,
                duration: 100,
                slowAmount: 0.3,
                slowDuration: 90
            }
        };
        const defB = {
            id: 'b',
            name: 'B',
            damage: 2,
            interval: 20,
            speed: 8,
            radius: 6,
            lifetime: 140,
            aoeRadius: 30,
            aoeDamage: 0.9,
            rayRange: 300,
            rayLength: 500,
            rayWidth: 12,
            chainCount: 1,
            chainRange: 80,
            chainCooldown: 10,
            burnDuration: 200,
            burnDamagePerFrame: 0.2,
            freezeChance: 0.5,
            freezeDuration: 120,
            spawnMode: 'sky_drop',
            terrainOnHit: {
                type: 'ridge',
                length: 100,
                width: 20,
                duration: 120,
                slowAmount: 0.2,
                slowDuration: 120
            }
        };

        const fused = buildFusionDefinition(defA, defB, { id: 'fusion_a_b' });

        expect(fused.tier).toBe(WEAPON_TIER.FUSION);
        expect(fused.isFusion).toBe(true);
        expect(fused.interval).toBe(20);
        expect(fused.damage).toBe(2);
        expect(fused.speed).toBe(8);
        expect(fused.radius).toBe(6);
        expect(fused.lifetime).toBe(140);
        expect(fused.aoeRadius).toBe(60 + 0.5 * 30);
        expect(fused.aoeDamage).toBe(0.9);
        expect(fused.rayRange).toBe(300 + 0.5 * 200);
        expect(fused.rayLength).toBe(500 + 0.5 * 300);
        expect(fused.rayWidth).toBe(12 + 0.5 * 8);
        expect(fused.chainCount).toBe(2);
        expect(fused.chainRange).toBe(120 + 0.5 * 80);
        expect(fused.chainCooldown).toBe(10);
        expect(fused.burnDuration).toBe(200);
        expect(fused.burnDamagePerFrame).toBeCloseTo(0.3, 5);
        expect(fused.freezeChance).toBe(0.5);
        expect(fused.freezeDuration).toBe(120);
        expect(fused.spawnMode).toBe('sky_drop');
        expect(fused.terrainOnHit.length).toBe(100 + 0.5 * 80);
        expect(fused.terrainOnHit.width).toBe(20 + 0.5 * 10);
        expect(fused.terrainOnHit.duration).toBe(120);
        expect(fused.terrainOnHit.slowAmount).toBeCloseTo(0.5, 5);
        expect(fused.terrainOnHit.slowDuration).toBe(120);
    });

    test('buildFusionDefinition merges dark flame fields', () => {
        const defA = {
            id: 'a',
            name: 'A',
            darkFlameDuration: 600,
            darkFlameDamagePerFrame: 0.02,
            darkFlameSpreadInterval: 60,
            darkFlameContactPadding: 4,
            darkFlameColor: '#111111'
        };
        const defB = {
            id: 'b',
            name: 'B',
            darkFlameDuration: 900,
            darkFlameDamagePerFrame: 0.04,
            darkFlameSpreadInterval: 40,
            darkFlameContactPadding: 10,
            darkFlameColor: '#222222'
        };

        const fused = buildFusionDefinition(defA, defB, { id: 'fusion_a_b' });

        expect(fused.darkFlameDuration).toBe(900);
        expect(fused.darkFlameDamagePerFrame).toBeCloseTo(0.06, 5);
        expect(fused.darkFlameSpreadInterval).toBe(40);
        expect(fused.darkFlameContactPadding).toBe(10);
        expect(fused.darkFlameColor).toBe('#111111');
    });

    test('buildFusionDefinition merges abyss sacrifice fields', () => {
        const defA = {
            id: 'a',
            name: 'A',
            abyssSacrificeDuration: 300,
            abyssSacrificeHeal: 1
        };
        const defB = {
            id: 'b',
            name: 'B',
            abyssSacrificeDuration: 600,
            abyssSacrificeHeal: 2
        };

        const fused = buildFusionDefinition(defA, defB, { id: 'fusion_a_b' });

        expect(fused.abyssSacrificeDuration).toBe(600);
        expect(fused.abyssSacrificeHeal).toBe(2);
    });
});
