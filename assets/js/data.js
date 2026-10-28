/* Données de la maquette D3CO.
   Tout vient du site actuel (d3co.ch), sauf ce qui est marqué « aCompleter ».
   Noms des coloris : descriptifs, à confirmer par D3CO. */
import { FORMES } from './formes.js?v=20261028-2';

export const SITE = {
  tel: '+41 78 668 89 77',
  telLien: '+41786688977',
  email: 'info@d3co.ch',
  rue: 'Florastrasse 16',
  ville: '2502 Biel/Bienne',
  instagram: 'https://www.instagram.com/d3co.ch',
  instagramNom: '@d3co.ch',
  cgv: 'https://www.d3co.ch/terms-conditions',
  livraison: { frais: 5, seuil: 100, min: 2, max: 5 },
  garantieMois: 6,
};

const IMG = 'assets/img/produits/';

/* tailles telles qu'annoncées sur les fiches actuelles (cm) */
const T_CACHEPOT = (ext = [null, null, null], h = [null, null, null]) => [
  { id: 's', int: 11.3, ext: ext[0], h: h[0] },
  { id: 'm', int: 15.3, ext: ext[1], h: h[1] },
  { id: 'l', int: 19.3, ext: ext[2], h: h[2] },
];

const couleurs = (cle) => (FORMES[cle]?.couleurs || []).map((c) => ({
  ...c,
  img: (s) => `${IMG}${cle}/${cle}-${c.slug}-${s}.webp`,
}));

export const PRODUITS = [
  {
    slug: 'linea',
    nom: 'Linea',
    cat: 'vases',
    forme: 'linea',
    conseil: 'vase',
    finitions: [
      {
        id: 'unis', prix: 19.9, des: true, couleurs: couleurs('linea'),
        tailles: [{ id: 'u', ext: 18.2, h: 25 }],
        noteTailles: true,
      },
      {
        id: 'bicolores', prix: 24.9, des: true, couleurs: couleurs('linea-bicolore'),
        tailles: [{ id: 'u', ext: 18.2, h: 25 }],
      },
    ],
  },
  {
    slug: 'flow',
    nom: 'Flow',
    cat: 'vases',
    forme: 'flow',
    conseil: 'vase',
    finitions: [
      {
        id: 'unis', prix: 19.9, des: true, couleurs: couleurs('flow'),
        tailles: [
          { id: 's', ext: 11.2, h: 15 },
          { id: 'm', ext: 14.8, h: 20 },
          { id: 'l', ext: 18.5, h: 25 },
        ],
      },
      {
        id: 'bicolores', prix: 24.9, des: true, couleurs: couleurs('flow-bicolore'),
        tailles: [{ id: 'u', ext: 18.2, h: 25 }],
      },
    ],
  },
  {
    slug: 'twist',
    nom: 'Twist',
    cat: 'cache-pots',
    forme: 'twist',
    conseil: 'cachepot',
    finitions: [{ id: 'unis', prix: 24.9, des: true, couleurs: couleurs('twist'), tailles: T_CACHEPOT() }],
  },
  {
    slug: 'paper',
    nom: 'Paper',
    cat: 'cache-pots',
    forme: 'paper',
    conseil: 'cachepot',
    finitions: [{
      id: 'unis', prix: 29.9, des: true, couleurs: couleurs('paper'),
      tailles: T_CACHEPOT([16.6, 20.6, 25.5], [12.3, 15.9, 19.8]),
    }],
  },
  {
    slug: 'concrete',
    nom: 'Concrete',
    cat: 'cache-pots',
    forme: 'concrete',
    conseil: 'cachepot',
    finitions: [{ id: 'unis', prix: 26.9, des: true, couleurs: couleurs('concrete'), tailles: T_CACHEPOT([14, 17.8, 21.8]) }],
  },
  {
    slug: 'dia',
    nom: 'Dia',
    cat: 'bac',
    forme: 'dia',
    conseil: 'bac',
    finitions: [{ id: 'unis', prix: 39.9, des: false, couleurs: couleurs('dia'), tailles: [{ id: 'u', ext: 25.5, h: 11.5 }] }],
  },
  {
    slug: 'solo',
    nom: 'Solo',
    cat: 'cache-pots',
    forme: null,
    conseil: 'cachepot',
    aCompleter: true,
    finitions: [{ id: 'unis', prix: 24.9, des: true, couleurs: [], tailles: [] }],
  },
  {
    slug: 'fluffy',
    nom: 'Fluffy',
    cat: 'cache-pots',
    forme: null,
    conseil: 'cachepot',
    aCompleter: true,
    finitions: [{ id: 'unis', prix: 29.9, des: true, couleurs: [], tailles: [] }],
  },
];

export const HEROS = {
  img: (s) => `assets/img/accueil/heros-linea-${s}.webp`,
  ratio: 0.7014,
};

/* module saisonnier : à changer ici, rien d'autre à toucher */
export const SAISON = {
  cle: 'automne',
  articles: [
    { slug: 'twist', couleur: 'brun' },
    { slug: 'linea', couleur: 'vert-olive' },
    { slug: 'paper', couleur: 'orange' },
    { slug: 'dia', couleur: 'sable-rose' },
  ],
};

export const produit = (slug) => PRODUITS.find((p) => p.slug === slug);
export const formeDe = (p) => (p && p.forme ? FORMES[p.forme].forme : null);
export const toutesCouleurs = (p) => p.finitions.flatMap((f) => f.couleurs.map((c) => ({ ...c, finition: f.id })));
export const prixMin = (p) => Math.min(...p.finitions.map((f) => f.prix));
export const nbCouleurs = (p) => p.finitions.reduce((n, f) => n + f.couleurs.length, 0);
export const finition = (p, id) => p.finitions.find((f) => f.id === id) || p.finitions[0];
export const couleur = (p, slugCouleur, finId) => {
  const fins = finId ? [finition(p, finId)] : p.finitions;
  for (const f of fins) {
    const c = f.couleurs.find((x) => x.slug === slugCouleur);
    if (c) return { c, f };
  }
  const f = fins[0];
  return { c: f.couleurs[0], f };
};

export const CHF = (n) => new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' CHF';
export const cm = (n) => (n == null ? null : String(n).replace('.', ','));
