import { ARTIFACTS, ARTIFACT_MAP } from './ArtifactData.js';
import { STATUS_EFFECTS } from '../enemies/StatusEffects.js';

const FRAMES_PER_SECOND = 60;
const DEATH_SAVE_INVULN_FRAMES = 120;
const SHIELD_INTERVAL_FRAMES = 720;
const SHIELD_SLOW_FRAMES = 30;
const EMERGENCY_SPEED_FRAMES = 180;
const EMERGENCY_COOLDOWN_FRAMES = 600;
const EMERGENCY_PENALTY_FRAMES = 300;
const KILL_BOOST_FRAMES = 120;
const OVERGROWTH_SLOW_FRAMES = 60;
const ZONE_BUFF_FRAMES = 180;
const ZONE_DEBUFF_FRAMES = 180;
const HUNTER_MARK_RESET_FRAMES = 120;

export default class ArtifactSystem {
    constructor(defs = ARTIFACTS) {
        this.defs = Array.isArray(defs) ? defs : [];
        this.map = ARTIFACT_MAP;
        this.artifacts = [];
        this.maxSlots = 4;
        this.resetState();
    }

    resetState() {
        this.state = {
            deathSaveUsed: false,
            shieldTimer: 0,
            shieldCharges: 0,
            shieldSlowTimer: 0,
            emergencyTimer: 0,
            emergencyCooldown: 0,
            emergencyPenaltyTimer: 0,
            killBoostTimer: 0,
            overgrowthSlowTimer: 0,
            zoneBuffTimer: 0,
            zoneDebuffDelay: 0,
            zoneDebuffTimer: 0,
            hunterMarkTarget: null,
            hunterMarkStacks: 0,
            hunterMarkTimer: 0
        };
    }

    setMaxSlots(maxSlots) {
        if (Number.isFinite(maxSlots) && maxSlots >= 0) {
            this.maxSlots = maxSlots;
        }
    }

    setArtifacts(ids) {
        this.artifacts = Array.isArray(ids) ? ids.slice() : [];
        this.resetState();
    }

    getArtifacts() {
        return this.artifacts.slice();
    }

    getArtifactCount() {
        return this.artifacts.length;
    }

    isFull() {
        return this.artifacts.length >= this.maxSlots;
    }

    hasArtifact(id) {
        return this.artifacts.includes(id);
    }

    getUniqueArtifacts() {
        return Array.from(new Set(this.artifacts));
    }

    getArtifactDefinition(id) {
        return this.map[id] || null;
    }

    getRandomArtifactId() {
        if (!this.defs.length) return null;
        const idx = Math.floor(Math.random() * this.defs.length);
        return this.defs[idx] ? this.defs[idx].id : null;
    }

    getRandomArtifact() {
        const id = this.getRandomArtifactId();
        return id ? this.getArtifactDefinition(id) : null;
    }

    canAddArtifact(id) {
        if (!id || !this.getArtifactDefinition(id)) return false;
        return this.artifacts.length < this.maxSlots;
    }

    addArtifact(id) {
        if (!this.canAddArtifact(id)) {
            return { success: false, reason: 'full' };
        }
        this.artifacts.push(id);
        return { success: true };
    }

    update(dt, playerStats) {
        const frames = Number.isFinite(dt) ? dt * FRAMES_PER_SECOND : 1;
        const state = this.state;

        const reduceTimer = (key) => {
            if (state[key] > 0) {
                state[key] = Math.max(0, state[key] - frames);
            }
        };

        reduceTimer('shieldSlowTimer');
        reduceTimer('emergencyTimer');
        reduceTimer('emergencyCooldown');
        reduceTimer('emergencyPenaltyTimer');
        reduceTimer('killBoostTimer');
        reduceTimer('overgrowthSlowTimer');
        reduceTimer('zoneBuffTimer');

        if (state.zoneDebuffDelay > 0) {
            state.zoneDebuffDelay = Math.max(0, state.zoneDebuffDelay - frames);
        } else {
            reduceTimer('zoneDebuffTimer');
        }

        if (state.hunterMarkTimer > 0) {
            state.hunterMarkTimer = Math.max(0, state.hunterMarkTimer - frames);
            if (state.hunterMarkTimer === 0) {
                state.hunterMarkTarget = null;
                state.hunterMarkStacks = 0;
            }
        }

        if (this.hasArtifact('shield_echo')) {
            state.shieldTimer += frames;
            if (state.shieldCharges < 1 && state.shieldTimer >= SHIELD_INTERVAL_FRAMES) {
                state.shieldCharges = 1;
                state.shieldTimer = 0;
                state.shieldSlowTimer = SHIELD_SLOW_FRAMES;
            }
        } else {
            state.shieldTimer = 0;
            state.shieldCharges = 0;
        }

        if (this.hasArtifact('emergency_float') && playerStats) {
            const hpRatio = playerStats.maxHp > 0 ? playerStats.hp / playerStats.maxHp : 1;
            if (state.emergencyTimer <= 0 && state.emergencyCooldown <= 0 && hpRatio > 0 && hpRatio < 0.3) {
                state.emergencyTimer = EMERGENCY_SPEED_FRAMES;
                state.emergencyPenaltyTimer = EMERGENCY_PENALTY_FRAMES;
                state.emergencyCooldown = EMERGENCY_COOLDOWN_FRAMES;
            }
        }
    }

