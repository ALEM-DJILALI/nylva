-- NYLVA — Migration v8.1 : ajout colonne tenue dans analyses
-- À exécuter dans Supabase SQL Editor

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS tenue jsonb;

-- Index pour future feature de recherche par occasion
CREATE INDEX IF NOT EXISTS idx_analyses_tenue_occasion ON public.analyses ((tenue->>'occasion')) WHERE tenue IS NOT NULL;
