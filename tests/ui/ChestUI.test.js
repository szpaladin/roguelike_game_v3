import ChestUI from '../../js/ui/ChestUI.js';
import { WEAPON_ID_MAP } from '../../js/weapons/WeaponsData.js';

describe('ChestUI', () => {
    let ui;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="chest-menu" style="display:none;">
                <div id="chest-options"></div>
            </div>
            <div id="fusion-overlay" style="display:none;">
                <div id="fusion-title"></div>
                <button id="fusion-back-btn"></button>
                <div id="fusion-options"></div>
                <button id="fusion-confirm-btn"></button>
            </div>
        `;
        ui = new ChestUI();
    });

    test('showChestMenu renders evolution/fusion/gold order', () => {
        const evolutions = [
            { name: '燃霜', result: 'frostfire', materials: ['fire', 'frost'] }
        ];
        const fusionWeapons = [
            { def: { id: 'fire', name: '火焰' } },
            { def: { id: 'frost', name: '冰霜' } }
        ];

        ui.showChestMenu(evolutions, fusionWeapons, null, 90, () => { });

        const menu = document.getElementById('chest-menu');
        expect(menu.style.display).toBe('flex');

        const cards = document.querySelectorAll('#chest-options .reward-card');
        expect(cards.length).toBe(3);
        expect(cards[0].dataset.rewardType).toBe('evolution');
        expect(cards[1].dataset.rewardType).toBe('fusion');
        const last = cards[cards.length - 1];
        expect(last.dataset.rewardType).toBe('gold');
    });

    test('handleEscape on menu defaults to gold', () => {
        let selected = null;
        ui.showChestMenu([], [], null, 88, (selection) => {
            selected = selection;
        });

        const handled = ui.handleEscape();
        expect(handled).toBe(true);
        expect(selected).toEqual({ type: 'gold', amount: 88 });

        const menu = document.getElementById('chest-menu');
        expect(menu.style.display).toBe('none');
    });

    test('handleEscape in fusion view returns to menu', () => {
        const fusionWeapons = [
            { def: { id: 'fire', name: '火焰' } },
            { def: { id: 'frost', name: '冰霜' } }
        ];
        ui.showChestMenu([], fusionWeapons, null, 50, () => { });

        const fusionEntry = document.querySelector('.reward-card[data-reward-type="fusion"]');
        fusionEntry.click();

        const overlay = document.getElementById('fusion-overlay');
        expect(overlay.style.display).toBe('flex');

        const handled = ui.handleEscape();
        expect(handled).toBe(true);
        expect(overlay.style.display).toBe('none');

        const menu = document.getElementById('chest-menu');
        expect(menu.style.display).toBe('flex');
    });

    test('fusion confirm emits sorted weapon ids', () => {
        let selected = null;
        const fusionWeapons = [
            { def: { id: 'frost', name: '冰霜' } },
            { def: { id: 'fire', name: '火焰' } }
        ];
        ui.showChestMenu([], fusionWeapons, null, 0, (selection) => {
            selected = selection;
        });

        const fusionEntry = document.querySelector('.reward-card[data-reward-type="fusion"]');
        fusionEntry.click();

        const weaponCards = document.querySelectorAll('.fusion-select-card');
        weaponCards[0].click();
        weaponCards[1].click();

        const confirmBtn = document.getElementById('fusion-confirm-btn');
        confirmBtn.click();

        const orderMap = {};
        Object.values(WEAPON_ID_MAP).forEach((info) => {
            orderMap[info.id] = info.order ?? 9999;
        });
        const expected = ['fire', 'frost'].sort((a, b) => {
            const orderA = orderMap[a] ?? 9999;
            const orderB = orderMap[b] ?? 9999;
            if (orderA !== orderB) return orderA - orderB;
            return a.localeCompare(b);
        });

        expect(selected.type).toBe('fusion');
        expect(selected.weaponIds).toEqual(expected);
    });
});
