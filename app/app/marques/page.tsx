'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, ExternalLink, Mail, Link2,
  Star, Award, Users, BarChart3, Sparkles, ChevronRight,
  ChevronLeft, X, Eye, Smile, Circle, Layers, Droplets,
  ArrowRight, Check, Info, Wand2, MessageSquare, SlidersHorizontal,
  RefreshCw, Heart, ShoppingBag, Play
} from 'lucide-react';

// Substituts pour Instagram/Youtube absents de cette version lucide-react
const Instagram = Link2;
const Youtube = Play;

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Segment = 'Grand public' | 'Prestige' | 'Luxe';
type SkinTone = 'très claire' | 'claire' | 'médium claire' | 'médium' | 'médium foncée' | 'foncée' | 'très foncée';
type Undertone = 'cool' | 'warm' | 'neutral' | 'olive';
type SkinType = 'sèche' | 'normale' | 'mixte' | 'grasse' | 'sensible';
type Concern = 'rougeurs' | 'taches' | 'pores' | 'rides' | 'éclat' | 'cernes' | 'acné' | 'hyperpigmentation';
type FaceZone = 'teint' | 'yeux' | 'joues' | 'lèvres' | 'contour' | 'sourcils' | 'skincare';

interface Product {
  id: string;
  name: string;
  category: FaceZone;
  subcategory: string;
  price: string;
  description: string;
  bestFor: Undertone[];
  skinTypes: SkinType[];
  coverage?: 'légère' | 'moyenne' | 'complète';
  finish?: 'mat' | 'satiné' | 'lumineux' | 'naturel';
  tags: string[];
  hero?: boolean;
  url?: string;
}

interface Brand {
  id: string;
  name: string;
  segment: Segment;
  description: string;
  gammes: string[];
  instagram: string;
  youtube?: string;
  nbTeintes: number;
  inclusivite: number;
  accentColor: string;
  products: Product[];
}

interface UserProfile {
  skinTone: SkinTone | null;
  undertone: Undertone | null;
  skinType: SkinType | null;
  concerns: Concern[];
}

interface Recommendation {
  zone: FaceZone;
  zoneLabel: string;
  zoneIcon: React.ReactNode;
  products: Array<{ brand: Brand; product: Product; reason: string }>;
}

// ─── BRAND + PRODUCTS DATA ────────────────────────────────────────────────────

