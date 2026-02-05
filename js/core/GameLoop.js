/**
 * GameLoop - 核心游戏循环
 * 负责驱动游戏的 update 和 draw
 */
export default class GameLoop {
    /**
     * @param {Function} onUpdate - 更新回调 (dt)
     * @param {Function} onDraw - 绘制回调
     */
    constructor(onUpdate, onDraw) {
        this.onUpdate = onUpdate;
        this.onDraw = onDraw;
        this.running = false;
        this.lastTime = 0;
        this.requestId = null;

        // 绑定 tick 方法
        this.tick = this.tick.bind(this);
    }

    /**
     * 启动循环
     */
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.requestId = requestAnimationFrame(this.tick);
    }

    /**
     * 停止循环 (完全中断)
     */
    stop() {
        this.running = false;
        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
            this.requestId = null;
        }
    }

    /**
     * 暂停
     */
    pause() {
        this.running = false;
    }

    /**
     * 恢复
     */
    resume() {
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.requestId = requestAnimationFrame(this.tick);
        }
    }

    /**
     * 每一帧的逻辑
     * @param {number} timestamp - 毫秒时间戳
     */
    tick(timestamp) {
        if (!this.running) return;

        // 如果没有传入 timestamp (手动调用 tick)，使用当前时间
        if (timestamp === undefined) {
            timestamp = performance.now();
        }

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // 限制最大 dt，防止切换标签页后突然跳跃
        const clampedDt = Math.min(dt, 0.1);

        if (this.onUpdate) this.onUpdate(clampedDt);
        if (this.onDraw) this.onDraw();

        this.requestId = requestAnimationFrame(this.tick);
    }
}
