import { WEAPONS, WEAPON_ICON_MAP, WEAPON_TIER } from '../weapons/WeaponsData.js';
import { log } from '../utils.js';

/**
 * UpgradeUI - 武器升级界面
 * 管理玩家武器选择菜单的显示和逻辑
 */
export default class UpgradeUI {
    constructor() {
        this.overlay = document.getElementById('upgrade-overlay');
        this.title = document.getElementById('upgrade-title');
        this.optionsContainer = document.getElementById('upgrade-options');
        this.player = null;
        this.onCloseCallback = null; // 关闭时的回调
        this.onEvacuationCallback = null; // 撤离时的回调
    }

    /**
     * 初始化并绑定玩家
     */
    init(player) {
        this.player = player;
    }

    /**
     * 设置关闭时的回调
     */
    onClose(callback) {
        this.onCloseCallback = callback;
    }

    /**
     * 设置撤离回调（由Game调用）
     */
    setEvacuationCallback(callback) {
        this.onEvacuationCallback = callback;
    }

    /**
     * 打开升级菜单
     */
    open() {
        if (!this.player || this.player.stats.skillPoints <= 0) {
            return;
        }

        // 生成武器选项
        const options = this.generateWeaponOptions();
        const weaponsFull = options.length === 0;

        // 更新标题
        if (this.title) {
            if (weaponsFull) {
                this.title.textContent = `武器栏已满 (${this.player.stats.skillPoints}点可用)`;
            } else {
                this.title.textContent = `选择一项武器 (${this.player.stats.skillPoints}点可用)`;
            }
        }

        // 清空并填充选项
        if (this.optionsContainer) {
            this.optionsContainer.innerHTML = '';

            // 只有武器栏未满时才显示武器选项
            if (!weaponsFull) {
                options.forEach(weaponDef => {
                    const card = this.createWeaponCard(weaponDef);
                    this.optionsContainer.appendChild(card);
                });
            }

            // 添加撤离选项（始终显示）
            const hasEnergy = this.player.stats.skillPoints >= 1;
            const evacCard = this.createEvacuationCard(hasEnergy);
            this.optionsContainer.appendChild(evacCard);
        }

        if (this.overlay) {
            this.overlay.style.display = 'flex';
        }
    }

    /**
     * 关闭升级菜单
     */
    close() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
        // 触发关闭回调（用于通知 Game 取消暂停）
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    /**
     * 检查菜单是否打开
     */
    isOpen() {
        return this.overlay && this.overlay.style.display === 'flex';
    }

    /**
     * 生成武器选项（从可用武器池中随机选择4个）
     */
    generateWeaponOptions() {
        // 如果武器栏已满（4个），返回空数组
        const currentWeapons = this.player.weaponSystem.getWeapons();
        if (currentWeapons.length >= 4) {
            return [];
        }

        // 所有基础武器池
        const allWeapons = this.getBasicWeaponPool();

        // 过滤掉已拥有的武器
        const available = allWeapons.filter(w =>
            !currentWeapons.some(pw => pw.def.id === w.id)
        );

        // 随机选择最多4个
        return available
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
    }

    getBasicWeaponPool() {
        return Object.values(WEAPONS).filter(
            weapon => weapon.tier === WEAPON_TIER.BASIC
        );
    }

    /**
     * 创建武器卡片DOM元素
     */
    createWeaponCard(weaponDef) {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="weapon-icon-box">
                <span class="weapon-icon">${this.getWeaponIcon(weaponDef.id)}</span>
            </div>
            <div class="weapon-name">${weaponDef.name}</div>
            <div class="status-text">全新!</div>
        `;
        card.onclick = () => this.selectWeapon(weaponDef);
        return card;
    }

    /**
     * 选择武器
     */
    selectWeapon(weaponDef) {
        if (!this.player || this.player.stats.skillPoints <= 0) {
            return;
        }

        // 检查武器栏是否已满
        if (this.player.weaponSystem.getWeapons().length >= 4) {
            log('武器栏已满！无法再获得新武器。', 'damage');
            this.close();
            return;
        }

        // 检查是否已拥有该武器
        if (this.player.weaponSystem.getWeapons().some(w => w.def.id === weaponDef.id)) {
            return;
        }

        // 添加武器
        this.player.weaponSystem.addWeapon(weaponDef);

        // 扣除技能点
        this.player.stats.skillPoints--;

        log(`获得新武器：${weaponDef.name}！`, 'important');

        // 关闭菜单
        this.close();
    }

    /**
     * 获取武器图标
     */
    getWeaponIcon(weaponId) {
        return WEAPON_ICON_MAP[weaponId] || '??';
    }

    /**
     * 创建撤离选项卡片
     * @param {boolean} hasEnergy - 是否有足够能源
     */
    createEvacuationCard(hasEnergy) {
        const card = document.createElement('div');
        card.className = 'upgrade-card evacuation-card';

        if (!hasEnergy) {
            card.classList.add('disabled');
        }

        card.innerHTML = `
            <div class="weapon-icon-box evacuation-icon-box">
                <span class="weapon-icon">🚁</span>
            </div>
            <div class="weapon-name">发送撤离信号</div>
            <div class="status-text">${hasEnergy ? '消耗1能源' : '能源不足'}</div>
        `;

        if (hasEnergy) {
            card.onclick = () => this.selectEvacuation();
        }

        return card;
    }

    /**
     * 选择撤离选项
     */
    selectEvacuation() {
        if (!this.player || this.player.stats.skillPoints < 1) {
            return;
        }

        // 消耗1能源
        this.player.stats.skillPoints--;

        // 触发撤离回调
        if (this.onEvacuationCallback) {
            this.onEvacuationCallback();
        }

        log('📡 撤离信号已发送！', 'important');

        // 关闭菜单
        this.close();
    }
}
