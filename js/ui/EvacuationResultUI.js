/**
 * EvacuationResultUI - 撤离结算界面
 * 显示本局收益明细，区分成功撤离和死亡两种情况
 */
export default class EvacuationResultUI {
    constructor() {
        this.overlay = null;
        this.container = null;
        this.onContinueCallback = null;
        this.init();
    }

    /**
     * 初始化 UI 元素
     */
    init() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.id = 'evacuation-result-overlay';
        this.overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        `;

        // 创建内容容器
        this.container = document.createElement('div');
        this.container.id = 'evacuation-result-container';
        this.container.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #00ff64;
            border-radius: 16px;
            padding: 32px;
            min-width: 320px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 0 30px rgba(0, 255, 100, 0.3);
        `;

        this.overlay.appendChild(this.container);
        document.body.appendChild(this.overlay);
    }

    /**
     * 显示撤离成功结算
     * @param {Object} result - 结算结果
     */
    showSuccess(result) {
        this.container.innerHTML = `
            <h2 style="color: #00ff64; margin: 0 0 24px 0; font-size: 28px;">
                🚀 撤离成功！
            </h2>
            <div style="color: #fff; text-align: left; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px; background: rgba(0,255,100,0.1); border-radius: 8px;">
                    <span>💰 金币收益</span>
                    <span style="color: #ffd700;">+${result.goldEarned}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px; background: rgba(0,255,100,0.1); border-radius: 8px;">
                    <span>📏 距离奖励</span>
                    <span style="color: #00bfff;">+${result.distanceBonus}</span>
                </div>
                ${result.newWeapons.length > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px; background: rgba(0,255,100,0.1); border-radius: 8px;">
                    <span>🔫 解锁武器</span>
                    <span style="color: #ff69b4;">${result.newWeapons.length} 把</span>
                </div>
                ` : ''}
            </div>
            <button id="evacuation-continue-btn" style="
                background: linear-gradient(135deg, #00ff64 0%, #00cc50 100%);
                border: none;
                padding: 14px 48px;
                font-size: 18px;
                font-weight: bold;
                color: #000;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
            ">继续</button>
        `;

        this.bindContinueButton();
        this.show();
    }

    /**
     * 显示死亡结算
     * @param {Object} result - 结算结果
     * @param {number} goldRetentionPercent - 金币保留百分比（如 60 表示 60%）
     */
    showDeath(result, goldRetentionPercent = 50) {
        this.container.innerHTML = `
            <h2 style="color: #ff4444; margin: 0 0 24px 0; font-size: 28px;">
                💀 噶了，小问题
            </h2>
            <div style="color: #fff; text-align: left; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px; background: rgba(255,68,68,0.1); border-radius: 8px;">
                    <span>💰 金币收益</span>
                    <span style="color: #ffd700;">+${result.goldEarned}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px; background: rgba(255,68,68,0.1); border-radius: 8px;">
                    <span>📏 距离奖励</span>
                    <span style="color: #00bfff;">+${result.distanceBonus}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px; background: rgba(255,68,68,0.1); border-radius: 8px;">
                    <span>🎒 带回道具</span>
                    <span style="color: #888;">空</span>
                </div>
                <div style="color: #888; font-size: 12px; margin-top: 16px; text-align: center;">
                    ⚠️ 当前区域内死亡获取本次探索 ${goldRetentionPercent}% 金币收益
                </div>
            </div>
            <button id="evacuation-continue-btn" style="
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
                border: none;
                padding: 14px 48px;
                font-size: 18px;
                font-weight: bold;
                color: #fff;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
            ">重新开始</button>
        `;

        this.bindContinueButton();
        this.show();
    }

    /**
     * 绑定继续按钮事件
     */
    bindContinueButton() {
        const btn = document.getElementById('evacuation-continue-btn');
        if (btn) {
            btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
            btn.onmouseout = () => btn.style.transform = 'scale(1)';
            btn.onclick = () => {
                this.hide();
                if (this.onContinueCallback) {
                    this.onContinueCallback();
                }
            };
        }
    }

    /**
     * 设置继续按钮回调
     * @param {Function} callback
     */
    onContinue(callback) {
        this.onContinueCallback = callback;
    }

    /**
     * 显示界面
     */
    show() {
        if (this.overlay) {
            this.overlay.style.display = 'flex';
        }
    }

    /**
     * 隐藏界面
     */
    hide() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }

    /**
     * 是否可见
     * @returns {boolean}
     */
    isVisible() {
        return this.overlay && this.overlay.style.display === 'flex';
    }
}
