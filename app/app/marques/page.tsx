'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ExternalLink, Mail, Star, Award, Users, BarChart3, Sparkles, ChevronRight } from 'lucide-react';

// ─── DATA ────────────────────────────────────────────────────────────────────

type Segment = 'Grand public' | 'Prestige' | 'Luxe';
type Produit = 'fond de teint' | 'rouge à lèvres' | 'mascara' | 'skincare' | 'palette' | 'blush' | 'highlighter';

interface Brand {
  id: string;
  name: string;
  segment: Segment;
  gammes: string[];
  instagram: string;
  youtube?: string;
  nbTeintes: number;
  inclusivite: number; // /5
  accentColor: string;
  produits: Produit[];
  description: string;
}

interface Creator {
  id: string;
  name: string;
  pseudo: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  specialite: string;
  abonnes: string;
  initiales: string;
  color: string;
}

const BRANDS: Brand[] = [
  {
    id: 'loreal',
    name: "L'Oréal Paris",
    segment: 'Grand public',
    gammes: ['Infaillible', 'True Match', 'Elvive'],
    instagram: 'https://instagram.com/lorealparis',
    youtube: 'https://youtube.com/@LOrealParis',
    nbTeintes: 40,
    inclusivite: 4,
    accentColor: '#D4A017',
    produits: ['fond de teint', 'rouge à lèvres', 'mascara'],
    description: "Marque leader du mass market beauté avec une gamme étendue adaptée à toutes les carnations.",
  },
  {
    id: 'maybelline',
    name: 'Maybelline',
    segment: 'Grand public',
    gammes: ['Fit Me', 'SuperStay', 'Sky High'],
    instagram: 'https://instagram.com/maybelline',
    youtube: 'https://youtube.com/@Maybelline',
    nbTeintes: 40,
    inclusivite: 4,
    accentColor: '#E8272A',
    produits: ['fond de teint', 'mascara', 'rouge à lèvres'],
    description: "Incontournable du maquillage accessible avec des innovations régulières et des teintes inclusives.",
  },
  {
    id: 'nyx',
    name: 'NYX Professional',
    segment: 'Grand public',
    gammes: ['Soft Matte Lip', 'Can\'t Stop Won\'t Stop', 'Epic Ink'],
    instagram: 'https://instagram.com/nyxcosmetics_france',
    youtube: 'https://youtube.com/@NYXCosmetics',
    nbTeintes: 35,
    inclusivite: 4,
    accentColor: '#8B2FC9',
    produits: ['rouge à lèvres', 'palette', 'fond de teint'],
    description: "La marque pro-inspired accessible, favoris des makeup artists et amateurs confirmés.",
  },
  {
    id: 'lancome',
    name: 'Lancôme',
    segment: 'Prestige',
    gammes: ['Teint Idole', 'Hypnôse', 'L\'Absolue'],
    instagram: 'https://instagram.com/lancomeofficial',
    youtube: 'https://youtube.com/@Lancome',
    nbTeintes: 40,
    inclusivite: 4,
    accentColor: '#C8A2C8',
    produits: ['fond de teint', 'mascara', 'rouge à lèvres', 'skincare'],
    description: "Maison de prestige française alliant élégance parisienne et innovation dermatologique.",
  },
  {
    id: 'dior',
    name: 'Dior Beauty',
    segment: 'Luxe',
    gammes: ['Forever', 'Rouge Dior', 'Backstage'],
    instagram: 'https://instagram.com/diorbeauty',
    youtube: 'https://youtube.com/@DiorBeauty',
    nbTeintes: 35,
    inclusivite: 3,
    accentColor: '#1A1A2E',
    produits: ['fond de teint', 'rouge à lèvres', 'palette'],
    description: "L'excellence couture appliquée au maquillage. Glamour intemporel et formules d'exception.",
  },
  {
    id: 'chanel',
    name: 'Chanel Beauty',
    segment: 'Luxe',
    gammes: ['Les Beiges', 'Rouge Allure', 'Le Lift'],
    instagram: 'https://instagram.com/chanelbeauty',
    youtube: 'https://youtube.com/@Chanel',
    nbTeintes: 28,
    inclusivite: 3,
    accentColor: '#2C2C2C',
    produits: ['fond de teint', 'rouge à lèvres', 'skincare'],
    description: "L'icône intemporelle du luxe beauté. Formules uniques et packaging signature noir et blanc.",
  },
  {
    id: 'nars',
    name: 'NARS Cosmetics',
    segment: 'Prestige',
    gammes: ['Sheer Glow', 'Natural Radiant', 'Afterglow'],
    instagram: 'https://instagram.com/narsissist',
    youtube: 'https://youtube.com/@NARSCosmetics',
    nbTeintes: 45,
    inclusivite: 4,
    accentColor: '#E8C4B8',
    produits: ['fond de teint', 'blush', 'highlighter'],
    description: "La référence du glow naturel. Connu pour ses teintes audacieuses et son légendaire blush Orgasm.",
  },
  {
    id: 'mac',
    name: 'MAC Cosmetics',
    segment: 'Prestige',
    gammes: ['Studio Fix', 'Lipstick', 'Pro Longwear'],
    instagram: 'https://instagram.com/maccosmetics',
    youtube: 'https://youtube.com/@MACCosmetics',
    nbTeintes: 50,
    inclusivite: 5,
    accentColor: '#2D2D2D',
    produits: ['fond de teint', 'rouge à lèvres', 'palette'],
    description: "La marque pro par excellence. Palette chromatique sans égale, plébiscitée par les professionnels.",
  },
  {
    id: 'urbandecay',
    name: 'Urban Decay',
    segment: 'Prestige',
    gammes: ['Naked', 'All Nighter', 'Hydromaniac'],
    instagram: 'https://instagram.com/urbandecaycosmetics',
    youtube: 'https://youtube.com/@UrbanDecay',
    nbTeintes: 30,
    inclusivite: 3,
    accentColor: '#6B3FA0',
    produits: ['palette', 'fond de teint', 'rouge à lèvres'],
    description: "La marque rebelle du make-up prestige. Les palettes Naked ont révolutionné les yeux smoky.",
  },
  {
    id: 'charlottetilbury',
    name: 'Charlotte Tilbury',
    segment: 'Prestige',
    gammes: ['Flawless Filter', 'Matte Revolution', 'Hollywood'],
    instagram: 'https://instagram.com/ctilbury',
    youtube: 'https://youtube.com/@CharlotteTilbury',
    nbTeintes: 30,
    inclusivite: 3,
    accentColor: '#C4758A',
    produits: ['fond de teint', 'rouge à lèvres', 'highlighter'],
    description: "Le make-up glamour old Hollywood revisité. Flawless Filter est devenu viral worldwide.",
  },
  {
    id: 'fenty',
    name: 'Fenty Beauty',
    segment: 'Prestige',
    gammes: ['Pro Filt\'r', 'Gloss Bomb', 'Cheeks Out'],
    instagram: 'https://instagram.com/fentybeauty',
    youtube: 'https://youtube.com/@FentyBeauty',
    nbTeintes: 50,
    inclusivite: 5,
    accentColor: '#D4A574',
    produits: ['fond de teint', 'highlighter', 'blush'],
    description: "La révolution inclusivité signée Rihanna. 50 teintes de fond de teint, référence absolue en diversité.",
  },
  {
    id: 'toofaced',
    name: 'Too Faced',
    segment: 'Prestige',
    gammes: ['Born This Way', 'Better Than Sex', 'Hangover'],
    instagram: 'https://instagram.com/toofaced',
    youtube: 'https://youtube.com/@TooFaced',
    nbTeintes: 35,
    inclusivite: 3,
    accentColor: '#F4A7B9',
    produits: ['fond de teint', 'mascara', 'palette'],
    description: "La marque fun et girly du prestige. Born This Way est l'un des fonds de teint les plus aimés.",
  },
  {
    id: 'rarebeauty',
    name: 'Rare Beauty',
    segment: 'Prestige',
    gammes: ['Soft Pinch', 'Liquid Touch', 'Perfect Strokes'],
    instagram: 'https://instagram.com/rarebeauty',
    youtube: 'https://youtube.com/@RareBeauty',
    nbTeintes: 48,
    inclusivite: 5,
    accentColor: '#C19A6B',
    produits: ['blush', 'fond de teint', 'rouge à lèvres'],
    description: "Marque de Selena Gomez centrée sur le bien-être mental. Le blush Soft Pinch est culte.",
  },
  {
    id: 'elf',
    name: 'e.l.f. Cosmetics',
    segment: 'Grand public',
    gammes: ['Halo Glow', 'Putty Primer', 'Suntouchable'],
    instagram: 'https://instagram.com/elfcosmetics',
    youtube: 'https://youtube.com/@elfcosmetics',
    nbTeintes: 25,
    inclusivite: 3,
    accentColor: '#00B4D8',
    produits: ['fond de teint', 'highlighter', 'mascara'],
    description: "La dupe friendly et accessiblee. Formules comparables aux prestige à des prix mini.",
  },
  {
    id: 'benefit',
    name: 'Benefit',
    segment: 'Prestige',
    gammes: ['Hoola', 'Gimme Brow', 'They\'re Real'],
    instagram: 'https://instagram.com/benefitcosmetics',
    youtube: 'https://youtube.com/@BenefitCosmetics',
    nbTeintes: 20,
    inclusivite: 3,
    accentColor: '#E91E8C',
    produits: ['blush', 'mascara', 'highlighter'],
    description: "La marque rétro et fun spécialiste des sourcils et du blush. Packaging collector.",
  },
  {
    id: 'ysl',
    name: 'YSL Beauté',
    segment: 'Luxe',
    gammes: ['Touche Éclat', 'Rouge Pur Couture', 'Libre'],
    instagram: 'https://instagram.com/yslbeauty',
    youtube: 'https://youtube.com/@YSLBeauty',
    nbTeintes: 25,
    inclusivite: 3,
    accentColor: '#C9A96E',
    produits: ['fond de teint', 'rouge à lèvres', 'skincare'],
    description: "L'audace couture dans un flacon. Le Touche Éclat reste l'un des produits beauté les plus vendus au monde.",
  },
  {
    id: 'givenchy',
    name: 'Givenchy Beauty',
    segment: 'Luxe',
    gammes: ['Prisme Libre', 'Le Rouge', 'Skin Perfecto'],
    instagram: 'https://instagram.com/givenchybeauty',
    youtube: 'https://youtube.com/@Givenchy',
    nbTeintes: 22,
    inclusivite: 2,
    accentColor: '#1C1C1C',
    produits: ['fond de teint', 'rouge à lèvres', 'blush'],
    description: "Le luxe parisien dans sa forme la plus épurée. Prisme Libre est la poudre libre signature.",
  },
  {
    id: 'clarins',
    name: 'Clarins',
    segment: 'Prestige',
    gammes: ['Everlasting', 'SOS Primer', 'Joli Rouge'],
    instagram: 'https://instagram.com/clarins',
    youtube: 'https://youtube.com/@Clarins',
    nbTeintes: 18,
    inclusivite: 2,
    accentColor: '#7C9A6F',
    produits: ['fond de teint', 'rouge à lèvres', 'skincare'],
    description: "Maison française prestige alliant botanique et maquillage. Expertise skincare reconnue.",
  },
  {
    id: 'embryolisse',
    name: 'Embryolisse',
    segment: 'Grand public',
    gammes: ['Lait-Crème Concentré', 'Hydra-Matte', 'Artist Secret'],
    instagram: 'https://instagram.com/embryolisse',
    youtube: 'https://youtube.com/@Embryolisse',
    nbTeintes: 5,
    inclusivite: 2,
    accentColor: '#B8D4E8',
    produits: ['skincare'],
    description: "Le secret de beauté des pros de la mode. Le Lait-Crème Concentré est une icône backstage.",
  },
  {
    id: 'larochposay',
    name: 'La Roche-Posay',
    segment: 'Grand public',
    gammes: ['Toleriane', 'Anthelios', 'Effaclar'],
    instagram: 'https://instagram.com/larocheposayfr',
    youtube: 'https://youtube.com/@LaRochePosay',
    nbTeintes: 10,
    inclusivite: 2,
    accentColor: '#4A90C4',
    produits: ['skincare', 'fond de teint'],
    description: "La référence dermatologique pour peaux sensibles. Anthelios est le SPF n°1 recommandé par les dermos.",
  },
];

