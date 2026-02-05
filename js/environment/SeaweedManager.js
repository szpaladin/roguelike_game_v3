import { GAME_CONFIG } from '../config.js';

const randomRange = (min, max) => min + Math.random() * (max - min);

export default class SeaweedManager {
    constructor(viewWidth = 600, viewHeight = 600) {
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.patches = [];
        this.nextSpawnDistance = 0;
        this.patchId = 0;
        this.rollNextSpawn(0);
    }

    getConfig() {
        return GAME_CONFIG.SEAWEED || {};
    }

    getRevealRadius() {
        const cfg = this.getConfig();
        return Number.isFinite(cfg.REVEAL_RADIUS) ? cfg.REVEAL_RADIUS : 140;
    }

    rollNextSpawn(currentDistance) {
        const cfg = this.getConfig();
        const minInterval = Number.isFinite(cfg.SPAWN_INTERVAL_MIN) ? cfg.SPAWN_INTERVAL_MIN : 800;
        const maxInterval = Number.isFinite(cfg.SPAWN_INTERVAL_MAX) ? cfg.SPAWN_INTERVAL_MAX : 1200;
        this.nextSpawnDistance = currentDistance + randomRange(minInterval, maxInterval);
    }

    update(scrollY, viewWidth = null, viewHeight = null) {
        if (Number.isFinite(viewWidth)) this.viewWidth = viewWidth;
        if (Number.isFinite(viewHeight)) this.viewHeight = viewHeight;

        if (scrollY >= this.nextSpawnDistance) {
            this.spawnPatch(scrollY);
            this.rollNextSpawn(scrollY);
        }

        const cleanupY = scrollY - 200;
        this.patches = this.patches.filter(patch => (patch.y + patch.h) >= cleanupY);
    }

    spawnPatch(scrollY) {
        const cfg = this.getConfig();
        const minSize = Number.isFinite(cfg.PATCH_MIN_SIZE) ? cfg.PATCH_MIN_SIZE : 240;
        const maxSize = Number.isFinite(cfg.PATCH_MAX_SIZE) ? cfg.PATCH_MAX_SIZE : 360;
        const offsetMin = Number.isFinite(cfg.SPAWN_OFFSET_MIN) ? cfg.SPAWN_OFFSET_MIN : 80;
        const offsetMax = Number.isFinite(cfg.SPAWN_OFFSET_MAX) ? cfg.SPAWN_OFFSET_MAX : 180;

        const w = randomRange(minSize, maxSize);
        const h = randomRange(minSize, maxSize);
        const maxX = Math.max(0, this.viewWidth - w);
        const x = Math.random() * maxX;
        const y = scrollY + this.viewHeight + randomRange(offsetMin, offsetMax);

        this.patches.push({
            id: this.patchId++,
            x,
            y,
            w,
            h
        });
    }

    isPointInsidePatch(x, y, patch) {
        return x >= patch.x && x <= patch.x + patch.w && y >= patch.y && y <= patch.y + patch.h;
    }

    findPatchAtPoint(x, y) {
        for (const patch of this.patches) {
            if (this.isPointInsidePatch(x, y, patch)) return patch;
        }
        return null;
    }

    isPointRevealed(x, y, playerWorldPos) {
        if (!playerWorldPos) return false;
        const r = this.getRevealRadius();
        const dx = x - playerWorldPos.x;
        const dy = y - playerWorldPos.y;
        return (dx * dx + dy * dy) <= r * r;
    }

    isPointHidden(x, y, playerWorldPos) {
        const patch = this.findPatchAtPoint(x, y);
        if (!patch) return false;
        return !this.isPointRevealed(x, y, playerWorldPos);
    }

    updateEnemyVisibility(enemies, playerWorldPos) {
        if (!Array.isArray(enemies)) return;
        for (const enemy of enemies) {
            if (!enemy) continue;
            enemy.hiddenInSeaweed = this.isPointHidden(enemy.x, enemy.y, playerWorldPos);
        }
    }

    updateChestVisibility(chests, playerWorldPos) {
        if (!Array.isArray(chests)) return;
        for (const chest of chests) {
            if (!chest) continue;
            chest.hiddenInSeaweed = this.isPointHidden(chest.x, chest.y, playerWorldPos);
        }
    }

    resolveBulletInteractions(bullets, playerWorldPos) {
        if (!Array.isArray(bullets)) return;

        for (const bullet of bullets) {
            if (!bullet || !bullet.active) continue;

            const patch = this.findPatchAtPoint(bullet.x, bullet.y);
            if (!patch) {
                bullet.seaweedInside = false;
                bullet.seaweedPatchId = null;
                continue;
            }

            const revealed = this.isPointRevealed(bullet.x, bullet.y, playerWorldPos);
            if (revealed) {
                bullet.seaweedInside = true;
                bullet.seaweedPatchId = patch.id;
                continue;
            }

            if (bullet.seaweedInside && bullet.seaweedPatchId === patch.id) {
                bullet.active = false;
                continue;
            }

            this.bounceBulletFromPatch(bullet, patch);
            bullet.seaweedInside = false;
            bullet.seaweedPatchId = null;
        }
    }

    bounceBulletFromPatch(bullet, patch) {
        const r = Number.isFinite(bullet.radius) ? bullet.radius : 0;
        const left = patch.x;
        const right = patch.x + patch.w;
        const top = patch.y;
        const bottom = patch.y + patch.h;

        const overlapLeft = (bullet.x + r) - left;
        const overlapRight = right - (bullet.x - r);
        const overlapTop = (bullet.y + r) - top;
        const overlapBottom = bottom - (bullet.y - r);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft) {
            bullet.x = left - r;
            bullet.vx = -Math.abs(bullet.vx);
        } else if (minOverlap === overlapRight) {
            bullet.x = right + r;
            bullet.vx = Math.abs(bullet.vx);
        } else if (minOverlap === overlapTop) {
            bullet.y = top - r;
            bullet.vy = -Math.abs(bullet.vy);
        } else {
            bullet.y = bottom + r;
            bullet.vy = Math.abs(bullet.vy);
        }
    }

    draw(ctx, scrollY, playerWorldPos) {
        if (!ctx || this.patches.length === 0) return;

        const cfg = this.getConfig();
        const color = cfg.COLOR || 'rgba(18, 80, 60, 0.75)';
        const edgeColor = cfg.EDGE_COLOR || 'rgba(20, 120, 90, 0.2)';
        const revealRadius = this.getRevealRadius();

        const px = playerWorldPos ? playerWorldPos.x : this.viewWidth / 2;
        const py = playerWorldPos ? (playerWorldPos.y - scrollY) : this.viewHeight / 2;
        const innerRadius = Math.max(0, revealRadius * 0.2);
        const outerRadius = Math.max(innerRadius + 1, revealRadius);
        const gradient = ctx.createRadialGradient(px, py, innerRadius, px, py, outerRadius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, color);

        ctx.save();
        for (const patch of this.patches) {
            const sx = patch.x;
            const sy = patch.y - scrollY;
            if (sy > this.viewHeight + patch.h || sy + patch.h < -patch.h) continue;

            ctx.fillStyle = gradient;
            ctx.fillRect(sx, sy, patch.w, patch.h);

            ctx.strokeStyle = edgeColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(sx + 1, sy + 1, patch.w - 2, patch.h - 2);
        }
        ctx.restore();
    }
}
