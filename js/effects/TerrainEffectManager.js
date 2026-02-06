import { wrapDeltaX, worldToScreen } from '../utils.js';

/**
 * TerrainEffectManager - 地形效果管理器
 * 负责岩脊带等地形控场效果的生命周期与应用
 */
export default class TerrainEffectManager {
    constructor() {
        this.ridges = [];
    }

    /**
     * 添加岩脊带
     * @param {number} x - 世界坐标X
     * @param {number} y - 世界坐标Y
     * @param {Object} config - 配置参数
     */
    addRidge(x, y, config = {}) {
        const length = Number.isFinite(config.length) ? config.length : 90;
        const width = Number.isFinite(config.width) ? config.width : 18;
        const duration = Number.isFinite(config.duration) ? config.duration : 120;
        const slowAmount = Number.isFinite(config.slowAmount) ? config.slowAmount : 0.3;
        const slowDuration = Number.isFinite(config.slowDuration) ? config.slowDuration : 120;
        const angle = Number.isFinite(config.angle) ? config.angle : Math.random() * Math.PI * 2;

        this.ridges.push({
            x,
            y,
            length,
            width,
            life: duration,
            slowAmount,
            slowDuration,
            angle
        });
    }

    /**
     * 更新地形效果（每帧调用）
     * @param {Array<Enemy>} enemies - 敌人列表
     */
    update(enemies = [], worldWidth = null) {
        for (let i = this.ridges.length - 1; i >= 0; i--) {
            this.ridges[i].life--;
            if (this.ridges[i].life <= 0) {
                this.ridges.splice(i, 1);
            }
        }

        if (!Array.isArray(enemies) || enemies.length === 0) return;

        for (const enemy of enemies) {
            if (!enemy || enemy.hp <= 0 || enemy.isDead) continue;
            for (const ridge of this.ridges) {
                if (this.isEnemyInsideRidge(enemy, ridge, worldWidth)) {
                    enemy.applyStatusEffect('slowed', ridge.slowDuration, {
                        slowAmount: ridge.slowAmount
                    });
                }
            }
        }
    }

    /**
     * 绘制地形效果
     */
    draw(ctx, view) {
        if (!ctx) return;
        ctx.save();
        ctx.fillStyle = 'rgba(107, 90, 74, 0.35)';

        for (const ridge of this.ridges) {
            const screen = view ? worldToScreen(ridge.x, ridge.y, view) : { x: ridge.x, y: ridge.y };
            const screenY = screen.y;
            ctx.save();
            ctx.translate(screen.x, screenY);
            ctx.rotate(ridge.angle);
            ctx.fillRect(-ridge.length / 2, -ridge.width / 2, ridge.length, ridge.width);
            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * 判定敌人中心点是否在岩脊带内
     */
    isEnemyInsideRidge(enemy, ridge, worldWidth = null) {
        const dx = Number.isFinite(worldWidth) ? wrapDeltaX(enemy.x - ridge.x, worldWidth) : (enemy.x - ridge.x);
        const dy = enemy.y - ridge.y;
        const cos = Math.cos(-ridge.angle);
        const sin = Math.sin(-ridge.angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        return Math.abs(localX) <= ridge.length / 2 && Math.abs(localY) <= ridge.width / 2;
    }
}
