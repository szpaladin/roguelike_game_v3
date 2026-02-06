import { GAME_CONFIG } from '../config.js';
import { wrapDeltaX, wrapX } from '../utils.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const mix = (a, b, t) => a + (b - a) * t;

const hash = (n) => {
    const s = Math.sin(n) * 43758.5453;
    return s - Math.floor(s);
};

const hash2 = (x, y) => hash(x * 127.1 + y * 311.7);

export default class DeepSeaBackground {
    constructor(viewWidth = 600, viewHeight = 600, baseWorldWidth = null) {
        const cfg = GAME_CONFIG.BACKGROUND || {};
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.baseWorldWidth = Number.isFinite(baseWorldWidth) ? baseWorldWidth : viewWidth;
        this.cellSize = Number.isFinite(cfg.LOW_POLY_CELL) ? cfg.LOW_POLY_CELL : 80;
        this.beamCount = Number.isFinite(cfg.BEAM_COUNT) ? cfg.BEAM_COUNT : 5;
        this.dustCount = Number.isFinite(cfg.DUST_COUNT) ? cfg.DUST_COUNT : 70;
        this.time = 0;

        this.beams = this.createBeams();
        this.haze = this.createHaze();
        this.dust = this.createDust();
    }

    refreshView(view) {
        if (!view) return;
        if (Number.isFinite(view.width)) this.viewWidth = view.width;
        if (Number.isFinite(view.height)) this.viewHeight = view.height;
    }

    createBeams() {
        const beams = [];
        for (let i = 0; i < this.beamCount; i++) {
            beams.push({
                baseX: Math.random() * this.baseWorldWidth,
                x: 0,
                width: 40 + Math.random() * 60,
                alpha: 0.04 + Math.random() * 0.05,
                drift: 8 + Math.random() * 14,
                speed: 0.12 + Math.random() * 0.25,
                parallax: 0.35 + Math.random() * 0.2,
                phase: Math.random() * Math.PI * 2
            });
        }
        return beams;
    }

    createHaze() {
        const blobs = [];
        const count = 6;
        for (let i = 0; i < count; i++) {
            blobs.push({
                x: Math.random() * this.baseWorldWidth,
                y: Math.random() * this.viewHeight * 2,
                radius: 160 + Math.random() * 220,
                alpha: 0.03 + Math.random() * 0.05,
                parallax: 0.25 + Math.random() * 0.2
            });
        }
        return blobs;
    }

    createDust() {
        const dust = [];
        for (let i = 0; i < this.dustCount; i++) {
            dust.push({
                x: Math.random() * this.baseWorldWidth,
                y: Math.random() * this.viewHeight,
                radius: 0.6 + Math.random() * 1.2,
                alpha: 0.05 + Math.random() * 0.06,
                vy: 4 + Math.random() * 10,
                parallax: 0.6 + Math.random() * 0.2
            });
        }
        return dust;
    }

    update(dt, view) {
        this.time += dt;
        this.refreshView(view);
        const scrollY = view ? (view.scrollY || 0) : 0;
        const resetY = scrollY + this.viewHeight * 1.5;

        for (const beam of this.beams) {
            beam.phase += dt * beam.speed;
            beam.x = wrapX(beam.baseX + Math.sin(beam.phase) * beam.drift, this.baseWorldWidth);
        }

        for (const blob of this.haze) {
            if (blob.y + blob.radius < scrollY - this.viewHeight) {
                blob.y = resetY + Math.random() * this.viewHeight;
                blob.x = Math.random() * this.baseWorldWidth;
            }
        }

        for (const particle of this.dust) {
            particle.y -= particle.vy * dt;
            if (particle.y < scrollY - this.viewHeight) {
                particle.y = resetY + Math.random() * this.viewHeight;
                particle.x = Math.random() * this.baseWorldWidth;
            }
        }
    }

