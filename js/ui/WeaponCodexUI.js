import {
    WEAPONS,
    WEAPON_ICON_MAP,
    WEAPON_ID_MAP,
    WEAPON_EVOLUTION_TABLE,
    WEAPON_TIER
} from '../weapons/WeaponsData.js';
import { STATUS_EFFECTS } from '../enemies/StatusEffects.js';

const FPS = 60;

const TIER_LABEL = {
    [WEAPON_TIER.INITIAL]: '初始',
    [WEAPON_TIER.BASIC]: '基础',
    [WEAPON_TIER.EVOLUTION]: '进化',
    [WEAPON_TIER.FUSION]: '融合'
};

const STATUS_TYPE_LABEL = {
    dot: 'DOT',
    debuff: 'DEBUFF',
    cc: 'CC'
};

const STATUS_TYPE_NAME = {
    dot: '持续伤害',
    debuff: '减益',
    cc: '控制'
};

const STATUS_TYPE_ORDER = {
    dot: 1,
    debuff: 2,
    cc: 3
};

const GROUPS = [
    {
        key: 'basic',
        label: '基础',
        predicate: (tier) => tier === WEAPON_TIER.INITIAL || tier === WEAPON_TIER.BASIC
    },
    {
        key: 'evolution',
        label: '进化',
        predicate: (tier) => tier === WEAPON_TIER.EVOLUTION
    },
    {
        key: 'fusion',
        label: '融合',
        predicate: (tier) => tier === WEAPON_TIER.FUSION
    }
];

const ATTACK_RULES = [
    {
        key: 'ray',
        label: '射线',
        icon: '🔦',
        test: (def) => !!(def && (def.rayRange || def.rayLength))
    },
    {
        key: 'full_screen',
        label: '全屏',
        icon: '🌕',
        test: (def) => !!(def && def.fullScreenDamage)
    },
    {
        key: 'aoe',
        label: '圆形 AOE',
        icon: '⭕',
        test: (def) => !!(def && def.aoeRadius)
    },
    {
        key: 'explosion',
        label: '爆炸',
        icon: '💥',
        test: (def) => !!(def && def.explosionRadius)
    },
    {
        key: 'chain',
        label: '连锁',
        icon: '⚡',
        test: (def) => !!(def && def.chainCount)
    },
    {
        key: 'piercing',
        label: '穿透',
        icon: '🗡️',
        test: (def) => !!(def && def.piercing)
    },
    {
        key: 'split',
        label: '分裂',
        icon: '🧬',
        test: (def) => !!(def && def.canSplit)
    },
    {
        key: 'sky_drop',
        label: '天降/落点',
        icon: '🌠',
        test: (def) => !!(def && def.spawnMode === 'sky_drop')
    }
];

const ATTACK_GROUPS = [
    ...ATTACK_RULES.map(({ key, label, icon }) => ({ key, label, icon })),
    { key: 'straight', label: '直线弹道', icon: '➡️' }
];

const ATTACK_GROUP_MAP = ATTACK_GROUPS.reduce((acc, group) => {
    acc[group.key] = group;
    return acc;
}, {});

const STATUS_WEAPON_FIELDS = {
    burning: ['burnDuration'],
    dark_flame: ['darkFlameDuration'],
    abyss_sacrifice: ['abyssSacrificeDuration'],
    frozen: ['freezeChance', 'freezeDuration'],
    poisoned: ['poisonDuration'],
    plagued: ['plagueDuration'],
    overgrowth: ['overgrowthDuration'],
    cursed: ['curseDuration'],
    ridge_control: ['terrainOnHit'],
    blinded: ['blindChance'],
    vulnerable: ['vulnerability'],
    radiation_vulnerable: ['radiationVulnerability'],
    lightning_rod: ['lightningRodDuration'],
    execute: ['executeChance', 'executeChainChance', 'executeOnShatterChance', 'executeOnShatterChainChance']
};

function fmtFrames(frames) {
    if (frames === undefined || frames === null) return '';
    const sec = (Number(frames) / FPS);
    return `${frames}f (${sec.toFixed(2)}s)`;
}

function fmtBool(v) {
    return v ? '是' : '否';
}

function safeText(s) {
    return (s === undefined || s === null) ? '' : String(s);
}

