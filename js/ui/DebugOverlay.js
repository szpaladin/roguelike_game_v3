import { getStatusEffect } from '../enemies/StatusEffects.js';

export default class DebugOverlay {
    constructor() {
        this.enabled = false;
        this.fps = 0;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    update(dt) {
        if (!this.enabled) return;
        const currentFps = dt > 0 ? 1 / dt : 0;
        this.fps = this.fps === 0 ? currentFps : this.fps * 0.9 + currentFps * 0.1;
    }

    draw(ctx, game) {
        if (!this.enabled || !ctx || !game) return;

        const enemies = Array.isArray(game.enemies) ? game.enemies : [];
        const aliveEnemies = enemies.filter(enemy => enemy && enemy.hp > 0 && !enemy.isDead);
        const bulletCount = game.bulletPool ? game.bulletPool.getActiveBullets().length : 0;

        const effectsManager = game.effectsManager;
        const explosionCount = effectsManager ? effectsManager.explosionEffects.length : 0;
        const lightningCount = effectsManager ? effectsManager.lightningEffects.length : 0;
        const rayCount = effectsManager ? effectsManager.rayEffects.length : 0;

        const statusEntries = this.collectStatusEntries(aliveEnemies);
        const statusSummary = this.buildStatusSummary(statusEntries);
        const statusText = statusSummary.length > 0 ? statusSummary.join('、') : '无';
        const debuffSummary = this.buildTypeDetail(statusEntries, 'debuff');
        const debuffText = debuffSummary.length > 0 ? debuffSummary.join('、') : '无';
        const controlSummary = this.buildTypeDetail(statusEntries, 'cc');
        const controlText = controlSummary.length > 0 ? controlSummary.join('、') : '无';
        const dotSummary = this.buildDotSummary(statusEntries);
        const dotText = dotSummary.length > 0 ? dotSummary.join('、') : '无';

        const lines = [
            '调试: 开 (~)',
            `FPS: ${Math.round(this.fps)}`,
            `敌人: ${aliveEnemies.length}`,
            `子弹: ${bulletCount}`,
            `特效: 爆炸${explosionCount} 闪电${lightningCount} 射线${rayCount}`,
            `状态: ${statusText}`,
            `减益: ${debuffText}`,
            `控制: ${controlText}`,
            `DOT详情: ${dotText}`
        ];

        ctx.save();
        ctx.font = '12px monospace';
        ctx.textBaseline = 'top';

        const padding = 6;
        const lineHeight = 14;
        const offsetX = 170;
        const offsetY = 8;
        let maxWidth = 0;
        for (const line of lines) {
            maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
        }

        const boxWidth = Math.ceil(maxWidth) + padding * 2;
        const boxHeight = lineHeight * lines.length + padding * 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(offsetX, offsetY, boxWidth, boxHeight);

        ctx.fillStyle = '#b9f7ff';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], offsetX + padding, offsetY + padding + lineHeight * i);
        }

        ctx.restore();
    }

    buildStatusSummary(source) {
        const entries = source instanceof Map ? source : this.collectStatusEntries(source);
        return Array.from(entries.values())
            .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans'))
            .map(entry => `${entry.label}x${entry.stacks}`);
    }

    buildTypeSummary(source, type) {
        const entries = source instanceof Map ? source : this.collectStatusEntries(source);
        return Array.from(entries.values())
            .filter(entry => entry.type === type)
            .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans'))
            .map(entry => `${entry.label}x${entry.stacks}`);
    }

    buildTypeDetail(source, type) {
        const entries = source instanceof Map ? source : this.collectStatusEntries(source);
        return Array.from(entries.values())
            .filter(entry => entry.type === type)
            .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans'))
            .map(entry => {
                const durationText = this.formatDurationRange(entry.durations, entry.stackBehavior);
                return `${entry.label}x${entry.stacks}(${durationText})`;
            });
    }

    buildDotSummary(source) {
        const entries = source instanceof Map ? source : this.collectStatusEntries(source);
        return Array.from(entries.values())
            .filter(entry => entry.type === 'dot')
            .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans'))
            .map(entry => {
                const durationText = this.formatDurationRange(entry.durations, entry.stackBehavior);
                return `${entry.label}x${entry.stacks}(${durationText})`;
            });
    }

    collectStatusEntries(enemies) {
        const entries = new Map();

        for (const enemy of enemies) {
            if (!enemy || !enemy.statusEffects || typeof enemy.statusEffects.getAllEffects !== 'function') {
                continue;
            }
            const effects = enemy.statusEffects.getAllEffects();
            for (const effect of effects) {
                if (!effect) continue;
                const id = effect.id || effect.name || 'unknown';
                const definition = getStatusEffect(id);
                const name = (definition && definition.name) || effect.name || id;
                const icon = definition && definition.icon ? definition.icon : '';
                const label = icon ? `${icon}${name}` : name;
                const stackCount = typeof effect.getStackCount === 'function' ? effect.getStackCount() : (effect.stacks || 1);
                const durations = this.extractDurations(effect);

                const entry = entries.get(id) || {
                    id,
                    label,
                    type: effect.type || (definition && definition.type) || 'unknown',
                    stackBehavior: effect.stackBehavior || (definition && definition.stackBehavior) || 'refresh',
                    stacks: 0,
                    durations: []
                };
                entry.stacks += stackCount;
                entry.durations.push(...durations);
                entries.set(id, entry);
            }
        }

        return entries;
    }

    extractDurations(effect) {
        if (!effect) return [];
        if (effect.stackBehavior === 'independent' && Array.isArray(effect.stackDurations)) {
            return effect.stackDurations.map(value => Math.max(0, value));
        }
        if (Number.isFinite(effect.duration)) {
            return [Math.max(0, effect.duration)];
        }
        return [];
    }

    formatDurationRange(durations, stackBehavior) {
        if (!durations || durations.length === 0) return '0.0s';
        const seconds = durations.map(value => value / 60);
        const min = Math.min(...seconds);
        const max = Math.max(...seconds);
        if (stackBehavior === 'independent' && Math.abs(max - min) > 0.05) {
            return `${min.toFixed(1)}~${max.toFixed(1)}s`;
        }
        return `${max.toFixed(1)}s`;
    }
}
