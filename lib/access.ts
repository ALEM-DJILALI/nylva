// lib/access.ts — Centralise les contrôles d'accès par tier
import { createServiceClient } from './supabase-server'

export type Tier = 'free' | 'essentiel' | 'signature'

export interface AccessProfile {
  userId: string
  tier: Tier
  isAdmin: boolean
  isPremium: boolean
  analysesCountMonth: number
  analysesResetAt: string | null
  premiumUntil: string | null
}

// Renvoie le profil d'accès ou null si non authentifié
export async function getAccessProfile(authHeader: string | null): Promise<AccessProfile | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)

  const supabase = createServiceClient()
  const { data: userData } = await supabase.auth.getUser(token)
  if (!userData.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, is_admin, is_premium, premium_until, analyses_count_month, analyses_reset_at')
    .eq('id', userData.user.id)
    .single()

  if (!profile) return null

  // Calcul effectif du tier (premium expiré → free)
  let effectiveTier: Tier = (profile.tier as Tier) ?? 'free'
  const premiumExpired = profile.premium_until && new Date(profile.premium_until) < new Date()
  if (premiumExpired) {
    effectiveTier = 'free'
  }
  if (profile.is_admin) effectiveTier = 'signature' // admin = full access

  return {
    userId: userData.user.id,
    tier: effectiveTier,
    isAdmin: !!profile.is_admin,
    isPremium: !premiumExpired && (profile.is_premium ?? false),
    analysesCountMonth: profile.analyses_count_month ?? 0,
    analysesResetAt: profile.analyses_reset_at,
    premiumUntil: profile.premium_until,
  }
}

// Quota analyses selon tier
export function analysesQuota(tier: Tier): number {
  if (tier === 'free') return 3
  return 9999 // essentiel et signature : illimité
}

// Quota messages coach par jour
export function coachQuotaParJour(tier: Tier): number {
  if (tier === 'signature') return 9999
  if (tier === 'essentiel') return 30
  return 0 // free : pas accès
}

// Features Signature uniquement
export function peutAccederFeature(
  tier: Tier,
  feature: 'coach_vocal' | 'miroir_temps_reel' | 'morphologie' | 'saison_chromatique_illimite' | 'historique_illimite'
): boolean {
  return tier === 'signature'
}

// Features Essentiel + Signature
export function peutAccederFeaturePremium(
  tier: Tier,
  feature: 'analyses_illimitees' | 'coach_texte' | 'saison_chromatique' | 'marques_recos'
): boolean {
  return tier === 'essentiel' || tier === 'signature'
}
