import { GAME_CONFIG } from '../config.js';
import { wrapDeltaX, wrapX, worldToScreen } from '../utils.js';

const randomRange = (min, max) => min + Math.random() * (max - min);
const randomInt = (min, max) => Math.floor(randomRange(min, max + 1));

export default class FogManager {
    constructor(viewWidth = 600, viewHeight = 600) {
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.worldWidth = viewWidth;
        this.patches = [];
        this.nextSpawnDistance = 0;
        this.patchId = 0;
        this.maskCanvas = null;
        this.maskCtx = null;
        this.maskWidth = 0;
        this.maskHeight = 0;
        this.rollNextSpawn(0);
    }

    getConfig() {
        return GAME_CONFIG.FOG || {};
    }

    getRevealRadius() {
        const cfg = this.getConfig();
        return Number.isFinite(cfg.REVEAL_RADIUS) ? cfg.REVEAL_RADIUS : 260;
    }

    rollNextSpawn(currentDistance) {
        const cfg = this.getConfig();
        const minInterval = Number.isFinite(cfg.SPAWN_INTERVAL_MIN) ? cfg.SPAWN_INTERVAL_MIN : 1100;
        const maxInterval = Number.isFinite(cfg.SPAWN_INTERVAL_MAX) ? cfg.SPAWN_INTERVAL_MAX : 1600;
        this.nextSpawnDistance = currentDistance + randomRange(minInterval, maxInterval);
    }

    update(view, dir) {
        const scrollY = view ? (view.scrollY || 0) : 0;
        if (view) {
            if (Number.isFinite(view.width)) this.viewWidth = view.width;
            if (Number.isFinite(view.height)) this.viewHeight = view.height;
            if (Number.isFinite(view.worldWidth)) this.worldWidth = view.worldWidth;
        }

        if (scrollY >= this.nextSpawnDistance) {
            this.spawnPatch(view, dir);
            this.rollNextSpawn(scrollY);
        }

        const cleanupY = scrollY - 300;
        this.patches = this.patches.filter(patch => {
            const maxY = Number.isFinite(patch.maxY) ? patch.maxY : (patch.y + patch.h);
            return maxY >= cleanupY;
        });
    }

    spawnPatch(view, dir) {
        const cfg = this.getConfig();
        const minSize = Number.isFinite(cfg.PATCH_MIN_SIZE) ? cfg.PATCH_MIN_SIZE : 420;
        const maxSize = Number.isFinite(cfg.PATCH_MAX_SIZE) ? cfg.PATCH_MAX_SIZE : 620;
        const offsetMin = Number.isFinite(cfg.SPAWN_OFFSET_MIN) ? cfg.SPAWN_OFFSET_MIN : 120;
        const offsetMax = Number.isFinite(cfg.SPAWN_OFFSET_MAX) ? cfg.SPAWN_OFFSET_MAX : 220;

        const w = randomRange(minSize, maxSize);
        const h = randomRange(minSize, maxSize);

        if (view && dir && Number.isFinite(view.cameraX) && Number.isFinite(view.cameraY)) {
            const forward = (view.height || this.viewHeight) + randomRange(offsetMin, offsetMax);
            const sideRange = (view.width || this.viewWidth) * 0.7;
            const side = (Math.random() * 2 - 1) * sideRange;
            const perpX = -dir.y;
            const perpY = dir.x;
            const baseX = view.cameraX + dir.x * forward;
            const baseY = view.cameraY + dir.y * forward;
            const x = wrapX(baseX + perpX * side - w / 2, this.worldWidth);
            const y = baseY + perpY * side - h / 2;

            this.patches.push(this.createPatch(x, y, w, h));
            return;
        }

        const maxX = Math.max(0, this.viewWidth - w);
        const x = Math.random() * maxX;
        const y = (view ? (view.scrollY || 0) : 0) + this.viewHeight + randomRange(offsetMin, offsetMax);

        this.patches.push(this.createPatch(x, y, w, h));
    }

    createPatch(x, y, w, h) {
        const circles = this.buildPatchCircles(x, y, w, h);
        const bounds = this.getCircleBounds(circles);
        return {
            id: this.patchId++,
            x,
            y,
            w,
            h,
            circles,
            minY: bounds.minY,
            maxY: bounds.maxY
        };
    }