function buildWeaponsById() {
    const map = {};
    for (const def of Object.values(WEAPONS)) {
        if (def && def.id) map[def.id] = def;
    }
    return map;
}

function buildStatusById() {
    const map = {};
    for (const def of Object.values(STATUS_EFFECTS)) {
        if (def && def.id) map[def.id] = def;
    }
    return map;
}

function fmtStackBehavior(value) {
    if (!value) return '刷新时长';
    if (value === 'independent') return '独立计时';
    return value;
}

function fmtPercent(value) {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'number') return `${Math.round(value * 100)}%`;
    return String(value);
}

function fmtNumber(value, digits = 4) {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value !== 'number') return String(value);
    if (Number.isInteger(value)) return `${value}`;
    const fixed = value.toFixed(digits);
    return fixed.replace(/\.?0+$/, '');
}

function fmtMultiplier(value, digits = 2) {
    const num = fmtNumber(value, digits);
    if (!num) return '';
    return `x${num}`;
}

const STATUS_CORE_FIELDS = [
    { key: 'defaultDamagePerFrame', label: '每帧伤害', format: (v) => `${fmtNumber(v)}/f` },
    { key: 'defaultDamagePerStack', label: '每层伤害', format: (v) => `${fmtNumber(v)}/f` },
    { key: 'defaultHeal', label: '死亡回复' },
    { key: 'defaultSlowAmount', label: '减速比例', format: fmtPercent },
    { key: 'defaultSlowDuration', label: '减速持续', format: fmtFrames },
    { key: 'defaultVulnerabilityAmount', label: '易伤增幅', format: fmtPercent },
    { key: 'defaultTriggerStacks', label: '触发层数' },
    { key: 'defaultLength', label: '长度' },
    { key: 'defaultWidth', label: '宽度' },
    { key: 'defaultExplosionRadius', label: '爆炸半径' },
    { key: 'defaultExplosionMultiplier', label: '爆炸倍率', format: fmtMultiplier },
    { key: 'defaultConsumeStacks', label: '消耗层数' },
    { key: 'defaultDamageMultiplier', label: '触发倍率', format: fmtMultiplier }
];

const STATUS_ADVANCED_FIELDS = [
    { key: 'cloudRadius', label: '云雾半径' },
    { key: 'spreadInterval', label: '扩散间隔', format: fmtFrames },
    { key: 'spreadRadius', label: '扩散半径' },
    { key: 'spreadStacks', label: '扩散层数' },
    { key: 'deathCloudDuration', label: '死亡云持续', format: fmtFrames },
    { key: 'deathCloudInterval', label: '死亡云间隔', format: fmtFrames },
    { key: 'deathCloudRadius', label: '死亡云半径' },
    { key: 'deathCloudStacks', label: '死亡云层数' }
];

function deriveEffects(def) {
    if (!def) return '（待补全）';
    if (def.effects) return def.effects;

    const tags = [];
    if (def.canSplit) tags.push('分裂');
    if (def.piercing) tags.push('穿透');
    if (def.aoeRadius || def.explosionRadius) tags.push('范围伤害');
    if (def.rayRange || def.rayLength) tags.push('射线');
    if (def.chainCount) tags.push('连锁');
    if (def.burnDuration) tags.push('燃烧');
    if (def.darkFlameDuration) tags.push('黑焰');
    if (def.abyssSacrificeDuration) tags.push('海渊献祭');
    if (def.poisonDuration) tags.push('中毒');
    if (def.plagueDuration) tags.push('瘟疫');
    if (def.overgrowthDuration) tags.push('蔓延');
    if (def.curseDuration) tags.push('诅咒');
    if (def.freezeChance || def.freezeDuration) tags.push('冻结');
    if (def.blindChance || def.blindDuration) tags.push('致盲');
    if (def.lifeStealChance) tags.push('吸血');
    if (def.executeChance || def.executeChainChance || def.executeOnShatterChance || def.executeOnShatterChainChance) {
        tags.push('秒杀');
    }
    if (def.vulnerability || def.radiationVulnerability) tags.push('易伤');

    return tags.length ? tags.join('、') : '（待补全）';
}

function deriveAttackTags(def) {
    if (!def) return ['straight'];
    const tags = ATTACK_RULES.filter(rule => rule.test(def)).map(rule => rule.key);
    if (!tags.length) tags.push('straight');
    return tags;
}

