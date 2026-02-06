import { GAME_CONFIG } from '../config.js';
import { worldToScreen } from '../utils.js';

/**
 * Bullet - 子弹类
 * 可重用的子弹对象
 */
export default class Bullet {
    constructor(data) {
        this.active = false;
        if (data) {
            this.reset(data);
        }
    }

    /**
     * 重置/初始化子弹属性（用于对象池复用）
     */
    reset(data) {
        const coreKeys = new Set([
            'active',
            'x',
            'y',
            'vx',
            'vy',
            'damage',
            'radius',
            'color',
            'lifetime',
            'piercing',
            'chainCooldownRemaining',
            'hitEntities'
        ]);

        for (const key of Object.keys(this)) {
            if (!coreKeys.has(key)) {
                delete this[key];
            }
        }

        this.x = data.x;
        this.y = data.y;
        this.vx = data.vx;
        this.vy = data.vy;
        this.damage = data.damage;
        this.radius = data.radius;
        this.color = data.color;
        const baseLifetime = Number.isFinite(data.lifetime) ? data.lifetime : null;
        const lifetimeMultiplier = Number.isFinite(GAME_CONFIG.BULLET_LIFETIME_MULTIPLIER)
            ? GAME_CONFIG.BULLET_LIFETIME_MULTIPLIER
            : 1;
        this.lifetime = baseLifetime === null ? data.lifetime : Math.round(baseLifetime * lifetimeMultiplier);
        this.piercing = data.piercing || false;
        this.active = true;
        this.chainCooldownRemaining = 0;

        // 存储所有其他额外属性(各种武器特效)
        // 这样不需要为每种武器子弹写子类
        Object.keys(data).forEach(key => {
            if (!coreKeys.has(key)) {
                this[key] = data[key];
            }
        });

        // 记录该子弹是否已经命中过某个敌人（针对穿透子弹）
        this.hitEntities = new Set();
    }

    /**
     * 更新逻辑
     */
    update() {
        if (!this.active) return;

        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        if (this.chainCooldownRemaining > 0) {
            this.chainCooldownRemaining--;
        }

        if (this.lifetime <= 0) {
            this.active = false;
        }
    }

    /**
     * 绘制子弹
     */
    draw(ctx, view) {
        if (!this.active) return;

        const screen = view ? worldToScreen(this.x, this.y, view) : { x: this.x, y: this.y };
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}


