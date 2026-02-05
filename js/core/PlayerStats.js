/**
 * PlayerStats - 玩家属性管理类
 * 管理玩家的生命值、等级、经验、力量、智力、防御力、技能点和金币
 */
export default class PlayerStats {
    constructor() {
        this.hp = 100;
        this.maxHp = 100;
        this.level = 1;
        this.exp = 0;
        this.expToNext = 10;
        this.strength = 5;       // 力量：影响武器直接伤害 (伤害 = 武器倍率 * (力量+45)/10)
        this.intelligence = 5;   // 智力：影响DOT伤害 (DOT = 基础DOT * (智力+45)/50)
        this.defense = 2;
        this.speed = 3;
        this.skillPoints = 0;
        this.gold = 0;
        this.pendingLevelUpBonuses = [];
    }

    /**
     * 获得经验值，可能触发升级
     * @param {number} amount - 经验值数量
     */
    gainExp(amount) {
        this.exp += amount;
        while (this.exp >= this.expToNext) {
            this.levelUp();
        }
    }

    /**
     * 升级
     * - 生命上限: +5
     * - 当前生命值: 按比例保持（如升级前 50%，升级后仍为新上限的 50%）
     * - 经验需求: 下一级所需经验增加 20%
     */
    levelUp() {
        // 记录当前生命值比例
        const hpRatio = this.hp / this.maxHp;

        // 扣除经验并提升等级
        this.exp -= this.expToNext;
        this.level++;
        this.skillPoints++;

        // 更新属性
        this.expToNext = Math.floor(this.expToNext * 1.2);
        this.maxHp += 5;

        // 按比例恢复生命值
        this.hp = Math.floor(this.maxHp * hpRatio);

        // Randomly increase strength or intelligence by 1 on level up.
        const bonusStat = Math.random() < 0.5 ? 'strength' : 'intelligence';
        this[bonusStat] += 1;
        this.pendingLevelUpBonuses.push({ stat: bonusStat, amount: 1 });
    }

    /**
     * 受到伤害
     * @param {number} damage - 敌人攻击力
     * @returns {number} - 实际受到的伤害值
     */
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - (this.defense || 0));
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }

    /**
     * 治疗
     * @param {number} amount - 治疗量
     */
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    /**
     * 检查玩家是否存活
     * @returns {boolean}
     */
    isAlive() {
        return this.hp > 0;
    }

    /**
     * 增加金币
     * @param {number} amount - 金币数量
     */
    addGold(amount) {
        this.gold += amount;
    }

    /**
     * 使用技能点
     * @returns {boolean} - 是否成功使用
     */
    useSkillPoint() {
        if (this.skillPoints > 0) {
            this.skillPoints--;
            return true;
        }
        return false;
    }

    /**
     * 使用技能点提升生命上限
     */
    upgradeMaxHp() {
        if (this.useSkillPoint()) {
            this.maxHp += 20;
            this.hp += 20;
            return true;
        }
        return false;
    }

    /**
     * 使用技能点提升力量
     */
    upgradeStrength() {
        if (this.useSkillPoint()) {
            this.strength += 5;
            return true;
        }
        return false;
    }

    /**
     * 使用技能点提升防御力
     */
    upgradeDefense() {
        if (this.useSkillPoint()) {
            this.defense += 1;
            return true;
        }
        return false;
    }

    /**
     * 使用技能点提升速度
     */
    upgradeSpeed() {
        if (this.useSkillPoint()) {
            this.speed += 0.2;
            return true;
        }
        return false;
    }

    /**
     * Read and clear pending level-up bonuses.
     * @returns {Array<{stat: string, amount: number}>}
     */
    consumeLevelUpBonuses() {
        const bonuses = this.pendingLevelUpBonuses.slice();
        this.pendingLevelUpBonuses.length = 0;
        return bonuses;
    }

    /**
     * 序列化为 JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            level: this.level,
            exp: this.exp,
            expToNext: this.expToNext,
            strength: this.strength,
            intelligence: this.intelligence,
            defense: this.defense,
            speed: this.speed,
            skillPoints: this.skillPoints,
            gold: this.gold
        };
    }
}
