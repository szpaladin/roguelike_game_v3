import { UPGRADE_TABLE, getUpgradeSummary } from './MetaUpgrades.js';

export default class BaseScreen {
    constructor(metaStore, options = {}) {
        this.metaStore = metaStore;
        this.onStart = options.onStart || null;
        this.onOpen = options.onOpen || null;
        this.onClose = options.onClose || null;

        this.baseRoot = document.getElementById('base-root');
        this.gameRoot = document.getElementById('game-root');
        this.runsEl = document.getElementById('base-runs');
        this.bestDepthEl = document.getElementById('base-best-depth');
        this.goldEl = document.getElementById('base-gold');
        this.upgradeList = document.getElementById('base-upgrade-list');
        this.logEl = document.getElementById('base-log');
        this.loadoutTip = document.getElementById('base-loadout-tip');
        this.startBtn = document.getElementById('base-start-btn');

        if (this.startBtn) {
            this.startBtn.onclick = () => {
                if (this.onStart) this.onStart();
            };
        }
    }

    open() {
        if (!this.baseRoot && !this.gameRoot) return;
        this.render();
        if (this.gameRoot) this.gameRoot.style.display = 'none';
        if (this.baseRoot) this.baseRoot.style.display = 'flex';
        if (this.onOpen) this.onOpen();
    }

    close() {
        if (this.baseRoot) this.baseRoot.style.display = 'none';
        if (this.gameRoot) this.gameRoot.style.display = 'block';
        if (this.onClose) this.onClose();
    }

    isOpen() {
        return this.baseRoot && this.baseRoot.style.display === 'flex';
    }

    render() {
        const meta = this.metaStore.getProgress();
        if (this.runsEl) this.runsEl.textContent = String(meta.stats.runs || 0);
        if (this.bestDepthEl) this.bestDepthEl.textContent = String(meta.stats.bestDepth || 0);
        if (this.goldEl) this.goldEl.textContent = String(meta.gold || 0);

        this.renderUpgrades(meta);
        this.renderLog(meta);

        if (this.loadoutTip) {
            this.loadoutTip.style.display = 'block';
        }
    }

    renderUpgrades(meta) {
        if (!this.upgradeList) return;
        this.upgradeList.innerHTML = '';

        Object.keys(UPGRADE_TABLE).forEach((key) => {
            const summary = getUpgradeSummary(meta, key);
            if (!summary) return;

            const card = document.createElement('div');
            card.className = 'base-upgrade-card';

            const levelText = `${summary.level}/${summary.maxLevel}`;
            const valueText = `+${summary.perLevel} / 等级`;
            const costText = summary.maxed ? '已满级' : `花费 ${summary.cost}`;

            card.innerHTML = `
                <div class="base-upgrade-info">
                    <div class="base-upgrade-name">${summary.label}</div>
                    <div class="base-upgrade-meta">等级 ${levelText} · ${valueText}</div>
                </div>
                <button class="btn base-upgrade-btn" ${summary.maxed ? 'disabled' : ''}>
                    ${costText}
                </button>
            `;

            const btn = card.querySelector('.base-upgrade-btn');
            if (btn && !summary.maxed) {
                btn.onclick = () => {
                    const ok = this.metaStore.purchaseUpgrade(key);
                    if (ok) this.render();
                };
                if (!summary.cost || meta.gold < summary.cost) {
                    btn.disabled = true;
                }
            }

            this.upgradeList.appendChild(card);
        });
    }

    renderLog(meta) {
        if (!this.logEl) return;
        const last = meta.stats.lastResult;
        if (!last) {
            this.logEl.innerHTML = '<div class="base-log-empty">暂无航行记录</div>';
            return;
        }
        const title = last.type === 'evacuation' ? '撤离成功' : '本轮潜水';
        this.logEl.innerHTML = `
            <div class="base-log-title">${title}</div>
            <div class="base-log-row">金币收益：+${last.goldEarned || 0}</div>
            <div class="base-log-row">距离奖励：+${last.distanceBonus || 0}</div>
            <div class="base-log-row">最远距离：${last.distance || 0}m</div>
        `;
    }
}