    draw(ctx, view) {
        if (!ctx) return;
        const viewW = this.viewWidth;
        const viewH = this.viewHeight;
        const scrollX = view ? (view.scrollX || 0) : 0;
        const scrollY = view ? (view.scrollY || 0) : 0;

        const gradient = ctx.createLinearGradient(0, 0, 0, viewH);
        gradient.addColorStop(0, '#050b1a');
        gradient.addColorStop(1, '#02050f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, viewW, viewH);

        this.drawHaze(ctx, scrollX, scrollY, viewW, viewH);
        this.drawLowPoly(ctx, scrollX, scrollY, viewW, viewH, {
            cellSize: this.cellSize,
            parallax: 1,
            alpha: 1,
            colorShift: 0
        });
        this.drawLowPoly(ctx, scrollX, scrollY, viewW, viewH, {
            cellSize: this.cellSize * 1.6,
            parallax: 0.7,
            alpha: 0.35,
            colorShift: -6
        });
        this.drawBeams(ctx, scrollX, viewW, viewH);
        this.drawWaves(ctx, viewW, viewH);
        this.drawDust(ctx, scrollX, scrollY, viewW, viewH);
    }

    drawHaze(ctx, scrollX, scrollY, viewW, viewH) {
        ctx.save();
        for (const blob of this.haze) {
            const parallaxX = scrollX * blob.parallax;
            const parallaxY = scrollY * blob.parallax;
            const screenX = wrapDeltaX(blob.x - (parallaxX + viewW / 2), this.baseWorldWidth) + viewW / 2;
            const screenY = blob.y - parallaxY;
            if (screenX + blob.radius < -viewW || screenX - blob.radius > viewW * 2) continue;
            if (screenY + blob.radius < -viewH || screenY - blob.radius > viewH * 2) continue;
            const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, blob.radius);
            gradient.addColorStop(0, `rgba(10, 26, 60, ${blob.alpha})`);
            gradient.addColorStop(1, 'rgba(5, 10, 24, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenX, screenY, blob.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawLowPoly(ctx, scrollX, scrollY, viewW, viewH, options = {}) {
        const cell = Number.isFinite(options.cellSize) ? options.cellSize : this.cellSize;
        const parallax = Number.isFinite(options.parallax) ? options.parallax : 1;
        const alpha = Number.isFinite(options.alpha) ? options.alpha : 1;
        const colorShift = Number.isFinite(options.colorShift) ? options.colorShift : 0;

        const originX = scrollX * parallax;
        const originY = scrollY * parallax;
        const cols = Math.max(1, Math.floor(this.baseWorldWidth / cell));
        const gxStart = Math.floor((originX - cell) / cell);
        const gxEnd = Math.floor((originX + viewW + cell) / cell);
        const gyStart = Math.floor((originY - cell) / cell);
        const gyEnd = Math.floor((originY + viewH + cell) / cell);

        ctx.save();
        ctx.globalAlpha = alpha;

        for (let gy = gyStart; gy <= gyEnd; gy++) {
            for (let gx = gxStart; gx <= gxEnd; gx++) {
                const p00 = this.getPoint(gx, gy, cell, originX, originY, cols);
                const p10 = this.getPoint(gx + 1, gy, cell, originX, originY, cols);
                const p01 = this.getPoint(gx, gy + 1, cell, originX, originY, cols);
                const p11 = this.getPoint(gx + 1, gy + 1, cell, originX, originY, cols);

                const gxWrapped = ((gx % cols) + cols) % cols;
                const diag = hash2(gxWrapped, gy) > 0.5;
                const centerY = (p00.y + p11.y) * 0.5;
                ctx.fillStyle = this.getColor(gxWrapped, gy, centerY, viewH, colorShift);

                if (diag) {
                    this.fillTriangle(ctx, p00, p10, p11);
                    this.fillTriangle(ctx, p00, p11, p01);
                } else {
                    this.fillTriangle(ctx, p00, p10, p01);
                    this.fillTriangle(ctx, p10, p11, p01);
                }
            }
        }

        ctx.restore();
    }

    drawBeams(ctx, scrollX, viewW, viewH) {
        ctx.save();
        for (const beam of this.beams) {
            const parallaxX = scrollX * beam.parallax;
            const screenX = wrapDeltaX(beam.x - (parallaxX + viewW / 2), this.baseWorldWidth) + viewW / 2;
            if (screenX + beam.width < 0 || screenX - beam.width > viewW) continue;

            const gradient = ctx.createLinearGradient(screenX - beam.width, 0, screenX + beam.width, 0);
            gradient.addColorStop(0, 'rgba(40, 90, 140, 0)');
            gradient.addColorStop(0.5, `rgba(50, 120, 190, ${beam.alpha})`);
            gradient.addColorStop(1, 'rgba(40, 90, 140, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX - beam.width, 0, beam.width * 2, viewH);
        }
        ctx.restore();
    }

    drawDust(ctx, scrollX, scrollY, viewW, viewH) {
        ctx.save();
        for (const particle of this.dust) {
            const parallaxX = scrollX * particle.parallax;
            const parallaxY = scrollY * particle.parallax;
            const screenX = wrapDeltaX(particle.x - (parallaxX + viewW / 2), this.baseWorldWidth) + viewW / 2;
            const screenY = particle.y - parallaxY;
            if (screenX < -10 || screenX > viewW + 10) continue;
            if (screenY < -20 || screenY > viewH + 20) continue;
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = '#9bb8d4';
            ctx.beginPath();
            ctx.arc(screenX, screenY, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    drawWaves(ctx, viewW, viewH) {
        ctx.save();
        ctx.strokeStyle = 'rgba(25, 55, 90, 0.08)';
        ctx.lineWidth = 1;
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
            const baseY = (this.time * 12 + i * (viewH / waveCount)) % viewH;
            ctx.beginPath();
            for (let x = 0; x <= viewW + 30; x += 30) {
                const y = baseY + Math.sin((x * 0.04) + this.time * 0.6 + i) * 4;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    fillTriangle(ctx, a, b, c) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.closePath();
        ctx.fill();
    }

    getPoint(gx, gy, cell, originX, originY, cols) {
        const gxWrapped = ((gx % cols) + cols) % cols;
        const seed = gxWrapped * 928371 + gy * 727;
        const jitter = cell * 0.3;
        const jx = (hash(seed) - 0.5) * jitter;
        const jy = (hash(seed + 11.13) - 0.5) * jitter;
        const worldX = gx * cell + jx;
        const worldY = gy * cell + jy;
        return {
            x: worldX - originX,
            y: worldY - originY
        };
    }

    getColor(gxWrapped, gy, screenY, viewH, colorShift = 0) {
        const noise = hash2(gxWrapped * 1.3, gy * 1.7);
        const depth = clamp((screenY + this.cellSize) / viewH, 0, 1);
        const top = [6, 18, 40];
        const bottom = [2, 6, 18];
        const light = (1 - depth) * 6;
        const variation = (noise - 0.5) * 12 + colorShift;

        const r = clamp(mix(top[0], bottom[0], depth) + variation + light, 0, 255);
        const g = clamp(mix(top[1], bottom[1], depth) + variation + light * 0.6, 0, 255);
        const b = clamp(mix(top[2], bottom[2], depth) + variation, 0, 255);

        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
}
