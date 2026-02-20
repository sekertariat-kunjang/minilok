import { supabase } from '../../../core/supabase';

class AkreditasiService {
    // ─── PERIODE ──────────────────────────────────────────────────

    async getPeriodeList() {
        const { data, error } = await supabase
            .from('akreditasi_periode')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    async createPeriode(nama) {
        const { data, error } = await supabase
            .from('akreditasi_periode')
            .insert([{ nama, status: 'open' }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async setPeriodeStatus(id, status, alasan = null) {
        const updateData = { status };
        if (status === 'open') {
            updateData.alasan_buka = alasan;
        } else {
            updateData.alasan_buka = null; // Reset alasan saat dikunci kembali
        }

        const { data, error } = await supabase
            .from('akreditasi_periode')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async deletePeriode(id) {
        // Hapus skor dulu (cascade manual)
        await supabase.from('akreditasi_skor').delete().eq('periode_id', id);
        const { error } = await supabase
            .from('akreditasi_periode')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }

    // ─── SKOR ─────────────────────────────────────────────────────

    async getSkorByPeriode(periodeId) {
        const { data, error } = await supabase
            .from('akreditasi_skor')
            .select('*')
            .eq('periode_id', periodeId);
        if (error) throw error;

        // Kembalikan sebagai map: { [ep_id]: { skor, komentar } }
        const map = {};
        data.forEach((row) => {
            map[row.ep_id] = { skor: row.skor, komentar: row.komentar };
        });
        return map;
    }

    async saveSkor({ periode_id, ep_id, skor, komentar = '' }) {
        const { data, error } = await supabase
            .from('akreditasi_skor')
            .upsert(
                {
                    periode_id,
                    ep_id,
                    skor,
                    komentar,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'periode_id,ep_id' }
            )
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async deleteSkor(periodeId, epId) {
        const { error } = await supabase
            .from('akreditasi_skor')
            .delete()
            .eq('periode_id', periodeId)
            .eq('ep_id', epId);
        if (error) throw error;
        return true;
    }
}

const akreditasiService = new AkreditasiService();
export default akreditasiService;
