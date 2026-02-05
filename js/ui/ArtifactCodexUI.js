import { ARTIFACTS, ARTIFACT_MAP } from '../artifacts/ArtifactData.js';

function safeText(value) {
    return value === undefined || value === null ? '' : String(value);
}

export default class ArtifactCodexUI {
    constructor(opts = {}) {
        this.getPaused = opts.getPaused || (() => false);
        this.setPaused = opts.setPaused || (() => { });
        this.isBlocked = opts.isBlocked || (() => false);

        this._prevPaused = false;

        this.overlay = null;
        this.dialog = null;
        this.grid = null;
        this.searchInput = null;
        this.countEl = null;

        this.detailOverlay = null;
        this.detailDialog = null;

        this.artifactEntries = this.buildArtifactEntries();
    }

    init() {
        this.injectButton();
        this.ensureDom();
        this.renderList('');
    }

    buildArtifactEntries() {
        return (ARTIFACTS || []).map((def) => ({
            id: def.id,
            name: def.name || def.id,
            icon: def.icon || '🎁',
            def
        }));
    }

    injectButton() {
        const panel = document.querySelector('.inventory-panel');
        if (!panel) return;
        const title = panel.querySelector('h2');
        if (!title) return;
        if (panel.querySelector('.artifact-codex-open-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'codex-open-btn artifact-codex-open-btn';
        btn.textContent = '图鉴';
        btn.onclick = () => this.open();
        title.appendChild(btn);
    }

    ensureDom() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'artifact-codex-overlay';
            this.overlay.className = 'overlay codex-overlay';
            this.overlay.style.display = 'none';
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.closeAll();
            });

            this.dialog = document.createElement('div');
            this.dialog.className = 'dialog codex-dialog';

            const header = document.createElement('div');
            header.className = 'codex-header';
            header.innerHTML = `
                <h2 class="codex-title">道具图鉴</h2>
                <button type="button" class="codex-close-btn" aria-label="关闭图鉴">关闭</button>
            `;
            header.querySelector('.codex-close-btn').onclick = () => this.closeAll();

            const toolbar = document.createElement('div');
            toolbar.className = 'codex-toolbar';
            toolbar.innerHTML = `
                <input class="codex-search" type="search" placeholder="搜索道具（名称/ID）" />
                <div class="codex-count"></div>
            `;

            this.searchInput = toolbar.querySelector('.codex-search');
            this.countEl = toolbar.querySelector('.codex-count');
            this.searchInput.addEventListener('input', () => this.renderList(this.searchInput.value));
            this.searchInput.addEventListener('keydown', (e) => e.stopPropagation());
            this.searchInput.addEventListener('keyup', (e) => e.stopPropagation());

            this.grid = document.createElement('div');
            this.grid.className = 'codex-grid';
            this.grid.addEventListener('click', (e) => {
                const card = e.target.closest('[data-artifact-id]');
                if (!card) return;
                const artifactId = card.getAttribute('data-artifact-id');
                if (artifactId) this.openDetail(artifactId);
            });

