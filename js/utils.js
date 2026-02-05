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
