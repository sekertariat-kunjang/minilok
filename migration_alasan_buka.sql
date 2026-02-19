-- ============================================
-- Migrasi: Tambah kolom alasan_buka
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================

ALTER TABLE akreditasi_periode 
ADD COLUMN IF NOT EXISTS alasan_buka text;

COMMENT ON COLUMN akreditasi_periode.alasan_buka IS 'Catatan alasan mengapa gembok dibuka kembali untuk audit.';
