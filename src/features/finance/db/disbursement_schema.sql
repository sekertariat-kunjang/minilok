-- ============================================
-- DDL: Tabel Pelacakan Pencairan Dana (Finance)
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================

-- Pastikan extension pgcrypto aktif untuk fungsi gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tipe Enum untuk Status (Opsional, bisa pake text dengan check constraint)
-- CREATE TYPE activity_status AS ENUM (
--   'DRAFT', 'PENDING_PPTK', 'PENDING_REPORT', 'PENDING_EVALUATION', 
--   'PENDING_BPP', 'PENDING_REQUEST', 'PENDING_KAPUS', 
--   'PENDING_CROSSCHECK', 'COMPLETED'
-- );

CREATE TABLE IF NOT EXISTS finance_activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  budget           numeric DEFAULT 0,
  description      text,
  status           text NOT NULL DEFAULT 'DRAFT',
  
  -- Role Assignments & Tokens
  pptk_name        text,
  petugas_name     text,
  petugas_token    text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  evaluator_name   text,
  evaluator_token  text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Data Konten
  activity_date    date,
  report_text      text,
  photo_urls       jsonb DEFAULT '[]'::jsonb,
  visited_name     text,
  rejection_note   text,
  
  -- Timestamps
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  
  -- Per-state Timestamps (Audit Trail)
  assigned_at      timestamptz, -- PPTK assign
  reported_at      timestamptz, -- Petugas upload
  evaluated_at     timestamptz, -- Evaluator ACC
  bpp_checked_at   timestamptz, -- BPP check
  request_created_at timestamptz, -- Accountant request
  transferred_at   timestamptz, -- Kapus transfer
  final_checked_at timestamptz  -- Accountant crosscheck
);

-- Constraint Status (Idempotent)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_finance_status') THEN
    ALTER TABLE finance_activities 
    ADD CONSTRAINT check_finance_status 
    CHECK (status IN (
      'DRAFT', 'PENDING_PPTK', 'PENDING_REPORT', 'PENDING_EVALUATION', 
      'PENDING_BPP', 'PENDING_REQUEST', 'PENDING_KAPUS', 
      'PENDING_CROSSCHECK', 'COMPLETED'
    ));
  END IF;
END $$;

-- Indexing
CREATE INDEX IF NOT EXISTS idx_finance_status ON finance_activities(status);
CREATE INDEX IF NOT EXISTS idx_finance_petugas_token ON finance_activities(petugas_token);
CREATE INDEX IF NOT EXISTS idx_finance_evaluator_token ON finance_activities(evaluator_token);

-- Security (RLS)
ALTER TABLE finance_activities ENABLE ROW LEVEL SECURITY;

-- Allow all for anon (untuk demo/uji coba sesuai request user)
DROP POLICY IF EXISTS "Allow all for anon" ON finance_activities;
CREATE POLICY "Allow all for anon" ON finance_activities FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- Tabel Personel Keuangan (Untuk Dropdown Plotting)
-- ============================================
CREATE TABLE IF NOT EXISTS finance_personnel (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  role       text NOT NULL CHECK (role IN ('PETUGAS', 'EVALUATOR')),
  created_at timestamptz DEFAULT now()
);

-- Security (RLS) untuk Personel
ALTER TABLE finance_personnel ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon personnel" ON finance_personnel;
CREATE POLICY "Allow all for anon personnel" ON finance_personnel FOR ALL TO anon USING (true) WITH CHECK (true);
