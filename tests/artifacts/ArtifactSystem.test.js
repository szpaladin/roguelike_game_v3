import ArtifactSystem from '../../js/artifacts/ArtifactSystem.js';

describe('ArtifactSystem', () => {
    test('addArtifact respects max slots', () => {
        const system = new ArtifactSystem();
        system.setMaxSlots(2);

        expect(system.addArtifact('deep_sea_echo').success).toBe(true);
        expect(system.addArtifact('deep_sea_echo').success).toBe(true);
        expect(system.addArtifact('decompression_shell').success).toBe(false);
    });

    test('reheat device toggles damage multiplier', () => {
        const system = new ArtifactSystem();
        system.setArtifacts(['reheat_device']);

        expect(system.getDamageMultiplier()).toBeCloseTo(0.95, 5);
        system.onEnemyKilled();
        expect(system.getDamageMultiplier()).toBeCloseTo(1.2, 5);
    });

    test('corrosion imprint adjusts DOT multipliers', () => {
        const system = new ArtifactSystem();
        system.setArtifacts(['corrosion_imprint']);

        const mods = system.getStatusModifiers();
        expect(mods.dotDurationMultiplier).toBeCloseTo(1.25, 5);
        expect(mods.dotDamageMultiplier).toBeCloseTo(0.9, 5);
    });
});
