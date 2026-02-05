import StatusEffectManager from './StatusEffectManager.js';

/**
 * Enemy class - 敌人基类
 */
export default class Enemy {
    constructor(x, y, data) {
        this.x = x;
        this.y = y;
        this.name = data.name;
        this.maxHp = data.maxHp;
        this.hp = data.hp;
        this.attack = data.attack;
        this.defense = data.defense;
        this.speed = data.speed;
        this.radius = data.radius;
        this.color = data.color;
        this.shapeSides = Number.isFinite(data.shapeSides) ? data.shapeSides : 0;
        this.shapeRotation = Number.isFinite(data.shapeRotation) ? data.shapeRotation : Math.random() * Math.PI * 2;
        this.shapeRotationSpeed = Number.isFinite(data.shapeRotationSpeed)
            ? data.shapeRotationSpeed
            : (this.shapeSides >= 3 ? (Math.random() * 0.02 - 0.01) : 0);
        this.exp = data.exp;
        this.gold = data.gold;
        this.moveType = data.moveType || 'chase';
        this.harmless = data.harmless === true;
        this.patrolDirection = Number.isFinite(data.patrolDirection) ? data.patrolDirection : 1;
        this.patrolBaseY = Number.isFinite(data.patrolBaseY) ? data.patrolBaseY : y;
        this.patrolPhase = Number.isFinite(data.patrolPhase) ? data.patrolPhase : Math.random() * Math.PI * 2;
        this.patrolWaveAmplitude = Number.isFinite(data.patrolWaveAmplitude)
            ? data.patrolWaveAmplitude
            : Math.max(4, this.radius * 0.6);
        this.patrolWaveSpeed = Number.isFinite(data.patrolWaveSpeed) ? data.patrolWaveSpeed : 0.08;

        // 使用新的状态效果管理器
        this.statusEffects = new StatusEffectManager();
    }

    /**
     * 受到伤害
     * @param {number} rawDamage - 原始伤害值
     * @param {Object} options - 伤害选项
     * @returns {number} - 实际受到的伤害值
     */
    takeDamage(rawDamage, options = {}) {
        return this.applyDamage(rawDamage, {
            source: options.source || 'hit',
            applyVulnerability: options.applyVulnerability !== false,
            ignoreDefense: options.ignoreDefense === true
        });
    }

    /**
     * 应用伤害（支持诅咒触发）
     * @param {number} rawDamage - 原始伤害值
     * @param {Object} options - 伤害选项
     * @returns {number} - 实际受到的伤害值
     */
    applyDamage(rawDamage, options = {}) {
        const source = options.source || 'hit';
        const applyVulnerability = options.applyVulnerability !== false;
        const ignoreDefense = options.ignoreDefense === true;
        const minDamage = Number.isFinite(options.minDamage) ? options.minDamage : 1;

        const defense = ignoreDefense ? 0 : (this.defense || 0);
        let actualDamage = Math.max(minDamage, rawDamage - defense);

        // 应用易伤倍率
        if (applyVulnerability && this.statusEffects) {
            actualDamage *= this.statusEffects.getVulnerabilityMultiplier();
        }

        this.hp -= actualDamage;
        this.triggerCurseOnDamage(actualDamage, source);
        return actualDamage;
    }

    /**
     * 应用状态效果
     * @param {string} effectId - 效果ID
     * @param {number} duration - 持续时间
     * @param {Object} params - 效果参数
     */
    applyStatusEffect(effectId, duration, params = {}) {
        this.statusEffects.applyEffect(effectId, duration, params);
    }

    /**
     * 兼容旧API - 施加冰冻
     */
    applyFreeze(duration) {
        this.statusEffects.applyEffect('frozen', duration);
    }

    /**
     * 兼容旧API - 施加燃烧
     */
    applyBurn(duration, damagePerFrame, color = null) {
        this.statusEffects.applyEffect('burning', duration, { damagePerFrame, color });
    }

    /**
     * 兼容旧API - 施加中毒
     */
    applyPoison(duration, damagePerStack = 5 / 60) {
        this.statusEffects.applyEffect('poisoned', duration, {
            damagePerStack,
            stacks: 1
        });
    }

    /**
     * 兼容旧API - 施加易伤
     */
    applyVulnerable(amount, duration) {
        this.statusEffects.applyEffect('vulnerable', duration, {
            vulnerabilityAmount: amount
        });
    }

    /**
     * 兼容旧API - 施加致盲
     */
    applyBlind(duration) {
        this.statusEffects.applyEffect('blinded', duration);
    }

