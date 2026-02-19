-- ============================================
-- DDL: Tabel Akreditasi Puskesmas 2023
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================

-- Tabel 1: Periode penilaian
CREATE TABLE IF NOT EXISTS akreditasi_periode (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       text NOT NULL,
  status     text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked')),
  created_at timestamptz DEFAULT now()
);

-- Tabel 2: Skor per EP per periode
CREATE TABLE IF NOT EXISTS akreditasi_skor (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_id uuid NOT NULL REFERENCES akreditasi_periode(id) ON DELETE CASCADE,
  ep_id      text NOT NULL,
  skor       numeric NOT NULL DEFAULT 0 CHECK (skor IN (0, 5, 10)),
  komentar   text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (periode_id, ep_id)
);

-- Index untuk query yang sering (ambil skor per periode)
CREATE INDEX IF NOT EXISTS idx_akreditasi_skor_periode ON akreditasi_skor(periode_id);

-- Row Level Security: nonaktifkan dulu (app tanpa auth)
ALTER TABLE akreditasi_periode ENABLE ROW LEVEL SECURITY;
ALTER TABLE akreditasi_skor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON akreditasi_periode FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON akreditasi_skor FOR ALL TO anon USING (true) WITH CHECK (true);
