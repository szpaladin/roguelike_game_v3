import BurningVFX from './BurningVFX.js';
import PoisonVFX from './PoisonVFX.js';
import FrozenVFX from './FrozenVFX.js';
import PlagueVFX from './PlagueVFX.js';
import DarkFlameVFX from './DarkFlameVFX.js';

export default class StatusVFXManager {
    constructor() {
        this.registry = new Map([
            ['burning', BurningVFX],
            ['poisoned', PoisonVFX],
            ['frozen', FrozenVFX],
            ['plagued', PlagueVFX],
            ['dark_flame', DarkFlameVFX]
        ]);
        this.enemyEffects = new Map();
    }

    update(enemies) {
        const aliveEnemies = enemies.filter(enemy => enemy && enemy.hp > 0 && !enemy.isDead);
        const activeEnemies = new Set(aliveEnemies);
        for (const enemy of this.enemyEffects.keys()) {
            if (!activeEnemies.has(enemy)) {
                this.enemyEffects.delete(enemy);
            }
        }

        for (const enemy of aliveEnemies) {
            if (!enemy || !enemy.statusEffects) continue;
            const hasDarkFlame = enemy.statusEffects.hasEffect('dark_flame');

            for (const [effectId, VfxClass] of this.registry.entries()) {
                const hasEffect = effectId === 'burning' && hasDarkFlame
                    ? false
                    : enemy.statusEffects.hasEffect(effectId);
                let effectMap = this.enemyEffects.get(enemy);

                if (hasEffect) {
                    const effect = enemy.statusEffects.getEffect(effectId);
                    if (!effectMap) {
                        effectMap = new Map();
                        this.enemyEffects.set(enemy, effectMap);
                    }

                    let vfx = effectMap.get(effectId);
                    if (!vfx) {
                        vfx = new VfxClass(enemy, effect ? effect.color : null);
                        effectMap.set(effectId, vfx);
                    }

                    vfx.update(enemy, effect);
                } else if (effectMap && effectMap.has(effectId)) {
                    effectMap.delete(effectId);
                    if (effectMap.size === 0) {
                        this.enemyEffects.delete(enemy);
                    }
                }
            }
        }
    }

    draw(ctx, scrollY) {
        for (const [enemy, effectMap] of this.enemyEffects.entries()) {
            for (const vfx of effectMap.values()) {
                vfx.draw(ctx, scrollY, enemy);
            }
        }
    }

    clear() {
        this.enemyEffects.clear();
    }
}
