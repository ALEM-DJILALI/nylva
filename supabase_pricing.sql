-- NYLVA — Migration v3 : pricing 2 tiers
-- À exécuter dans Supabase SQL Editor APRÈS supabase_setup.sql et supabase_feedback.sql

-- ─────────────────────────────────────────────────────────────
-- 1. Colonne tier sur profiles
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free' CHECK (tier IN ('free','essentiel','signature'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_signature_used boolean DEFAULT false;

-- Migration des profils existants premium → tier essentiel
-- (les anciens payaient 9€/mois → équivalent Essentiel 6,99€, opportunité de upsell vers Signature)
UPDATE public.profiles
SET tier = 'essentiel'
WHERE is_premium = true AND tier = 'free' AND is_admin = false;

-- Admins → signature (full access)
UPDATE public.profiles
SET tier = 'signature'
WHERE is_admin = true;

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);

-- ─────────────────────────────────────────────────────────────
-- 2. Mise à jour du trigger anti-escalade pour inclure tier et trial
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION protect_sensitive_profile_fields()
RETURNS trigger AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    NEW.is_premium := OLD.is_premium;
    NEW.is_admin := OLD.is_admin;
    NEW.premium_until := OLD.premium_until;
    NEW.analyses_count_month := OLD.analyses_count_month;
    NEW.analyses_reset_at := OLD.analyses_reset_at;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.tier := OLD.tier;
    NEW.trial_signature_used := OLD.trial_signature_used;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 3. Table de log des messages coach (pour quota daily)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coach_messages_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  tier text,
  vocal boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_coach_log_user_date ON public.coach_messages_log(user_id, created_at DESC);

-- RLS : seul service_role peut insérer/lire (transparent pour utilisatrice)
ALTER TABLE public.coach_messages_log ENABLE ROW LEVEL SECURITY;
-- Pas de policies authenticated → tout passe par service_role

-- Optionnel : purge automatique des logs > 30j (pour éviter explosion table)
SELECT cron.schedule('purge-coach-logs', '0 3 * * *', $$
  DELETE FROM public.coach_messages_log WHERE created_at < now() - interval '30 days';
$$);

-- ─────────────────────────────────────────────────────────────
-- 4. Vue pour stats business
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.tier_distribution AS
SELECT
  tier,
  COUNT(*) AS nb_users,
  SUM(CASE WHEN is_premium = true THEN 1 ELSE 0 END) AS nb_actifs,
  SUM(CASE WHEN trial_signature_used = true THEN 1 ELSE 0 END) AS nb_ayant_eu_trial
FROM public.profiles
WHERE is_admin = false
GROUP BY tier
ORDER BY
  CASE tier WHEN 'signature' THEN 1 WHEN 'essentiel' THEN 2 ELSE 3 END;
