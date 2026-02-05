import { UPGRADE_TABLE, canPurchase, purchaseUpgrade, getUpgradeCost } from '../../js/meta/MetaUpgrades.js';

describe('MetaUpgrades', () => {
    const makeMeta = (gold, levels = {}) => ({
        gold,
        upgrades: { maxHp: 0, strength: 0, intelligence: 0, ...levels }
    });

    test('getUpgradeCost returns null when maxed', () => {
        const meta = makeMeta(1000, { maxHp: UPGRADE_TABLE.maxHp.maxLevel });
        expect(getUpgradeCost(meta, 'maxHp')).toBe(null);
    });

    test('canPurchase checks gold and level', () => {
        const meta = makeMeta(10, { strength: 0 });
        expect(canPurchase(meta, 'strength')).toBe(false);

        meta.gold = 9999;
        expect(canPurchase(meta, 'strength')).toBe(true);
    });

    test('purchaseUpgrade deducts gold and increments level', () => {
        const meta = makeMeta(1000, { intelligence: 0 });
        const cost = getUpgradeCost(meta, 'intelligence');
        const ok = purchaseUpgrade(meta, 'intelligence');

        expect(ok).toBe(true);
        expect(meta.gold).toBe(1000 - cost);
        expect(meta.upgrades.intelligence).toBe(1);
    });
});
