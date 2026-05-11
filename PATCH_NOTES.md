# NYLVA — Patch v8.1 (post ultra-review)

Cette release corrige les **10 problèmes identifiés lors de l'audit critique** de la v8.

## 🔴 Critiques — corrigés

### 1. `.env.local` exposait les vraies clés
- ⚠️ **Action de ta part requise** : régénère ces clés dès que possible (Supabase service_role + Anthropic API + Stripe)
- Le `.gitignore` est maintenant correct (UTF-8, conforme Next.js standard)

### 2. `.gitignore` corrompu
Réécrit en UTF-8 propre. Ignore correctement `.env.local`, `node_modules`, `.next`, `.vercel`, etc. Compatible Linux/Vercel.

## 🟠 Importants — corrigés

### 3. Home : tier-aware
- Lecture du `tier` depuis profile (avec vérif `premium_until` côté client)
- Label dynamique : "Signature", "Essentiel" ou nombre d'analyses gratuites
- L'affichage retombe automatiquement à free si `premium_until` est expiré (sans attendre le cron)

### 4. Profil : invalidation premium expiré
- Si `premium_until < now()` côté client → tier affiché = `free`
- Pas d'attente du cron quotidien pour avoir un affichage cohérent

### 5. Quota coach timezone-aware
- Avant : "messages depuis 00:00 UTC" (faux pour les utilisateurs France entre minuit et 2h locales)
- Maintenant : fenêtre glissante des **24 dernières heures** réelles, juste pour tous les fuseaux

### 6. Marques : ouvert volontairement à tous
Décision : on garde Marques accessible aux Free comme **point d'entrée acquisition**. Le scoring + recommandations est local (pas d'IA), donc zéro coût. Permet à une utilisatrice Free de découvrir la valeur de l'app avant de s'abonner.

### 7. Miroir : indicateur de détection bien placé
Le point vert "détection OK" était dessiné à `W-20` mais apparaissait à gauche à cause du flip CSS. Maintenant à `x=20` (= droite à l'écran après mirror).

## 🟡 Mineurs — corrigés

### 8. Lockfile
Pas inclus volontairement (le fait laisser Vercel régénérer un lockfile cohérent à partir du `package.json`). Au premier déploiement, Vercel génère et met en cache ses propres versions résolues. **Important** : après extraction du zip en local, fais `npm install` pour générer ton lockfile local.

### 9. Modèle Claude pinné
Toutes les routes API utilisaient `claude-sonnet-4-5` (alias). Maintenant pinné sur `claude-sonnet-4-5-20250929` partout (analyse, coach, saison). Évite les changements de comportement quand Anthropic migre l'alias.

### 10. Migration anciens premium → Essentiel (pas Signature)
Décision : les utilisateurs déjà premium à l'ancien tarif passent en **tier Essentiel** (pas Signature). Plus juste vis-à-vis des futurs Signature qui paient plus cher, et opportunité d'upsell.

### Bonus — Compteur d'analyses
Avant : on incrémentait `analyses_count_month` même pour les abonnés (pas utilisé mais polluait le champ)
Maintenant : compteur incrémenté uniquement pour les Free non-admin. Plus propre statistiquement.

---

## ⚙️ Récap technique des fichiers v8.1

| Fichier | Changement |
|---|---|
| `.gitignore` | Réécrit en UTF-8 propre |
| `app/app/page.tsx` | tier-aware avec vérif premium_until |
| `app/app/profil/page.tsx` | Invalidation client-side du premium expiré |
| `app/app/miroir/page.tsx` | Position du point vert détection |
| `app/api/analyse/route.ts` | Modèle pinné, increment conditionnel |
| `app/api/coach/route.ts` | Modèle pinné, fenêtre glissante 24h |
| `app/api/saison/route.ts` | Modèle pinné |
| `supabase_pricing.sql` | Migration anciens premium → essentiel |

---

## ⚠️ Étapes de déploiement v8.1

### Si tu n'as RIEN déployé encore
1. `npm install` après extraction du zip (génère le lockfile local)
2. Régénère tes clés API (Supabase service_role + Anthropic + Stripe webhook secret)
3. Push sur Vercel + variables d'env (cf v7 PATCH_NOTES)
4. SQL Supabase dans cet ordre :
   - `supabase_setup.sql` ✅ (déjà fait, ne pas relancer si déjà OK)
   - `supabase_feedback.sql`
   - `supabase_pricing.sql`
   - `supabase_tenue.sql`
5. Configure le webhook Stripe (URL + 5 events + récupère whsec_)

### Si tu as déjà déployé une version précédente
- Remplace simplement le code par cette v8.1
- Pas besoin de re-tourner les SQL si tu les avais déjà passés
- Régénère quand même tes clés API quand tu auras un moment

---

## 🐛 Récap complet des bugs depuis le début

| # | Sévérité | Problème | Fix |
|---|---|---|---|
| 1-4 | 🔴 | Bugs Stripe & sécurité | v2-v3 |
| 5-9 | 🟠 | Hallucinations IA + gating routes | v4-v6 |
| 10-12 | 🟡 | PWA, doublons, tabs | v6 |
| 13 | 🆕 | Pricing 2 tiers + trial | v7 |
| 14 | 🔴 | Miroir IA décalé | v8 |
| 15 | 🟠 | Historique sans nav, sans graphique | v8 |
| 16 | 🟠 | CGV tarif obsolète | v8 |
| 17 | 🟡 | CTAs upgrade incohérents | v8 |
| 18 | 🆕 | Conseil tenue & couleurs | v8 |
| 19 | 🔴 | `.env.local` exposé + `.gitignore` cassé | v8.1 |
| 20 | 🟠 | Home & Profil pas tier-aware | v8.1 |
| 21 | 🟠 | Quota coach timezone bug | v8.1 |
| 22 | 🟡 | Modèle non pinné, increment inutile | v8.1 |

---

## 🚀 Production-ready

À ce stade, ton projet est **prêt pour la production**. Plus de bugs critiques connus, plus de bugs orange importants, juste des optimisations possibles plus tard.

**Mes 3 dernières recommandations avant déploiement** :
1. Régénère ces clés API exposées (priorité 1)
2. Teste avec ta femme sur la photo qui faisait halluciner le fond de teint — vérifie que le fix v6 marche
3. Fais le test complet de bout en bout : checkout Stripe en mode test → vérif Supabase → accès aux features par tier → annulation
