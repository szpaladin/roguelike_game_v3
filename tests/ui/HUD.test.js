import HUD from '../../js/ui/HUD.js';

describe('HUD', () => {
    let hud;
    let mockElements;

    beforeEach(() => {
        // Mock DOM elements
        mockElements = {
            'health-fill': { style: {} },
            'health-text': { textContent: '' },
            'exp-fill': { style: {} },
            'exp': { textContent: '' },
            'level': { textContent: '' },
            'skill-points': { textContent: '' },
            'attack': { textContent: '' },
            'defense': { textContent: '' },
            'gold': { textContent: '' },
            'floor': { textContent: '' }
        };

        document.getElementById = (id) => mockElements[id] || null;
        hud = new HUD();
    });

    test('updatePlayerStats updates HP and EXP bars', () => {
        const player = {
            stats: {
                hp: 50,
                maxHp: 100,
                exp: 5,
                expToNext: 10,
                level: 2,
                skillPoints: 1,
                attack: 10,
                defense: 5,
                gold: 100
            }
        };
        const distance = 500;

        hud.update(player, distance);

        expect(mockElements['health-fill'].style.width).toBe('50%');
        expect(mockElements['health-text'].textContent).toBe('50/100');
        expect(mockElements['exp-fill'].style.width).toBe('50%');
        expect(mockElements['level'].textContent).toBe('Lv.2');
        expect(mockElements['gold'].textContent).toBe('100');
        expect(mockElements['floor'].textContent).toBe('50.0\u7c73');
    });
});
