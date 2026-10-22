/* Briques réutilisées par l'accueil, la boutique et la fiche produit. */
import { t, prix, cm, nomCouleur, stock, ajouterAuPanier } from './core.js';
import { formeDe, prixMin, nbCouleurs, toutesCouleurs, finition } from './data.js';

const BICOLORES = ['violet-bronze', 'turquoise', 'cuivre', 'bleu-magenta', 'rouge-noir', 'rouge-violet'];
export const estBicolore = (c) => BICOLORES.includes(c.slug);
export const fondNuance = (c) => (estBicolore(c) ? `linear-gradient(135deg, ${c.t1} 0 45%, ${c.t2} 55% 100%)` : c.hex);

/* mémorise le choix de coloris avant d'ouvrir une fiche (le hash ne porte que le modèle) */
export function memoriserChoix(slug, couleur, fin) {
  stock.set('d3co-choix', { slug, couleur, fin, quand: Date.now() });
}
export function lireChoix(slug) {
  const c = stock.get('d3co-choix', null);
  if (!c || c.slug !== slug || Date.now() - c.quand > 10 * 60 * 1000) return null;
  return c;
}

export function lienProduit(slug) { return `produit.html#${slug}`; }

export const prixDes = (p) => {
  const f = p.finitions[0];
  const min = prixMin(p);
  return (p.finitions.length > 1 || f.des) ? `${t('des')} ${prix(min)}` : prix(min);
};

export function resumeTailles(p) {
  const f = p.finitions[0];
  if (!f.tailles.length) return t('aCompleter');
  if (f.tailles.length === 1) {
    const tl = f.tailles[0];
    return [tl.ext && `Ø ${cm(tl.ext)}`, tl.h && `H ${cm(tl.h)}`].filter(Boolean).join(' × ') + ' cm';
  }
  if (f.tailles[0].int) return `Ø int. ${f.tailles.map((x) => cm(x.int)).join(' / ')} cm`;
  return `H ${f.tailles.map((x) => cm(x.h)).join(' / ')} cm`;
}

export function pastilles(p, max = 7) {
  const cs = toutesCouleurs(p);
  const vis = cs.slice(0, max);
  return `<span class="pastilles" aria-label="${t('coloris', { n: cs.length })}">${vis.map((c) => `<span class="pastille" style="background:${fondNuance(c)}" title="${nomCouleur(c)}"></span>`).join('')}${cs.length > max ? `<span class="plus">+${cs.length - max}</span>` : ''}</span>`;
}

/* scène provisoire pour les modèles sans photo (Solo, Fluffy) */
export function sceneManquante(p) {
  return `<div class="ph" style="position:absolute;inset:0">
    <svg viewBox="0 0 1000 1000" aria-hidden="true"><g fill="none" stroke="#8d877c" stroke-width="2" stroke-dasharray="6 8"><path d="M300 380 L700 380 L660 820 L340 820 Z"/><path d="M260 860 L740 860"/></g><text x="500" y="610" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="40" fill="#615d55">${p.nom.toUpperCase()}</text></svg>
    <span class="ph__balayage"></span>
    <span class="ph__etiquette">${t('photosManquantes')}</span>
  </div>`;
}

export function scenePrincipale(p, { taille = 1200, trajet = true } = {}) {
  if (p.aCompleter) return sceneManquante(p);
  const fo = formeDe(p);
  const cs = toutesCouleurs(p);
  const c1 = cs[0];
  const c2 = cs[Math.min(cs.length - 1, 4)];
  return `<div class="modele__grille"></div>
    ${trajet && fo ? `<svg class="modele__trajet" viewBox="0 0 1000 1000" aria-hidden="true"><path class="contour" d="${fo.contour}"/><path class="trajet" d="${fo.toolpath}"/></svg>` : ''}
    <img class="modele__img" src="${c1.img(taille)}" alt="${p.nom}, ${t(`cat1.${p.cat}`).toLowerCase()} ${nomCouleur(c1).toLowerCase()}" loading="lazy" decoding="async">
    ${c2 && c2 !== c1 ? `<img class="modele__img modele__img--2" src="${c2.img(taille)}" alt="" loading="lazy" decoding="async">` : ''}`;
}

export function carteCollection(p) {
  const n = nbCouleurs(p);
  return `<article class="modele" data-modele="${p.slug}">
    <a class="modele__scene" href="${lienProduit(p.slug)}" data-curseur-label="voir.curseur" aria-label="${p.nom}">${scenePrincipale(p)}</a>
    <div class="modele__corps">
      <div class="modele__ligne"><h3 class="modele__nom">${p.nom}</h3><span class="modele__prix">${prixDes(p)}</span></div>
      <div class="modele__infos mono"><span>${t(`cat1.${p.cat}`)}</span>${p.aCompleter ? '' : `<span>${resumeTailles(p)}</span><span>${t('coloris', { n })}</span>`}</div>
      ${p.aCompleter ? `<p class="muet" style="font-size:.875rem">${t('ficheCassee')}</p>` : pastilles(p)}
      <div class="modele__actions">
        ${p.aCompleter ? '' : `<button class="btn btn--petit" type="button" data-ajout-rapide="${p.slug}">${t('ajouter')}</button>`}
        <a class="btn btn--petit btn--ligne" href="${lienProduit(p.slug)}">${t('voir')}</a>
      </div>
    </div>
  </article>`;
}

/* ajout direct : premier coloris, plus petite taille */
export function ajoutDirect(slug, source, P) {
  const p = P.find((x) => x.slug === slug);
  const f = p.finitions[0];
  ajouterAuPanier({ slug, fin: f.id, couleur: f.couleurs[0]?.slug, taille: f.tailles[0]?.id }, source);
}

export { finition };
