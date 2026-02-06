/**
 * 圆形碰撞检测
 * @param {number} x1 - 第一个圆的 X 坐标
 * @param {number} y1 - 第一个圆的 Y 坐标
 * @param {number} r1 - 第一个圆的半径
 * @param {number} x2 - 第二个圆的 X 坐标
 * @param {number} y2 - 第二个圆的 Y 坐标
 * @param {number} r2 - 第二个圆的半径
 * @returns {boolean} - 是否发生碰撞
 */
export function circleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (r1 + r2);
}

/**
 * Wrap a world X coordinate into [0, width).
 */
export function wrapX(x, width) {
    if (!Number.isFinite(width) || width <= 0) return x;
    const wrapped = x % width;
    return wrapped < 0 ? wrapped + width : wrapped;
}

/**
 * Shortest wrapped delta on X axis.
 */
export function wrapDeltaX(dx, width) {
    if (!Number.isFinite(width) || width <= 0) return dx;
    const half = width / 2;
    const wrapped = (dx + half) % width;
    const normalized = wrapped < 0 ? wrapped + width : wrapped;
    return normalized - half;
}

/**
 * Convert world coordinate to screen coordinate with horizontal wrap.
 */
export function worldToScreen(x, y, view) {
    if (!view) return { x, y };
    const width = view.worldWidth ?? view.width;
    const cameraX = Number.isFinite(view.cameraX) ? view.cameraX : (view.scrollX || 0) + (view.width || 0) / 2;
    const scrollY = view.scrollY || 0;
    const screenX = wrapDeltaX(x - cameraX, width) + (view.width || 0) / 2;
    const screenY = y - scrollY;
    return { x: screenX, y: screenY };
}

/**
 * 日志系统 - 将消息添加到游戏日志中
 * @param {string} message - 日志消息
 * @param {string} type - 日志类型 (normal, important, damage, heal)
 */
export function log(message, type = 'normal') {
    const logContent = document.getElementById('log-content');
    if (!logContent) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;

    // 最多保留 30 条日志
    while (logContent.children.length > 30) {
        logContent.removeChild(logContent.firstChild);
    }
}
