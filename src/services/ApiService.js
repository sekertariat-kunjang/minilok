import { CLUSTERS } from '../constants/appConstants';

const STORAGE_KEY = 'minilok_data';

class ApiService {
    constructor() {
        this.data = this._loadFromStorage();
    }

    _loadFromStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse storage data', e);
                return this._getInitialData();
            }
        }
        return this._getInitialData();
    }

    _saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    _getInitialData() {
        return {
            activities: [], // { id, clusterId, name, targetValue, targetLogic }
            achievements: [], // { activityId, month, value, year }
            pdca: [] // { activityId, month, year, plan, do, check, action }
        };
    }

    // Activities
    async getActivities(clusterId) {
        if (clusterId) {
            return this.data.activities.filter(a => a.clusterId === clusterId);
        }
        return this.data.activities;
    }

    async addActivity(activity) {
        // Prevent exact duplicates (same name in same cluster)
        const exists = this.data.activities.find(a =>
            a.name.toLowerCase() === activity.name.toLowerCase() &&
            a.clusterId === activity.clusterId
        );
        if (exists) return exists;

        const newActivity = {
            ...activity,
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        this.data.activities.push(newActivity);
        this._saveToStorage();
        return newActivity;
    }

    async updateActivity(id, updates) {
        const index = this.data.activities.findIndex(a => a.id === id);
        if (index !== -1) {
            this.data.activities[index] = { ...this.data.activities[index], ...updates };
            this._saveToStorage();
            return this.data.activities[index];
        }
        throw new Error('Activity not found');
    }

    async deleteActivity(id) {
        this.data.activities = this.data.activities.filter(a => a.id !== id);
        // Cleanup achievements and PDCA for this activity
        this.data.achievements = this.data.achievements.filter(ach => ach.activityId !== id);
        this.data.pdca = this.data.pdca.filter(p => p.activityId !== id);
        this._saveToStorage();
        return true;
    }

    // Achievements
    async getAchievements(month, year, clusterId) {
        let activities = this.data.activities;
        if (clusterId) {
            activities = activities.filter(a => a.clusterId === clusterId);
        }

        const activityIds = activities.map(a => a.id);
        return this.data.achievements.filter(ach =>
            activityIds.includes(ach.activityId) &&
            ach.month === parseInt(month) &&
            ach.year === parseInt(year)
        );
    }

    async saveAchievement(achievement) {
        // achievement: { activityId, month, year, value }
        const index = this.data.achievements.findIndex(ach =>
            ach.activityId === achievement.activityId &&
            ach.month === achievement.month &&
            ach.year === achievement.year
        );

        if (index !== -1) {
            this.data.achievements[index].value = achievement.value;
        } else {
            this.data.achievements.push(achievement);
        }
        this._saveToStorage();
        return achievement;
    }

    // PDCA
    async getPDCA(activityId, month, year) {
        return this.data.pdca.find(p =>
            p.activityId === activityId &&
            p.month === parseInt(month) &&
            p.year === parseInt(year)
        );
    }

    async savePDCA(pdcaEntry) {
        const index = this.data.pdca.findIndex(p =>
            p.activityId === pdcaEntry.activityId &&
            p.month === pdcaEntry.month &&
            p.year === pdcaEntry.year
        );

        if (index !== -1) {
            this.data.pdca[index] = { ...this.data.pdca[index], ...pdcaEntry };
        } else {
            this.data.pdca.push(pdcaEntry);
        }
        this._saveToStorage();
        return pdcaEntry;
    }
}

const apiService = new ApiService();
export default apiService;
