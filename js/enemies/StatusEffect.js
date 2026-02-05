/**
 * StatusEffect - 单个状态效果实例
 * 代表敌人身上的一个激活的状态效果
 */
export default class StatusEffect {
    /**
     * @param {Object} definition - 效果定义 (来自 STATUS_EFFECTS)
     * @param {number} duration - 持续时间（帧）
     * @param {Object} params - 额外参数 (如伤害值、减速百分比等)
     */
    constructor(definition, duration, params = {}) {
        this.id = definition.id;
        this.name = definition.name;
        this.type = definition.type;
        this.color = params.color || definition.color;
        this.maxStacks = definition.maxStacks || 1;
        this.stackBehavior = definition.stackBehavior || 'refresh';
        this.duration = duration;
        this.maxDuration = duration;
        this.stacks = params.stacks || 1;
        this.stackDurations = null;
        this.stackMaxDurations = null;

        // 效果参数
        this.params = {
            damagePerFrame: params.damagePerFrame || 0,
            damagePerStack: params.damagePerStack || 0,
            slowAmount: params.slowAmount || 0,
            vulnerabilityAmount: params.vulnerabilityAmount || 0,
            ...params
        };

        if (this.maxStacks > 1 && this.stackBehavior === 'independent') {
            const initialStacks = Math.min(this.maxStacks, params.stacks || 1);
            this.stackDurations = [];
            this.stackMaxDurations = [];
            for (let i = 0; i < initialStacks; i++) {
                this.stackDurations.push(duration);
                this.stackMaxDurations.push(duration);
            }
            this.syncStackSummary();
        }
    }

    /**
     * 更新效果（每帧调用）
     * @param {Enemy} enemy - 受影响的敌人
     * @returns {number} - 本帧造成的伤害
     */
    update(enemy) {
        if (this.stackBehavior === 'independent' && this.stackDurations) {
            for (let i = this.stackDurations.length - 1; i >= 0; i--) {
                this.stackDurations[i]--;
                if (this.stackDurations[i] <= 0) {
                    this.stackDurations.splice(i, 1);
                    this.stackMaxDurations.splice(i, 1);
                }
            }
            this.syncStackSummary();
        } else if (this.duration > 0) {
            this.duration--;
        }

        // 根据效果类型应用效果
        let damage = 0;
        switch (this.type) {
            case 'dot': // 持续伤害 (Damage Over Time)
                damage = this.calculateDotDamage(enemy);
                break;
            case 'debuff': // 减益效果 (不造成伤害)
                // 减益效果在其他地方应用（如移动速度、易伤）
                break;
            case 'cc': // 控制效果 (Crowd Control)
                // 控制效果影响敌人行为（如冰冻）
                break;
        }

        return damage;
    }

    /**
     * 计算持续伤害
     */
    calculateDotDamage(enemy) {
        let damage = 0;

        // 基础伤害
        if (this.params.damagePerFrame > 0) {
            damage += this.params.damagePerFrame;
        }

        // 叠加伤害
        if (this.params.damagePerStack > 0) {
            damage += this.params.damagePerStack * this.getStackCount();
        }

        // 易伤加成 (通过 statusEffects 管理器访问)
        // 注：冰冻效果本身不增加伤害，冰霜武器会同时施加冰冻+易伤两个独立效果
        if (enemy.statusEffects && typeof enemy.statusEffects.getVulnerabilityMultiplier === 'function') {
            damage *= enemy.statusEffects.getVulnerabilityMultiplier();
        }

        return damage;
    }

    /**
     * 叠加效果
     * @param {number} additionalStacks - 增加的层数
     * @param {number} newDuration - 新的持续时间
     */
    stack(additionalStacks = 1, newDuration = null) {
        if (this.stackBehavior === 'independent' && this.stackDurations) {
            const stackDuration = newDuration !== null ? newDuration : this.duration;
            this.addStacks(additionalStacks, stackDuration);
            return;
        }

        this.stacks = Math.min(this.stacks + additionalStacks, this.maxStacks);

        // 刷新持续时间
        if (newDuration !== null) {
            this.duration = Math.max(this.duration, newDuration);
            this.maxDuration = Math.max(this.maxDuration, newDuration);
        }
    }

    /**
     * 叠加独立计时的效果层数
     */
    addStacks(additionalStacks = 1, duration = null) {
        if (this.stackBehavior !== 'independent' || !this.stackDurations) {
            this.stack(additionalStacks, duration);
            return;
        }

        const stackDuration = Number.isFinite(duration) ? duration : this.duration;
        const stacksToAdd = Math.max(0, additionalStacks);
        for (let i = 0; i < stacksToAdd; i++) {
            this.stackDurations.push(stackDuration);
            this.stackMaxDurations.push(stackDuration);
            if (this.stackDurations.length > this.maxStacks) {
                this.stackDurations.shift();
                this.stackMaxDurations.shift();
            }
        }
        this.syncStackSummary();
    }

    /**
     * 消耗效果层数
     * @param {number} count - 要消耗的层数
     * @returns {number} - 实际消耗的层数
     */
    consumeStacks(count = 1) {
        const toRemove = Math.max(0, count);

        if (this.stackBehavior === 'independent' && this.stackDurations) {
            const removeCount = Math.min(toRemove, this.stackDurations.length);
            for (let i = 0; i < removeCount; i++) {
                this.stackDurations.shift();
                this.stackMaxDurations.shift();
            }
            this.syncStackSummary();
            return removeCount;
        }

        const before = this.stacks;
        this.stacks = Math.max(0, this.stacks - toRemove);
        if (this.stacks === 0) {
            this.duration = 0;
            this.maxDuration = 0;
        }
        return before - this.stacks;
    }

    /**
     * 获取当前层数
     */
    getStackCount() {
        if (this.stackBehavior === 'independent' && this.stackDurations) {
            return this.stackDurations.length;
        }
        return this.stacks;
    }

    /**
     * 同步独立层数的汇总时长
     */
    syncStackSummary() {
        if (!this.stackDurations) return;

        this.stacks = this.stackDurations.length;
        if (this.stackDurations.length === 0) {
            this.duration = 0;
            this.maxDuration = 0;
            return;
        }

        this.duration = Math.max(...this.stackDurations);
        this.maxDuration = Math.max(...this.stackMaxDurations);
    }

    /**
     * 效果是否已过期
     */
    isExpired() {
        if (this.stackBehavior === 'independent' && this.stackDurations) {
            return this.stackDurations.length === 0;
        }
        return this.duration <= 0;
    }

    /**
     * 获取进度百分比
     */
    getProgress() {
        if (this.stackBehavior === 'independent' && this.stackDurations) {
            const totalMax = this.stackMaxDurations.reduce((sum, value) => sum + value, 0);
            if (totalMax <= 0) return 0;
            const totalCurrent = this.stackDurations.reduce((sum, value) => sum + Math.max(0, value), 0);
            return totalCurrent / totalMax;
        }
        if (this.maxDuration <= 0) return 0;
        return this.duration / this.maxDuration;
    }
}

