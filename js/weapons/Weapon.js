/**
 * Weapon - 武器基类
 * 管理单个武器的冷却与发射逻辑
 */
export default class Weapon {
    /**
     * @param {Object} definition - 武器定义数据（来自 WEAPONS）
     */
    constructor(definition) {
        this.def = definition;
        this.name = definition.name;
        this.color = definition.color;
        this.cooldown = 0;
    }

    /**
     * 更新冷却时间
     */
    update(cooldownStep = 1) {
        if (this.cooldown > 0) {
            this.cooldown = Math.max(0, this.cooldown - cooldownStep);
        }
    }

    /**
     * 是否可以发射
     */
    canFire() {
        return this.cooldown <= 0;
    }

    /**
     * 发射武器
     * @param {number} startX - 发射起始位置 X
     * @param {number} startY - 发射起始位置 Y（世界坐标）
     * @param {Object} targetPos - 目标位置 {x, y}（世界坐标）
     * @param {number} playerAttack - 玩家攻击力
     * @returns {Object} - 子弹初始化数据
     */
    fire(startX, startY, targetPos, playerAttack = 5) {
        if (!this.canFire()) return null;

        // 计算速度向量
        const dx = targetPos.x - startX;
        const dy = targetPos.y - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 如果没有距离（目标与起点重合），默认向上发射
        let vx = 0;
        let vy = -this.def.speed;

        if (dist > 0) {
            vx = (dx / dist) * this.def.speed;
            vy = (dy / dist) * this.def.speed;
        }

        // 重置冷却
        this.cooldown = this.def.interval;

        // 计算最终伤害 = 武器伤害倍率 * 力量 / 10
        const baseAttack = Number.isFinite(playerAttack) ? playerAttack : 0;
        const effectiveAttack = baseAttack + 45;
        const finalDamage = this.def.damage * (effectiveAttack / 10);

        // 返回子弹数据（合并武器定义的所有属性）
        return {
            x: startX,
            y: startY,
            vx,
            vy,
            ...this.def,
            damage: finalDamage, // 瑕嗙洊浼ゅ涓烘渶缁堣绠楀€?
            active: true
        };
    }

    /**
     * 带扩散角度发射武器
     * @param {number} startX - 发射起始位置 X
     * @param {number} startY - 发射起始位置 Y（世界坐标）
     * @param {Object} targetPos - 目标位置 {x, y}（世界坐标）
     * @param {number} playerAttack - 玩家攻击力
     * @param {number} spreadAngle - 扩散角度（弧度）
     * @returns {Object} - 子弹初始化数据
     */
    fireWithSpread(startX, startY, targetPos, playerAttack = 5, spreadAngle = 0) {
        if (!this.canFire()) return null;

        // 计算基础角度
        const dx = targetPos.x - startX;
        const dy = targetPos.y - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 计算带扩散的角度
        let angle = Math.atan2(dy, dx) + spreadAngle;

        // 如果没有距离（目标与起点重合），默认向上发射
        let vx, vy;
        if (dist > 0) {
            vx = Math.cos(angle) * this.def.speed;
            vy = Math.sin(angle) * this.def.speed;
        } else {
            vx = 0;
            vy = -this.def.speed;
        }

        // 重置冷却
        this.cooldown = this.def.interval;

        // 计算最终伤害 = 武器伤害倍率 * 力量 / 10
        const baseAttack = Number.isFinite(playerAttack) ? playerAttack : 0;
        const effectiveAttack = baseAttack + 45;
        const finalDamage = this.def.damage * (effectiveAttack / 10);

        // 返回子弹数据（合并武器定义的所有属性）
        return {
            x: startX,
            y: startY,
            vx,
            vy,
            ...this.def,
            damage: finalDamage, // 瑕嗙洊浼ゅ涓烘渶缁堣绠楀€?
            active: true
        };
    }
}


