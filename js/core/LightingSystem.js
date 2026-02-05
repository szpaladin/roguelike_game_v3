/**
 * LightingSystem - 光线系统
 * 使用全屏黑色遮罩模拟深度光线衰减
 * 遮罩透明度由外部 RiskSystem 提供
 */
export default class LightingSystem {
    constructor() {
        this.currentAlpha = 0;
        this.targetAlpha = 0;
        this.transitionSpeed = 0.5; // 每秒过渡0.5的alpha
    }

    /**
     * 设置目标透明度（由 RiskSystem 调用）
     * @param {number} alpha - 目标透明度
     */
    setTargetAlpha(alpha) {
        this.targetAlpha = alpha;
    }

    /**
     * 更新光照（平滑过渡）
     * @param {number} dt - 帧间隔（秒）
     */
    update(dt) {
        // 平滑过渡
        if (this.currentAlpha < this.targetAlpha) {
            this.currentAlpha = Math.min(this.currentAlpha + this.transitionSpeed * dt, this.targetAlpha);
        } else if (this.currentAlpha > this.targetAlpha) {
            this.currentAlpha = Math.max(this.currentAlpha - this.transitionSpeed * dt, this.targetAlpha);
        }
    }

    /**
     * 绘制黑暗遮罩
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     */
    draw(ctx, width, height) {
        if (this.currentAlpha <= 0) return;

        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${this.currentAlpha})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    /**
     * 重置光照
     */
    reset() {
        this.currentAlpha = 0;
        this.targetAlpha = 0;
    }
}
