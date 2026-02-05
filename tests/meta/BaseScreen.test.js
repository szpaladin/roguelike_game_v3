// 简单的 localStorage mock
const mockStorage = {};
global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => { mockStorage[key] = value; },
    clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); },
    removeItem: (key) => { delete mockStorage[key]; }
};

import BaseScreen from '../../js/meta/BaseScreen.js';
import MetaStore from '../../js/meta/MetaStore.js';

describe('BaseScreen', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-root" style="display:block;"></div>
            <div id="base-root" style="display:none;">
                <span id="base-runs"></span>
                <span id="base-best-depth"></span>
                <span id="base-gold"></span>
                <div id="base-upgrade-list"></div>
                <div id="base-log"></div>
                <div id="base-loadout-tip"></div>
                <button id="base-start-btn"></button>
            </div>
        `;
        localStorage.clear();
    });

    test('open renders and shows overlay', () => {
        const store = new MetaStore('test_meta');
        const screen = new BaseScreen(store);
        screen.open();

        const baseRoot = document.getElementById('base-root');
        const gameRoot = document.getElementById('game-root');
        expect(baseRoot.style.display).toBe('flex');
        expect(gameRoot.style.display).toBe('none');
        const upgradeList = document.getElementById('base-upgrade-list');
        expect(upgradeList.children.length).toBeGreaterThan(0);
    });
});
