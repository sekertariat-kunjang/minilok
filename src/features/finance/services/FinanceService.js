import { supabase } from '../../../core/supabase';
import { FINANCE_STATUS } from '../constants/financeConstants';

class FinanceService {
    async getActivities() {
        const { data, error } = await supabase
            .from('finance_activities')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async getActivityById(id) {
        const { data, error } = await supabase
            .from('finance_activities')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async createActivity(activity) {
        const { data, error } = await supabase
            .from('finance_activities')
            .insert([{
                title: activity.title,
                budget: activity.budget,
                description: activity.description,
                status: FINANCE_STATUS.DRAFT
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async createBulkActivities(activities) {
        const rows = activities.map(act => ({
            title: act.title,
            budget: act.budget || 0,
            description: act.description || '',
            status: FINANCE_STATUS.DRAFT
        }));

        const { data, error } = await supabase
            .from('finance_activities')
            .insert(rows)
            .select();

        if (error) throw error;
        return data;
    }

    async updateActivity(id, updates) {
        // Sanitize updates data: convert empty strings to null for database compatibility
        const sanitizedUpdates = {};
        Object.keys(updates).forEach(key => {
            sanitizedUpdates[key] = updates[key] === '' ? null : updates[key];
        });

        const { data, error } = await supabase
            .from('finance_activities')
            .update({
                ...sanitizedUpdates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async transitionStatus(id, newStatus, additionalData = {}) {
        const updates = { status: newStatus };

        // Record transition timestamps
        if (newStatus === FINANCE_STATUS.PENDING_REPORT) updates.assigned_at = new Date().toISOString();
        if (newStatus === FINANCE_STATUS.PENDING_EVALUATION) updates.reported_at = new Date().toISOString();
        if (newStatus === FINANCE_STATUS.PENDING_BPP) updates.evaluated_at = new Date().toISOString();
        if (newStatus === FINANCE_STATUS.PENDING_REQUEST) updates.bpp_checked_at = new Date().toISOString();
        if (newStatus === FINANCE_STATUS.PENDING_KAPUS) updates.request_created_at = new Date().toISOString();
        if (newStatus === FINANCE_STATUS.PENDING_CROSSCHECK) updates.transferred_at = new Date().toISOString();
        if (newStatus === FINANCE_STATUS.COMPLETED) updates.final_checked_at = new Date().toISOString();

        // Sanitize additionalData: convert empty strings to null for database compatibility
        const sanitizedData = {};
        Object.keys(additionalData).forEach(key => {
            sanitizedData[key] = additionalData[key] === '' ? null : additionalData[key];
        });

        return this.updateActivity(id, { ...updates, ...sanitizedData });
    }

    // Public Access Methods (using tokens)
    async getActivityByToken(token, type = 'petugas') {
        const column = type === 'petugas' ? 'petugas_token' : 'evaluator_token';
        const { data, error } = await supabase
            .from('finance_activities')
            .select('*')
            .eq(column, token)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async submitReportByToken(token, reportData) {
        const { data: activity } = await supabase
            .from('finance_activities')
            .select('id, status')
            .eq('petugas_token', token)
            .single();

        if (!activity) throw new Error('Invalid token');

        return this.transitionStatus(activity.id, FINANCE_STATUS.PENDING_EVALUATION, {
            report_text: reportData.report_text,
            photo_urls: reportData.photo_urls,
            visited_name: reportData.visited_name,
            rejection_note: null // Clear previous notes on resubmit
        });
    }

    async evaluateByToken(token, approved, note) {
        const { data: activity } = await supabase
            .from('finance_activities')
            .select('id, status')
            .eq('evaluator_token', token)
            .single();

        if (!activity) throw new Error('Invalid token');

        if (approved) {
            return this.transitionStatus(activity.id, FINANCE_STATUS.PENDING_BPP);
        } else {
            // Rejection logic: back to PENDING_REPORT
            return this.updateActivity(activity.id, {
                status: FINANCE_STATUS.PENDING_REPORT,
                rejection_note: note
            });
        }
    }

    // Personnel Management Methods
    async getPersonnel() {
        const { data, error } = await supabase
            .from('finance_personnel')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    async addPersonnel(name, role) {
        const { data, error } = await supabase
            .from('finance_personnel')
            .insert([{ name, role }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async addBulkPersonnel(personnel) {
        const rows = personnel.map(p => ({
            name: p.name,
            role: p.role
        }));

        const { data, error } = await supabase
            .from('finance_personnel')
            .insert(rows)
            .select();

        if (error) throw error;
        return data;
    }

    async deletePersonnel(id) {
        const { error } = await supabase
            .from('finance_personnel')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    async uploadPhoto(file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('finance-photos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('finance-photos')
            .getPublicUrl(filePath);

        return publicUrl;
    }
}

const financeService = new FinanceService();
export default financeService;
