import Weapon from './Weapon.js';
import { WEAPON_TIER } from './WeaponsData.js';

/**
 * WeaponSystem - 武器系统管理
 * 负责玩家所有武器的更新、索敌与自动射击
 */
export default class WeaponSystem {
    constructor() {
        this.weapons = [];
    }

    /**
     * 添加武器
     * @param {Object} definition - 武器定义数据
     */
    addWeapon(definition) {
        if (!definition) return null;

        if (definition.id !== 'basic' && this.weapons.some(w => w.def && w.def.id === 'basic')) {
            this.weapons = this.weapons.filter(w => w.def && w.def.id !== 'basic');
        }

        // 检查是否已拥有该武器（可选逻辑）
        const weapon = new Weapon(definition);
        this.weapons.push(weapon);
        return weapon;
    }

    /**
     * 更新所有武器冷却
     */
    update(cooldownMultiplier = 1) {
        for (const weapon of this.weapons) {
            weapon.update(cooldownMultiplier);
        }
    }


    createSkyDropBullet(weapon, target, playerAttack, scrollY) {
        if (!weapon || !weapon.def || !weapon.canFire()) return null;

        const def = weapon.def;
        const offsetX = Number.isFinite(def.dropOffsetX) ? def.dropOffsetX : 0;
        const offsetY = Number.isFinite(def.dropOffsetY) ? def.dropOffsetY : 60;
        const dropSpeed = Number.isFinite(def.dropSpeed) ? def.dropSpeed : def.speed;
        const dropLifetime = Number.isFinite(def.dropLifetime) ? def.dropLifetime : def.lifetime;
        const dropRadius = Number.isFinite(def.dropRadius) ? def.dropRadius : def.radius;
        const randOffset = offsetX !== 0 ? (Math.random() * 2 - 1) * offsetX : 0;

        // 重置冷却
        weapon.cooldown = def.interval;

        // 计算最终伤害
        const baseAttack = Number.isFinite(playerAttack) ? playerAttack : 0;
        const effectiveAttack = baseAttack + 45;
        const finalDamage = def.damage * (effectiveAttack / 10);

        return {
            x: target.x + randOffset,
            y: scrollY - offsetY,
            vx: 0,
            vy: dropSpeed,
            ...def,
            speed: dropSpeed,
            radius: dropRadius,
            lifetime: dropLifetime,
            damage: finalDamage,
            active: true
        };
    }    /**
     * 自动搜索目标并发射
     * @param {Object} playerPos - 玩家当前位置 {x, y}
     * @param {number} playerAttack - 玩家攻击力
     * @param {Array<Enemy>} enemies - 敌人列表
     * @param {BulletPool} bulletPool - 子弹对象池
     * @param {number} scrollY - 当前滚动位置（世界坐标需要）
     */
    autoShoot(playerPos, playerAttack, enemies, bulletPool, scrollY = 0, artifactSystem = null) {
        const playerWorldY = scrollY + playerPos.y;
        const weaponCount = this.weapons.length;

        for (let i = 0; i < weaponCount; i++) {
            const weapon = this.weapons[i];
            if (!weapon.canFire()) continue;

            const target = this.findNearestEnemy(playerPos.x, playerWorldY, enemies);
            if (target) {
                // 计算扩散角度：每个武器基于索引有微小角度偏移
                // spread = (index - (weaponCount - 1)/2) * 0.05 弧度（约3度）
                const spread = (i - (weaponCount - 1) / 2) * 0.05;

                let bulletData = null;
                if (weapon.def && weapon.def.spawnMode === 'sky_drop') {
                    bulletData = this.createSkyDropBullet(weapon, target, playerAttack, scrollY);
                } else {
                    bulletData = weapon.fireWithSpread(
                        playerPos.x,
                        playerWorldY,
                        { x: target.x, y: target.y },
                        playerAttack,
                        spread
                    );
                }
                if (bulletData) {
                    if (artifactSystem && typeof artifactSystem.applyBulletModifiers === 'function') {
                        artifactSystem.applyBulletModifiers(bulletData);
                    }
                    bulletPool.spawnBullet(bulletData);
                }
            }
        }
    }

    /**
     * 搜索最近的存活敌人
     */
    findNearestEnemy(px, py, enemies) {
        let nearest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;

            const dx = enemy.x - px;
            const dy = enemy.y - py;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDist) {
                minDist = distSq;
                nearest = enemy;
            }
        }

        return nearest;
    }

    /**
     * 移除特定武器
     */
    removeWeapon(weaponId) {
        const index = this.weapons.findIndex(w => w.def.id === weaponId);
        if (index !== -1) {
            this.weapons.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 获取所有武器实例
     */
    getWeapons() {
        return this.weapons;
    }

    /**
     * 设置武器列表（用于武器融合）
     * @param {Array} weapons - 新的武器数组
     */
    setWeapons(weapons) {
        this.weapons = weapons;
    }

    /**
     * 获取所有进化武器的ID
     * @returns {Array<string>} - 进化武器ID列表
     */
    getEvolutionWeaponIds() {
        return this.weapons
            .filter(w => w.def && w.def.tier === WEAPON_TIER.EVOLUTION)
            .map(w => w.def.id);
    }
}



