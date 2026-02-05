import GameLoop from '../../js/core/GameLoop.js';

describe('GameLoop', () => {
    let loop;
    let updateCount = 0;
    let drawCount = 0;

    beforeEach(() => {
        updateCount = 0;
        drawCount = 0;
        loop = new GameLoop(
            () => updateCount++,
            () => drawCount++
        );
    });

    test('initializes as not running', () => {
        expect(loop.running).toBe(false);
    });

    test('start sets running to true', () => {
        loop.start();
        expect(loop.running).toBe(true);
        loop.stop();
    });

    test('pause sets running to false', () => {
        loop.start();
        loop.pause();
        expect(loop.running).toBe(false);
    });

    test('tick calls update and draw if running', () => {
        loop.running = true; // Manually enable for testing tick in isolation
        loop.tick();
        expect(updateCount).toBe(1);
        expect(drawCount).toBe(1);
    });
});