    onEnemyKilled() {
        if (this.hasArtifact('reheat_device')) {
            this.state.killBoostTimer = KILL_BOOST_FRAMES;
        }
    }

    onZoneChange() {
        if (this.hasArtifact('tide_chip')) {
            this.state.zoneBuffTimer = ZONE_BUFF_FRAMES;
            this.state.zoneDebuffDelay = ZONE_BUFF_FRAMES;
            this.state.zoneDebuffTimer = ZONE_DEBUFF_FRAMES;
        }
    }

    onOvergrowthExplosion() {
        if (this.hasArtifact('overgrowth_core')) {
            this.state.overgrowthSlowTimer = OVERGROWTH_SLOW_FRAMES;
        }
    }

    consumeShieldCharge() {
        if (!this.hasArtifact('shield_echo')) return false;
        if (this.state.shieldCharges <= 0) return false;
        this.state.shieldCharges -= 1;
        return true;
    }

    tryConsumeDeathSave() {
        if (!this.hasArtifact('deep_sea_echo')) return false;
        if (this.state.deathSaveUsed) return false;
        this.state.deathSaveUsed = true;
        return true;
    }

    getDeathSaveInvulnFrames() {
        return DEATH_SAVE_INVULN_FRAMES;
    }

    getOxygenIntervalMultiplier() {
        let multiplier = 1;
        if (this.hasArtifact('deep_sea_echo')) multiplier *= 0.9;
        if (this.hasArtifact('decompression_shell')) multiplier *= 1.2;
        return multiplier;
    }

    getSpeedMultiplier() {
        let multiplier = 1;
        if (this.hasArtifact('decompression_shell')) multiplier *= 0.92;
        if (this.hasArtifact('emergency_float') && this.state.emergencyTimer > 0) multiplier *= 1.3;
        if (this.state.shieldSlowTimer > 0) multiplier *= 0.85;
        if (this.state.overgrowthSlowTimer > 0) multiplier *= 0.85;
        if (this.hasArtifact('tide_chip') && this.state.zoneBuffTimer > 0) multiplier *= 1.1;
        return multiplier;
    }

    getWeaponCooldownMultiplier() {
        let multiplier = 1;
        if (this.hasArtifact('shock_feedback')) multiplier *= 0.95;
        if (this.hasArtifact('emergency_float') && this.state.emergencyPenaltyTimer > 0) multiplier *= 0.85;
        return multiplier;
    }

    getDamageMultiplier() {
        let multiplier = 1;
        if (this.hasArtifact('fission_lens')) multiplier *= 0.85;
        if (this.hasArtifact('reheat_device')) {
            multiplier *= this.state.killBoostTimer > 0 ? 1.2 : 0.95;
        }
        if (this.hasArtifact('tide_chip') && this.state.zoneDebuffDelay <= 0 && this.state.zoneDebuffTimer > 0) {
            multiplier *= 0.9;
        }
        return multiplier;
    }

    getDamageTakenMultiplier() {
        let multiplier = 1;
        if (this.hasArtifact('relic_navigator')) multiplier *= 1.05;
        return multiplier;
    }

    getChestIntervalMultiplier() {
        let multiplier = 1;
        if (this.hasArtifact('relic_navigator')) multiplier *= 0.9;
        if (this.hasArtifact('supply_beacon')) multiplier *= 0.8;
        return multiplier;
    }

    getGoldRewardMultiplier() {
        let multiplier = 1;
        if (this.hasArtifact('supply_beacon')) multiplier *= 0.85;
        return multiplier;
    }

    getLightingAlphaOffset() {
        return this.hasArtifact('shadow_compass') ? -0.08 : 0;
    }

    getEvacuationSpawnIntervalMultiplier() {
        return this.hasArtifact('shadow_compass') ? 1.15 : 1;
    }