const BRANDS: Brand[] = [
  {
    id: 'fenty',
    name: 'Fenty Beauty',
    segment: 'Prestige',
    description: 'La révolution inclusive signée Rihanna. 50 teintes, référence absolue en diversité.',
    gammes: ["Pro Filt'r", 'Gloss Bomb', 'Cheeks Out', 'Snap Shadows'],
    instagram: 'https://instagram.com/fentybeauty',
    youtube: 'https://youtube.com/@FentyBeauty',
    nbTeintes: 50,
    inclusivite: 5,
    accentColor: '#D4A574',
    products: [
      {
        id: 'fenty-pro-filtr-matte',
        name: "Pro Filt'r Soft Matte Longwear Foundation",
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~38€',
        description: 'Le fond de teint qui a tout changé. Tenue longue durée, 50 teintes, fini satiné-mat. Buildable de léger à couvrant.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['grasse', 'mixte', 'normale'],
        coverage: 'complète',
        finish: 'mat',
        tags: ['bestseller', 'inclusif', '50 teintes', 'longue tenue'],
        hero: true,
        url: 'https://fentybeauty.com'
      },
      {
        id: 'fenty-eaze-drop',
        name: 'Eaze Drop Blurring Skin Tint',
        category: 'teint',
        subcategory: 'Skin tint',
        price: '~38€',
        description: 'Skin tint ultra-léger pour un effet peau nue parfaite. Idéal pour celles qui veulent du naturel avec de la couverture.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'sèche', 'mixte'],
        coverage: 'légère',
        finish: 'naturel',
        tags: ['naturel', 'léger', 'quotidien'],
        url: 'https://fentybeauty.com'
      },
      {
        id: 'fenty-gloss-bomb',
        name: 'Gloss Bomb Universal Lip Luminizer',
        category: 'lèvres',
        subcategory: 'Gloss',
        price: '~22€',
        description: 'Le gloss universel culte. Teinte Fenty Glow flatteuse sur toutes les carnations, brillance miroir.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['sèche', 'normale', 'mixte', 'grasse', 'sensible'],
        tags: ['universel', 'culte', 'bestseller', 'brillance'],
        hero: true,
        url: 'https://fentybeauty.com'
      },
      {
        id: 'fenty-cheeks-out',
        name: 'Cheeks Out Freestyle Cream Blush',
        category: 'joues',
        subcategory: 'Blush crème',
        price: '~24€',
        description: 'Blush crème fondant, teintes buildables, fini naturel-lumineux. Disponible en 8 teintes.',
        bestFor: ['warm', 'neutral'],
        skinTypes: ['normale', 'mixte', 'sèche'],
        finish: 'lumineux',
        tags: ['crème', 'naturel', 'buildable'],
        url: 'https://fentybeauty.com'
      },
      {
        id: 'fenty-killawatt',
        name: 'Killawatt Freestyle Highlighter',
        category: 'joues',
        subcategory: 'Highlighter',
        price: '~36€',
        description: 'Highlighter poudre pour un éclat intense. Galaxy disponible en duo ou simple teinte.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche'],
        finish: 'lumineux',
        tags: ['glow', 'intense', 'duo'],
        url: 'https://fentybeauty.com'
      },
      {
        id: 'fenty-snap-shadows',
        name: 'Snap Shadows Mix & Match Eyeshadow',
        category: 'yeux',
        subcategory: 'Palette',
        price: '~30€',
        description: 'Petite palette 6 teintes, format voyage. Fards mat et shimmer pour tous les looks.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'grasse', 'sèche', 'sensible'],
        tags: ['voyage', 'polyvalent', 'mat+shimmer'],
        url: 'https://fentybeauty.com'
      },
    ],
  },
  {
    id: 'charlottetilbury',
    name: 'Charlotte Tilbury',
    segment: 'Prestige',
    description: 'Make-up glamour old Hollywood revisité. Le Flawless Filter est devenu viral worldwide.',
    gammes: ['Flawless Filter', 'Pillow Talk', 'Airbrush Flawless', 'Magic Cream'],
    instagram: 'https://instagram.com/ctilbury',
    youtube: 'https://youtube.com/@CharlotteTilbury',
    nbTeintes: 30,
    inclusivite: 3,
    accentColor: '#C4758A',
    products: [
      {
        id: 'ct-flawless-filter',
        name: 'Hollywood Flawless Filter',
        category: 'teint',
        subcategory: 'Complexion booster',
        price: '~44€',
        description: 'Le booster teint viral. Blur, lisse et illumine pour un effet filtre réel. À mélanger au fond de teint ou seul.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['normale', 'mixte', 'sèche'],
        coverage: 'légère',
        finish: 'lumineux',
        tags: ['viral', 'glow', 'filtre', 'bestseller'],
        hero: true,
        url: 'https://charlottetilbury.com'
      },
      {
        id: 'ct-airbrush-foundation',
        name: 'Airbrush Flawless Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~49€',
        description: 'Fond de teint pleine couverture, fini mat poreless. Formule skincare avec Magic REPLEXIUM.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['grasse', 'mixte', 'normale'],
        coverage: 'complète',
        finish: 'mat',
        tags: ['full coverage', 'poreless', 'anti-âge'],
        url: 'https://charlottetilbury.com'
      },
      {
        id: 'ct-pillow-talk-lipstick',
        name: 'Matte Revolution Pillow Talk',
        category: 'lèvres',
        subcategory: 'Rouge à lèvres',
        price: '~37€',
        description: "Le rouge à lèvres universel nude-rose. Porté par Meghan Markle, Hailey Bieber. Flatteuse sur toutes les carnations.",
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['sèche', 'normale', 'mixte', 'grasse', 'sensible'],
        tags: ['universel', 'culte', 'nude-rose', 'célébrités'],
        hero: true,
        url: 'https://charlottetilbury.com'
      },
      {
        id: 'ct-pillow-talk-liner',
        name: 'Lip Cheat Lip Liner Pillow Talk',
        category: 'lèvres',
        subcategory: 'Crayon lèvres',
        price: '~26€',
        description: 'Contour lèvres nude-rose iconique. Redessine et agrandit le volume des lèvres.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['sèche', 'normale', 'mixte', 'grasse', 'sensible'],
        tags: ['universel', 'volume', 'duo pillow talk'],
        url: 'https://charlottetilbury.com'
      },
      {
        id: 'ct-eyes-to-mesmerise',
        name: 'Eyes to Mesmerise Cream Eyeshadow',
        category: 'yeux',
        subcategory: 'Fard à paupières crème',
        price: '~32€',
        description: 'Fard crème longue tenue, 24h. Disponible en rose gold, champagne, or, bronze. Application doigt ultra rapide.',
        bestFor: ['warm', 'neutral', 'cool'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        finish: 'lumineux',
        tags: ['crème', '24h', 'rose gold', 'rapide'],
        url: 'https://charlottetilbury.com'
      },
      {
        id: 'ct-full-fat-lashes',
        name: 'Full Fat Lashes 5 Star Mascara',
        category: 'yeux',
        subcategory: 'Mascara',
        price: '~30€',
        description: 'Mascara volume intense, formule haute définition. Cils allongés, galbés, volumineux.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['volume', 'allongeur', 'haute définition'],
        url: 'https://charlottetilbury.com'
      },
      {
        id: 'ct-magic-cream',
        name: "Charlotte's Magic Cream",
        category: 'skincare',
        subcategory: 'Crème visage',
        price: '~55€',
        description: 'La crème backstage des mannequins. Hydratation profonde, base de maquillage parfaite.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['sèche', 'normale', 'mixte', 'sensible'],
        tags: ['backstage', 'hydratation', 'base maquillage'],
        hero: true,
        url: 'https://charlottetilbury.com'
      },
    ],
  },
  {
    id: 'rarebeauty',
    name: 'Rare Beauty',
    segment: 'Prestige',
    description: 'Marque de Selena Gomez centrée sur le bien-être. Le blush Soft Pinch est culte.',
    gammes: ['Soft Pinch', 'Liquid Touch', 'Perfect Strokes'],
    instagram: 'https://instagram.com/rarebeauty',
    youtube: 'https://youtube.com/@RareBeauty',
    nbTeintes: 48,
    inclusivite: 5,
    accentColor: '#C19A6B',
    products: [
      {
        id: 'rb-soft-pinch-blush',
        name: 'Soft Pinch Liquid Blush',
        category: 'joues',
        subcategory: 'Blush liquide',
        price: '~22€',
        description: "Le blush liquide le plus viral de TikTok. 1 goutte suffit. Couleur naturelle 8h. 18 teintes.",
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['normale', 'mixte', 'grasse', 'sèche'],
        finish: 'naturel',
        tags: ['viral', 'tiktok', 'longue tenue', '1 goutte'],
        hero: true,
        url: 'https://rarebeauty.com'
      },
      {
        id: 'rb-liquid-touch-foundation',
        name: 'Liquid Touch Weightless Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~30€',
        description: 'Fond de teint ultra-léger, couvrance modulable. 48 teintes pour toutes les carnations.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche'],
        coverage: 'moyenne',
        finish: 'naturel',
        tags: ['léger', 'naturel', '48 teintes'],
        url: 'https://rarebeauty.com'
      },
      {
        id: 'rb-positive-light-highlighter',
        name: 'Positive Light Silky Touch Highlighter',
        category: 'joues',
        subcategory: 'Highlighter',
        price: '~24€',
        description: 'Highlighter poudre doux, 8 teintes du champagne au bronze. Fini naturellement lumineux.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse'],
        finish: 'lumineux',
        tags: ['naturel', '8 teintes', 'doux'],
        url: 'https://rarebeauty.com'
      },
      {
        id: 'rb-perfect-strokes-mascara',
        name: 'Perfect Strokes Matte Liquid Liner',
        category: 'yeux',
        subcategory: 'Eye-liner',
        price: '~22€',
        description: 'Eye-liner mat longue tenue, trait précis. Résistant eau.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['normale', 'mixte', 'grasse', 'sèche', 'sensible'],
        tags: ['précis', 'longue tenue', 'waterproof'],
        url: 'https://rarebeauty.com'
      },
      {
        id: 'rb-kind-words-lip',
        name: 'Kind Words Matte Lipstick',
        category: 'lèvres',
        subcategory: 'Rouge à lèvres',
        price: '~22€',
        description: 'Lèvres confortables en mat. 14 teintes de nude à berry.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['sèche', 'normale', 'mixte', 'grasse'],
        finish: 'mat',
        tags: ['mat confortable', 'nude à berry'],
        url: 'https://rarebeauty.com'
      },
    ],
  },
  {
    id: 'nars',
    name: 'NARS Cosmetics',
    segment: 'Prestige',
    description: 'Référence du glow naturel. Le blush Orgasm est le plus vendu au monde.',
    gammes: ['Sheer Glow', 'Natural Radiant', 'Afterglow', 'Orgasm'],
    instagram: 'https://instagram.com/narsissist',
    youtube: 'https://youtube.com/@NARSCosmetics',
    nbTeintes: 45,
    inclusivite: 4,
    accentColor: '#E8C4B8',
    products: [
      {
        id: 'nars-sheer-glow',
        name: 'Sheer Glow Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~48€',
        description: 'Fond de teint lumineux couvrance moyenne-haute. Fini peau seconde main, hydratant.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['normale', 'sèche', 'mixte'],
        coverage: 'moyenne',
        finish: 'lumineux',
        tags: ['lumineux', 'glow', 'hydratant', '35 teintes'],
        hero: true,
        url: 'https://narscosmetics.fr'
      },
      {
        id: 'nars-orgasm-blush',
        name: 'Blush Orgasm',
        category: 'joues',
        subcategory: 'Blush poudre',
        price: '~38€',
        description: 'Le blush le plus vendu au monde. Rose-pêche avec micro-particules dorées. Illumine toutes les carnations.',
        bestFor: ['warm', 'neutral', 'cool'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse'],
        finish: 'lumineux',
        tags: ['iconique', 'bestseller', 'universel', 'nacré'],
        hero: true,
        url: 'https://narscosmetics.fr'
      },
      {
        id: 'nars-radiant-creamy-concealer',
        name: 'Radiant Creamy Concealer',
        category: 'teint',
        subcategory: 'Correcteur',
        price: '~33€',
        description: 'Correcteur crème lumineux, couvrance haute. Anti-cernes et anti-imperfections. 30 teintes.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['normale', 'sèche', 'mixte'],
        coverage: 'complète',
        finish: 'lumineux',
        tags: ['anti-cernes', '30 teintes', 'crème'],
        url: 'https://narscosmetics.fr'
      },
      {
        id: 'nars-afterglow-lip',
        name: 'Afterglow Lip Color',
        category: 'lèvres',
        subcategory: 'Rouge à lèvres',
        price: '~31€',
        description: 'Rouge à lèvres satiné hydratant avec huile de jojoba. Tenues sexy et lumineuses.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['sèche', 'normale', 'mixte'],
        finish: 'satiné',
        tags: ['hydratant', 'satiné', 'jojoba'],
        url: 'https://narscosmetics.fr'
      },
      {
        id: 'nars-narsissist-palette',
        name: 'NARSissist Wanted Eyeshadow Palette',
        category: 'yeux',
        subcategory: 'Palette',
        price: '~62€',
        description: '14 teintes neutres mat et scintillant pour des regards quotidiens à intenses.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse'],
        tags: ['neutre', 'polyvalent', '14 teintes'],
        url: 'https://narscosmetics.fr'
      },
    ],
  },
  {
    id: 'loreal',
    name: "L'Oréal Paris",
    segment: 'Grand public',
    description: "Leader mass market beauté, innovations constantes, gammes adaptées à toutes les carnations.",
    gammes: ['Infaillible', 'True Match', 'Paradise'],
    instagram: 'https://instagram.com/lorealparis',
    youtube: 'https://youtube.com/@LOrealParis',
    nbTeintes: 40,
    inclusivite: 4,
    accentColor: '#D4A017',
    products: [
      {
        id: 'loreal-true-match',
        name: 'Accord Parfait True Match Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~16€',
        description: 'Le fond de teint qui matche parfaitement. 40 teintes, sous-tons W/N/C, couvrance modulable.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche'],
        coverage: 'moyenne',
        finish: 'naturel',
        tags: ['accessible', '40 teintes', 'warm/cool/neutral', 'rapport qualité-prix'],
        hero: true,
        url: 'https://loreal-paris.fr'
      },
      {
        id: 'loreal-infaillible-24h',
        name: 'Fond de Teint Infaillible 24H',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~14€',
        description: 'Tenue 24h garantie, résistant chaleur/sweat. Couvrance haute, fini mat.',
        bestFor: ['warm', 'neutral', 'cool'],
        skinTypes: ['grasse', 'mixte'],
        coverage: 'complète',
        finish: 'mat',
        tags: ['longue tenue', 'anti-brillance', '24h'],
        url: 'https://loreal-paris.fr'
      },
      {
        id: 'loreal-paradise-mascara',
        name: 'Paradise Extatic Mascara',
        category: 'yeux',
        subcategory: 'Mascara',
        price: '~12€',
        description: "Mascara formule huile d'argan, brosse sphérique. Cils volumineux et recourbés.",
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['volume', 'courbe', 'argan', 'accessible'],
        url: 'https://loreal-paris.fr'
      },
      {
        id: 'loreal-infaillible-lip',
        name: 'Infaillible 24H Les Lèvres',
        category: 'lèvres',
        subcategory: 'Rouge à lèvres longue tenue',
        price: '~10€',
        description: 'Rouge à lèvres 24h, 2 étapes (couleur + baume). Résistant repas, baisers.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'sèche', 'mixte', 'grasse'],
        tags: ['24h', 'résistant', 'accessible'],
        url: 'https://loreal-paris.fr'
      },
      {
        id: 'loreal-true-match-concealer',
        name: 'True Match Concealer',
        category: 'teint',
        subcategory: 'Correcteur',
        price: '~10€',
        description: 'Correcteur liquide accordé avec True Match. Anti-cernes, anti-fatigue.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche'],
        coverage: 'moyenne',
        tags: ['accessible', 'anti-cernes', 'anti-fatigue'],
        url: 'https://loreal-paris.fr'
      },
    ],
  },
  {
    id: 'maybelline',
    name: 'Maybelline',
    segment: 'Grand public',
    description: "Incontournable du maquillage accessible avec des innovations régulières.",
    gammes: ['Fit Me', 'SuperStay', 'Sky High'],
    instagram: 'https://instagram.com/maybelline',
    youtube: 'https://youtube.com/@Maybelline',
    nbTeintes: 40,
    inclusivite: 4,
    accentColor: '#E8272A',
    products: [
      {
        id: 'maybelline-fit-me-matte',
        name: 'Fit Me Matte + Poreless Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~13€',
        description: 'Fond de teint mat anti-pores, 40 teintes. Formule légère pour peaux grasses.',
        bestFor: ['warm', 'neutral', 'cool'],
        skinTypes: ['grasse', 'mixte'],
        coverage: 'moyenne',
        finish: 'mat',
        tags: ['mat', 'anti-pores', 'léger', '40 teintes'],
        hero: true,
        url: 'https://maybelline.fr'
      },
      {
        id: 'maybelline-superstay-foundation',
        name: 'SuperStay 24H Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~14€',
        description: 'Résiste au sport, à la chaleur, aux baisers. 24h de tenue sans retouche.',
        bestFor: ['warm', 'neutral', 'cool'],
        skinTypes: ['grasse', 'mixte', 'normale'],
        coverage: 'complète',
        finish: 'satiné',
        tags: ['24h', 'sport', 'résistant'],
        url: 'https://maybelline.fr'
      },
      {
        id: 'maybelline-sky-high-mascara',
        name: 'Sky High Mascara',
        category: 'yeux',
        subcategory: 'Mascara',
        price: '~11€',
        description: 'Le mascara le plus viral du monde. Brosse flexible, allongeur extrême, formule bambou + fibre.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['viral', 'allongeur', 'tiktok', 'bestseller'],
        hero: true,
        url: 'https://maybelline.fr'
      },
      {
        id: 'maybelline-fit-me-blush',
        name: 'Fit Me Blush',
        category: 'joues',
        subcategory: 'Blush poudre',
        price: '~9€',
        description: "Blush poudre naturel et discret. Couleurs douces pour toutes les carnations.",
        bestFor: ['warm', 'neutral', 'cool'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse'],
        finish: 'naturel',
        tags: ['accessible', 'naturel', 'quotidien'],
        url: 'https://maybelline.fr'
      },
      {
        id: 'maybelline-superstay-lip',
        name: "SuperStay Matte Ink",
        category: 'lèvres',
        subcategory: 'Rouge à lèvres liquide',
        price: '~10€',
        description: 'Rouge à lèvres liquide mat ultra-tenue. Résiste 16h. 40+ teintes de nude à rouge vif.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['sèche', 'normale', 'mixte', 'grasse'],
        finish: 'mat',
        tags: ['16h', 'mat', 'liquide', 'ultra-pigmenté'],
        hero: true,
        url: 'https://maybelline.fr'
      },
    ],
  },
  {
    id: 'dior',
    name: 'Dior Beauty',
    segment: 'Luxe',
    description: "L'excellence couture dans le maquillage. Glamour intemporel, formules d'exception.",
    gammes: ['Forever', 'Rouge Dior', 'Backstage'],
    instagram: 'https://instagram.com/diorbeauty',
    youtube: 'https://youtube.com/@DiorBeauty',
    nbTeintes: 35,
    inclusivite: 3,
    accentColor: '#1A1A2E',
    products: [
      {
        id: 'dior-forever',
        name: 'Dior Forever Skin Glow Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~55€',
        description: 'Fond de teint lumineux SPF 35, fini peau lumineuse. Formule skincare avec acide hyaluronique.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['normale', 'sèche', 'mixte'],
        coverage: 'complète',
        finish: 'lumineux',
        tags: ['luxe', 'SPF35', 'hydratant', 'lumineux'],
        hero: true,
        url: 'https://dior.com'
      },
      {
        id: 'dior-rouge',
        name: 'Rouge Dior Satin',
        category: 'lèvres',
        subcategory: 'Rouge à lèvres',
        price: '~43€',
        description: 'Le rouge à lèvres iconique de la maison Dior. Satiné, confortable, couleurs couture.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['sèche', 'normale', 'mixte'],
        finish: 'satiné',
        tags: ['iconique', 'luxe', 'couture', 'satiné'],
        hero: true,
        url: 'https://dior.com'
      },
      {
        id: 'dior-backstage-concealer',
        name: 'Dior Backstage Face & Body Flash Perfector Concealer',
        category: 'teint',
        subcategory: 'Correcteur',
        price: '~38€',
        description: 'Correcteur fluide haute couverture, adapté visage et corps. Multi-usages, 12 teintes.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['normale', 'mixte', 'sèche'],
        coverage: 'complète',
        tags: ['haute couverture', 'visage+corps', 'backstage'],
        url: 'https://dior.com'
      },
      {
        id: 'dior-backstage-eyeshadow',
        name: 'Dior Backstage Eye Palette',
        category: 'yeux',
        subcategory: 'Palette',
        price: '~52€',
        description: '8 teintes professionnelles mat et scintillant. Conçue par les maquilleurs backstage de Dior.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse'],
        tags: ['pro', 'backstage', '8 teintes'],
        url: 'https://dior.com'
      },
    ],
  },
  {
    id: 'mac',
    name: 'MAC Cosmetics',
    segment: 'Prestige',
    description: 'La marque pro par excellence. Palette chromatique sans égale.',
    gammes: ['Studio Fix', 'Pro Longwear', 'Lipstick'],
    instagram: 'https://instagram.com/maccosmetics',
    youtube: 'https://youtube.com/@MACCosmetics',
    nbTeintes: 50,
    inclusivite: 5,
    accentColor: '#2D2D2D',
    products: [
      {
        id: 'mac-studio-fix',
        name: 'Studio Fix Fluid SPF 15 Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~41€',
        description: 'Fond de teint pro mat SPF15, 65 teintes NC/NW. La référence des maquilleurs professionnels.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['grasse', 'mixte', 'normale'],
        coverage: 'complète',
        finish: 'mat',
        tags: ['pro', '65 teintes', 'NC/NW', 'mat', 'SPF15'],
        hero: true,
        url: 'https://maccosmetics.fr'
      },
      {
        id: 'mac-ruby-woo',
        name: 'MAC Lipstick Ruby Woo',
        category: 'lèvres',
        subcategory: 'Rouge à lèvres',
        price: '~23€',
        description: 'Le rouge à lèvres le plus vendu de MAC. Rouge vif mat rétro, tenue longue durée.',
        bestFor: ['cool', 'neutral'],
        skinTypes: ['sèche', 'normale', 'mixte', 'grasse'],
        finish: 'mat',
        tags: ['iconique', 'rouge vif', 'rétro', 'bestseller'],
        url: 'https://maccosmetics.fr'
      },
      {
        id: 'mac-fix-plus',
        name: 'MAC Fix+ Setting Spray',
        category: 'teint',
        subcategory: 'Spray fixateur',
        price: '~27€',
        description: 'Spray fixateur culte des maquilleurs. Fixe, hydrate, unifie le maquillage.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['pro', 'fixateur', 'hydratant', 'culte'],
        hero: true,
        url: 'https://maccosmetics.fr'
      },
      {
        id: 'mac-prep-prime',
        name: 'Prep + Prime Natural Radiance',
        category: 'teint',
        subcategory: 'Primer',
        price: '~35€',
        description: 'Primer illuminant radiance naturelle. Prépare le teint, lisse les pores.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche'],
        tags: ['primer', 'lumineux', 'lisse', 'pro'],
        url: 'https://maccosmetics.fr'
      },
      {
        id: 'mac-eye-shadow-palette',
        name: "Burgundy × MAC Eye Shadow Palette",
        category: 'yeux',
        subcategory: 'Palette',
        price: '~40€',
        description: '9 teintes mat et métal autour des tons prune, bordeaux et nude chaud.',
        bestFor: ['warm', 'neutral', 'cool'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse'],
        tags: ['bordeaux', 'mat+métal', 'polyvalent'],
        url: 'https://maccosmetics.fr'
      },
    ],
  },
  {
    id: 'lancome',
    name: 'Lancôme',
    segment: 'Prestige',
    description: 'Maison de prestige française alliant élégance parisienne et innovation dermatologique.',
    gammes: ['Teint Idole', 'Hypnôse', "L'Absolu"],
    instagram: 'https://instagram.com/lancomeofficial',
    youtube: 'https://youtube.com/@Lancome',
    nbTeintes: 40,
    inclusivite: 4,
    accentColor: '#C8A2C8',
    products: [
      {
        id: 'lancome-teint-idole',
        name: 'Teint Idole Ultra Wear Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~48€',
        description: 'Fond de teint haute couverture 24h. Formule poids-plume, résistant, 46 teintes.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['normale', 'mixte', 'grasse'],
        coverage: 'complète',
        finish: 'satiné',
        tags: ['24h', '46 teintes', 'haute couverture'],
        hero: true,
        url: 'https://lancome.fr'
      },
      {
        id: 'lancome-hypnose-mascara',
        name: 'Hypnôse Volume-à-Porter Mascara',
        category: 'yeux',
        subcategory: 'Mascara',
        price: '~33€',
        description: 'Mascara volume modifiable selon intensité désirée. Brosse customisable.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['volume modulable', 'technologie brosse', 'prestige'],
        hero: true,
        url: 'https://lancome.fr'
      },
      {
        id: 'lancome-absolu-rouge',
        name: "L'Absolu Rouge Cream",
        category: 'lèvres',
        subcategory: 'Rouge à lèvres',
        price: '~40€',
        description: "Rouge à lèvres prestige ultra-crémeux, formule Rosa Mexicana. 58 teintes.",
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['sèche', 'normale', 'mixte'],
        finish: 'lumineux',
        tags: ['prestige', 'hydratant', '58 teintes', 'Rosa Mexicana'],
        url: 'https://lancome.fr'
      },
      {
        id: 'lancome-cils-booster',
        name: 'Cils Booster XL Mascara Primer',
        category: 'yeux',
        subcategory: 'Base cils',
        price: '~28€',
        description: 'Base cils amplificatrice. Multiplie le volume du mascara et allonge les cils.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['primer cils', 'volume +', 'amplificateur'],
        url: 'https://lancome.fr'
      },
    ],
  },
  {
    id: 'nyx',
    name: 'NYX Professional',
    segment: 'Grand public',
    description: 'La marque pro-inspired accessible. Favorites des makeup artists et amateurs confirmés.',
    gammes: ['Soft Matte Lip', "Can't Stop Won't Stop", 'Epic Ink'],
    instagram: 'https://instagram.com/nyxcosmetics_france',
    youtube: 'https://youtube.com/@NYXCosmetics',
    nbTeintes: 35,
    inclusivite: 4,
    accentColor: '#8B2FC9',
    products: [
      {
        id: 'nyx-cant-stop',
        name: "Can't Stop Won't Stop Foundation",
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~17€',
        description: 'Fond de teint pleine couverture, tenue matte 24h. 45 teintes, texture légère.',
        bestFor: ['warm', 'neutral', 'cool'],
        skinTypes: ['grasse', 'mixte', 'normale'],
        coverage: 'complète',
        finish: 'mat',
        tags: ['24h', 'mat', '45 teintes', 'rapport qualité-prix'],
        url: 'https://nyxcosmetics.fr'
      },
      {
        id: 'nyx-soft-matte-lip',
        name: 'Soft Matte Lip Cream',
        category: 'lèvres',
        subcategory: 'Rouge à lèvres crème',
        price: '~8€',
        description: 'Rouge à lèvres crème liquide mat confortable. 60+ teintes de nude à rouge vif.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['sèche', 'normale', 'mixte', 'grasse'],
        finish: 'mat',
        tags: ['60+ teintes', 'confortable', 'mat crème', 'bestseller'],
        hero: true,
        url: 'https://nyxcosmetics.fr'
      },
      {
        id: 'nyx-epic-ink-liner',
        name: 'Epic Ink Liner',
        category: 'yeux',
        subcategory: 'Eye-liner',
        price: '~10€',
        description: "Eye-liner feutre waterproof, trait ultra-précis. La référence accessible pour le cat eye.",
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['waterproof', 'précis', 'cat eye', 'accessible'],
        hero: true,
        url: 'https://nyxcosmetics.fr'
      },
      {
        id: 'nyx-butter-lip',
        name: 'Butter Gloss',
        category: 'lèvres',
        subcategory: 'Gloss',
        price: '~8€',
        description: 'Gloss hydratant ultra-confortable, fini beurré. 40 teintes gourmandes.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['sèche', 'normale', 'mixte'],
        tags: ['hydratant', 'confortable', 'gourmand', 'accessible'],
        url: 'https://nyxcosmetics.fr'
      },
    ],
  },
  {
    id: 'ysl',
    name: 'YSL Beauté',
    segment: 'Luxe',
    description: "L'audace couture. Le Touche Éclat reste un des produits beauté les plus vendus au monde.",
    gammes: ['Touche Éclat', 'Rouge Pur Couture', 'All Hours'],
    instagram: 'https://instagram.com/yslbeauty',
    youtube: 'https://youtube.com/@YSLBeauty',
    nbTeintes: 25,
    inclusivite: 3,
    accentColor: '#C9A96E',
    products: [
      {
        id: 'ysl-touche-eclat',
        name: 'Touche Éclat Highlighter Pen',
        category: 'teint',
        subcategory: 'Correcteur illuminant',
        price: '~38€',
        description: "Le stylo illuminateur iconique. Masque les cernes, estompe la fatigue, illumine en un toucher.",
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse'],
        coverage: 'légère',
        finish: 'lumineux',
        tags: ['iconique', 'illuminateur', 'cernes', 'stylo'],
        hero: true,
        url: 'https://yslbeauty.fr'
      },
      {
        id: 'ysl-rouge-pur-couture',
        name: 'Rouge Pur Couture',
        category: 'lèvres',
        subcategory: 'Rouge à lèvres',
        price: '~45€',
        description: 'Le rouge à lèvres couture de YSL. Satiné lumineux, 50 teintes, packaging iconique.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['sèche', 'normale', 'mixte'],
        finish: 'satiné',
        tags: ['luxe', 'couture', '50 teintes', 'iconique'],
        hero: true,
        url: 'https://yslbeauty.fr'
      },
      {
        id: 'ysl-all-hours-foundation',
        name: 'All Hours Matte Foundation',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~49€',
        description: 'Fond de teint mat longue tenue, résiste chaleur et humidité. Couvrance buildable.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['grasse', 'mixte', 'normale'],
        coverage: 'complète',
        finish: 'mat',
        tags: ['luxe', 'mat', 'résistant chaleur'],
        url: 'https://yslbeauty.fr'
      },
    ],
  },
  {
    id: 'benefit',
    name: 'Benefit',
    segment: 'Prestige',
    description: 'La marque rétro et fun, spécialiste des sourcils et du blush. Packaging collector.',
    gammes: ['Hoola', 'Gimme Brow', "They're Real"],
    instagram: 'https://instagram.com/benefitcosmetics',
    youtube: 'https://youtube.com/@BenefitCosmetics',
    nbTeintes: 20,
    inclusivite: 3,
    accentColor: '#E91E8C',
    products: [
      {
        id: 'benefit-gimme-brow',
        name: 'Gimme Brow+ Volumizing Eyebrow Gel',
        category: 'sourcils',
        subcategory: 'Gel sourcils',
        price: '~27€',
        description: 'Gel sourcils volumisant avec fibres, 5 teintes. Redessine et épaissit les sourcils.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['sourcils', 'volume', 'fibres', 'bestseller'],
        hero: true,
        url: 'https://benefitcosmetics.com'
      },
      {
        id: 'benefit-hoola-bronzer',
        name: 'Hoola Matte Bronzer',
        category: 'joues',
        subcategory: 'Bronzer',
        price: '~35€',
        description: 'Le bronzer mat de référence. Naturel, sans éclat, adapté aux teints moyens à foncés.',
        bestFor: ['warm', 'neutral'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse'],
        finish: 'mat',
        tags: ['bronzer', 'mat', 'naturel', 'référence'],
        hero: true,
        url: 'https://benefitcosmetics.com'
      },
      {
        id: 'benefit-theyre-real-mascara',
        name: "They're Real! Mascara",
        category: 'yeux',
        subcategory: 'Mascara',
        price: '~27€',
        description: 'Mascara allongeur et séparateur, brosse pointe. Résultats spectaculaires effet faux-cils.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['allongeur', 'séparateur', 'effet faux-cils'],
        url: 'https://benefitcosmetics.com'
      },
    ],
  },
  {
    id: 'larochposay',
    name: 'La Roche-Posay',
    segment: 'Grand public',
    description: 'La référence dermatologique pour peaux sensibles. N°1 recommandé par les dermos.',
    gammes: ['Toleriane', 'Anthelios', 'Effaclar'],
    instagram: 'https://instagram.com/larocheposayfr',
    youtube: 'https://youtube.com/@LaRochePosay',
    nbTeintes: 10,
    inclusivite: 2,
    accentColor: '#4A90C4',
    products: [
      {
        id: 'lrp-toleriane-fluid',
        name: 'Toleriane Teint Fluide',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~18€',
        description: "Fond de teint fluide pour peaux sensibles. 7 teintes, formule sans parfum, testée dermato.",
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['sensible', 'normale', 'mixte'],
        coverage: 'moyenne',
        finish: 'naturel',
        tags: ['sensible', 'dermato', 'sans parfum', 'toleriane'],
        hero: true,
        url: 'https://laroche-posay.fr'
      },
      {
        id: 'lrp-anthelios-spf50',
        name: 'Anthelios UVmune 400 SPF50+',
        category: 'skincare',
        subcategory: 'Protection solaire',
        price: '~22€',
        description: 'SPF50+ invisible, protège des UVA longs. Texture fluide non grasse, idéal sous maquillage.',
        bestFor: ['cool', 'neutral', 'warm', 'olive'],
        skinTypes: ['sensible', 'normale', 'mixte', 'grasse'],
        tags: ['SPF50+', 'quotidien', 'anti-UV', 'non gras'],
        url: 'https://laroche-posay.fr'
      },
      {
        id: 'lrp-effaclar-duo',
        name: 'Effaclar Duo(+)',
        category: 'skincare',
        subcategory: 'Soin ciblé',
        price: '~18€',
        description: 'Soin anti-imperfections double action. Réduit visiblement les boutons et taches post-acné.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['grasse', 'mixte'],
        tags: ['anti-acné', 'post-acné', 'dermato'],
        url: 'https://laroche-posay.fr'
      },
    ],
  },
  {
    id: 'urbandecay',
    name: 'Urban Decay',
    segment: 'Prestige',
    description: 'La marque rebelle du maquillage prestige. Les palettes Naked ont révolutionné le smoky.',
    gammes: ['Naked', 'All Nighter', 'Hydromaniac'],
    instagram: 'https://instagram.com/urbandecaycosmetics',
    youtube: 'https://youtube.com/@UrbanDecay',
    nbTeintes: 30,
    inclusivite: 3,
    accentColor: '#6B3FA0',
    products: [
      {
        id: 'ud-naked-palette',
        name: 'Naked 3 Eyeshadow Palette',
        category: 'yeux',
        subcategory: 'Palette',
        price: '~54€',
        description: '12 teintes roses et champagne mat + shimmer. La palette pour les regards délicats ou intenses.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse'],
        tags: ['nude rose', '12 teintes', 'smoky', 'culte'],
        hero: true,
        url: 'https://urbandecay.com'
      },
      {
        id: 'ud-all-nighter',
        name: 'All Nighter Long-Lasting Makeup Setting Spray',
        category: 'teint',
        subcategory: 'Spray fixateur',
        price: '~31€',
        description: 'Spray fixateur ultra-longue tenue 16h+. Utilisé par les maquilleurs pro backstage.',
        bestFor: ['warm', 'neutral', 'cool', 'olive'],
        skinTypes: ['normale', 'mixte', 'sèche', 'grasse', 'sensible'],
        tags: ['16h', 'pro', 'fixateur', 'backstage'],
        hero: true,
        url: 'https://urbandecay.com'
      },
      {
        id: 'ud-hydromaniac-foundation',
        name: 'Hydromaniac Tinted Glow Hydrator',
        category: 'teint',
        subcategory: 'Fond de teint',
        price: '~36€',
        description: 'Fond de teint hydratant glow intense. 30 teintes, fini lumineux naturel. Formule eau.',
        bestFor: ['cool', 'neutral', 'warm'],
        skinTypes: ['sèche', 'normale', 'mixte'],
        coverage: 'légère',
        finish: 'lumineux',
        tags: ['hydratant', 'glow', '30 teintes', 'lumineux'],
        url: 'https://urbandecay.com'
      },
    ],
  },
];