const CREATORS: Creator[] = [
  {
    id: 'enjoyphoenix',
    name: 'Marie Lopez',
    pseudo: 'EnjoyPhoenix',
    youtube: 'https://youtube.com/@EnjoyPhoenix',
    instagram: 'https://instagram.com/enjoyphoenix',
    specialite: 'Maquillage & lifestyle',
    abonnes: '5M+ YouTube',
    initiales: 'EP',
    color: '#F4A261',
  },
  {
    id: 'sananas',
    name: 'Sananas',
    pseudo: 'Sananas',
    youtube: 'https://youtube.com/@Sananas2106',
    instagram: 'https://instagram.com/sananas2106',
    specialite: 'Beauté & mode',
    abonnes: '3M+ YouTube',
    initiales: 'SA',
    color: '#C4758A',
  },
  {
    id: 'lena',
    name: 'Léna Mahfouf',
    pseudo: 'Lena Situations',
    youtube: 'https://youtube.com/@LenaSituations',
    instagram: 'https://instagram.com/lenasituations',
    specialite: 'Lifestyle & beauté',
    abonnes: '4M+',
    initiales: 'LS',
    color: '#B8934A',
  },
  {
    id: 'jenesuispasjolie',
    name: 'Jenesuispasjolie',
    pseudo: 'jenesuispasjolie',
    instagram: 'https://instagram.com/jenesuispasjolie',
    specialite: 'Artiste maquillage',
    abonnes: '700K+ Instagram',
    initiales: 'JS',
    color: '#6B3FA0',
  },
  {
    id: 'mathilde',
    name: 'Mathilde Lacombe',
    pseudo: 'mathildelacombe',
    instagram: 'https://instagram.com/mathildelacombe',
    specialite: 'Skincare & fondatrice Aime',
    abonnes: '300K+ Instagram',
    initiales: 'ML',
    color: '#7C9A6F',
  },
  {
    id: 'rania',
    name: 'Rania Beauty',
    pseudo: 'RaniaBeauty',
    youtube: 'https://youtube.com/@RaniaBeauty',
    tiktok: 'https://tiktok.com/@raniabeauty',
    specialite: 'Tutoriels maquillage',
    abonnes: '1M+ YouTube',
    initiales: 'RB',
    color: '#E8272A',
  },
  {
    id: 'angelina',
    name: 'Angelina Beauty',
    pseudo: 'angelinabeauty',
    tiktok: 'https://tiktok.com/@angelinabeauty',
    instagram: 'https://instagram.com/angelinabeauty',
    specialite: 'Gen Z & tendances',
    abonnes: '2M+ TikTok',
    initiales: 'AB',
    color: '#00B4D8',
  },
  {
    id: 'patricia',
    name: 'Patricia Loison',
    pseudo: 'patricialoisonjournaliste',
    instagram: 'https://instagram.com/patricialoisonjournaliste',
    specialite: 'Journaliste beauté',
    abonnes: '150K+ Instagram',
    initiales: 'PL',
    color: '#8B6914',
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const InclusiviteBadge = ({ score }: { score: number }) => {
  if (score === 5) return <span style={{ color: '#B8934A', fontWeight: 700, fontSize: 13 }}>🏆 Icône inclusive</span>;
  if (score === 4) return <span style={{ color: '#7C9A6F', fontWeight: 600, fontSize: 13 }}>⭐ Très inclusive</span>;
  if (score === 3) return <span style={{ color: '#C4758A', fontWeight: 500, fontSize: 13 }}>✓ Inclusive</span>;
  return <span style={{ color: '#999', fontSize: 13 }}>En progrès</span>;
};

const SegmentBadge = ({ segment }: { segment: Segment }) => {
  const config = {
    'Grand public': { bg: '#F0F4F0', color: '#4A7C59', label: 'Grand public' },
    Prestige: { bg: '#FFF0F3', color: '#C4758A', label: 'Prestige' },
    Luxe: { bg: '#FBF5E6', color: '#B8934A', label: 'Luxe' },
  }[segment];
  return (
    <span style={{
      background: config.bg, color: config.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {config.label}
    </span>
  );
};

// ─── BRAND MODAL ──────────────────────────────────────────────────────────────

function BrandModal({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(30,20,15,0.55)',
        backdropFilter: 'blur(6px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FBF7F4', borderRadius: 20,
          padding: '40px', maxWidth: 520, width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.25s cubic-bezier(.16,1,.3,1)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: '#999', lineHeight: 1,
          }}
        >×</button>

        <div style={{
          width: 56, height: 4, background: brand.accentColor,
          borderRadius: 2, marginBottom: 20,
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, fontWeight: 700, margin: 0, color: '#1A1A1A' }}>
            {brand.name}
          </h2>
          <SegmentBadge segment={brand.segment} />
        </div>

        <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>{brand.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #F0EAE4' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: 4 }}>Teintes</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: brand.accentColor }}>{brand.nbTeintes}</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #F0EAE4' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: 4 }}>Inclusivité</div>
            <InclusiviteBadge score={brand.inclusivite} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: 8 }}>Gammes phares</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {brand.gammes.map(g => (
              <span key={g} style={{
                background: 'white', border: `1px solid ${brand.accentColor}40`,
                color: '#444', padding: '5px 12px', borderRadius: 20, fontSize: 13,
              }}>{g}</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <a href={brand.instagram} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 10,
              background: brand.accentColor, color: 'white',
              textDecoration: 'none', fontSize: 13, fontWeight: 600,
            }}>
            <ExternalLink size={14} /> Instagram
          </a>
          {brand.youtube && (
            <a href={brand.youtube} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 10,
                background: 'white', border: '1px solid #E8DDD5',
                color: '#444', textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}>
              <ExternalLink size={14} /> YouTube
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
  const [inclusiviteMin, setInclusiviteMin] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ nomMarque: '', email: '', message: '' });
  const heroRef = useRef<HTMLDivElement>(null);

  const filtered = BRANDS.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchSegment = segment === 'Tous' || b.segment === segment;
    const matchInclusivite = b.inclusivite >= inclusiviteMin;
    return matchSearch && matchSegment && matchInclusivite;
  });

  const handlePartnerSubmit = () => {
    const subject = encodeURIComponent(`Demande partenariat NYLVA — ${formData.nomMarque}`);
    const body = encodeURIComponent(`Marque : ${formData.nomMarque}\nEmail : ${formData.email}\n\n${formData.message}`);
    window.open(`mailto:contact@nylva.fr?subject=${subject}&body=${body}`);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--bg, #FBF7F4);
          font-family: 'DM Sans', sans-serif;
          color: #1A1A1A;
          -webkit-font-smoothing: antialiased;
        }

        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(32px) }
          to { opacity: 1; transform: translateY(0) }
        }

        .brand-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s ease;
          border: 1px solid #F0EAE4;
          animation: revealUp 0.4s ease both;
          position: relative;
          overflow: hidden;
        }
        .brand-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.1);
        }
        .brand-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--card-accent, #C4758A);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .brand-card:hover::before { opacity: 1; }

        .creator-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #F0EAE4;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: revealUp 0.4s ease both;
        }
        .creator-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.08);
        }

        .filter-btn {
          padding: 8px 18px;
          border-radius: 20px;
          border: 1.5px solid transparent;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
          background: white;
          color: #666;
          border-color: #E8DDD5;
        }
        .filter-btn:hover { border-color: var(--accent, #C4758A); color: var(--accent, #C4758A); }
        .filter-btn.active {
          background: var(--accent, #C4758A);
          color: white;
          border-color: var(--accent, #C4758A);
        }

        .partner-input {
          width: 100%;
          padding: 14px 18px;
          border: 1.5px solid #E8DDD5;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          background: white;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.15s;
        }
        .partner-input:focus { border-color: var(--gold, #B8934A); }
        .partner-input::placeholder { color: #BBB; }

        .nylva-search {
          width: 100%;
          padding: 14px 18px 14px 48px;
          border: 1.5px solid #E8DDD5;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          background: white;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .nylva-search:focus {
          border-color: var(--accent, #C4758A);
          box-shadow: 0 0 0 3px rgba(196,117,138,0.1);
        }

        .partner-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: var(--gold, #B8934A);
          color: white;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .partner-btn:hover {
          background: #A07D3A;
          transform: translateY(-1px);
        }

        .nylva-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      `}</style>

      <div style={{ background: 'var(--bg, #FBF7F4)', minHeight: '100vh' }}>

        {/* ── HERO ── */}
        <section ref={heroRef} style={{
          padding: '80px 24px 64px',
          textAlign: 'center',
          borderBottom: '1px solid #F0EAE4',
          background: 'linear-gradient(180deg, #FFFAF7 0%, #FBF7F4 100%)',
        }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(184,147,74,0.1)', marginBottom: 24,
            }}>
              <Sparkles size={13} style={{ color: 'var(--gold, #B8934A)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold, #B8934A)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Catalogue Beauté
              </span>
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(36px, 6vw, 56px)',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 20,
              color: '#1A1A1A',
            }}>
              Marques & <em style={{ color: 'var(--accent, #C4758A)', fontStyle: 'italic' }}>Créateurs</em>
            </h1>
            <p style={{
              fontSize: 17, color: '#777', lineHeight: 1.7,
              fontWeight: 300, maxWidth: 520, margin: '0 auto',
            }}>
              Explorez les marques recommandées par NYLVA et les créatrices qui inspirent la communauté. Trouvez les produits qui correspondent réellement à votre teinte.
            </p>
          </div>
        </section>

        {/* ── CATALOGUE MARQUES ── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 32, fontWeight: 700, color: '#1A1A1A',
              }}>
                Marques beauté
              </h2>
              <p style={{ color: '#999', fontSize: 14, marginTop: 4 }}>{filtered.length} marques · {BRANDS.length} au total</p>
            </div>
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 220 }}>
              <Search size={17} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#BBB' }} />
              <input
                className="nylva-search"
                placeholder="Rechercher une marque…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['Tous', 'Grand public', 'Prestige', 'Luxe'] as const).map(s => (
                <button
                  key={s}
                  className={`filter-btn ${segment === s ? 'active' : ''}`}
                  onClick={() => setSegment(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center' }}>Inclusivité min :</span>
              {[0, 3, 4, 5].map(v => (
                <button
                  key={v}
                  className={`filter-btn ${inclusiviteMin === v ? 'active' : ''}`}
                  onClick={() => setInclusiviteMin(v)}
                  style={{ '--accent': '#B8934A' } as React.CSSProperties}
                >
                  {v === 0 ? 'Toutes' : v === 5 ? '🏆' : '⭐'.repeat(v - 2)}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {filtered.map((brand, i) => (
              <div
                key={brand.id}
                className="brand-card"
                style={{ '--card-accent': brand.accentColor, animationDelay: `${i * 0.04}s` } as React.CSSProperties}
                onClick={() => setSelectedBrand(brand)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${brand.accentColor}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: brand.accentColor }}>
                      {brand.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <SegmentBadge segment={brand.segment} />
                    {/* Badge Partenaire NYLVA — vide pour l'instant */}
                  </div>
                </div>

                <h3 style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#1A1A1A',
                }}>{brand.name}</h3>

                <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {brand.description}
                </p>

                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#777', marginBottom: 14 }}>
                  <span><strong style={{ color: brand.accentColor }}>{brand.nbTeintes}</strong> teintes</span>
                  <span>·</span>
                  <InclusiviteBadge score={brand.inclusivite} />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {brand.gammes.slice(0, 2).map(g => (
                    <span key={g} style={{
                      background: '#F8F3EF', color: '#888',
                      padding: '4px 10px', borderRadius: 20, fontSize: 11,
                    }}>{g}</span>
                  ))}
                  {brand.gammes.length > 2 && (
                    <span style={{ color: '#BBB', fontSize: 11, padding: '4px 0' }}>+{brand.gammes.length - 2}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, color: brand.accentColor, fontSize: 12, fontWeight: 600 }}>
                  Voir la fiche <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E8DDD5 30%, #E8DDD5 70%, transparent)', maxWidth: 1200, margin: '0 auto 64px', }} />

        {/* ── CRÉATEURS ── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ marginBottom: 40 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(196,117,138,0.1)', marginBottom: 12,
            }}>
              <Star size={11} style={{ color: 'var(--accent, #C4758A)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent, #C4758A)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Communauté
              </span>
            </span>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 32, fontWeight: 700,
            }}>Créatrices & Créateurs beauté</h2>
            <p style={{ color: '#999', fontSize: 14, marginTop: 6 }}>Les voix qui inspirent la communauté NYLVA</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {CREATORS.map((c, i) => (
              <div key={c.id} className="creator-card" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Avatar */}
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: `${c.color}20`,
                  border: `2px solid ${c.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: c.color, fontFamily: 'Cormorant Garamond, serif' }}>
                    {c.initiales}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#1A1A1A' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: c.color, fontWeight: 500 }}>@{c.pseudo}</div>
                    </div>
                    <span style={{
                      background: `${c.color}15`, color: c.color,
                      padding: '3px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {c.abonnes}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{c.specialite}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {c.instagram && (
                      <a href={c.instagram} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#BBB', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = c.color)}
                        onMouseLeave={e => (e.currentTarget.style.color = '#BBB')}>
                        <Instagram size={15} />
                      </a>
                    )}
                    {c.youtube && (
                      <a href={c.youtube} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#BBB', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = c.color)}
                        onMouseLeave={e => (e.currentTarget.style.color = '#BBB')}>
                        <Youtube size={15} />
                      </a>
                    )}
                    {c.tiktok && (
                      <a href={c.tiktok} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#BBB', transition: 'color 0.15s', fontWeight: 700, fontSize: 12 }}
                        onMouseEnter={e => (e.currentTarget.style.color = c.color)}
                        onMouseLeave={e => (e.currentTarget.style.color = '#BBB')}>
                        TK
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA PARTENARIAT ── */}
        <section style={{
          background: 'linear-gradient(135deg, #FBF5E6 0%, #FBF7F4 60%, #FFF0F3 100%)',
          borderTop: '1px solid #F0EAE4',
          padding: '80px 24px',
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>

              {/* Left — pitch */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 2, background: 'var(--gold, #B8934A)', borderRadius: 1 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold, #B8934A)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Partenariat
                  </span>
                </div>
                <h2 style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  fontWeight: 700, lineHeight: 1.15, marginBottom: 20,
                }}>
                  Votre marque<br />
                  <em style={{ color: 'var(--accent, #C4758A)', fontStyle: 'italic' }}>sur NYLVA</em>
                </h2>
                <p style={{ color: '#777', fontSize: 15, lineHeight: 1.7, marginBottom: 32, fontWeight: 300 }}>
                  NYLVA connecte vos produits aux utilisatrices dont le profil de teint et les sous-tons correspondent réellement à votre gamme. Pas de l'audience. Des conversations.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { icon: <Users size={16} />, title: 'Profils qualifiés', desc: 'Teint, sous-tons, type de peau — chaque utilisatrice a un profil précis.' },
                    { icon: <Sparkles size={16} />, title: 'Recommandations IA', desc: 'Vos produits recommandés naturellement, au bon moment, à la bonne personne.' },
                    { icon: <BarChart3 size={16} />, title: 'Insights anonymisés', desc: 'Tendances, préférences, comportements — données exclusives (à venir).' },
                    { icon: <Award size={16} />, title: 'Placement natif', desc: 'Intégration non intrusive, cohérente avec l\'expérience utilisatrice.' },
                  ].map(item => (
                    <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(184,147,74,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--gold, #B8934A)', flexShrink: 0,
                      }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — formulaire */}
              <div style={{
                background: 'white',
                borderRadius: 20,
                padding: '36px',
                border: '1.5px solid',
                borderColor: 'rgba(184,147,74,0.3)',
                boxShadow: '0 8px 40px rgba(184,147,74,0.08)',
              }}>
                <h3 style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 22, fontWeight: 700, marginBottom: 8,
                }}>Devenir partenaire</h3>
                <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>
                  On vous répond sous 48h.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    className="partner-input"
                    placeholder="Nom de votre marque"
                    value={formData.nomMarque}
                    onChange={e => setFormData(f => ({ ...f, nomMarque: e.target.value }))}
                  />
                  <input
                    className="partner-input"
                    type="email"
                    placeholder="Email professionnel"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  />
                  <textarea
                    className="partner-input"
                    placeholder="Votre message (gammes concernées, objectifs…)"
                    rows={4}
                    value={formData.message}
                    onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                  <button className="partner-btn" onClick={handlePartnerSubmit} style={{ width: '100%', justifyContent: 'center' }}>
                    <Mail size={16} />
                    Envoyer la demande
                  </button>
                </div>

                <p style={{ fontSize: 12, color: '#CCC', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
                  Ou directement par email :{' '}
                  <a href="mailto:contact@nylva.fr" style={{ color: 'var(--gold, #B8934A)', textDecoration: 'none' }}>
                    contact@nylva.fr
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Modal */}
      {selectedBrand && (
        <BrandModal brand={selectedBrand} onClose={() => setSelectedBrand(null)} />
      )}
    </>
  );
}