export default class WeaponCodexUI {
    constructor(opts = {}) {
        this.getPaused = opts.getPaused || (() => false);
        this.setPaused = opts.setPaused || (() => { });
        this.isBlocked = opts.isBlocked || (() => false);

        this._prevPaused = false;

        this.weaponsById = buildWeaponsById();

        this.overlay = null;
        this.dialog = null;
        this.grid = null;
        this.searchInput = null;
        this.countEl = null;

        this.detailOverlay = null;
        this.detailDialog = null;

        this.tabsEl = null;

        this.weaponEntries = this.buildWeaponEntries();
        this.attackEntries = this.buildAttackEntries();
        this.statusById = buildStatusById();
        this.statusEntries = this.buildStatusEntries();
        this.activeTab = 'weapons';
    }

    init() {
        this.injectButton();
        this.ensureDom();
        this.setTab(this.activeTab);
    }

    buildWeaponEntries() {
        const entries = Object.values(WEAPON_ID_MAP)
            .slice()
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
            .map(info => {
                const id = info.id;
                const def = this.weaponsById[id];
                return {
                    id,
                    name: (def && def.name) || info.name || id,
                    tier: (def && def.tier) ?? info.tier,
                    icon: WEAPON_ICON_MAP[id] || '??',
                    def: def || null
                };
            });

        return entries;
    }

    buildAttackEntries() {
        return this.weaponEntries.map(entry => ({
            ...entry,
            tags: deriveAttackTags(entry.def)
        }));
    }

    buildStatusEntries() {
        return Object.values(STATUS_EFFECTS)
            .map(def => ({
                id: def.id,
                name: def.name || def.id,
                icon: def.icon || '❔',
                type: def.type,
                color: def.color || '#999999',
                def
            }))
            .sort((a, b) => {
                const typeA = STATUS_TYPE_ORDER[a.type] || 99;
                const typeB = STATUS_TYPE_ORDER[b.type] || 99;
                if (typeA !== typeB) return typeA - typeB;
                return a.name.localeCompare(b.name, 'zh-Hans-CN');
            });
    }

    getStatusSources(statusId) {
        const fields = STATUS_WEAPON_FIELDS[statusId];
        if (!fields || !fields.length) return [];
        return this.weaponEntries.filter(entry => {
            if (!entry.def) return false;
            return fields.some((field) => {
                const value = entry.def[field];
                if (field === 'terrainOnHit') {
                    return value && value.type === 'ridge';
                }
                return value !== undefined && value !== null && value !== 0;
            });
        });
    }

    getEvolutionRecipes(weaponId) {
        const recipes = [];
        for (const recipe of WEAPON_EVOLUTION_TABLE) {
            if (!recipe || !Array.isArray(recipe.materials)) continue;
            if (!recipe.materials.includes(weaponId)) continue;
            const resultId = recipe.result;
            if (!resultId) continue;
            const resultDef = this.weaponsById[resultId];
            const materials = recipe.materials.map((matId) => {
                const matDef = this.weaponsById[matId];
                return {
                    id: matId,
                    name: (matDef && matDef.name) || matId,
                    icon: WEAPON_ICON_MAP[matId] || '??'
                };
            });
            recipes.push({
                materials,
                result: {
                    id: resultId,
                    name: (resultDef && resultDef.name) || recipe.name || resultId,
                    icon: WEAPON_ICON_MAP[resultId] || '??'
                }
            });
        }
        return recipes.sort((a, b) => {
            const aName = a.result.name || a.result.id;
            const bName = b.result.name || b.result.id;
            const cmp = aName.localeCompare(bName, 'zh-Hans-CN');
            if (cmp !== 0) return cmp;
            const aMats = a.materials.map(m => m.name).join('+');
            const bMats = b.materials.map(m => m.name).join('+');
            return aMats.localeCompare(bMats, 'zh-Hans-CN');
        });
    }

