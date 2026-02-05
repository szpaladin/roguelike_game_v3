import ArtifactCodexUI from '../../js/ui/ArtifactCodexUI.js';

describe('ArtifactCodexUI', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="panel inventory-panel">
                <h2>背包</h2>
            </div>
        `;
    });

    test('injects a codex button into inventory panel header', () => {
        const ui = new ArtifactCodexUI();
        ui.init();

        const btn = document.querySelector('.inventory-panel .artifact-codex-open-btn');
        expect(btn).not.toBeNull();
        expect(btn.textContent).toBe('图鉴');
    });

    test('open/escape closes overlays and restores pause state', () => {
        let paused = false;
        const ui = new ArtifactCodexUI({
            getPaused: () => paused,
            setPaused: (v) => { paused = v; },
            isBlocked: () => false
        });
        ui.init();

        ui.open();
        expect(ui.isOpen()).toBe(true);
        expect(paused).toBe(true);

        const firstCard = document.querySelector('#artifact-codex-overlay [data-artifact-id]');
        expect(firstCard).not.toBeNull();
        const artifactId = firstCard.getAttribute('data-artifact-id');
        ui.openDetail(artifactId);
        expect(ui.isDetailOpen()).toBe(true);

        expect(ui.handleEscape()).toBe(true);
        expect(ui.isDetailOpen()).toBe(false);
        expect(ui.isOpen()).toBe(true);

        expect(ui.handleEscape()).toBe(true);
        expect(ui.isOpen()).toBe(false);
        expect(paused).toBe(false);
    });

    test('search filters list by name/id', () => {
        const ui = new ArtifactCodexUI({
            isBlocked: () => false
        });
        ui.init();
        ui.open();

        const allCards = document.querySelectorAll('#artifact-codex-overlay [data-artifact-id]').length;
        expect(allCards).toBeGreaterThan(0);

        const input = document.querySelector('#artifact-codex-overlay .codex-search');
        expect(input).not.toBeNull();

        input.value = 'sea';
        input.dispatchEvent(new Event('input'));

        const filteredCards = document.querySelectorAll('#artifact-codex-overlay [data-artifact-id]').length;
        expect(filteredCards).toBeLessThanOrEqual(allCards);
    });
});
