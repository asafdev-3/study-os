-- ─────────────────────────────────────────────────────────────
-- StudyOS · Schema v1
-- Execute inteiro no Supabase SQL Editor (projeto → SQL → New query)
-- ─────────────────────────────────────────────────────────────

-- ── Tabela: study_sessions ──────────────────────────────────
-- Registra cada sessão pomodoro (área + duração + nota simulada)
CREATE TABLE IF NOT EXISTS study_sessions (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area         text        NOT NULL CHECK (area IN ('lc', 'ch', 'cn', 'mt', 'red')),
  duration_min integer     NOT NULL DEFAULT 25,
  score        integer     CHECK (score BETWEEN 0 AND 1000),
  notes        text,
  created_at   timestamptz DEFAULT now()
);

-- ── Tabela: enem_scores ─────────────────────────────────────
-- Snapshot das notas simuladas do usuário por área (1 linha por usuário)
CREATE TABLE IF NOT EXISTS enem_scores (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  lc           integer     NOT NULL DEFAULT 500 CHECK (lc BETWEEN 0 AND 1000),
  ch           integer     NOT NULL DEFAULT 500 CHECK (ch BETWEEN 0 AND 1000),
  cn           integer     NOT NULL DEFAULT 500 CHECK (cn BETWEEN 0 AND 1000),
  mt           integer     NOT NULL DEFAULT 500 CHECK (mt BETWEEN 0 AND 1000),
  red          integer     NOT NULL DEFAULT 500 CHECK (red BETWEEN 0 AND 1000),
  updated_at   timestamptz DEFAULT now()
);

-- ── Tabela: annotations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS annotations (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text        NOT NULL DEFAULT '',
  content      text        NOT NULL DEFAULT '',
  area         text        CHECK (area IN ('lc', 'ch', 'cn', 'mt', 'red', 'geral')),
  pinned       boolean     NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ── Tabela: goals ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text         text        NOT NULL,
  area         text        CHECK (area IN ('lc', 'ch', 'cn', 'mt', 'red', 'geral')),
  done         boolean     NOT NULL DEFAULT false,
  deadline     date,
  created_at   timestamptz DEFAULT now()
);

-- ── Trigger: updated_at automático ────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enem_scores_updated_at  ON enem_scores;
DROP TRIGGER IF EXISTS trg_annotations_updated_at  ON annotations;

CREATE TRIGGER trg_enem_scores_updated_at
  BEFORE UPDATE ON enem_scores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS: Row Level Security ────────────────────────────────
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enem_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_sessions: próprio usuário"
  ON study_sessions FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enem_scores: próprio usuário"
  ON enem_scores FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "annotations: próprio usuário"
  ON annotations FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals: próprio usuário"
  ON goals FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Índices ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id    ON study_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id       ON annotations    (user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id             ON goals          (user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_done           ON goals          (user_id, done);

-- ── Seed de teste (opcional — delete antes da mostra) ──────
-- INSERT INTO enem_scores (user_id, lc, ch, cn, mt, red)
-- VALUES (auth.uid(), 630, 681, 663, 633, 708);
