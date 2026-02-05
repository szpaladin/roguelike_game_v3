import PlayerStats from './PlayerStats.js';
import WeaponSystem from '../weapons/WeaponSystem.js';
import { GAME_CONFIG } from '../config.js';
import { ASSET_MANAGER } from '../assets/AssetManager.js';
import { SPRITES } from '../assets/Sprites.js';

/**
 * Player - 玩家类
 * 整合玩家属性、移动和武器系统
 */
export default class Player {
    /**
     * @param {number} x - 初始 X
     * @param {number} y - 初始 Y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.stats = new PlayerStats();
        this.weaponSystem = new WeaponSystem();

        this.invulnerable = false;
        this.invulnerableTime = 0;
    }

    /**
     * 更新逻辑
     * @param {Object} keys - 按键状态
     * @param {number} dt - 帧时间 (秒)
     * @param {number} scrollY - 当前滚动位移
     */
    update(keys, dt, scrollY) {
        // 1. 处理移动
        let dx = 0;
        let dy = 0;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 注意：由于是按帧更新逻辑，这里计算位移
            // 原项目中是每帧固定位移，即 speed * 1 (帧)
            // 在 TDD 测试中，我们按 1/60 换算以匹配
            const speedMultiplier = this.artifactSystem && typeof this.artifactSystem.getSpeedMultiplier === 'function'
                ? this.artifactSystem.getSpeedMultiplier()
                : 1;
            const moveDist = this.stats.speed * speedMultiplier * (dt * 60);
            this.x += (dx / dist) * moveDist;
            this.y += (dy / dist) * moveDist;
        }

        // 2. 边界限制
        const mapPixelWidth = GAME_CONFIG.TILE_SIZE * GAME_CONFIG.MAP_WIDTH;
        this.x = Math.max(this.radius, Math.min(mapPixelWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(600 - this.radius, this.y));

        // 3. 更新冷却和状态
        const cooldownMultiplier = this.artifactSystem && typeof this.artifactSystem.getWeaponCooldownMultiplier === 'function'
            ? this.artifactSystem.getWeaponCooldownMultiplier()
            : 1;
        this.weaponSystem.update(cooldownMultiplier);

        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        if (this.invulnerable) return 0;

        const artifactSystem = this.artifactSystem;
        if (artifactSystem && typeof artifactSystem.consumeShieldCharge === 'function') {
            if (artifactSystem.consumeShieldCharge()) {
                this.invulnerable = true;
                this.invulnerableTime = Math.max(this.invulnerableTime, 20);
                return 0;
            }
        }

        const damageMultiplier = artifactSystem && typeof artifactSystem.getDamageTakenMultiplier === 'function'
            ? artifactSystem.getDamageTakenMultiplier()
            : 1;
        const actualDamage = this.stats.takeDamage(amount * damageMultiplier);

        if (this.stats.hp <= 0 && artifactSystem && typeof artifactSystem.tryConsumeDeathSave === 'function') {
            if (artifactSystem.tryConsumeDeathSave()) {
                this.stats.hp = 1;
                this.invulnerable = true;
                this.invulnerableTime = artifactSystem.getDeathSaveInvulnFrames
                    ? artifactSystem.getDeathSaveInvulnFrames()
                    : GAME_CONFIG.PLAYER_INVULNERABLE_TIME;
                return 0;
            }
        }

        if (actualDamage > 0) {
            this.invulnerable = true;
            this.invulnerableTime = GAME_CONFIG.PLAYER_INVULNERABLE_TIME;
        }
        return actualDamage;
    }

    /**
     * 绘制玩家
     */
    draw(ctx) {
        ctx.save();

        // 无敌闪烁效果
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        const sprite = SPRITES.player;
        const img = sprite ? ASSET_MANAGER.getImage(sprite.id) : null;
        if (img) {
            const w = sprite.w || this.radius * 2;
            const h = sprite.h || this.radius * 2;
            ctx.drawImage(img, this.x - w / 2, this.y - h / 2, w, h);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#00f';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }

        ctx.restore();
    }
}