// ─── AI RECOMMENDATION ENGINE ─────────────────────────────────────────────────

function generateRecommendations(profile: UserProfile, brands: Brand[]): Recommendation[] {
  const { skinTone, undertone, skinType, concerns } = profile;
  if (!skinTone || !undertone || !skinType) return [];

  const allProducts: Array<{ brand: Brand; product: Product; score: number }> = [];

  brands.forEach(brand => {
    brand.products.forEach(product => {
      let score = 0;
      if (product.bestFor.includes(undertone)) score += 3;
      if (product.skinTypes.includes(skinType)) score += 2;
      if (product.hero) score += 1;

      // Concern matching
      if (concerns.includes('cernes') && product.subcategory === 'Correcteur') score += 3;
      if (concerns.includes('rougeurs') && product.tags.includes('sensible')) score += 2;
      if (concerns.includes('pores') && (product.finish === 'mat' || product.tags.includes('anti-pores'))) score += 2;
      if (concerns.includes('éclat') && (product.finish === 'lumineux' || product.tags.includes('glow'))) score += 2;
      if (concerns.includes('acné') && product.tags.some(t => ['anti-acné', 'mat', 'dermato'].includes(t))) score += 2;
      if (concerns.includes('rides') && product.tags.some(t => ['anti-âge', 'hydratant', 'SPF'].includes(t))) score += 2;
      if (concerns.includes('taches') && product.tags.some(t => ['post-acné', 'illuminateur'].includes(t))) score += 2;
      if (concerns.includes('hyperpigmentation') && product.coverage === 'complète') score += 1;

      // Skin type specifics
      if (skinType === 'grasse' && product.finish === 'mat') score += 1;
      if (skinType === 'sèche' && product.finish === 'lumineux') score += 1;
      if (skinType === 'sensible' && brand.id === 'larochposay') score += 2;

      allProducts.push({ brand, product, score });
    });
  });

  const ZONES: Array<{ zone: FaceZone; label: string; icon: React.ReactNode; subcategories: string[] }> = [
    {
      zone: 'teint',
      label: 'Teint & Base',
      icon: <Layers size={16} />,
      subcategories: ['Fond de teint', 'Correcteur', 'Skin tint', 'Primer', 'Complexion booster', 'Correcteur illuminant', 'Spray fixateur'],
    },
    {
      zone: 'yeux',
      label: 'Yeux',
      icon: <Eye size={16} />,
      subcategories: ['Mascara', 'Palette', 'Eye-liner', 'Fard à paupières crème', 'Base cils'],
    },
    {
      zone: 'joues',
      label: 'Joues & Contour',
      icon: <Circle size={16} />,
      subcategories: ['Blush poudre', 'Blush crème', 'Blush liquide', 'Highlighter', 'Bronzer'],
    },
    {
      zone: 'lèvres',
      label: 'Lèvres',
      icon: <Smile size={16} />,
      subcategories: ['Rouge à lèvres', 'Rouge à lèvres crème', 'Rouge à lèvres liquide', 'Gloss', 'Crayon lèvres'],
    },
    {
      zone: 'sourcils',
      label: 'Sourcils',
      icon: <ArrowRight size={16} />,
      subcategories: ['Gel sourcils'],
    },
    {
      zone: 'skincare',
      label: 'Soin & Prep',
      icon: <Droplets size={16} />,
      subcategories: ['Crème visage', 'Protection solaire', 'Soin ciblé'],
    },
  ];

  return ZONES.map(({ zone, label, icon, subcategories }) => {
    const zoneProducts = allProducts
      .filter(({ product }) => subcategories.includes(product.subcategory))
      .sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    const top = zoneProducts
      .filter(({ product }) => {
        if (seen.has(product.subcategory)) return false;
        seen.add(product.subcategory);
        return true;
      })
      .slice(0, 2);

    return {
      zone,
      zoneLabel: label,
      zoneIcon: icon,
      products: top.map(({ brand, product, score }) => ({
        brand,
        product,
        reason: buildReason(product, profile, score),
      })),
    };
  }).filter(r => r.products.length > 0);
}

