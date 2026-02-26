-- ============================================
-- MIGRASI: Tambah Kolom 'description'
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================

-- Tambahkan kolom description jika belum ada
ALTER TABLE finance_activities 
ADD COLUMN IF NOT EXISTS description text;

-- Catatan: Supabase biasanya otomatis refresh cache. 
-- Jika masih error setelah ini, klik button 'Reload Schema'
-- di Settings -> API -> PostgREST di Dashboard Supabase.