    injectButton() {
        const weaponPanel = document.querySelector('.weapon-panel');
        if (!weaponPanel) return;
        const title = weaponPanel.querySelector('h2');
        if (!title) return;

        // Avoid double-inject on hot reloads.
        if (weaponPanel.querySelector('.codex-open-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'codex-open-btn';
        btn.textContent = '图鉴';
        btn.onclick = () => this.open();
        title.appendChild(btn);
    }

    ensureDom() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'codex-overlay';
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
                <h2 class="codex-title">武器图鉴</h2>
                <button type="button" class="codex-close-btn" aria-label="关闭图鉴">关闭</button>
            `;
            header.querySelector('.codex-close-btn').onclick = () => this.closeAll();

            const tabs = document.createElement('div');
            tabs.className = 'codex-tabs';
            tabs.innerHTML = `
                <button type="button" class="codex-tab" data-tab="weapons">武器图鉴</button>
                <button type="button" class="codex-tab" data-tab="status">状态图鉴</button>
                <button type="button" class="codex-tab" data-tab="attack">攻击方式/范围</button>
            `;
            tabs.addEventListener('click', (e) => {
                const btn = e.target.closest('.codex-tab');
                if (!btn) return;
                this.setTab(btn.getAttribute('data-tab'));
            });
            this.tabsEl = tabs;

            const toolbar = document.createElement('div');
            toolbar.className = 'codex-toolbar';
            toolbar.innerHTML = `
                <input class="codex-search" type="search" placeholder="搜索武器（名称/ID）" />
                <div class="codex-count"></div>
            `;

            this.searchInput = toolbar.querySelector('.codex-search');
            this.countEl = toolbar.querySelector('.codex-count');
            this.searchInput.addEventListener('input', () => this.renderActiveList(this.searchInput.value));
            this.searchInput.addEventListener('keydown', (e) => e.stopPropagation());
            this.searchInput.addEventListener('keyup', (e) => e.stopPropagation());

            this.grid = document.createElement('div');
            this.grid.className = 'codex-grid';
            this.grid.addEventListener('click', (e) => {
                const weaponCard = e.target.closest('[data-weapon-id]');
                if (weaponCard) {
                    const weaponId = weaponCard.getAttribute('data-weapon-id');
                    this.openDetail(weaponId);
                    return;
                }
                const statusCard = e.target.closest('[data-status-id]');
                if (!statusCard) return;
                const statusId = statusCard.getAttribute('data-status-id');
                this.openStatusDetail(statusId);
            });

            this.dialog.appendChild(header);
            this.dialog.appendChild(tabs);
            this.dialog.appendChild(toolbar);
            this.dialog.appendChild(this.grid);
            // Prevent game controls while interacting with the codex UI.
            this.dialog.addEventListener('keydown', (e) => e.stopPropagation());
            this.dialog.addEventListener('keyup', (e) => e.stopPropagation());
            this.overlay.appendChild(this.dialog);
            document.body.appendChild(this.overlay);
        }

        if (!this.detailOverlay) {
            this.detailOverlay = document.createElement('div');
            this.detailOverlay.id = 'codex-detail-overlay';
            this.detailOverlay.className = 'overlay codex-overlay codex-detail-overlay';
            this.detailOverlay.style.display = 'none';
            this.detailOverlay.addEventListener('click', (e) => {
                if (e.target === this.detailOverlay) this.closeDetail();
            });

            this.detailDialog = document.createElement('div');
            this.detailDialog.className = 'dialog codex-dialog codex-detail-dialog';
            // Prevent game controls while interacting with the detail view.
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
        }
        this.setTab(this.activeTab);
        if (this.searchInput) {
            this.searchInput.focus();
        }
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

    setTab(tab) {
        if (!tab) return;
        this.activeTab = tab;
        if (this.tabsEl) {
            this.tabsEl.querySelectorAll('.codex-tab').forEach(btn => {
                const isActive = btn.getAttribute('data-tab') === tab;
                btn.classList.toggle('is-active', isActive);
            });
        }
        if (this.searchInput) {
            this.searchInput.value = '';
            if (tab === 'status') {
                this.searchInput.placeholder = '搜索状态（名称/ID/类型）';
            } else if (tab === 'attack') {
                this.searchInput.placeholder = '搜索武器（名称/ID/类别）';
            } else {
                this.searchInput.placeholder = '搜索武器（名称/ID）';
            }
        }
        this.renderActiveList('');
    }

    renderActiveList(query) {
        if (this.activeTab === 'status') {
            this.renderStatusList(query);
            return;
        }
        if (this.activeTab === 'attack') {
            this.renderAttackList(query);
            return;
        }
        this.renderWeaponList(query);
    }

    renderWeaponList(query) {
        if (!this.grid) return;
        const q = safeText(query).trim().toLowerCase();
        const filtered = !q ? this.weaponEntries : this.weaponEntries.filter(w => {
            return w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q);
        });

        if (this.countEl) {
            this.countEl.textContent = `${filtered.length}/${this.weaponEntries.length}`;
        }

        const cardHtml = (w) => `
            <button type="button" class="codex-card" data-weapon-id="${w.id}">
                <div class="codex-card-icon">${w.icon}</div>
                <div class="codex-card-name">${w.name}</div>
            </button>
        `;

        // 搜索时直接平铺结果；平时按“基础/进化/融合”分组，中间用长分隔线。
        if (q) {
            this.grid.innerHTML = `
                <div class="codex-group-grid">
                    ${filtered.map(cardHtml).join('')}
                </div>
            `;
            return;
        }

        const sections = [];
        for (const g of GROUPS) {
            const groupItems = filtered.filter(w => g.predicate(w.tier));
            if (!groupItems.length) continue;

            sections.push(`
                <div class="codex-group">
                    <div class="codex-group-title">${g.label}</div>
                    <div class="codex-group-grid">
                        ${groupItems.map(cardHtml).join('')}
                    </div>
                </div>
            `);
        }

        this.grid.innerHTML = sections.join('<div class="codex-divider"></div>');
    }

    renderAttackList(query) {
        if (!this.grid) return;
        const q = safeText(query).trim().toLowerCase();
        const entries = this.attackEntries;
        const filtered = entries.filter(entry => {
            if (!q) return true;
            const tagLabels = entry.tags
                .map(tag => (ATTACK_GROUP_MAP[tag] && ATTACK_GROUP_MAP[tag].label) || tag)
                .join(' ');
            const haystack = `${entry.name} ${entry.id} ${tagLabels}`.toLowerCase();
            return haystack.includes(q);
        });

        const uniqueMap = new Map();
        for (const item of filtered) {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
        }
        const uniqueItems = Array.from(uniqueMap.values());

        if (this.countEl) {
            this.countEl.textContent = `${uniqueItems.length}/${this.weaponEntries.length}`;
        }

        const cardHtml = (w) => `
            <button type="button" class="codex-card" data-weapon-id="${w.id}">
                <div class="codex-card-icon">${w.icon}</div>
                <div class="codex-card-name">${w.name}</div>
            </button>
        `;

        if (q) {
            if (!uniqueItems.length) {
                this.grid.innerHTML = '<div class="codex-muted">暂无匹配的武器</div>';
                return;
            }
            this.grid.innerHTML = `
                <div class="codex-group-grid">
                    ${uniqueItems.map(cardHtml).join('')}
                </div>
            `;
            return;
        }

        const sections = [];
        for (const group of ATTACK_GROUPS) {
            const groupItems = filtered.filter(entry => entry.tags.includes(group.key));
            if (!groupItems.length) continue;
            sections.push(`
                <div class="codex-group">
                    <div class="codex-group-title">${group.icon} ${group.label}</div>
                    <div class="codex-group-grid">
                        ${groupItems.map(cardHtml).join('')}
                    </div>
                </div>
            `);
        }

        if (!sections.length) {
            this.grid.innerHTML = '<div class="codex-muted">暂无匹配的武器</div>';
            return;
        }

        this.grid.innerHTML = sections.join('<div class="codex-divider"></div>');
    }

    renderStatusList(query) {
        if (!this.grid) return;
        const q = safeText(query).trim().toLowerCase();
        const filtered = !q ? this.statusEntries : this.statusEntries.filter((s) => {
            const haystack = [
                s.name,
                s.id,
                STATUS_TYPE_NAME[s.type] || s.type,
                STATUS_TYPE_LABEL[s.type] || s.type,
                s.def && s.def.description ? s.def.description : ''
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        });

        if (this.countEl) {
            this.countEl.textContent = `${filtered.length}/${this.statusEntries.length}`;
        }

        if (!filtered.length) {
            this.grid.innerHTML = '<div class="codex-muted">暂无匹配的状态效果</div>';
            return;
        }

        const cardHtml = (s) => `
            <button type="button" class="codex-card codex-status-card" data-status-id="${s.id}" style="--status-color:${s.color}">
                <div class="codex-card-icon">${s.icon}</div>
                <div class="codex-card-name">${s.name}</div>
                <div class="codex-status-type">${STATUS_TYPE_NAME[s.type] || s.type}</div>
            </button>
        `;

        this.grid.innerHTML = `
            <div class="codex-group-grid">
                ${filtered.map(cardHtml).join('')}
            </div>
        `;
    }

    openDetail(weaponId) {
        const def = this.weaponsById[weaponId] || null;
        const icon = WEAPON_ICON_MAP[weaponId] || '??';
        const name = (def && def.name) || weaponId;
        const tierLabel = TIER_LABEL[def ? def.tier : undefined] || '未知';

        const recipes = WEAPON_EVOLUTION_TABLE.filter(r => r.result === weaponId);

        const statsRows = [];
        const add = (label, value) => {
            if (value === undefined || value === null || value === '') return;
            statsRows.push(`<div class="codex-stat"><div class="codex-stat-k">${label}</div><div class="codex-stat-v">${value}</div></div>`);
        };

        if (def) {
            add('伤害', safeText(def.damage));
            add('间隔', fmtFrames(def.interval));
            add('速度', safeText(def.speed));
            add('半径', safeText(def.radius));
            add('存活', fmtFrames(def.lifetime));
            add('穿透', fmtBool(!!def.piercing));
            add('全屏伤害', fmtBool(!!def.fullScreenDamage));

            add('射线范围', safeText(def.rayRange));
            add('射线长度', safeText(def.rayLength));
            add('射线宽度', safeText(def.rayWidth));

            add('AOE半径', safeText(def.aoeRadius));
            add('AOE伤害', safeText(def.aoeDamage));

            add('爆炸半径', safeText(def.explosionRadius));
            add('爆炸伤害', safeText(def.explosionDamage));

            add('连锁次数', safeText(def.chainCount));
            add('连锁范围', safeText(def.chainRange));
            add('连锁冷却', safeText(def.chainCooldown));

            add('燃烧时长', fmtFrames(def.burnDuration));
            if (def.burnDamagePerFrame !== undefined) {
                add('燃烧伤害', `${def.burnDamagePerFrame.toFixed ? def.burnDamagePerFrame.toFixed(4) : def.burnDamagePerFrame}/f`);
            }

            add('中毒时长', fmtFrames(def.poisonDuration));
            if (def.poisonDamagePerStack !== undefined) {
                add('中毒伤害', `${def.poisonDamagePerStack.toFixed ? def.poisonDamagePerStack.toFixed(4) : def.poisonDamagePerStack}/f`);
            }

            add('献祭时长', fmtFrames(def.abyssSacrificeDuration));
            if (def.abyssSacrificeHeal !== undefined) {
                add('献祭回复', safeText(def.abyssSacrificeHeal));
            }

            if (def.freezeChance !== undefined) add('冻结概率', `${Math.round(def.freezeChance * 100)}%`);
            add('冻结时长', fmtFrames(def.freezeDuration));
            if (def.blindChance !== undefined) add('致盲概率', `${Math.round(def.blindChance * 100)}%`);
            add('致盲时长', fmtFrames(def.blindDuration));
            if (def.lifeStealChance !== undefined) add('吸血概率', `${Math.round(def.lifeStealChance * 100)}%`);
            add('吸血数值', safeText(def.lifeStealAmount));
            if (def.executeChance !== undefined) add('秒杀概率', `${fmtNumber(def.executeChance * 100, 2)}%`);
            if (def.executeChainChance !== undefined) add('秒杀概率(连锁)', `${fmtNumber(def.executeChainChance * 100, 2)}%`);
            if (def.executeOnShatterChance !== undefined) add('碎冰秒杀概率', `${fmtNumber(def.executeOnShatterChance * 100, 2)}%`);
            if (def.executeOnShatterChainChance !== undefined) {
                add('碎冰秒杀概率(连锁)', `${fmtNumber(def.executeOnShatterChainChance * 100, 2)}%`);
            }

            if (def.vulnerability !== undefined) add('易伤', `${Math.round(def.vulnerability * 100)}%`);
            if (def.radiationVulnerability !== undefined) add('辐射易伤', `${Math.round(def.radiationVulnerability * 100)}%`);
            add('辐射时长', fmtFrames(def.radiationVulnerabilityDuration));
        }

        const recipesHtml = recipes.length ? recipes.map(r => {
            const m = r.materials || [];
            const m0 = m[0];
            const m1 = m[1];
            const m0Icon = WEAPON_ICON_MAP[m0] || '??';
            const m1Icon = WEAPON_ICON_MAP[m1] || '??';
            const m0Name = (this.weaponsById[m0] && this.weaponsById[m0].name) || m0;
            const m1Name = (this.weaponsById[m1] && this.weaponsById[m1].name) || m1;
            return `
                <div class="codex-recipe">
                    <div class="codex-recipe-mats">
                        <span class="codex-mat">${m0Icon} ${m0Name}</span>
                        <span class="codex-plus">+</span>
                        <span class="codex-mat">${m1Icon} ${m1Name}</span>
                    </div>
                </div>
            `;
        }).join('') : `<div class="codex-muted">不可通过合成获得</div>`;

        const descHtml = (() => {
            if (recipes.length) {
                const list = recipes.map(r => safeText(r.description)).filter(Boolean);
                if (list.length) {
                    return `<div class="codex-desc-list">${list.map(d => `<div class="codex-desc-item">${d}</div>`).join('')}</div>`;
                }
            }
            if (def && def.description) return `<div class="codex-desc-item">${def.description}</div>`;
            return `<div class="codex-muted">（待补全）</div>`;
        })();

        const effectsHtml = `<div class="codex-effects">${safeText(deriveEffects(def))}</div>`;

        const evolutionRecipes = this.getEvolutionRecipes(weaponId);
        const evolutionsHtml = evolutionRecipes.length ? evolutionRecipes.map((recipe) => {
            const matsHtml = recipe.materials.map((mat, idx) => {
                const plus = idx === 0 ? '' : '<span class="codex-plus">+</span>';
                return `${plus}<span class="codex-mat">${mat.icon} ${mat.name}</span>`;
            }).join('');
            return `
                <div class="codex-recipe">
                    <div class="codex-recipe-mats">
                        ${matsHtml}
                        <span class="codex-plus">→</span>
                    </div>
                    <button type="button" class="codex-source-card codex-evolution-card" data-weapon-id="${recipe.result.id}">
                        <div class="codex-source-icon">${recipe.result.icon}</div>
                        <div class="codex-source-name">${recipe.result.name}</div>
                        <div class="codex-source-id">${recipe.result.id}</div>
                    </button>
                </div>
            `;
        }).join('') : `<div class="codex-muted">暂无可进化武器</div>`;

        this.detailDialog.innerHTML = `
            <div class="codex-detail-header">
                <div class="codex-detail-title">
                    <div class="codex-detail-icon">${icon}</div>
                    <div class="codex-detail-meta">
                        <div class="codex-detail-name">${name}</div>
                        <div class="codex-detail-tier">${tierLabel}</div>
                    </div>
                </div>
                <button type="button" class="codex-back-btn">返回</button>
            </div>

            <div class="codex-section">
                <div class="codex-section-title">数值面板</div>
                <div class="codex-stats">
                    ${statsRows.length ? statsRows.join('') : '<div class="codex-muted">无可显示数值</div>'}
                </div>
            </div>

            <div class="codex-section">
                <div class="codex-section-title">合成材料</div>
                ${recipesHtml}
            </div>

            <div class="codex-section">
                <div class="codex-section-title">描述</div>
                ${descHtml}
            </div>

            <div class="codex-section">
                <div class="codex-section-title">效果</div>
                ${effectsHtml}
            </div>

            <div class="codex-section">
                <div class="codex-section-title">可能进化的武器类型</div>
                ${evolutionsHtml}
            </div>
        `;

        this.detailDialog.querySelector('.codex-back-btn').onclick = () => this.closeDetail();
        this.detailDialog.querySelectorAll('.codex-evolution-card').forEach((btn) => {
            btn.onclick = () => {
                const targetId = btn.getAttribute('data-weapon-id');
                if (targetId) this.openDetail(targetId);
            };
        });

        this.detailOverlay.style.display = 'flex';
    }

    openStatusDetail(statusId) {
        const def = this.statusById[statusId];
        if (!def) return;

        const icon = def.icon || '❔';
        const name = def.name || def.id;
        const typeName = STATUS_TYPE_NAME[def.type] || def.type || '未知';
        const typeLabel = STATUS_TYPE_LABEL[def.type] || def.type || '';
        const typeText = typeLabel ? `${typeName} (${typeLabel})` : typeName;

        const baseRows = [];
        const coreRows = [];
        const advancedRows = [];
        const addRow = (rows, label, value) => {
            if (value === undefined || value === null || value === '') return;
            rows.push(`<div class="codex-stat"><div class="codex-stat-k">${label}</div><div class="codex-stat-v">${value}</div></div>`);
        };

        addRow(baseRows, '类型', safeText(typeText));
        addRow(baseRows, '最大层数', safeText(def.maxStacks));
        addRow(baseRows, '叠层计时', fmtStackBehavior(def.stackBehavior));
        addRow(baseRows, '默认持续', fmtFrames(def.defaultDuration));
        if (def.color) {
            addRow(baseRows, '颜色', `<span class="codex-color-swatch" style="background:${def.color};"></span>${def.color}`);
        }

        STATUS_CORE_FIELDS.forEach((field) => {
            const raw = def[field.key];
            if (raw === undefined || raw === null || raw === '') return;
            const val = field.format ? field.format(raw) : safeText(raw);
            if (!val) return;
            addRow(coreRows, field.label, val);
        });

        if (statusId === 'vulnerable') {
            addRow(coreRows, '默认规则', '仅未配置易伤数值时，才使用默认值');
            addRow(coreRows, '叠层', '不可叠层');
        }

        STATUS_ADVANCED_FIELDS.forEach((field) => {
            const raw = def[field.key];
            if (raw === undefined || raw === null || raw === '') return;
            const val = field.format ? field.format(raw) : safeText(raw);
            if (!val) return;
            addRow(advancedRows, field.label, val);
        });

        const descHtml = def.description
            ? `<div class="codex-desc-item">${def.description}</div>`
            : `<div class="codex-muted">（待补全）</div>`;

        const sources = this.getStatusSources(statusId);
        const sourcesHtml = sources.length ? `
            <div class="codex-source-grid">
                ${sources.map((w) => `
                    <button type="button" class="codex-source-card" data-weapon-id="${w.id}">
                        <div class="codex-source-icon">${w.icon}</div>
                        <div class="codex-source-name">${w.name}</div>
                        <div class="codex-source-id">${w.id}</div>
                    </button>
                `).join('')}
            </div>
        ` : `<div class="codex-muted">暂无来源武器</div>`;

        const advancedHtml = advancedRows.length ? `
            <details class="codex-advanced" open>
                <summary>高级参数</summary>
                <div class="codex-stats">
                    ${advancedRows.join('')}
                </div>
            </details>
        ` : '<div class="codex-muted">无高级参数</div>';

        this.detailDialog.innerHTML = `
            <div class="codex-detail-header">
                <div class="codex-detail-title">
                    <div class="codex-detail-icon">${icon}</div>
                    <div class="codex-detail-meta">
                        <div class="codex-detail-name">${name}</div>
                        <div class="codex-detail-tier">${typeText}</div>
                    </div>
                </div>
                <button type="button" class="codex-back-btn">返回</button>
            </div>

            <div class="codex-section">
                <div class="codex-section-title">基础信息</div>
                <div class="codex-stats">
                    ${baseRows.length ? baseRows.join('') : '<div class="codex-muted">无可显示信息</div>'}
                </div>
            </div>

            <div class="codex-section">
                <div class="codex-section-title">核心参数</div>
                <div class="codex-stats">
                    ${coreRows.length ? coreRows.join('') : '<div class="codex-muted">无可显示数值</div>'}
                </div>
                ${advancedHtml}
            </div>

            <div class="codex-section">
                <div class="codex-section-title">说明</div>
                ${descHtml}
            </div>

            <div class="codex-section">
                <div class="codex-section-title">来源武器</div>
                ${sourcesHtml}
            </div>
        `;

        this.detailDialog.querySelector('.codex-back-btn').onclick = () => this.closeDetail();
        this.detailDialog.querySelectorAll('.codex-source-card').forEach((btn) => {
            btn.addEventListener('click', () => {
                const weaponId = btn.getAttribute('data-weapon-id');
                if (!weaponId) return;
                this.openDetail(weaponId);
            });
        });

        this.detailOverlay.style.display = 'flex';
    }
}