function buildReason(product: Product, profile: UserProfile, score: number): string {
  const { skinType, undertone, concerns } = profile;
  const reasons: string[] = [];

  if (product.bestFor.includes(undertone!)) {
    const undertoneLabels: Record<Undertone, string> = {
      warm: 'sous-ton chaud',
      cool: 'sous-ton froid',
      neutral: 'sous-ton neutre',
      olive: 'teint olive'
    };
    reasons.push(`Idéal pour ${undertoneLabels[undertone!]}`);
  }
  if (product.skinTypes.includes(skinType!)) {
    reasons.push(`Formulé pour peau ${skinType}`);
  }
  if (product.hero) reasons.push('Bestseller de la marque');
  if (concerns.includes('cernes') && product.subcategory === 'Correcteur') reasons.push('Cerne camouflés');
  if (concerns.includes('éclat') && product.finish === 'lumineux') reasons.push('Booste l\'éclat');
  if (concerns.includes('pores') && product.finish === 'mat') reasons.push('Affine les pores');
  if (concerns.includes('acné') && product.tags.includes('dermato')) reasons.push('Testé dermato');

  return reasons.slice(0, 2).join(' · ') || 'Recommandé par NYLVA';
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const SKIN_TONES: SkinTone[] = ['très claire', 'claire', 'médium claire', 'médium', 'médium foncée', 'foncée', 'très foncée'];
const TONE_COLORS: Record<SkinTone, string> = {
  'très claire': '#FDEFD5',
  'claire': '#F3D8B2',
  'médium claire': '#E8B99A',
  'médium': '#D4956A',
  'médium foncée': '#B87040',
  'foncée': '#8B4E25',
  'très foncée': '#4A2010',
};

const UNDERTONE_CONFIG: Record<Undertone, { label: string; desc: string; color: string }> = {
  warm: { label: 'Chaud', desc: 'Tons jaunes, dorés, pêche', color: '#D4A017' },
  cool: { label: 'Froid', desc: 'Tons roses, bleutés', color: '#C4758A' },
  neutral: { label: 'Neutre', desc: 'Mélange chaud/froid', color: '#9E8A78' },
  olive: { label: 'Olive', desc: 'Tons verts, jaune-vert', color: '#7C9A6F' },
};

const SKIN_TYPES: Record<SkinType, { label: string; icon: string }> = {
  sèche: { label: 'Sèche', icon: '💧' },
  normale: { label: 'Normale', icon: '✨' },
  mixte: { label: 'Mixte', icon: '⚖️' },
  grasse: { label: 'Grasse', icon: '🌿' },
  sensible: { label: 'Sensible', icon: '🌸' },
};

const CONCERNS_CONFIG: Record<Concern, { label: string; icon: string }> = {
  rougeurs: { label: 'Rougeurs', icon: '🔴' },
  taches: { label: 'Taches', icon: '☀️' },
  pores: { label: 'Pores', icon: '🔬' },
  rides: { label: 'Rides', icon: '⏳' },
  éclat: { label: 'Éclat', icon: '✨' },
  cernes: { label: 'Cernes', icon: '👁️' },
  acné: { label: 'Acné', icon: '⚡' },
  hyperpigmentation: { label: 'Hyperpigmentation', icon: '🎨' },
};

function SegmentBadge({ segment }: { segment: Segment }) {
  const cfg = {
    'Grand public': { bg: '#F0F4F0', color: '#4A7C59' },
    Prestige: { bg: '#FFF0F3', color: '#C4758A' },
    Luxe: { bg: '#FBF5E6', color: '#B8934A' },
  }[segment];
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {segment}
    </span>
  );
}

