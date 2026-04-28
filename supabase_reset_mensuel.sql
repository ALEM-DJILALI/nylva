-- NYLVA — Supabase SQL Editor
-- 1. Activer pg_cron : Dashboard → Database → Extensions → pg_cron

-- Fonction increment robuste
CREATE OR REPLACE FUNCTION increment_analysis_count(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET
    analyses_count_month = CASE WHEN analyses_reset_at IS NULL OR analyses_reset_at <= now() THEN 1 ELSE analyses_count_month + 1 END,
    analyses_reset_at    = CASE WHEN analyses_reset_at IS NULL OR analyses_reset_at <= now() THEN date_trunc('month', now()) + interval '1 month' ELSE analyses_reset_at END
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron 1er du mois minuit UTC
SELECT cron.schedule('reset-analyses-mensuel','0 0 1 * *',$$
  UPDATE public.profiles SET analyses_count_month=0, analyses_reset_at=date_trunc('month',now())+interval '1 month'
  WHERE analyses_reset_at<=now() AND is_premium=false AND is_admin=false;
$$);

-- Init profils existants
UPDATE public.profiles SET analyses_reset_at=date_trunc('month',now())+interval '1 month' WHERE analyses_reset_at IS NULL;

-- Colonne saison chromatique (si pas encore créée)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS saison_chromatique text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sous_saison text;
