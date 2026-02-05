import ChestManager from '../../js/chest/ChestManager.js';
import { WEAPONS } from '../../js/weapons/WeaponsData.js';
import { jest } from '@jest/globals';

// Mock ChestUI
const mockChestUI = {
    showChestMenu: jest.fn(),
    close: jest.fn()
};

describe('ChestManager - Weapon Fusion', () => {
    let chestManager;

    beforeEach(() => {
        chestManager = new ChestManager(mockChestUI);
        jest.clearAllMocks();
    });

    describe('openChest with fusion options', () => {
        test('shows evolution, fusion options and gold reward', () => {
            // Player has Fire + Frost = can make Frostfire
            const mockPlayer = {
                weaponSystem: {
                    weapons: [
                        { def: WEAPONS.FIRE },
                        { def: WEAPONS.FROST }
                    ],
                    getWeapons: function () { return this.weapons; }
                },
                stats: {
                    addGold: jest.fn()
                }
            };
            const mockChest = { x: 100, y: 200, interactionCooldown: 0 };
            const mockRisk = { getCurrentZone: () => ({ name: 'Unknown' }) };
            const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

            chestManager.openChest(mockChest, mockPlayer, {
                distanceMeters: 350,
                riskSystem: mockRisk,
                onComplete: () => { }
            });

            // Should call showChestMenu with evolution list, fusion weapon list, and gold
            expect(mockChestUI.showChestMenu).toHaveBeenCalled();
            const evolutions = mockChestUI.showChestMenu.mock.calls[0][0];
            const fusionWeapons = mockChestUI.showChestMenu.mock.calls[0][1];
            const goldReward = mockChestUI.showChestMenu.mock.calls[0][3];
            expect(evolutions.some(r => r.result === 'frostfire')).toBe(true);
            expect(fusionWeapons.map(w => w.def.id)).toEqual(expect.arrayContaining(['fire', 'frost']));
            expect(goldReward).toBe(75);
            randomSpy.mockRestore();
        });

        test('shows gold option when no evolution or fusion options available', () => {
            // Player has only one weapon, cannot fuse
            const mockPlayer = {
                weaponSystem: {
                    weapons: [
                        { def: WEAPONS.FIRE }
                    ],
                    getWeapons: function () { return this.weapons; }
                },
                stats: {
                    gold: 0,
                    addGold: jest.fn(function (amount) { this.gold += amount; })
                }
            };
            const mockChest = { x: 100, y: 200, interactionCooldown: 0 };
            const mockOnComplete = jest.fn();
            const mockRisk = { getCurrentZone: () => ({ name: 'Unknown' }) };
            const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

            chestManager.chests.push(mockChest);
            mockChestUI.showChestMenu.mockImplementation((evolutions, fusionWeapons, artifactReward, goldReward, callback) => {
                callback({ type: 'gold', amount: goldReward });
            });

            chestManager.openChest(mockChest, mockPlayer, {
                distanceMeters: 0,
                riskSystem: mockRisk,
                onComplete: mockOnComplete
            });

            // Should show choices and award gold
            expect(mockChestUI.showChestMenu).toHaveBeenCalled();
            expect(mockPlayer.stats.addGold).toHaveBeenCalledWith(75);
            expect(mockChestManagerHasChest(chestManager, mockChest)).toBe(false);
            expect(mockOnComplete).toHaveBeenCalled();
            randomSpy.mockRestore();
        });

        test('performs evolution when player selects an evolution recipe', () => {
            const mockPlayer = {
                weaponSystem: {
                    weapons: [
                        { def: WEAPONS.FIRE, name: 'Fire', color: '#ff6600', cooldown: 0 },
                        { def: WEAPONS.FROST, name: 'Frost', color: '#00ccff', cooldown: 0 }
                    ],
                    getWeapons: function () { return this.weapons; },
                    setWeapons: function (w) { this.weapons = w; },
                    removeWeapon: function (id) {
                        this.weapons = this.weapons.filter(w => w.def.id !== id);
                    },
                    addWeapon: function (def) {
                        this.weapons.push({ def, name: def.name, color: def.color, cooldown: 0 });
                    }
                },
                stats: {
                    addGold: jest.fn()
                }
            };
            const mockChest = { x: 100, y: 200, interactionCooldown: 0 };
            const mockRisk = { getCurrentZone: () => ({ name: 'Unknown' }) };

            // Mock showChestMenu to immediately call callback with frostfire evolution
            mockChestUI.showChestMenu.mockImplementation((evolutions, fusionWeapons, artifactReward, goldReward, callback) => {
                const frostfireRecipe = evolutions.find(r => r.result === 'frostfire');
                callback({ type: 'evolution', recipe: frostfireRecipe });
            });

            chestManager.openChest(mockChest, mockPlayer, {
                distanceMeters: 0,
                riskSystem: mockRisk,
                onComplete: () => { }
            });

            // After evolution: Fire + Frost removed, Frostfire added
            expect(mockPlayer.weaponSystem.weapons.length).toBe(1);
            expect(mockPlayer.weaponSystem.weapons[0].def.id).toBe('frostfire');
        });

        test('performs fusion when player selects a fusion pair', () => {
            const mockPlayer = {
                weaponSystem: {
                    weapons: [
                        { def: WEAPONS.FIRE, name: 'Fire', color: '#ff6600', cooldown: 0 },
                        { def: WEAPONS.FROST, name: 'Frost', color: '#00ccff', cooldown: 0 }
                    ],
                    getWeapons: function () { return this.weapons; },
                    removeWeapon: function (id) {
                        this.weapons = this.weapons.filter(w => w.def.id !== id);
                    },
                    addWeapon: function (def) {
                        this.weapons.push({ def, name: def.name, color: def.color, cooldown: 0 });
                    }
                },
                stats: {
                    addGold: jest.fn()
                }
            };
            const mockChest = { x: 100, y: 200, interactionCooldown: 0 };
            const mockRisk = { getCurrentZone: () => ({ name: 'Unknown' }) };

            mockChestUI.showChestMenu.mockImplementation((evolutions, fusionWeapons, artifactReward, goldReward, callback) => {
                callback({ type: 'fusion', weaponIds: ['frost', 'fire'] });
            });

            chestManager.openChest(mockChest, mockPlayer, {
                distanceMeters: 0,
                riskSystem: mockRisk,
                onComplete: () => { }
            });

            expect(mockPlayer.weaponSystem.weapons.length).toBe(1);
            expect(mockPlayer.weaponSystem.weapons[0].def.isFusion).toBe(true);
        });
    });
});

function mockChestManagerHasChest(chestManager, chest) {
    return chestManager.chests.includes(chest);
}