// ─── PROFILER WIZARD ─────────────────────────────────────────────────────────

function ProfilerWizard({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({ skinTone: null, undertone: null, skinType: null, concerns: [] });

  const canNext = [
    !!profile.skinTone,
    !!profile.undertone,
    !!profile.skinType,
    true,
  ][step];

  const handleNext = () => {
    if (step < 3) setStep(s => s + 1);
    else onComplete(profile);
  };

  const steps = [
    {
      title: 'Quelle est votre carnation ?',
      subtitle: 'La couleur naturelle de votre peau',
      content: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {SKIN_TONES.map(tone => (
            <button
              key={tone}
              onClick={() => setProfile(p => ({ ...p, skinTone: tone }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 12,
                border: `2px solid ${profile.skinTone === tone ? '#C4758A' : '#E8DDD5'}`,
                background: profile.skinTone === tone ? '#FFF0F3' : 'white',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: TONE_COLORS[tone], display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
              <span style={{ textTransform: 'capitalize' }}>{tone}</span>
              {profile.skinTone === tone && <Check size={13} style={{ color: '#C4758A' }} />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Quel est votre sous-ton ?',
      subtitle: 'La nuance profonde de votre peau (test des veines ou des bijoux)',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(Object.entries(UNDERTONE_CONFIG) as [Undertone, typeof UNDERTONE_CONFIG[Undertone]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setProfile(p => ({ ...p, undertone: key }))}
              style={{
                padding: '16px', borderRadius: 14,
                border: `2px solid ${profile.undertone === key ? cfg.color : '#E8DDD5'}`,
                background: profile.undertone === key ? `${cfg.color}12` : 'white',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: profile.undertone === key ? cfg.color : '#1A1A1A' }}>{cfg.label}</span>
                {profile.undertone === key && <Check size={14} style={{ color: cfg.color }} />}
              </div>
              <span style={{ fontSize: 12, color: '#999' }}>{cfg.desc}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Quel est votre type de peau ?',
      subtitle: 'Pour des formules adaptées',
      content: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {(Object.entries(SKIN_TYPES) as [SkinType, { label: string; icon: string }][]).map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => setProfile(p => ({ ...p, skinType: key }))}
              style={{
                padding: '12px 18px', borderRadius: 12,
                border: `2px solid ${profile.skinType === key ? '#C4758A' : '#E8DDD5'}`,
                background: profile.skinType === key ? '#FFF0F3' : 'white',
                cursor: 'pointer', fontSize: 14, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.15s',
              }}
            >
              <span>{icon}</span> {label}
              {profile.skinType === key && <Check size={13} style={{ color: '#C4758A' }} />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Vos préoccupations beauté',
      subtitle: 'Sélectionnez tout ce qui vous concerne (optionnel)',
      content: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {(Object.entries(CONCERNS_CONFIG) as [Concern, { label: string; icon: string }][]).map(([key, { label, icon }]) => {
            const selected = profile.concerns.includes(key);
            return (
              <button
                key={key}
                onClick={() => setProfile(p => ({
                  ...p,
                  concerns: selected ? p.concerns.filter(c => c !== key) : [...p.concerns, key],
                }))}
                style={{
                  padding: '10px 16px', borderRadius: 20,
                  border: `2px solid ${selected ? '#B8934A' : '#E8DDD5'}`,
                  background: selected ? '#FBF5E6' : 'white',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <span>{icon}</span> {label}
                {selected && <Check size={12} style={{ color: '#B8934A' }} />}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1.5px solid #F0EAE4', position: 'relative' }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            height: 4, flex: 1, borderRadius: 2,
            background: i <= step ? '#C4758A' : '#F0EAE4',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ marginBottom: 4, fontSize: 11, color: '#BBB', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Étape {step + 1} / {steps.length}
      </div>
      <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#1A1A1A' }}>
        {current.title}
      </h3>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>{current.subtitle}</p>

      <div style={{ marginBottom: 28 }}>{current.content}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {step > 0 ? (
          <button onClick={() => setStep(s => s - 1)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={14} /> Retour
          </button>
        ) : <div />}
        <button
          onClick={handleNext}
          disabled={!canNext}
          style={{
            padding: '12px 28px', borderRadius: 12,
            background: canNext ? '#C4758A' : '#E8DDD5',
            color: canNext ? 'white' : '#BBB',
            border: 'none', cursor: canNext ? 'pointer' : 'default',
            fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.15s',
          }}
        >
          {step < 3 ? 'Suivant' : '✨ Obtenir mes recommandations'}
          {step < 3 && <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── RECOMMENDATION DISPLAY ───────────────────────────────────────────────────

function RecommendationsPanel({ recs, profile, onReset }: { recs: Recommendation[]; profile: UserProfile; onReset: () => void }) {
  const [activeZone, setActiveZone] = useState<FaceZone>(recs[0]?.zone || 'teint');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const current = recs.find(r => r.zone === activeZone);

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #F0EAE4', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0EAE4', background: 'linear-gradient(135deg, #FBF5E6 0%, #FFF0F3 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Wand2 size={14} style={{ color: '#B8934A' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#B8934A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recommandations NYLVA</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {profile.skinTone && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'white', border: '1px solid #E8DDD5', fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: TONE_COLORS[profile.skinTone], display: 'inline-block' }} />
                  {profile.skinTone}
                </span>
              )}
              {profile.undertone && (
                <span style={{ padding: '3px 10px', borderRadius: 20, background: 'white', border: '1px solid #E8DDD5', fontSize: 12 }}>
                  {UNDERTONE_CONFIG[profile.undertone].label}
                </span>
              )}
              {profile.skinType && (
                <span style={{ padding: '3px 10px', borderRadius: 20, background: 'white', border: '1px solid #E8DDD5', fontSize: 12 }}>
                  Peau {profile.skinType}
                </span>
              )}
            </div>
          </div>
          <button onClick={onReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BBB', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <RefreshCw size={12} /> Modifier
          </button>
        </div>
      </div>

      {/* Zone tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #F0EAE4', overflowX: 'auto' }}>
        {recs.map(rec => (
          <button
            key={rec.zone}
            onClick={() => setActiveZone(rec.zone)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: activeZone === rec.zone ? 'white' : 'transparent',
              borderBottom: activeZone === rec.zone ? '2px solid #C4758A' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 12, fontWeight: activeZone === rec.zone ? 700 : 400,
              color: activeZone === rec.zone ? '#C4758A' : '#999',
              display: 'flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {rec.zoneIcon}
            {rec.zoneLabel}
          </button>
        ))}
      </div>

      {/* Products */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {current?.products.map(({ brand, product, reason }, i) => {
          const key = `${brand.id}-${product.id}`;
          const isSaved = saved.has(key);
          return (
            <div
              key={key}
              style={{
                display: 'flex', gap: 14, padding: '16px', borderRadius: 14,
                background: '#FDFAF8', border: '1px solid #F0EAE4',
                animation: `recReveal 0.3s ease ${i * 0.08}s both`,
                position: 'relative',
              }}
            >
              {/* Brand swatch */}
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: `${brand.accentColor}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${brand.accentColor}30`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: brand.accentColor, fontFamily: 'Cormorant Garamond, serif' }}>
                  {brand.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: brand.accentColor, fontWeight: 600, marginBottom: 2 }}>{brand.name}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A', lineHeight: 1.3 }}>{product.name}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#B8934A', whiteSpace: 'nowrap' }}>{product.price}</span>
                </div>
                <p style={{ fontSize: 12, color: '#888', lineHeight: 1.5, margin: '6px 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#C4758A', background: '#FFF0F3', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                    {reason}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setSaved(s => { const n = new Set(s); isSaved ? n.delete(key) : n.add(key); return n; })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#C4758A' : '#CCC', padding: 4, transition: 'color 0.15s' }}
                    >
                      <Heart size={14} fill={isSaved ? '#C4758A' : 'none'} />
                    </button>
                    {product.url && (
                      <a href={product.url} target="_blank" rel="noopener noreferrer"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BBB', padding: 4, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BRAND MODAL ──────────────────────────────────────────────────────────────

function BrandModal({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<FaceZone | 'all'>('all');

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const categories = ['all', ...Array.from(new Set(brand.products.map(p => p.category)))] as Array<FaceZone | 'all'>;
  const ZONE_LABELS: Record<FaceZone, string> = {
    teint: 'Teint', yeux: 'Yeux', joues: 'Joues', lèvres: 'Lèvres', contour: 'Contour', sourcils: 'Sourcils', skincare: 'Skincare'
  };
  const displayed = activeCategory === 'all' ? brand.products : brand.products.filter(p => p.category === activeCategory);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,10,5,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FBF7F4', borderRadius: 24, maxWidth: 680, width: '100%',
          maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
          animation: 'slideUp 0.28s cubic-bezier(.16,1,.3,1)',
        }}
      >
        {/* Modal header */}
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #F0EAE4', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${brand.accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${brand.accentColor}40` }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: brand.accentColor, fontFamily: 'Cormorant Garamond, serif' }}>{brand.name.slice(0,2).toUpperCase()}</span>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 24, fontWeight: 700, margin: 0 }}>{brand.name}</h2>
                  <SegmentBadge segment={brand.segment} />
                </div>
                <p style={{ color: '#999', fontSize: 13, margin: 0 }}>{brand.products.length} produits · {brand.nbTeintes} teintes</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BBB', padding: 4 }}><X size={20} /></button>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none',
                  background: activeCategory === cat ? brand.accentColor : '#F0EAE4',
                  color: activeCategory === cat ? 'white' : '#666',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                {cat === 'all' ? 'Tout voir' : ZONE_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Products list */}
        <div style={{ overflowY: 'auto', padding: '20px 28px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map(product => (
              <div key={product.id} style={{ padding: '16px', background: 'white', borderRadius: 14, border: '1px solid #F0EAE4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: brand.accentColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{product.subcategory}</span>
                      {product.hero && <span style={{ fontSize: 9, background: '#FBF5E6', color: '#B8934A', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>⭐ Bestseller</span>}
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>{product.name}</h4>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, color: '#B8934A', fontSize: 14 }}>{product.price}</span>
                    {product.url && (
                      <a href={product.url} target="_blank" rel="noopener noreferrer" style={{ color: '#BBB', display: 'flex' }}><ExternalLink size={14} /></a>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#777', lineHeight: 1.5, margin: '0 0 10px' }}>{product.description}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {product.finish && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F8F3EF', color: '#999' }}>Fini {product.finish}</span>}
                  {product.coverage && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F8F3EF', color: '#999' }}>Couvrance {product.coverage}</span>}
                  {product.tags.slice(0,3).map(t => (
                    <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${brand.accentColor}12`, color: brand.accentColor, fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #F0EAE4', display: 'flex', gap: 10, flexShrink: 0 }}>
          <a href={brand.instagram} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: brand.accentColor, color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            <Instagram size={13} /> Instagram
          </a>
          {brand.youtube && (
            <a href={brand.youtube} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'white', border: '1px solid #E8DDD5', color: '#444', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              <Youtube size={13} /> YouTube
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function MarquesPage() {
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment | 'Tous'>('Tous');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  const filtered = BRANDS.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchSegment = segment === 'Tous' || b.segment === segment;
    return matchSearch && matchSegment;
  });

  const handleProfileComplete = useCallback((p: UserProfile) => {
    setProfile(p);
    setRecommendations(generateRecommendations(p, BRANDS));
  }, []);

  const handleReset = () => {
    setProfile(null);
    setRecommendations(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }

        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(28px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes recReveal { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(196,117,138,0.3) } 50% { box-shadow: 0 0 0 8px rgba(196,117,138,0) } }

        .brand-card {
          background: white; border-radius: 16px; padding: 20px;
          cursor: pointer; border: 1.5px solid #F0EAE4;
          transition: transform 0.22s cubic-bezier(.16,1,.3,1), box-shadow 0.22s ease, border-color 0.15s;
          animation: slideUp 0.4s ease both; position: relative; overflow: hidden;
        }
        .brand-card:hover { transform: translateY(-4px); box-shadow: 0 14px 44px rgba(0,0,0,0.1); border-color: #E0D0C8; }

        .filter-btn {
          padding: 7px 16px; border-radius: 20px; border: 1.5px solid #E8DDD5;
          cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          transition: all 0.15s; background: white; color: #777;
        }
        .filter-btn:hover { border-color: var(--accent, #C4758A); color: var(--accent, #C4758A); }
        .filter-btn.active { background: var(--accent, #C4758A); color: white; border-color: var(--accent, #C4758A); }

        .advisor-fab {
          position: fixed; bottom: 28px; right: 28px; z-index: 100;
          display: flex; align-items: center; gap: 8px;
          padding: 14px 22px; border-radius: 28px;
          background: linear-gradient(135deg, #C4758A, #B8934A);
          color: white; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          box-shadow: 0 8px 24px rgba(196,117,138,0.4);
          transition: transform 0.15s, box-shadow 0.15s;
          animation: pulseGlow 2.5s ease 1s 3;
        }
        .advisor-fab:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(196,117,138,0.5); }

        .nylva-search {
          width: 100%; padding: 12px 16px 12px 46px;
          border: 1.5px solid #E8DDD5; border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          outline: none; background: white; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .nylva-search:focus { border-color: #C4758A; box-shadow: 0 0 0 3px rgba(196,117,138,0.1); }

        .product-count-badge {
          background: #F8F3EF; color: #999; font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 10; letter-spacing: 0.05em;
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F8F3EF; }
        ::-webkit-scrollbar-thumb { background: #E0D0C8; border-radius: 3px; }
      `}</style>

      <div style={{ background: 'var(--bg, #FBF7F4)', minHeight: '100vh' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '72px 24px 56px', background: 'linear-gradient(180deg, #FFFAF7 0%, #FBF7F4 100%)', borderBottom: '1px solid #F0EAE4' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(184,147,74,0.1)', marginBottom: 22 }}>
              <Sparkles size={12} style={{ color: '#B8934A' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#B8934A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Catalogue Beauté + Conseiller IA</span>
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(36px, 6vw, 58px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 18 }}>
              Marques, Produits &{' '}
              <em style={{ color: '#C4758A', fontStyle: 'italic' }}>Conseils Personnalisés</em>
            </h1>
            <p style={{ fontSize: 16, color: '#888', lineHeight: 1.7, fontWeight: 300, maxWidth: 560, margin: '0 auto 28px' }}>
              Explorez {BRANDS.length} marques et {BRANDS.reduce((s, b) => s + b.products.length, 0)} produits. Obtenez des recommandations IA zone par zone selon votre profil unique.
            </p>
            <button
              onClick={() => setAdvisorOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 14,
                background: 'linear-gradient(135deg, #C4758A, #B8934A)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 600,
                boxShadow: '0 6px 20px rgba(196,117,138,0.35)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Wand2 size={16} />
              Obtenir mes recommandations personnalisées
            </button>
          </div>
        </section>

        {/* ── MAIN LAYOUT ── */}
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

          {/* LEFT: CATALOGUE */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, fontWeight: 700 }}>Catalogue Marques</h2>
                <p style={{ color: '#BBB', fontSize: 13, marginTop: 2 }}>{filtered.length} marques · {filtered.reduce((s, b) => s + b.products.length, 0)} produits</p>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
                <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#CCC' }} />
                <input className="nylva-search" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['Tous', 'Grand public', 'Prestige', 'Luxe'] as const).map(s => (
                  <button key={s} className={`filter-btn ${segment === s ? 'active' : ''}`} onClick={() => setSegment(s)}>{s}</button>
                ))}
              </div>
            </div>

            {/* Brand grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {filtered.map((brand, i) => (
                <div
                  key={brand.id}
                  className="brand-card"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => setSelectedBrand(brand)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${brand.accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${brand.accentColor}30` }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: brand.accentColor, fontFamily: 'Cormorant Garamond, serif' }}>{brand.name.slice(0,2).toUpperCase()}</span>
                    </div>
                    <SegmentBadge segment={brand.segment} />
                  </div>

                  <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 19, fontWeight: 700, marginBottom: 4 }}>{brand.name}</h3>
                  <p style={{ fontSize: 12, color: '#999', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {brand.description}
                  </p>

                  {/* Product categories preview */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {Array.from(new Set(brand.products.map(p => p.category))).map(cat => {
                      const labels: Partial<Record<FaceZone, string>> = { teint: '🎨 Teint', yeux: '👁️ Yeux', joues: '🌸 Joues', lèvres: '💄 Lèvres', sourcils: '✏️ Sourcils', skincare: '💧 Soin' };
                      return <span key={cat} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#F8F3EF', color: '#888', fontWeight: 600 }}>{labels[cat] || cat}</span>;
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#AAA' }}>
                      <span><strong style={{ color: brand.accentColor }}>{brand.nbTeintes}</strong> teintes</span>
                      <span>·</span>
                      <span><strong style={{ color: '#555' }}>{brand.products.length}</strong> produits</span>
                    </div>
                    <span style={{ color: brand.accentColor, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      Voir <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: ADVISOR PANEL */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <Wand2 size={14} style={{ color: '#B8934A' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#B8934A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Conseiller NYLVA</span>
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700 }}>
                Votre routine<br /><em style={{ color: '#C4758A', fontStyle: 'italic' }}>sur-mesure</em>
              </h2>
            </div>

            {!profile ? (
              <ProfilerWizard onComplete={handleProfileComplete} />
            ) : recommendations ? (
              <RecommendationsPanel recs={recommendations} profile={profile} onReset={handleReset} />
            ) : null}

            {/* Teaser if no profile */}
            {!profile && (
              <div style={{ marginTop: 14, padding: '14px', background: 'rgba(184,147,74,0.06)', borderRadius: 12, border: '1px dashed rgba(184,147,74,0.3)' }}>
                <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6, textAlign: 'center' }}>
                  Répondez à 4 questions pour obtenir vos recommandations produits <strong>zone par zone</strong> : teint, yeux, joues, lèvres, sourcils et soin.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── PARTENARIAT CTA ── */}
        <section style={{ background: 'linear-gradient(135deg, #FBF5E6 0%, #FFF0F3 100%)', borderTop: '1px solid #F0EAE4', padding: '72px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ width: 28, height: 2, background: '#B8934A', borderRadius: 1 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#B8934A', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Partenariat Marques</span>
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 18 }}>
                Votre marque<br /><em style={{ color: '#C4758A', fontStyle: 'italic' }}>sur NYLVA</em>
              </h2>
              <p style={{ color: '#777', fontSize: 15, lineHeight: 1.7, marginBottom: 28, fontWeight: 300 }}>
                NYLVA connecte vos produits aux utilisatrices selon leur profil teint et sous-tons réels. Des recommandations IA personnalisées, pas de la publicité.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: <Users size={15} />, t: 'Profils qualifiés', d: 'Teint, sous-ton, type de peau, préoccupations.' },
                  { icon: <Wand2 size={15} />, t: 'Recommandations IA', d: 'Vos produits intégrés au moteur de conseil.' },
                  { icon: <BarChart3 size={15} />, t: 'Insights anonymisés', d: 'Tendances et comportements exclusifs (à venir).' },
                ].map(item => (
                  <div key={item.t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(184,147,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8934A', flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 1 }}>{item.t}</div>
                      <div style={{ fontSize: 12, color: '#AAA' }}>{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1.5px solid rgba(184,147,74,0.3)', boxShadow: '0 8px 40px rgba(184,147,74,0.08)' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Devenir partenaire</h3>
              <p style={{ fontSize: 13, color: '#AAA', marginBottom: 20 }}>Réponse sous 48h.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { p: 'Nom de votre marque', k: 'nomMarque' },
                  { p: 'Email professionnel', k: 'email', type: 'email' },
                ].map(({ p, k, type }) => (
                  <input
                    key={k}
                    type={type || 'text'}
                    placeholder={p}
                    style={{ padding: '13px 16px', border: '1.5px solid #E8DDD5', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, outline: 'none', transition: 'border-color 0.15s' }}
                    onFocus={e => (e.target.style.borderColor = '#B8934A')}
                    onBlur={e => (e.target.style.borderColor = '#E8DDD5')}
                  />
                ))}
                <textarea
                  placeholder="Votre message…"
                  rows={3}
                  style={{ padding: '13px 16px', border: '1.5px solid #E8DDD5', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, outline: 'none', resize: 'vertical', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.target.style.borderColor = '#B8934A')}
                  onBlur={e => (e.target.style.borderColor = '#E8DDD5')}
                />
                <a
                  href="mailto:contact@nylva.fr?subject=Demande partenariat NYLVA"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 10, background: '#B8934A', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
                >
                  <Mail size={15} /> Envoyer la demande
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ADVISOR MODAL (mobile) */}
      {advisorOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,10,5,0.6)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0', animation: 'fadeIn 0.2s ease' }}
          onClick={() => setAdvisorOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FBF7F4', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', padding: '24px', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700 }}>Conseiller NYLVA</h3>
              <button onClick={() => setAdvisorOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BBB' }}><X size={20} /></button>
            </div>
            {!profile ? (
              <ProfilerWizard onComplete={(p) => { handleProfileComplete(p); setAdvisorOpen(false); }} />
            ) : recommendations ? (
              <RecommendationsPanel recs={recommendations} profile={profile} onReset={handleReset} />
            ) : null}
          </div>
        </div>
      )}

      {/* BRAND MODAL */}
      {selectedBrand && <BrandModal brand={selectedBrand} onClose={() => setSelectedBrand(null)} />}

      {/* FAB */}
      {!recommendations && (
        <button className="advisor-fab" onClick={() => setAdvisorOpen(true)}>
          <Wand2 size={16} />
          Trouver mes produits
        </button>
      )}
    </>
  );
}
