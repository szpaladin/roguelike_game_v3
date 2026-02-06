import Bullet from './Bullet.js';

/**
 * BulletPool - 子弹对象池
 * 用于复用子弹对象，减少垃圾回收压力
 */
export default class BulletPool {
    /**
     * @param {number} initialSize - 初始池大小
     */
    constructor(initialSize = 100) {
        this.pool = [];
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new Bullet());
        }
    }

    /**
     * 生成/获取一个子弹
     * @param {Object} data - 子弹初始化数据
     * @returns {Bullet} - 激活的子弹对象
     */
    spawnBullet(data) {
        // 寻找一个非激活的子弹
        let bullet = this.pool.find(b => !b.active);

        // 如果没有，则创建一个并加入池中 (扩容)
        if (!bullet) {
            bullet = new Bullet();
            this.pool.push(bullet);
        }

        bullet.reset(data);
        return bullet;
    }

    /**
     * 获取所有当前激活的子弹
     * @returns {Array<Bullet>}
     */
    getActiveBullets() {
        return this.pool.filter(b => b.active);
    }

    /**
     * 更新所有激活的子弹
     */
    update() {
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                this.pool[i].update();
            }
        }
    }

    /**
     * 绘制所有激活的子弹
     */
    draw(ctx, view) {
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                this.pool[i].draw(ctx, view);
            }
        }
    }

    /**
     * 清除所有子弹
     */
    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
        }
    }
}