    buildPatchCircles(x, y, w, h) {
        const baseSize = Math.min(w, h);
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        const coreRadius = baseSize * randomRange(0.35, 0.48);
        const stretchX = randomRange(0.9, 1.6);
        const stretchY = randomRange(0.9, 1.6);
        const extraCount = randomInt(6, 12);
        const circles = [];

        circles.push({
            x: wrapX(centerX, this.worldWidth),
            y: centerY,
            r: coreRadius * randomRange(0.95, 1.25)
        });

        for (let i = 0; i < extraCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const offset = coreRadius * randomRange(0.5, 1.6);
            const jitterX = randomRange(-coreRadius * 0.25, coreRadius * 0.25);
            const jitterY = randomRange(-coreRadius * 0.25, coreRadius * 0.25);
            const cx = centerX + Math.cos(angle) * offset * stretchX + jitterX;
            const cy = centerY + Math.sin(angle) * offset * stretchY + jitterY;
            const r = coreRadius * randomRange(0.55, 1.15);
            circles.push({
                x: wrapX(cx, this.worldWidth),
                y: cy,
                r
            });
        }

        return circles;
    }

    getCircleBounds(circles) {
        let minY = Infinity;
        let maxY = -Infinity;

        for (const circle of circles) {
            const top = circle.y - circle.r;
            const bottom = circle.y + circle.r;
            if (top < minY) minY = top;
            if (bottom > maxY) maxY = bottom;
        }

        return { minY, maxY };
    }

    getCircleHit(x, y, radius, patch) {
        if (!patch || !patch.circles) return null;
        const r = Number.isFinite(radius) ? radius : 0;
        if (Number.isFinite(patch.minY) && Number.isFinite(patch.maxY)) {
            if (y < patch.minY - r || y > patch.maxY + r) return null;
        }

        let best = null;
        let bestDepth = -Infinity;
        for (const circle of patch.circles) {
            const dx = wrapDeltaX(x - circle.x, this.worldWidth);
            const dy = y - circle.y;
            const sum = circle.r + r;
            const dist2 = dx * dx + dy * dy;
            if (dist2 <= sum * sum) {
                const dist = Math.sqrt(dist2);
                const depth = sum - dist;
                if (!best || depth > bestDepth) {
                    bestDepth = depth;
                    best = { circle, dx, dy, dist };
                }
            }
        }
        return best;
    }

    findPatchForCircle(x, y, radius) {
        for (const patch of this.patches) {
            const hit = this.getCircleHit(x, y, radius, patch);
            if (hit) return { patch, hit };
        }
        return null;
    }