            this.dialog.appendChild(header);
            this.dialog.appendChild(toolbar);
            this.dialog.appendChild(this.grid);
            this.dialog.addEventListener('keydown', (e) => e.stopPropagation());
            this.dialog.addEventListener('keyup', (e) => e.stopPropagation());
            this.overlay.appendChild(this.dialog);
            document.body.appendChild(this.overlay);
        }

        if (!this.detailOverlay) {
            this.detailOverlay = document.createElement('div');
            this.detailOverlay.id = 'artifact-codex-detail-overlay';
            this.detailOverlay.className = 'overlay codex-overlay codex-detail-overlay';
            this.detailOverlay.style.display = 'none';
            this.detailOverlay.addEventListener('click', (e) => {
                if (e.target === this.detailOverlay) this.closeDetail();
            });

            this.detailDialog = document.createElement('div');
            this.detailDialog.className = 'dialog codex-dialog codex-detail-dialog';
            this.detailDialog.addEventListener('keydown', (e) => e.stopPropagation());
            this.detailDialog.addEventListener('keyup', (e) => e.stopPropagation());

            this.detailOverlay.appendChild(this.detailDialog);
            document.body.appendChild(this.detailOverlay);
        }
    }

    open() {
        if (this.isOpen()) return;
        if (this.isBlocked()) return;

        this.ensureDom();

        this._prevPaused = !!this.getPaused();
        this.setPaused(true);

        this.overlay.style.display = 'flex';
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
        }
        this.renderList('');
    }

    closeAll() {
        this.closeDetail();
        if (this.overlay) this.overlay.style.display = 'none';
        this.setPaused(this._prevPaused);
    }

    closeDetail() {
        if (this.detailOverlay) this.detailOverlay.style.display = 'none';
        if (this.detailDialog) this.detailDialog.innerHTML = '';
    }

    closeTop() {
        if (this.isDetailOpen()) this.closeDetail();
        else this.closeAll();
    }

    handleEscape() {
        if (!this.isOpen()) return false;
        this.closeTop();
        return true;
    }

    isOpen() {
        return !!(this.overlay && this.overlay.style.display === 'flex');
    }

    isDetailOpen() {
        return !!(this.detailOverlay && this.detailOverlay.style.display === 'flex');
    }

    renderList(query) {
        if (!this.grid) return;
        const q = safeText(query).trim().toLowerCase();
        const entries = !q
            ? this.artifactEntries
            : this.artifactEntries.filter((entry) => {
                return entry.name.toLowerCase().includes(q) || entry.id.toLowerCase().includes(q);
            });

        if (this.countEl) {
            this.countEl.textContent = `${entries.length}/${this.artifactEntries.length}`;
        }

        if (!entries.length) {
            this.grid.innerHTML = '<div class="codex-muted">暂无匹配的道具</div>';
            return;
        }

        const cardHtml = (entry) => `
            <button type="button" class="codex-card" data-artifact-id="${entry.id}">
                <div class="codex-card-icon">${entry.icon}</div>
                <div class="codex-card-name">${entry.name}</div>
            </button>
        `;

        this.grid.innerHTML = `
            <div class="codex-group-grid">
                ${entries.map(cardHtml).join('')}
            </div>
        `;
    }

    openDetail(artifactId) {
        const def = ARTIFACT_MAP[artifactId];
        if (!def) return;

        this.detailDialog.innerHTML = `
            <div class="codex-detail-header">
                <div class="codex-detail-title">
                    <div class="codex-detail-icon">${def.icon || '🎁'}</div>
                    <div class="codex-detail-meta">
                        <div class="codex-detail-name">${safeText(def.name || def.id)}</div>
                        <div class="codex-detail-tier">${safeText(def.id)}</div>
                    </div>
                </div>
                <button type="button" class="codex-back-btn">返回</button>
            </div>

            <div class="codex-section">
                <div class="codex-section-title">描述</div>
                <div class="codex-desc-item">${safeText(def.desc) || '（待补全）'}</div>
            </div>

            <div class="codex-section">
                <div class="codex-section-title">效果</div>
                <div class="codex-effects">${safeText(def.effectDesc) || '（待补全）'}</div>
            </div>

            <div class="codex-section">
                <div class="codex-section-title">代价</div>
                <div class="codex-effects">${safeText(def.drawbackDesc) || '（待补全）'}</div>
            </div>

            <div class="codex-section">
                <div class="codex-section-title">来源</div>
                <div class="codex-desc-item">宝箱掉落（每 3~4 个宝箱出现一次）</div>
            </div>
        `;

        this.detailDialog.querySelector('.codex-back-btn').onclick = () => this.closeDetail();
        this.detailOverlay.style.display = 'flex';
    }
}
