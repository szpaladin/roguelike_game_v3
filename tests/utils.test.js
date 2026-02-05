import { circleCollision, log } from '../js/utils.js';

describe('Utility Functions', () => {
    describe('circleCollision', () => {
        test('detects collision when circles overlap', () => {
            expect(circleCollision(0, 0, 10, 5, 5, 10)).toBe(true);
        });

        test('detects no collision when circles are far apart', () => {
            expect(circleCollision(0, 0, 10, 100, 100, 10)).toBe(false);
        });

        test('detects no collision when circles touch exactly', () => {
            expect(circleCollision(0, 0, 10, 20, 0, 10)).toBe(false); // exactly touching should not collide
        });

        test('handles zero radius circles', () => {
            // distance 0 < (0 + 0) is false, so no collision
            expect(circleCollision(0, 0, 0, 0, 0, 0)).toBe(false);
        });
    });

    describe('log', () => {
        let mockLogContent;

        beforeEach(() => {
            // Setup mock DOM element
            mockLogContent = document.createElement('div');
            mockLogContent.id = 'log-content';
            document.body.appendChild(mockLogContent);
        });

        afterEach(() => {
            // Cleanup - check if element is still a child before removing
            if (mockLogContent && mockLogContent.parentNode === document.body) {
                document.body.removeChild(mockLogContent);
            }
        });

        test('appends log entry to log-content', () => {
            log('Test message', 'normal');
            expect(mockLogContent.children.length).toBe(1);
            expect(mockLogContent.children[0].textContent).toBe('Test message');
            expect(mockLogContent.children[0].className).toContain('log-entry');
            expect(mockLogContent.children[0].className).toContain('normal');
        });

        test('limits log entries to 30', () => {
            // Add 35 log entries
            for (let i = 0; i < 35; i++) {
                log(`Message ${i}`);
            }
            expect(mockLogContent.children.length).toBe(30);
        });

        test('handles missing log-content element gracefully', () => {
            // Remove element first
            document.body.removeChild(mockLogContent);
            mockLogContent = null; // prevent double removal in afterEach
            expect(() => log('Test')).not.toThrow();
        });
    });
});
