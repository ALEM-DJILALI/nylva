-- NYLVA — Migration v8 : stockage photos historique

-- 1. Colonne photo_url sur la table analyses
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Création du bucket Storage privé pour les photos d'analyses
-- (À faire via Supabase Dashboard si pas déjà fait, ou via SQL ci-dessous)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('analyses-photos', 'analyses-photos', false, 2097152, ARRAY['image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 3. RLS sur le bucket : chaque utilisatrice ne peut lire QUE ses propres photos
-- Convention de nommage : <user_id>/<analyse_id>.jpg

DROP POLICY IF EXISTS "Users can read own analyses photos" ON storage.objects;
CREATE POLICY "Users can read own analyses photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'analyses-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Insertion via service_role uniquement (route API), pas d'INSERT pour authenticated
DROP POLICY IF EXISTS "Users can insert own analyses photos" ON storage.objects;

-- DELETE : utilisatrice peut supprimer ses propres photos
DROP POLICY IF EXISTS "Users can delete own analyses photos" ON storage.objects;
CREATE POLICY "Users can delete own analyses photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'analyses-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Cascade : quand une analyse est supprimée, on supprime aussi la photo associée
CREATE OR REPLACE FUNCTION delete_photo_on_analyse_delete()
RETURNS trigger AS $$
BEGIN
  IF OLD.photo_url IS NOT NULL THEN
    -- Extraire le path depuis l'URL signée et supprimer
    PERFORM storage.delete_object('analyses-photos', OLD.user_id::text || '/' || OLD.id::text || '.jpg');
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_delete_analyse_photo ON public.analyses;
CREATE TRIGGER trg_delete_analyse_photo
  BEFORE DELETE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION delete_photo_on_analyse_delete();
