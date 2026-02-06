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
        this.vx = 0;
        this.vy = 0;
        this.animTime = 0;
        this.animFrame = 0;
        this.facing = 1;
        this.isMoving = false;
        this.animState = 'idle';
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
        const inertiaCfg = GAME_CONFIG.WATER_INERTIA || {};
        const accelBase = Number.isFinite(inertiaCfg.PLAYER_ACCEL) ? inertiaCfg.PLAYER_ACCEL : 0.22;
        const decelBase = Number.isFinite(inertiaCfg.PLAYER_DECEL) ? inertiaCfg.PLAYER_DECEL : 0.14;
        const stopThreshold = Number.isFinite(inertiaCfg.PLAYER_STOP) ? inertiaCfg.PLAYER_STOP : 0.03;
        const frameScale = dt * 60;
        const accel = 1 - Math.pow(1 - accelBase, frameScale);
        const decel = 1 - Math.pow(1 - decelBase, frameScale);

        let targetVx = 0;
        let targetVy = 0;

        if (dx !== 0 || dy !== 0) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speedMultiplier = this.artifactSystem && typeof this.artifactSystem.getSpeedMultiplier === 'function'
                ? this.artifactSystem.getSpeedMultiplier()
                : 1;
            const baseSpeed = this.stats.speed * speedMultiplier;
            targetVx = (dx / dist) * baseSpeed;
            targetVy = (dy / dist) * baseSpeed;
            this.vx += (targetVx - this.vx) * accel;
            this.vy += (targetVy - this.vy) * accel;
        } else {
            this.vx += (0 - this.vx) * decel;
            this.vy += (0 - this.vy) * decel;
        }

        if (Math.abs(this.vx) < stopThreshold) this.vx = 0;
        if (Math.abs(this.vy) < stopThreshold) this.vy = 0;

        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        const moveThreshold = 0.01;
        if (this.vx < -moveThreshold) this.facing = -1;
        else if (this.vx > moveThreshold) this.facing = 1;
        this.isMoving = Math.abs(this.vx) > moveThreshold || Math.abs(this.vy) > moveThreshold;

        const speedMag = Math.hypot(this.vx, this.vy);
        const baseSpeed = this.stats.speed || 1;
        const speedRatio = baseSpeed > 0 ? speedMag / baseSpeed : 0;
        const fastThreshold = 1.25;
        const rushThreshold = 1.6;
        let nextState = 'idle';

        if (this.invulnerable) {
            nextState = 'hurt';
        } else if (this.isMoving) {
            if (speedRatio >= rushThreshold) nextState = 'rush';
            else if (speedRatio >= fastThreshold) nextState = 'fast';
            else nextState = 'swim';
        }

        if (nextState !== this.animState) {
            this.animState = nextState;
            this.animTime = 0;
            this.animFrame = 0;
        }

        const sprite = SPRITES[`player_${this.animState}`] || SPRITES.player_swim || SPRITES.player_idle;
        const frameCfg = sprite ? sprite.frame : null;
        if (frameCfg && Number.isFinite(frameCfg.count) && frameCfg.count > 1) {
            const rate = Number.isFinite(frameCfg.rate) ? frameCfg.rate : 8;
            this.animTime += dt;
            this.animFrame = Math.floor(this.animTime * rate) % frameCfg.count;
        } else {
            this.animFrame = 0;
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
        const sprite = SPRITES[`player_${this.animState}`] || SPRITES.player_swim || SPRITES.player_idle;
        const img = sprite ? ASSET_MANAGER.getImage(sprite.id) : null;
        if (img) {
            const w = sprite.w || this.radius * 2;
            const h = sprite.h || this.radius * 2;
            let sx = 0;
            let sy = 0;
            let sw = img.width;
            let sh = img.height;
            if (sprite.frame) {
                const frame = sprite.frame;
                if (Number.isFinite(frame.w) && Number.isFinite(frame.h)) {
                    const frameIndex = Number.isFinite(this.animFrame) ? this.animFrame : 0;
                    const frameX = frameIndex * frame.w;
                    if (frame.trim) {
                        sx = frameX + frame.trim.x;
                        sy = frame.trim.y;
                        sw = frame.trim.w;
                        sh = frame.trim.h;
                    } else {
                        sx = frameX;
                        sy = 0;
                        sw = frame.w;
                        sh = frame.h;
                    }
                } else if (Number.isFinite(frame.x)) {
                    sx = frame.x;
                    sy = frame.y;
                    sw = frame.w;
                    sh = frame.h;
                }
            }
            ctx.save();
            ctx.translate(this.x, this.y);
            if (this.facing < 0) ctx.scale(-1, 1);
            ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
            ctx.restore();
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

