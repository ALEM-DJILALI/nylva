-- NYLVA — Table de feedback utilisateur
-- À exécuter dans Supabase SQL Editor APRÈS supabase_setup.sql

CREATE TABLE IF NOT EXISTS public.feedback_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  score integer,
  titre text,
  zones_incorrectes jsonb,
  comment text,
  detection_brute jsonb,
  zones_confirmees jsonb,
  zones_resultat jsonb
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_zones ON public.feedback_analyses USING gin(zones_incorrectes);

-- RLS : seul service_role peut insérer (via la route API), seul l'admin peut lire
ALTER TABLE public.feedback_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_select_admin" ON public.feedback_analyses;
CREATE POLICY "feedback_select_admin" ON public.feedback_analyses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ─────────────────────────────────────────────────────────────
-- VUE D'ANALYSE : zones les plus souvent incorrectes (pour ajuster le seuil)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.feedback_zones_stats AS
SELECT
  zone_incorrecte,
  COUNT(*) AS nb_signalements,
  ROUND(AVG((detection_brute->zone_norm->>'certitude')::numeric), 1) AS certitude_moyenne_au_signalement
FROM (
  SELECT
    jsonb_array_elements_text(zones_incorrectes) AS zone_incorrecte,
    detection_brute,
    LOWER(
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        jsonb_array_elements_text(zones_incorrectes),
        'Lèvres', 'levres'),
        'Sourcils', 'sourcils'),
        'Blush', 'blush'),
        'Yeux', 'yeux'),
        'Teint', 'teint')
    ) AS zone_norm
  FROM public.feedback_analyses
  WHERE detection_brute IS NOT NULL
) sub
GROUP BY zone_incorrecte
ORDER BY nb_signalements DESC;

-- Pour consulter les feedback :
-- SELECT * FROM public.feedback_analyses ORDER BY created_at DESC LIMIT 50;
-- SELECT * FROM public.feedback_zones_stats;
