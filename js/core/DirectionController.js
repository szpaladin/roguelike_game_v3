function normalize(vec) {
    const len = Math.hypot(vec.x, vec.y);
    if (len === 0) return { x: 0, y: 1 };
    return { x: vec.x / len, y: vec.y / len };
}

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

export default class DirectionController {
    constructor(config = {}) {
        this.mode = 'random';
        this.dir = { x: 0, y: 1 };
        this.target = { x: 0, y: 1 };
        this.timer = 0;
        this.turnSpeed = Number.isFinite(config.TURN_SPEED) ? config.TURN_SPEED : 4.0;
        this.angleMin = Number.isFinite(config.ANGLE_MIN) ? config.ANGLE_MIN : -Math.PI / 2;
        this.angleMax = Number.isFinite(config.ANGLE_MAX) ? config.ANGLE_MAX : Math.PI / 2;
        this.horizontalThreshold = Number.isFinite(config.HORIZONTAL_THRESHOLD) ? config.HORIZONTAL_THRESHOLD : 0.15;
        this.midThreshold = Number.isFinite(config.MID_THRESHOLD) ? config.MID_THRESHOLD : 0.35;
        this.horizontalDuration = config.HORIZONTAL_DURATION || [1, 2];
        this.midDuration = config.MID_DURATION || [2, 4];
        this.defaultDuration = config.DEFAULT_DURATION || [3, 6];
    }

    setMode(mode) {
        if (mode === 'random' || mode === 'event') {
            this.mode = mode;
        }
    }

    forceDirection(angle, duration = null) {
        this.mode = 'event';
        this.target = this.angleToDir(angle);
        this.timer = Number.isFinite(duration) ? Math.max(0, duration) : this.pickDuration(this.target.y);
    }

    angleToDir(angle) {
        return normalize({ x: Math.sin(angle), y: Math.cos(angle) });
    }

    pickDuration(dirY) {
        const absY = Math.abs(dirY);
        if (absY < this.horizontalThreshold) {
            return randomRange(this.horizontalDuration[0], this.horizontalDuration[1]);
        }
        if (absY < this.midThreshold) {
            return randomRange(this.midDuration[0], this.midDuration[1]);
        }
        return randomRange(this.defaultDuration[0], this.defaultDuration[1]);
    }

    pickRandomDirection() {
        const angle = randomRange(this.angleMin, this.angleMax);
        this.target = this.angleToDir(angle);
        this.timer = this.pickDuration(this.target.y);
    }

    rotateTowards(current, target, dt) {
        const t = Math.max(0, Math.min(1, this.turnSpeed * dt));
        return normalize({
            x: current.x + (target.x - current.x) * t,
            y: current.y + (target.y - current.y) * t
        });
    }

    update(dt) {
        if (this.mode === 'random') {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.pickRandomDirection();
            }
        } else if (this.mode === 'event') {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.mode = 'random';
            }
        }

        this.dir = this.rotateTowards(this.dir, this.target, dt);
        return this.dir;
    }

    getDirection() {
        return this.dir;
    }
}
