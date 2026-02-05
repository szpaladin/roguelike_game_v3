import EvolutionSystem, { executeEvolution } from '../../js/weapons/EvolutionSystem.js';
import WeaponSystem from '../../js/weapons/WeaponSystem.js';
import { WEAPONS, WEAPON_EVOLUTION_TABLE } from '../../js/weapons/WeaponsData.js';

describe('EvolutionSystem', () => {
    let system;
    let playerWeapons;

    beforeEach(() => {
        system = new EvolutionSystem();
        playerWeapons = [
            { def: WEAPONS.FIRE, name: '火焰', cooldown: 0 },
            { def: WEAPONS.SWIFT, name: '疾风', cooldown: 0 }
        ];
    });

    test('getAvailableEvolutions returns matching recipes', () => {
        const available = system.getAvailableEvolutions(playerWeapons);
        expect(available.length).toBe(1);
        expect(available[0].result).toBe('inferno');
    });

    test('evolveWeapon successfully transforms weapons', () => {
        const result = system.evolveWeapon(playerWeapons, 'inferno');
        expect(result.success).toBe(true);
        expect(playerWeapons.length).toBe(1);
        expect(playerWeapons[0].def.id).toBe('inferno');
    });

    test('evolveWeapon fails if recipe not found or materials missing', () => {
        const result = system.evolveWeapon(playerWeapons, 'non_existent');
        expect(result.success).toBe(false);
    });

    test('executeEvolution uses weapon system to add evolution', () => {
        const weaponSystem = new WeaponSystem();
        weaponSystem.addWeapon(WEAPONS.FIRE);
        weaponSystem.addWeapon(WEAPONS.SWIFT);
        const recipe = WEAPON_EVOLUTION_TABLE.find(r => r.result === 'inferno');

        const result = executeEvolution(weaponSystem, recipe);
        expect(result.success).toBe(true);
        const ids = weaponSystem.getWeapons().map(w => w.def.id);
        expect(ids).toContain('inferno');
    });
});