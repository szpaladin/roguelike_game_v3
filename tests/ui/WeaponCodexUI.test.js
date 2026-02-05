import WeaponCodexUI from '../../js/ui/WeaponCodexUI.js';

describe('WeaponCodexUI', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="panel weapon-panel">
                <h2>角色武器</h2>
            </div>
        `;
    });

    test('injects a codex button into weapon panel header', () => {
        const ui = new WeaponCodexUI();
        ui.init();

        const btn = document.querySelector('.weapon-panel .codex-open-btn');
        expect(btn).not.toBeNull();
        expect(btn.textContent).toBe('图鉴');
    });

    test('open/escape closes overlays and restores pause state', () => {
        let paused = false;
        const ui = new WeaponCodexUI({
            getPaused: () => paused,
            setPaused: (v) => { paused = v; },
            isBlocked: () => false
        });
        ui.init();

        ui.open();
        expect(ui.isOpen()).toBe(true);
        expect(paused).toBe(true);

        // Open a detail view for any weapon id present in the list.
        const firstCard = document.querySelector('#codex-overlay [data-weapon-id]');
        expect(firstCard).not.toBeNull();
        const weaponId = firstCard.getAttribute('data-weapon-id');
        ui.openDetail(weaponId);
        expect(ui.isDetailOpen()).toBe(true);

        // First escape closes detail only.
        expect(ui.handleEscape()).toBe(true);
        expect(ui.isDetailOpen()).toBe(false);
        expect(ui.isOpen()).toBe(true);
        expect(paused).toBe(true);

        // Second escape closes list and restores pause.
        expect(ui.handleEscape()).toBe(true);
        expect(ui.isOpen()).toBe(false);
        expect(paused).toBe(false);
    });

    test('search filters list by name/id', () => {
        const ui = new WeaponCodexUI({
            isBlocked: () => false
        });
        ui.init();
        ui.open();

        const allCards = document.querySelectorAll('#codex-overlay [data-weapon-id]').length;
        expect(allCards).toBeGreaterThan(0);

        const input = document.querySelector('#codex-overlay .codex-search');
        expect(input).not.toBeNull();

        input.value = 'fire';
        input.dispatchEvent(new Event('input'));

        const filteredCards = document.querySelectorAll('#codex-overlay [data-weapon-id]').length;
        expect(filteredCards).toBeGreaterThan(0);
        expect(filteredCards).toBeLessThanOrEqual(allCards);
    });

    test('status tab renders status list and opens detail', () => {
        const ui = new WeaponCodexUI({
            isBlocked: () => false
        });
        ui.init();
        ui.open();

        const statusTab = document.querySelector('.codex-tab[data-tab="status"]');
        expect(statusTab).not.toBeNull();
        statusTab.click();

        const statusCards = document.querySelectorAll('#codex-overlay [data-status-id]');
        expect(statusCards.length).toBeGreaterThan(0);
        const weaponCards = document.querySelectorAll('#codex-overlay [data-weapon-id]');
        expect(weaponCards.length).toBe(0);

        statusCards[0].click();
        expect(ui.isDetailOpen()).toBe(true);
        const detailName = document.querySelector('#codex-detail-overlay .codex-detail-name');
        expect(detailName).not.toBeNull();
        expect(detailName.textContent.length).toBeGreaterThan(0);
    });
});
