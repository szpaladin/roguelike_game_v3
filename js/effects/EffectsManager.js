import { worldToScreen } from '../utils.js';

/**
 * EffectsManager - 瑙嗚鐗规晥绠＄悊鍣?
 * 璐熻矗绠＄悊娓告垙涓殑鍚勭瑙嗚鐗规晥锛堢垎鐐搞€侀棯鐢点€佸皠绾跨瓑锛?
 */
export default class EffectsManager {
    constructor() {
        this.explosionEffects = [];
        this.lightningEffects = [];
        this.rayEffects = [];
        this.floatingTexts = [];
    }

    /**
     * 鏇存柊鎵€鏈夌壒鏁?
     */
    update() {
        // 鏇存柊鐖嗙偢鐗规晥
        for (let i = this.explosionEffects.length - 1; i >= 0; i--) {
            const effect = this.explosionEffects[i];
            effect.life--;
            effect.currentRadius = effect.maxRadius * (1 - effect.life / effect.maxLife);

            if (effect.life <= 0) {
                this.explosionEffects.splice(i, 1);
            }
        }

        // 鏇存柊闂數鐗规晥
        for (let i = this.lightningEffects.length - 1; i >= 0; i--) {
            const effect = this.lightningEffects[i];
            effect.life--;

            if (effect.life <= 0) {
                this.lightningEffects.splice(i, 1);
            }
        }

        // 鏇存柊灏勭嚎鐗规晥
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
     * 缁樺埗鎵€鏈夌壒鏁?
     */
    draw(ctx, view) {
        const toScreen = (x, y) => view ? worldToScreen(x, y, view) : { x, y };

        // 绘制爆炸特效
        for (const effect of this.explosionEffects) {
            const screen = toScreen(effect.x, effect.y);
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, effect.currentRadius, 0, Math.PI * 2);
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
                const from = toScreen(chain.from.x, chain.from.y);
                const to = toScreen(chain.to.x, chain.to.y);
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);

                // 添加锯齿效果
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const segments = 5;

                for (let i = 1; i <= segments; i++) {
                    const t = i / segments;
                    const x = from.x + dx * t + (Math.random() - 0.5) * 20;
                    const y = from.y + dy * t + (Math.random() - 0.5) * 20;
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // 绘制射线特效
        for (const effect of this.rayEffects) {
            if (effect.mode === 'directional') {
                const origin = toScreen(effect.x, effect.y);
                const viewW = view ? (view.width || 0) : 0;
                const viewH = view ? (view.height || 0) : 0;
                const diag = Math.hypot(viewW, viewH);
                const scale = Number.isFinite(effect.lengthScale) ? effect.lengthScale : 1.2;
                const fullLength = Number.isFinite(effect.length) ? effect.length : diag * scale;
                const half = fullLength * 0.5;
                const startX = origin.x - effect.dirX * half;
                const startY = origin.y - effect.dirY * half;
                const endX = origin.x + effect.dirX * half;
                const endY = origin.y + effect.dirY * half;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 4;
                ctx.globalAlpha = effect.life / 10;
                ctx.stroke();
                ctx.globalAlpha = 1;
                continue;
            }

            const start = toScreen(effect.startX, effect.startY);
            const end = toScreen(effect.endX, effect.endY);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
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
    drawFloatingTexts(ctx, view) {
        if (!ctx || this.floatingTexts.length === 0) return;
        const toScreen = (x, y) => view ? worldToScreen(x, y, view) : { x, y };

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        for (const effect of this.floatingTexts) {
            const alpha = effect.maxLife > 0 ? effect.life / effect.maxLife : 1;
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            ctx.font = effect.font;
            ctx.fillStyle = effect.color;
            const screen = toScreen(effect.x, effect.y);
            ctx.fillText(effect.text, screen.x, screen.y);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    /**
     * 娣诲姞鐖嗙偢鐗规晥
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
     * 娣诲姞闂數閾剧壒鏁?
     */
    addLightningChain(chains) {
        this.lightningEffects.push({
            chains,
            life: 15
        });
    }

    /**
     * 娣诲姞灏勭嚎鐗规晥
     */
    addRay(startX, startY, endX, endY, color = '#FFA500', options = {}) {
        if (options && options.mode === 'directional') {
            this.rayEffects.push({
                x: startX,
                y: startY,
                dirX: endX,
                dirY: endY,
                color,
                life: 10,
                mode: 'directional',
                lengthScale: options.lengthScale,
                length: options.length
            });
            return;
        }

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
     * 娓呴櫎鎵€鏈夌壒鏁?
     */
    clear() {
        this.explosionEffects = [];
        this.lightningEffects = [];
        this.rayEffects = [];
        this.floatingTexts = [];
    }
}


