/**
 * GameOverUI - 游戏结束界面
 * 负责展示最终得分、等级和重新开始功能
 */
export default class GameOverUI {
    constructor() {
        this.screen = document.getElementById('game-over');
        this.scoreText = document.getElementById('final-score');
        this.levelText = document.getElementById('final-level');
        this.restartBtn = document.getElementById('restart-btn');
    }

    /**
     * 显示结算界面
     * @param {number} score - 最终得分/距离
     * @param {number} level - 最终等级
     */
    show(score, level) {
        if (this.scoreText) this.scoreText.textContent = String(score);
        if (this.levelText) this.levelText.textContent = String(level);
        // 使用 flex 而非 block，以启用 overlay 的 flexbox 居中布局
        if (this.screen) this.screen.style.display = 'flex';
    }

    /**
     * 隐藏结算界面
     */
    hide() {
        if (this.screen) this.screen.style.display = 'none';
    }

    /**
     * 绑定重新开始回调
     * @param {Function} callback 
     */
    onRestart(callback) {
        if (this.restartBtn) {
            this.restartBtn.onclick = callback;
        }
    }

    isVisible() {
        return this.screen && this.screen.style.display === 'flex';
    }
}
