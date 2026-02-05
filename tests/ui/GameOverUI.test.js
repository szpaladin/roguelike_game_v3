import GameOverUI from '../../js/ui/GameOverUI.js';

describe('GameOverUI', () => {
    let ui;
    let mockElements;

    beforeEach(() => {
        mockElements = {
            'game-over': { style: { display: 'none' } },
            'final-score': { textContent: '' },
            'final-level': { textContent: '' },
            'restart-btn': { onclick: null }
        };

        document.getElementById = (id) => mockElements[id] || { style: {} };
        ui = new GameOverUI();
    });

    test('show sets display to block and updates stats', () => {
        ui.show(1234, 10);
        expect(mockElements['game-over'].style.display).toBe('flex');
        expect(mockElements['final-score'].textContent).toBe('1234');
        expect(mockElements['final-level'].textContent).toBe('10');
    });

    test('hide sets display to none', () => {
        ui.show(1234, 10);
        ui.hide();
        expect(mockElements['game-over'].style.display).toBe('none');
    });
});