    /**
     * 更新逻辑
     * @param {Object} playerPos - 玩家位置 {x, y}
     * @param {number} scrollY - 滚动位置
     * @param {number} canvasHeight - 画布高度
     * @param {number} canvasWidth - 画布宽度
     */
    update(playerPos, scrollY, canvasHeight, canvasWidth) {
        if (this.hp <= 0) return;

        // 更新状态效果并应用持续伤害
        const dotDamage = this.statusEffects.update(this);
        if (dotDamage > 0) {
            this.applyDamage(dotDamage, { source: 'dot', applyVulnerability: false, ignoreDefense: true, minDamage: 0 });
        }

        // 移动逻辑 (如果不冰冻)
        if (!this.statusEffects.isFrozen()) {
            const speedMultiplier = this.statusEffects.getSpeedMultiplier();
            if (this.moveType === 'patrol_horizontal') {
                this.x += this.speed * speedMultiplier * this.patrolDirection;
                this.patrolPhase += this.patrolWaveSpeed * speedMultiplier;
                this.y = this.patrolBaseY + Math.sin(this.patrolPhase) * this.patrolWaveAmplitude;
                if (Number.isFinite(canvasWidth)) {
                    const minX = this.radius;
                    const maxX = canvasWidth - this.radius;
                    if (this.x <= minX) {
                        this.x = minX;
                        this.patrolDirection = 1;
                    } else if (this.x >= maxX) {
                        this.x = maxX;
                        this.patrolDirection = -1;
                    }
                }
            } else {
                // playerWorldY = scrollY + playerPos.y (玩家屏幕坐标转世界坐标)
                const playerWorldY = scrollY + playerPos.y;
                const dx = playerPos.x - this.x;
                const dy = playerWorldY - this.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d > 0) {
                    this.x += (dx / d) * this.speed * speedMultiplier;
                    this.y += (dy / d) * this.speed * speedMultiplier;
                }
            }
        }

        if (this.shapeRotationSpeed) {
            this.shapeRotation += this.shapeRotationSpeed;
        }
    }

    /**
     * 检查是否被致盲（兼容旧代码）
     */
    get blinded() {
        return this.statusEffects.isBlinded();
    }

    /**
     * 检查是否被冰冻（兼容旧代码）
     */
    get frozen() {
        return this.statusEffects.isFrozen();
    }

    /**
     * 绘制敌人
     */
    draw(ctx, scrollY) {
        if (this.hp <= 0) return;

        ctx.save();
        const screenY = this.y - scrollY;
        const sides = Number.isFinite(this.shapeSides) ? this.shapeSides : 0;
        const rotation = Number.isFinite(this.shapeRotation) ? this.shapeRotation : 0;

        const buildShapePath = () => {
            if (sides >= 3) {
                const step = (Math.PI * 2) / sides;
                ctx.moveTo(
                    this.x + Math.cos(rotation) * this.radius,
                    screenY + Math.sin(rotation) * this.radius
                );
                for (let i = 1; i < sides; i++) {
                    const angle = rotation + step * i;
                    ctx.lineTo(
                        this.x + Math.cos(angle) * this.radius,
                        screenY + Math.sin(angle) * this.radius
                    );
                }
                ctx.closePath();
                return;
            }

            ctx.arc(this.x, screenY, this.radius, 0, Math.PI * 2);
        };

        // 基础体
        ctx.beginPath();
        buildShapePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        // 描边效果 (优先显示最重要的状态)
        const activeEffects = this.statusEffects.getAllEffects();
        if (activeEffects.length > 0) {
            // 按优先级排序：冻结 > 燃烧 > 中毒
            let primaryEffect = null;
            if (this.statusEffects.hasEffect('dark_flame')) primaryEffect = this.statusEffects.getEffect('dark_flame');
            else if (this.frozen) primaryEffect = this.statusEffects.getEffect('frozen');
            else if (this.statusEffects.hasEffect('burning')) primaryEffect = this.statusEffects.getEffect('burning');
            else if (this.statusEffects.hasEffect('poisoned')) primaryEffect = this.statusEffects.getEffect('poisoned');

            if (primaryEffect) {
                ctx.beginPath();
                buildShapePath();
                ctx.strokeStyle = primaryEffect.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // 致盲标识
        if (this.blinded) {
            ctx.beginPath();
            buildShapePath();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText('X', this.x - 3, screenY + 4);
        }

        // 血条
        const healthBarW = this.radius * 2;
        const healthBarH = 4;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - this.radius, screenY - this.radius - 8, healthBarW, healthBarH);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - this.radius, screenY - this.radius - 8, healthBarW * (this.hp / this.maxHp), healthBarH);

        ctx.restore();
    }

    /**
     * 兼容旧代码 - burning getter
     */
    get burning() {
        return this.statusEffects.hasEffect('burning');
    }

    /**
     * 诅咒触发处理：非诅咒伤害消耗层数并追加伤害
     */
    triggerCurseOnDamage(actualDamage, source = 'hit') {
        if (!this.statusEffects || actualDamage <= 0) return;
        if (source === 'curse') return;

        const curse = this.statusEffects.getEffect('cursed');
        if (!curse) return;

        const consumeStacks = Number.isFinite(curse.params.consumeStacks) ? curse.params.consumeStacks : 1;
        const damageMultiplier = Number.isFinite(curse.params.damageMultiplier) ? curse.params.damageMultiplier : 1.5;
        const intMultiplier = Number.isFinite(curse.params.intMultiplier) ? curse.params.intMultiplier : 1;

        const consumed = typeof curse.consumeStacks === 'function'
            ? curse.consumeStacks(consumeStacks)
            : 0;

        if (consumed > 0) {
            const bonusDamage = actualDamage * damageMultiplier * intMultiplier;
            this.hp -= bonusDamage;
        }

        const remaining = typeof curse.getStackCount === 'function' ? curse.getStackCount() : (curse.stacks || 0);
        if (remaining <= 0) {
            this.statusEffects.removeEffect('cursed');
        }
    }
}


