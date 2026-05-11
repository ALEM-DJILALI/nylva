-- NYLVA — Supabase SQL Editor
-- Exécuter dans cet ordre dans Supabase Dashboard → SQL Editor

-- ─────────────────────────────────────────────────────────────
-- 1. Extensions (Dashboard → Database → Extensions → activer pg_cron)
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- 2. Colonnes additionnelles sur profiles
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS saison_chromatique text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sous_saison text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS undertone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- ─────────────────────────────────────────────────────────────
-- 3. Reset mensuel des analyses gratuites
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_analysis_count(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET
    analyses_count_month = CASE
      WHEN analyses_reset_at IS NULL OR analyses_reset_at <= now()
      THEN 1
      ELSE analyses_count_month + 1
    END,
    analyses_reset_at = CASE
      WHEN analyses_reset_at IS NULL OR analyses_reset_at <= now()
      THEN date_trunc('month', now()) + interval '1 month'
      ELSE analyses_reset_at
    END
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron : reset le 1er du mois à minuit UTC
SELECT cron.schedule('reset-analyses-mensuel', '0 0 1 * *', $$
  UPDATE public.profiles
  SET analyses_count_month = 0,
      analyses_reset_at = date_trunc('month', now()) + interval '1 month'
  WHERE analyses_reset_at <= now()
    AND is_premium = false
    AND is_admin = false;
$$);

-- Init des profils existants (champ vide = définir prochaine date de reset)
UPDATE public.profiles
SET analyses_reset_at = date_trunc('month', now()) + interval '1 month'
WHERE analyses_reset_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 4. Cron de révocation Premium expiré (sécurité)
-- ─────────────────────────────────────────────────────────────
-- Si le webhook Stripe a échoué ou été manqué, on révoque les premium expirés
-- chaque jour à 4h du matin UTC.

SELECT cron.schedule('revoke-expired-premium', '0 4 * * *', $$
  UPDATE public.profiles
  SET is_premium = false
  WHERE is_premium = true
    AND is_admin = false
    AND premium_until IS NOT NULL
    AND premium_until < now();
$$);

-- ─────────────────────────────────────────────────────────────
-- 5. RLS : Row Level Security sur profiles (CRITIQUE)
-- ─────────────────────────────────────────────────────────────
-- Empêche un utilisateur de modifier is_premium / is_admin / quotas
-- côté client. Le service role (webhook Stripe, admin API) bypass la RLS.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop anciennes policies si présentes
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- SELECT : chacun peut lire son propre profil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- UPDATE : chacun peut modifier son profil MAIS pas les champs sensibles.
-- On utilise une fonction trigger qui rejette les modifs sur is_premium, is_admin, etc.
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT : auto-création à la signup (handle_new_user trigger)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger qui empêche la modification des champs sensibles côté client
CREATE OR REPLACE FUNCTION protect_sensitive_profile_fields()
RETURNS trigger AS $$
BEGIN
  -- Si l'utilisateur courant n'est pas service_role, on bloque les modifs sensibles
  IF current_setting('role') != 'service_role' THEN
    NEW.is_premium := OLD.is_premium;
    NEW.is_admin := OLD.is_admin;
    NEW.premium_until := OLD.premium_until;
    NEW.analyses_count_month := OLD.analyses_count_month;
    NEW.analyses_reset_at := OLD.analyses_reset_at;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_sensitive_profile_fields();

-- ─────────────────────────────────────────────────────────────
-- 6. RLS sur analyses (chacun voit ses propres analyses)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analyses_select_own" ON public.analyses;
DROP POLICY IF EXISTS "analyses_insert_own" ON public.analyses;

CREATE POLICY "analyses_select_own" ON public.analyses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Insert via service_role uniquement (route /api/analyse fait l'insert)
-- Aucune policy d'insert pour authenticated → seul service_role peut insérer.

-- ─────────────────────────────────────────────────────────────
-- 7. Index utiles
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_until ON public.profiles(premium_until) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON public.analyses(user_id, created_at DESC);