    getStatusModifiers() {
        const modifiers = {
            dotDurationMultiplier: 1,
            dotDamageMultiplier: 1,
            freezeChanceMultiplier: 1,
            freezeDurationBonus: 0,
            curseDamageMultiplier: 1,
            curseConsumeStacksBonus: 0,
            curseDurationMultiplier: 1,
            overgrowthExplosionMultiplier: 1,
            overgrowthExplosionRadiusBonus: 0
        };

        if (this.hasArtifact('corrosion_imprint')) {
            modifiers.dotDurationMultiplier *= 1.25;
            modifiers.dotDamageMultiplier *= 0.9;
        }

        if (this.hasArtifact('stasis_shard')) {
            modifiers.freezeChanceMultiplier *= 0.9;
            modifiers.freezeDurationBonus += 30;
        }

        if (this.hasArtifact('curse_rune')) {
            modifiers.curseDamageMultiplier *= 1.25;
            modifiers.curseConsumeStacksBonus += 1;
            modifiers.curseDurationMultiplier *= 0.9;
        }

        return modifiers;
    }

    applyBulletModifiers(bullet) {
        if (!bullet) return bullet;

        const statusMods = this.getStatusModifiers();
        const damageMultiplier = this.getDamageMultiplier();
        if (Number.isFinite(bullet.damage)) {
            bullet.damage *= damageMultiplier;
            bullet.damageMultiplier = damageMultiplier;
        } else if (damageMultiplier !== 1) {
            bullet.damageMultiplier = damageMultiplier;
        }

        const aoeRadiusMultiplier = this.hasArtifact('resonance_ring') ? 1.15 : 1;
        const aoeDamageMultiplier = this.hasArtifact('resonance_ring') ? 0.9 : 1;
        const rayWidthMultiplier = this.hasArtifact('prismatic_lens') ? 0.9 : 1;

        if (Number.isFinite(bullet.aoeRadius)) bullet.aoeRadius *= aoeRadiusMultiplier;
        if (Number.isFinite(bullet.explosionRadius)) bullet.explosionRadius *= aoeRadiusMultiplier;
        if (Number.isFinite(bullet.aoeDamage)) bullet.aoeDamage *= aoeDamageMultiplier;
        if (Number.isFinite(bullet.explosionDamage)) bullet.explosionDamage *= aoeDamageMultiplier;

        if (rayWidthMultiplier !== 1 && Number.isFinite(bullet.rayWidth)) {
            bullet.rayWidth *= rayWidthMultiplier;
        }

        const isRay = (bullet.rayRange > 0) || (bullet.rayLength > 0);
        if (this.hasArtifact('prismatic_lens') && isRay) {
            bullet.blindChance = Math.max(bullet.blindChance || 0, 0.2);
            bullet.blindDuration = Math.max(bullet.blindDuration || 0, 90);
        }

        if (this.hasArtifact('overgrowth_core') && !bullet.overgrowthDuration) {
            bullet.overgrowthDuration = STATUS_EFFECTS.OVERGROWTH.defaultDuration;
            bullet.overgrowthTriggerStacks = STATUS_EFFECTS.OVERGROWTH.defaultTriggerStacks;
            bullet.overgrowthExplosionRadius = STATUS_EFFECTS.OVERGROWTH.defaultExplosionRadius;
            bullet.overgrowthExplosionMultiplier = STATUS_EFFECTS.OVERGROWTH.defaultExplosionMultiplier;
        }

        return bullet;
    }

    getHitDamageMultiplier(enemy) {
        if (!this.hasArtifact('hunter_mark') || !enemy) return 1;

        const state = this.state;
        const isSameTarget = enemy === state.hunterMarkTarget;

        if (isSameTarget) {
            state.hunterMarkStacks = Math.min(5, state.hunterMarkStacks + 1);
        } else {
            state.hunterMarkTarget = enemy;
            state.hunterMarkStacks = 0;
        }

        state.hunterMarkTimer = HUNTER_MARK_RESET_FRAMES;

        const bonus = isSameTarget ? state.hunterMarkStacks * 0.05 : 0;
        const penalty = isSameTarget ? 1 : 0.9;
        return (1 + bonus) * penalty;
    }

    applyOnHitEffects(bullet, enemy, enemies, playerAttack, aoeHandler) {
        if (!enemy) return;

        if (this.hasArtifact('fission_lens') && aoeHandler) {
            const explosionRadius = 35;
            const explosionDamage = 0.4;
            aoeHandler.handleExplosionAOE(
                { explosionRadius, explosionDamage },
                enemy,
                enemies,
                playerAttack,
                null
            );
        }

        if (this.hasArtifact('shock_feedback') && Math.random() < 0.2) {
            enemy.applyStatusEffect('slowed', 60, { slowAmount: 0.3 });
        }
    }
}
