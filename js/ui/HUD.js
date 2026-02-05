import SkillPointUI from './SkillPointUI.js';
import { WEAPON_ICON_MAP } from '../weapons/WeaponsData.js';
import { ARTIFACT_MAP } from '../artifacts/ArtifactData.js';

/**
 * HUD - 头部显示系统
 * 负责主界面上的各种状态条和数值显示
 */
export default class HUD {
    constructor() {
        // 缓存常用 DOM 元素
        this.elements = {
            healthBar: document.getElementById('health-fill'),
            healthText: document.getElementById('health-text'),
            level: document.getElementById('level'),
            expBar: document.getElementById('exp-fill'),
            exp: document.getElementById('exp'),
            skillPoints: document.getElementById('skill-points'),
            strength: document.getElementById('strength'),
            intelligence: document.getElementById('intelligence'),
            defense: document.getElementById('defense'),
            gold: document.getElementById('gold'),
            floor: document.getElementById('floor'),
            weaponGrid: document.getElementById('weapon-grid'),
            inventory: document.getElementById('inventory')
        };

        // 技能点指示器
        this.skillPointUI = new SkillPointUI();
    }

    /**
     * 更新 HUD 显示
     * @param {Player} player - 玩家对象
     * @param {number} distance - 当前行进距离 (格)
     */
    update(player, distance) {
        const s = player.stats;
        const e = this.elements;

        // 更新生命值
        if (e.healthBar) {
            e.healthBar.style.width = `${(s.hp / s.maxHp) * 100}%`;
        }
        if (e.healthText) {
            e.healthText.textContent = `${Math.ceil(s.hp)}/${s.maxHp}`;
        }

        // 更新经验值
        if (e.expBar) {
            e.expBar.style.width = `${(s.exp / s.expToNext) * 100}%`;
        }
        if (e.exp) {
            e.exp.textContent = `${Math.floor(s.exp)}/${s.expToNext}`;
        }

        // 更新基础数值
        if (e.level) e.level.textContent = `Lv.${s.level}`;
        if (e.skillPoints) e.skillPoints.textContent = String(s.skillPoints);
        if (e.strength) e.strength.textContent = String(s.strength);
        if (e.intelligence) e.intelligence.textContent = String(s.intelligence);
        if (e.defense) e.defense.textContent = String(s.defense);
        if (e.gold) e.gold.textContent = String(s.gold);
        if (this.elements.floor) {
            const meters = (distance || 0) / 10;
            this.elements.floor.textContent = `${meters.toFixed(1)}米`;
        }

        // 更新武器显示
        this.updateWeaponDisplay(player);
        // 更新道具显示
        this.updateArtifactDisplay(player);

        // 更新技能点指示器
        this.skillPointUI.update(s.skillPoints);
    }

    /**
     * 更新武器显示
     */
    updateWeaponDisplay(player) {
        if (!this.elements.weaponGrid) return;

        const weapons = player.weaponSystem.getWeapons();
        const gridHTML = [];

        // 生成武器格子（最多4个）
        for (let i = 0; i < 4; i++) {
            if (i < weapons.length) {
                const weapon = weapons[i];
                gridHTML.push(`
                    <div class="weapon-slot active">
                        <div class="weapon-icon-display">${this.getWeaponIcon(weapon.def.id, weapon.def)}</div>
                        <div class="weapon-name-display">${weapon.def.name}</div>
                    </div>
                `);
            } else {
                gridHTML.push(`
                    <div class="weapon-slot">
                        <div class="weapon-icon-display">-</div>
                    </div>
                `);
            }
        }

        this.elements.weaponGrid.innerHTML = gridHTML.join('');
    }

    /**
     * 获取武器图标
     */
    getWeaponIcon(weaponId, weaponDef = null) {
        if (weaponDef && weaponDef.isFusion) return '🌀';
        return WEAPON_ICON_MAP[weaponId] || '??';
    }

    updateArtifactDisplay(player) {
        const inventory = this.elements.inventory;
        if (!inventory) return;

        const system = player.artifactSystem;
        const artifacts = system && typeof system.getArtifacts === 'function'
            ? system.getArtifacts()
            : [];
        const maxSlots = system && Number.isFinite(system.maxSlots) ? system.maxSlots : 4;

        const gridHTML = [];
        for (let i = 0; i < maxSlots; i++) {
            if (i < artifacts.length) {
                const def = ARTIFACT_MAP[artifacts[i]];
                const icon = def ? def.icon : '🎁';
                const name = def ? def.name : artifacts[i];
                gridHTML.push(`
                    <div class="inventory-slot active">
                        <div class="inventory-icon-display">${icon}</div>
                        <div class="inventory-name-display">${name}</div>
                    </div>
                `);
            } else {
                gridHTML.push(`
                    <div class="inventory-slot empty">
                        <div class="inventory-icon-display">-</div>
                    </div>
                `);
            }
        }

        inventory.innerHTML = gridHTML.join('');
    }
}
