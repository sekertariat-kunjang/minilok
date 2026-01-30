import { supabase } from '../lib/supabase';

class ApiService {
    // Activities
    async getActivities(clusterId) {
        let query = supabase.from('activities').select('*').order('created_at', { ascending: true });
        if (clusterId) {
            query = query.eq('cluster_id', clusterId);
        }
        const { data, error } = await query;
        if (error) throw error;
        // Map snake_case to camelCase if necessary, but here we'll try to keep them consistent
        return data.map(item => ({
            ...item,
            clusterId: item.cluster_id,
            targetValue: item.target_value,
            targetLogic: item.target_logic
        }));
    }

    async addActivity(activity) {
        // Prevent exact duplicates
        const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('name', activity.name)
            .eq('cluster_id', activity.clusterId)
            .maybeSingle();

        if (existing) return existing;

        const newId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { data, error } = await supabase
            .from('activities')
            .insert([{
                id: newId,
                cluster_id: activity.clusterId,
                name: activity.name,
                target_value: activity.targetValue,
                target_logic: activity.targetLogic
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            clusterId: data.cluster_id,
            targetValue: data.target_value,
            targetLogic: data.target_logic
        };
    }

    async updateActivity(id, updates) {
        const payload = {};
        if (updates.name) payload.name = updates.name;
        if (updates.clusterId) payload.cluster_id = updates.clusterId;
        if (updates.targetValue) payload.target_value = updates.targetValue;
        if (updates.targetLogic) payload.target_logic = updates.targetLogic;

        const { data, error } = await supabase
            .from('activities')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            clusterId: data.cluster_id,
            targetValue: data.target_value,
            targetLogic: data.target_logic
        };
    }

    async deleteActivity(id) {
        // Cascading delete is handled by Supabase if configured, 
        // but we'll manually ensure it just in case or for cleaner API response
        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    // Achievements
    async getAchievements(month, year, clusterId) {
        // Link with activities to filter by clusterId
        let query = supabase
            .from('achievements')
            .select('*, activities!inner(*)')
            .eq('month', parseInt(month))
            .eq('year', parseInt(year));

        if (clusterId) {
            query = query.eq('activities.cluster_id', clusterId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map(item => ({
            activityId: item.activity_id,
            month: item.month,
            year: item.year,
            value: item.value
        }));
    }

    async saveAchievement(achievement) {
        const { data, error } = await supabase
            .from('achievements')
            .upsert({
                activity_id: achievement.activityId,
                month: achievement.month,
                year: achievement.year,
                value: achievement.value
            }, {
                onConflict: 'activity_id,month,year'
            })
            .select()
            .single();

        if (error) throw error;
        return {
            activityId: data.activity_id,
            month: data.month,
            year: data.year,
            value: data.value
        };
    }

    async getAnnualAchievements(year, clusterId) {
        let query = supabase
            .from('achievements')
            .select('*, activities!inner(*)')
            .eq('year', parseInt(year));

        if (clusterId) {
            query = query.eq('activities.cluster_id', clusterId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map(item => ({
            activityId: item.activity_id,
            month: item.month,
            year: item.year,
            value: item.value
        }));
    }

    // PDCA
    async getBulkPDCA(month, year, clusterId) {
        let query = supabase
            .from('pdca')
            .select('*, activities!inner(*)')
            .eq('month', parseInt(month))
            .eq('year', parseInt(year));

        if (clusterId) {
            query = query.eq('activities.cluster_id', clusterId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map(item => ({
            activityId: item.activity_id,
            activityName: item.activities.name,
            month: item.month,
            year: item.year,
            plan: item.plan,
            do: item.do,
            check: item.check,
            action: item.action
        }));
    }

    async getPDCA(activityId, month, year) {
        const { data, error } = await supabase
            .from('pdca')
            .select('*')
            .eq('activity_id', activityId)
            .eq('month', parseInt(month))
            .eq('year', parseInt(year))
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            activityId: data.activity_id,
            month: data.month,
            year: data.year,
            plan: data.plan,
            do: data.do,
            check: data.check,
            action: data.action
        };
    }

    async savePDCA(pdcaEntry) {
        const { data, error } = await supabase
            .from('pdca')
            .upsert({
                activity_id: pdcaEntry.activityId,
                month: pdcaEntry.month,
                year: pdcaEntry.year,
                plan: pdcaEntry.plan,
                do: pdcaEntry.do,
                check: pdcaEntry.check,
                action: pdcaEntry.action
            }, {
                onConflict: 'activity_id,month,year'
            })
            .select()
            .single();

        if (error) throw error;
        return {
            activityId: data.activity_id,
            month: data.month,
            year: data.year,
            plan: data.plan,
            do: data.do,
            check: data.check,
            action: data.action
        };
    }
}

const apiService = new ApiService();
export default apiService;
