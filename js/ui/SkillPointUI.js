/**
 * SkillPointUI - 技能点指示器
 * 显示在屏幕左下角，提示玩家可以按 E 键升级
 */
export default class SkillPointUI {
    constructor() {
        this.container = document.getElementById('skill-point-ui');
        this.countDisplay = document.getElementById('skill-count-ui');
    }

    /**
     * 更新显示状态
     * @param {number} skillPoints - 当前技能点数量
     */
    update(skillPoints) {
        if (!this.container) return;

        if (skillPoints > 0) {
            this.container.style.display = 'flex';
            if (this.countDisplay) {
                this.countDisplay.textContent = `(${skillPoints})`;
            }
        } else {
            this.container.style.display = 'none';
        }
    }

    /**
     * 隐藏指示器
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * 显示指示器
     */
    show(skillPoints) {
        if (this.container && skillPoints > 0) {
            this.container.style.display = 'flex';
            if (this.countDisplay) {
                this.countDisplay.textContent = `(${skillPoints})`;
            }
        }
    }
}