    isPointInsidePatch(x, y, patch) {
        return !!this.getCircleHit(x, y, 0, patch);
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
        const dx = wrapDeltaX(x - playerWorldPos.x, this.worldWidth);
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
            enemy.hiddenInFog = this.isPointHidden(enemy.x, enemy.y, playerWorldPos);
        }
    }

    updateChestVisibility(chests, playerWorldPos) {
        if (!Array.isArray(chests)) return;
        for (const chest of chests) {
            if (!chest) continue;
            chest.hiddenInFog = this.isPointHidden(chest.x, chest.y, playerWorldPos);
        }
    }

    resolveBulletInteractions(bullets, playerWorldPos) {
        if (!Array.isArray(bullets)) return;
        const cfg = this.getConfig();
        if (cfg.BLOCK_BULLETS === false) return;

        for (const bullet of bullets) {
            if (!bullet || !bullet.active) continue;

            const radius = Number.isFinite(bullet.radius) ? bullet.radius : 0;
            const result = this.findPatchForCircle(bullet.x, bullet.y, radius);
            if (!result) {
                bullet.fogInside = false;
                bullet.fogPatchId = null;
                continue;
            }

            const { patch, hit } = result;
            const revealed = this.isPointRevealed(bullet.x, bullet.y, playerWorldPos);
            if (revealed) {
                bullet.fogInside = true;
                bullet.fogPatchId = patch.id;
                continue;
            }

            if (bullet.fogInside && bullet.fogPatchId === patch.id) {
                bullet.active = false;
                continue;
            }

            this.bounceBulletFromPatch(bullet, patch, hit);
            bullet.fogInside = false;
            bullet.fogPatchId = null;
        }
    }

    bounceBulletFromPatch(bullet, patch, hit) {
        const r = Number.isFinite(bullet.radius) ? bullet.radius : 0;
        const collision = hit || this.getCircleHit(bullet.x, bullet.y, r, patch);
        if (!collision) return;

        let { circle, dx, dy, dist } = collision;
        let nx = 0;
        let ny = -1;

        if (dist > 0) {
            nx = dx / dist;
            ny = dy / dist;
        } else {
            const speed = Math.hypot(bullet.vx, bullet.vy);
            if (speed > 0) {
                nx = -bullet.vx / speed;
                ny = -bullet.vy / speed;
            }
        }

        const dot = bullet.vx * nx + bullet.vy * ny;
        bullet.vx -= 2 * dot * nx;
        bullet.vy -= 2 * dot * ny;

        const pushOut = circle.r + r + 0.5;
        const newX = circle.x + nx * pushOut;
        const newY = circle.y + ny * pushOut;
        bullet.x = wrapX(newX, this.worldWidth);
        bullet.y = newY;
    }

    ensureMaskCanvas(width, height) {
        if (this.maskCanvas && this.maskWidth === width && this.maskHeight === height) {
            return;
        }
        this.maskCanvas = document.createElement('canvas');
        this.maskCanvas.width = width;
        this.maskCanvas.height = height;
        this.maskCtx = this.maskCanvas.getContext('2d');
        this.maskWidth = width;
        this.maskHeight = height;
    }

    draw(ctx, view, playerWorldPos) {
        if (!ctx || this.patches.length === 0) return;

        const cfg = this.getConfig();
        const color = cfg.COLOR || 'rgba(190, 185, 150, 0.5)';
        const revealRadius = this.getRevealRadius();
        const viewWidth = view ? (view.width || this.viewWidth) : this.viewWidth;
        const viewHeight = view ? (view.height || this.viewHeight) : this.viewHeight;
        const worldWidth = view ? (view.worldWidth || this.worldWidth) : this.worldWidth;

        const playerScreen = playerWorldPos && view
            ? worldToScreen(playerWorldPos.x, playerWorldPos.y, view)
            : { x: viewWidth / 2, y: viewHeight / 2 };
        const px = playerScreen.x;
        const py = playerScreen.y;
        const innerRadius = Math.max(0, revealRadius * 0.2);
        const outerRadius = Math.max(innerRadius + 1, revealRadius);

        this.ensureMaskCanvas(viewWidth, viewHeight);
        const maskCtx = this.maskCtx;
        if (!maskCtx) return;

        const viewTop = view ? (view.scrollY || 0) : 0;
        const viewBottom = viewTop + viewHeight;

        maskCtx.clearRect(0, 0, viewWidth, viewHeight);
        maskCtx.save();
        maskCtx.beginPath();

        for (const patch of this.patches) {
            if (Number.isFinite(patch.minY) && Number.isFinite(patch.maxY)) {
                if (patch.maxY < viewTop - 120 || patch.minY > viewBottom + 120) continue;
            }

            for (const circle of patch.circles || []) {
                const screen = view ? worldToScreen(circle.x, circle.y, view) : { x: circle.x, y: circle.y };
                const r = circle.r;
                if (screen.y + r < -r || screen.y - r > viewHeight + r) continue;

                maskCtx.moveTo(screen.x + r, screen.y);
                maskCtx.arc(screen.x, screen.y, r, 0, Math.PI * 2);

                if (screen.x - r < 0) {
                    const wrapXPos = screen.x + worldWidth;
                    maskCtx.moveTo(wrapXPos + r, screen.y);
                    maskCtx.arc(wrapXPos, screen.y, r, 0, Math.PI * 2);
                } else if (screen.x + r > viewWidth) {
                    const wrapXPos = screen.x - worldWidth;
                    maskCtx.moveTo(wrapXPos + r, screen.y);
                    maskCtx.arc(wrapXPos, screen.y, r, 0, Math.PI * 2);
                }
            }
        }

        maskCtx.fillStyle = '#000';
        maskCtx.fill();
        maskCtx.globalCompositeOperation = 'source-in';

        const gradient = maskCtx.createRadialGradient(px, py, innerRadius, px, py, outerRadius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, color);
        maskCtx.fillStyle = gradient;
        maskCtx.fillRect(0, 0, viewWidth, viewHeight);

        maskCtx.restore();
        maskCtx.globalCompositeOperation = 'source-over';

        ctx.drawImage(this.maskCanvas, 0, 0);
    }
}
