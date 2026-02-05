import UpgradeUI from '../../js/ui/UpgradeUI.js';
import { WEAPONS, WEAPON_TIER } from '../../js/weapons/WeaponsData.js';

describe('UpgradeUI', () => {
    let ui;

    beforeEach(() => {
        // Mock DOM elements
        document.getElementById = (id) => {
            if (id === 'upgrade-overlay') {
                return { style: { display: 'none' } };
            }
            if (id === 'upgrade-title') {
                return { textContent: '' };
            }
            if (id === 'upgrade-options') {
                return {
                    innerHTML: '',
                    appendChild: () => { }
                };
            }
            return null;
        };
        ui = new UpgradeUI();
    });

    describe('撤离选项', () => {
        test('createEvacuationCard 应该创建撤离卡片', () => {
            const card = ui.createEvacuationCard(true);
            expect(card).toBeDefined();
            expect(card.className).toContain('upgrade-card');
        });

        test('有能源时撤离卡片应该可点击', () => {
            const card = ui.createEvacuationCard(true);
            expect(card.classList.contains('disabled')).toBe(false);
        });

        test('无能源时撤离卡片应该禁用', () => {
            const card = ui.createEvacuationCard(false);
            expect(card.classList.contains('disabled')).toBe(true);
        });

        test('selectEvacuation 应该触发回调', () => {
            let callbackCalled = false;
            ui.setEvacuationCallback(() => {
                callbackCalled = true;
            });
            ui.player = { stats: { skillPoints: 2 } };

            ui.selectEvacuation();

            expect(callbackCalled).toBe(true);
        });

        test('selectEvacuation 应该消耗1能源', () => {
            ui.setEvacuationCallback(() => { });
            ui.player = { stats: { skillPoints: 2 } };

            ui.selectEvacuation();

            expect(ui.player.stats.skillPoints).toBe(1);
        });

        test('无能源时selectEvacuation不应触发回调', () => {
            let callbackCalled = false;
            ui.setEvacuationCallback(() => {
                callbackCalled = true;
            });
            ui.player = { stats: { skillPoints: 0 } };

            ui.selectEvacuation();

            expect(callbackCalled).toBe(false);
        });
    });
    test('basic weapon pool includes all basic weapons', () => {
        const poolIds = ui.getBasicWeaponPool().map(weapon => weapon.id);
        const expectedIds = Object.values(WEAPONS)
            .filter(weapon => weapon.tier === WEAPON_TIER.BASIC)
            .map(weapon => weapon.id);

        expectedIds.forEach(id => expect(poolIds).toContain(id));
    });
});
