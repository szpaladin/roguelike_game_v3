import { UPGRADE_TABLE, purchaseUpgrade } from './MetaUpgrades.js';

export default class MetaStore {
    constructor(storageKey = 'roguelike_meta_progress') {
        this.storageKey = storageKey;
        this.data = this.load();
    }

    getDefaultData() {
        return {
            version: 1,
            gold: 0,
            upgrades: {
                maxHp: 0,
                strength: 0,
                intelligence: 0
            },
            stats: {
                runs: 0,
                bestDepth: 0,
                successfulEvacuations: 0,
                lastResult: null
            },
            unlockedWeapons: [],
            artifacts: {
                stash: [],
                inRun: [],
                maxSlots: 4
            },
            inventory: { width: 4, height: 4, items: [] },
            loadout: { slots: 0, equipped: [] },
            pendingLoot: []
        };
    }

    migrate(data) {
        const next = { ...this.getDefaultData(), ...(data || {}) };
        if (!next.stats) {
            next.stats = { runs: 0, bestDepth: 0, successfulEvacuations: 0, lastResult: null };
        }
        if (!next.upgrades) {
            next.upgrades = { maxHp: 0, strength: 0, intelligence: 0 };
        }
        if (!next.inventory) {
            next.inventory = { width: 4, height: 4, items: [] };
        }
        if (!next.loadout) {
            next.loadout = { slots: 0, equipped: [] };
        }
        if (!Array.isArray(next.pendingLoot)) {
            next.pendingLoot = [];
        }
        if (!Array.isArray(next.unlockedWeapons)) {
            next.unlockedWeapons = [];
        }
        if (!next.artifacts) {
            next.artifacts = { stash: [], inRun: [], maxSlots: 4 };
        }
        if (!Array.isArray(next.artifacts.stash)) {
            next.artifacts.stash = [];
        }
        if (!Array.isArray(next.artifacts.inRun)) {
            next.artifacts.inRun = [];
        }
        if (!Number.isFinite(next.artifacts.maxSlots)) {
            next.artifacts.maxSlots = 4;
        }

        if (next.gold === undefined && next.totalGold !== undefined) {
            next.gold = next.totalGold;
        }
        if (next.stats.bestDepth === 0 && next.highestDistance) {
            next.stats.bestDepth = next.highestDistance;
        }
        if (next.stats.runs === 0 && next.totalRuns) {
            next.stats.runs = next.totalRuns;
        }
        if (next.stats.successfulEvacuations === 0 && next.successfulEvacuations) {
            next.stats.successfulEvacuations = next.successfulEvacuations;
        }

        return next;
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return this.migrate(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load meta progress:', e);
        }
        return this.getDefaultData();
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save meta progress:', e);
        }
    }

    reset() {
        this.data = this.getDefaultData();
        this.save();
    }

    getProgress() {
        const canClone = typeof structuredClone === 'function';
        return canClone ? structuredClone(this.data) : JSON.parse(JSON.stringify(this.data));
    }

    applyUpgrades(stats) {
        if (!stats || !this.data || !this.data.upgrades) return;
        const upgrades = this.data.upgrades;
        const maxHpBoost = (upgrades.maxHp || 0) * UPGRADE_TABLE.maxHp.perLevel;
        const strengthBoost = (upgrades.strength || 0) * UPGRADE_TABLE.strength.perLevel;
        const intelligenceBoost = (upgrades.intelligence || 0) * UPGRADE_TABLE.intelligence.perLevel;

        stats.maxHp += maxHpBoost;
        stats.hp += maxHpBoost;
        stats.strength += strengthBoost;
        stats.intelligence += intelligenceBoost;
    }

    purchaseUpgrade(key) {
        const ok = purchaseUpgrade(this.data, key);
        if (ok) this.save();
        return ok;
    }

    processEvacuation(runData) {
        const goldEarned = runData.gold || 0;
        this.data.gold += goldEarned;

        if (runData.distance > this.data.stats.bestDepth) {
            this.data.stats.bestDepth = runData.distance;
        }

        if (runData.weapons && runData.weapons.length > 0) {
            for (const weapon of runData.weapons) {
                if (!this.data.unlockedWeapons.includes(weapon)) {
                    this.data.unlockedWeapons.push(weapon);
                }
            }
        }

        this.data.stats.runs++;
        this.data.stats.successfulEvacuations++;
        const result = {
            goldEarned,
            distanceBonus: Math.floor((runData.distance || 0) / 100),
            newWeapons: runData.weapons || [],
            penaltyApplied: false
        };
        this.data.stats.lastResult = {
            type: 'evacuation',
            goldEarned,
            distance: runData.distance || 0,
            distanceBonus: result.distanceBonus
        };
        this.save();

        return result;
    }

    processDeath(runData, penalty = 0.5) {
        const goldEarned = Math.floor((runData.gold || 0) * (1 - penalty));
        this.data.gold += goldEarned;

        if (runData.distance > this.data.stats.bestDepth) {
            this.data.stats.bestDepth = runData.distance;
        }

        this.data.stats.runs++;
        const result = {
            goldEarned,
            goldLost: (runData.gold || 0) - goldEarned,
            distanceBonus: Math.floor((runData.distance || 0) / 200),
            newWeapons: [],
            penaltyApplied: true
        };
        this.data.stats.lastResult = {
            type: 'death',
            goldEarned,
            goldLost: result.goldLost,
            distance: runData.distance || 0,
            distanceBonus: result.distanceBonus
        };
        this.save();

        return result;
    }

    prepareArtifactsForRun(maxSlots = null) {
        if (!this.data || !this.data.artifacts) return [];
        const artifacts = this.data.artifacts;
        const limit = Number.isFinite(maxSlots) ? maxSlots : (artifacts.maxSlots || 4);
        const stash = Array.isArray(artifacts.stash) ? artifacts.stash.slice() : [];
        if (limit <= 0) {
            artifacts.inRun = [];
            this.save();
            return [];
        }
        const selected = stash.slice(0, limit);
        const remaining = stash.slice(selected.length);
        artifacts.inRun = selected;
        artifacts.stash = remaining;
        this.save();
        return selected;
    }

    updateRunArtifacts(artifacts = []) {
        if (!this.data || !this.data.artifacts) return;
        this.data.artifacts.inRun = Array.isArray(artifacts) ? artifacts.slice() : [];
        this.save();
    }

    completeRunArtifacts(runArtifacts = [], success = false) {
        if (!this.data || !this.data.artifacts) return;
        if (success) {
            const stash = Array.isArray(this.data.artifacts.stash)
                ? this.data.artifacts.stash.slice()
                : [];
            for (const id of runArtifacts) {
                if (id) stash.push(id);
            }
            this.data.artifacts.stash = stash;
        }
        this.data.artifacts.inRun = [];
        this.save();
    }
}
