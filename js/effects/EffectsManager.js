/**
 * EffectsManager - 视觉特效管理器
 * 负责管理游戏中的各种视觉特效（爆炸、闪电、射线等）
 */
export default class EffectsManager {
    constructor() {
        this.explosionEffects = [];
        this.lightningEffects = [];
        this.rayEffects = [];
        this.floatingTexts = [];
    }

    /**
     * 更新所有特效
     */
    update() {
        // 更新爆炸特效
        for (let i = this.explosionEffects.length - 1; i >= 0; i--) {
            const effect = this.explosionEffects[i];
            effect.life--;
            effect.currentRadius = effect.maxRadius * (1 - effect.life / effect.maxLife);

            if (effect.life <= 0) {
                this.explosionEffects.splice(i, 1);
            }
        }

        // 更新闪电特效
        for (let i = this.lightningEffects.length - 1; i >= 0; i--) {
            const effect = this.lightningEffects[i];
            effect.life--;

            if (effect.life <= 0) {
                this.lightningEffects.splice(i, 1);
            }
        }

        // 更新射线特效
        for (let i = this.rayEffects.length - 1; i >= 0; i--) {
            const effect = this.rayEffects[i];
            effect.life--;

            if (effect.life <= 0) {
                this.rayEffects.splice(i, 1);
            }
        }

        // Update floating texts.
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const effect = this.floatingTexts[i];
            effect.life--;
            effect.y += effect.vy;
            if (effect.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    /**
     * 绘制所有特效
     */
    draw(ctx, scrollY) {
        // 绘制爆炸特效
        for (const effect of this.explosionEffects) {
            ctx.beginPath();
            ctx.arc(effect.x, effect.y - scrollY, effect.currentRadius, 0, Math.PI * 2);
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = effect.life / effect.maxLife;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // 绘制闪电特效
        for (const effect of this.lightningEffects) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = effect.life / 15;

            for (const chain of effect.chains) {
                ctx.beginPath();
                ctx.moveTo(chain.from.x, chain.from.y - scrollY);

                // 添加锯齿效果
                const dx = chain.to.x - chain.from.x;
                const dy = chain.to.y - chain.from.y;
                const segments = 5;

                for (let i = 1; i <= segments; i++) {
                    const t = i / segments;
                    const x = chain.from.x + dx * t + (Math.random() - 0.5) * 20;
                    const y = chain.from.y + dy * t + (Math.random() - 0.5) * 20;
                    ctx.lineTo(x, y - scrollY);
                }

                ctx.lineTo(chain.to.x, chain.to.y - scrollY);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // 绘制射线特效
        for (const effect of this.rayEffects) {
            ctx.beginPath();
            ctx.moveTo(effect.startX, effect.startY - scrollY);
            ctx.lineTo(effect.endX, effect.endY - scrollY);
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 4;
            ctx.globalAlpha = effect.life / 10;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    /**
     * Draw floating texts (call after player draw).
     */
    drawFloatingTexts(ctx, scrollY) {
        if (!ctx || this.floatingTexts.length === 0) return;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        for (const effect of this.floatingTexts) {
            const alpha = effect.maxLife > 0 ? effect.life / effect.maxLife : 1;
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            ctx.font = effect.font;
            ctx.fillStyle = effect.color;
            ctx.fillText(effect.text, effect.x, effect.y - scrollY);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    /**
     * 添加爆炸特效
     */
    addExplosion(x, y, radius, color = '#ff4500') {
        this.explosionEffects.push({
            x,
            y,
            currentRadius: 0,
            maxRadius: radius,
            life: 20,
            maxLife: 20,
            color
        });
    }

    /**
     * 添加闪电链特效
     */
    addLightningChain(chains) {
        this.lightningEffects.push({
            chains,
            life: 15
        });
    }

    /**
     * 添加射线特效
     */
    addRay(startX, startY, endX, endY, color = '#FFA500') {
        this.rayEffects.push({
            startX,
            startY,
            endX,
            endY,
            color,
            life: 10
        });
    }

    /**
     * Add a floating text effect.
     */
    addFloatingText(x, y, text, options = {}) {
        const life = Number.isFinite(options.life) ? options.life : 50;
        const font = options.font || '12px Arial';
        const color = options.color || '#ffffff';
        const vy = Number.isFinite(options.vy) ? options.vy : -0.4;

        this.floatingTexts.push({
            x,
            y,
            text,
            color,
            font,
            vy,
            life,
            maxLife: life
        });
    }

    /**
     * 清除所有特效
     */
    clear() {
        this.explosionEffects = [];
        this.lightningEffects = [];
        this.rayEffects = [];
        this.floatingTexts = [];
    }
}

