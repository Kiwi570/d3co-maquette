/* Page boutique D3CO */
import { init, gsap, ScrollTrigger, t, prix, cm, nomCouleur, onLangue, estCalme, estTactile, ajouterAuPanier, magnetiques } from './core.js';
import { PRODUITS, produit, formeDe, finition, couleur, prixMin, toutesCouleurs } from './data.js';
import { FORMES } from './formes.js';
import { pastilles, prixDes, resumeTailles, sceneManquante, lienProduit, fondNuance, memoriserChoix } from './composants.js';

init();

const ORDRE = ['linea', 'flow', 'twist', 'paper', 'concrete', 'dia', 'solo', 'fluffy'];
const CATS = ['tout', 'cache-pots', 'vases', 'bac'];
const TAILLES = [
  { id: 'i11', lab: 'Ø 11,3', test: (tl) => tl.int === 11.3 },
  { id: 'i15', lab: 'Ø 15,3', test: (tl) => tl.int === 15.3 },
  { id: 'i19', lab: 'Ø 19,3', test: (tl) => tl.int === 19.3 },
  { id: 'h15', lab: 'H 15', test: (tl) => tl.h === 15 },
  { id: 'h20', lab: 'H 20', test: (tl) => tl.h === 20 },
  { id: 'h25', lab: 'H 25', test: (tl) => tl.h === 25 },
];
const etat = { cat: 'tout', taille: null, tri: 'reco', ouvert: null };
const hash = location.hash.slice(1);
if (CATS.includes(hash)) etat.cat = hash;

const grille = document.querySelector('[data-grille]');
const fCat = document.querySelector('[data-f-cat]');
const fTaille = document.querySelector('[data-f-taille]');
const compte = document.querySelector('[data-compte-resultats]');

/* ---------- titre imprimé lettre par lettre ---------- */
function titre() {
  const h = document.querySelector('[data-titre-boutique]');
  if (estCalme()) return;
  const s = new window.SplitText(h, { type: 'chars' });
  gsap.fromTo(s.chars, { clipPath: 'inset(100% 0% 0% 0%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'steps(12)', stagger: 0.07, delay: 0.25,
    onComplete: () => s.revert(),
  });
}

/* ---------- plateau : premières couches des vraies silhouettes ---------- */
function plateau() {
  const zone = document.querySelector('[data-plateau]');
  const svgNS = 'http://www.w3.org/2000/svg';
  const formes = ['linea', 'flow', 'twist', 'paper', 'concrete', 'dia'].map((k) => FORMES[k].forme);
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  zone.append(svg);
  let tl = null;
  const dessiner = () => {
    const r = zone.getBoundingClientRect();
    if (!r.width) return;
    svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    const mobile = r.width < 640;
    const colonnes = mobile ? 3 : 6;
    const lignes = mobile ? 2 : 1;
    const cw = r.width * 0.84 / colonnes;
    const ch = r.height * 0.8 / lignes;
    const taille = Math.min(cw, ch) * 1.25;
    svg.innerHTML = formes.map((fo, i) => {
      const cx = r.width * 0.08 + cw * ((i % colonnes) + 0.5);
      const cy = r.height * 0.1 + ch * (Math.floor(i / colonnes) + 0.5);
      const k = taille / 1000;
      return `<g transform="translate(${cx - 500 * k} ${cy - 540 * k}) scale(${k})">
        <path d="${fo.contour}" fill="none" stroke="rgba(238,234,227,0.35)" stroke-width="${1 / k}" stroke-dasharray="${4 / k} ${5 / k}"/>
        <path class="tp" d="${fo.toolpath}" fill="none" stroke="#ff5a1f" stroke-width="${1.6 / k}" stroke-linejoin="round"/>
      </g>`;
    }).join('') + '<circle class="buse" r="7" fill="#ffb08f" style="filter:drop-shadow(0 0 8px #ff5a1f) drop-shadow(0 0 3px #ff5a1f)"/>';
    if (tl) tl.kill();
    if (estCalme()) return;
    const tps = [...svg.querySelectorAll('.tp')];
    const buse = svg.querySelector('.buse');
    tl = gsap.timeline({ delay: 0.4 });
    tps.forEach((p, i) => {
      tl.from(p, { drawSVG: 0, duration: 1.2, ease: 'none' }, i * 0.35);
    });
    tl.to(buse, {
      motionPath: { path: tps[tps.length - 1], align: tps[tps.length - 1], alignOrigin: [0.5, 0.5] },
      duration: 1.2, ease: 'none',
    }, (tps.length - 1) * 0.35);
    tl.to(buse, { opacity: 0, duration: 0.4 });
  };
  dessiner();
  let minuterie;
  new ResizeObserver(() => { clearTimeout(minuterie); minuterie = setTimeout(dessiner, 200); }).observe(zone);
}

/* ---------- filtres ---------- */
function rendreFiltres() {
  const lab = fCat.querySelector('span').outerHTML;
  fCat.innerHTML = lab + CATS.map((c) => `<button class="puce" type="button" data-cat="${c}" aria-pressed="${etat.cat === c}">${c === 'tout' ? t('bou.f.tout') : t(`cat.${c}`)}</button>`).join('');
  const labT = fTaille.querySelector('span').outerHTML;
  fTaille.innerHTML = labT + TAILLES.map((x) => `<button class="puce" type="button" data-taille="${x.id}" aria-pressed="${etat.taille === x.id}">${x.lab.replace('11,3', cm(11.3)).replace('15,3', cm(15.3)).replace('19,3', cm(19.3))}</button>`).join('');
}

function filtrer() {
  let liste = ORDRE.map(produit);
  if (etat.cat !== 'tout') liste = liste.filter((p) => p.cat === etat.cat);
  if (etat.taille) {
    const f = TAILLES.find((x) => x.id === etat.taille);
    liste = liste.filter((p) => p.finitions.some((fi) => fi.tailles.some(f.test)));
  }
  if (etat.tri === 'asc') liste.sort((a, b) => prixMin(a) - prixMin(b));
  if (etat.tri === 'desc') liste.sort((a, b) => prixMin(b) - prixMin(a));
  return liste;
}

function carte(p) {
  const cs = toutesCouleurs(p);
  const img = p.aCompleter ? sceneManquante(p) : `<img src="${cs[0].img(1200)}" alt="${p.nom}, ${t(`cat1.${p.cat}`).toLowerCase()} ${nomCouleur(cs[0]).toLowerCase()}" loading="lazy" decoding="async"><img src="${cs[Math.min(3, cs.length - 1)].img(1200)}" alt="" loading="lazy" decoding="async">`;
  return `<article class="carte-produit" data-flip-id="${p.slug}" data-carte="${p.slug}">
    <a class="carte-produit__img" href="${lienProduit(p.slug)}" data-curseur-label="voir.curseur" aria-label="${p.nom}">${img}</a>
    <div class="carte-produit__corps">
      <div class="carte-produit__ligne"><a class="carte-produit__nom" href="${lienProduit(p.slug)}">${p.nom}</a><span class="carte-produit__prix">${prixDes(p)}</span></div>
      <div class="carte-produit__ligne mono muet"><span>${t(`cat1.${p.cat}`)}</span><span>${p.aCompleter ? t('aCompleter') : resumeTailles(p)}</span></div>
      <div class="carte-produit__ligne">${p.aCompleter ? `<span class="muet" style="font-size:.8125rem">${t('ficheCassee')}</span>` : pastilles(p, 8)}${p.aCompleter ? '' : `<button class="btn btn--petit" type="button" data-ouvrir-ajout="${p.slug}">${t('ajouter')}</button>`}</div>
    </div>
  </article>`;
}

function rendreGrille(anim = true) {
  const liste = filtrer();
  const avant = anim && !estCalme() ? window.Flip.getState(grille.querySelectorAll('.carte-produit')) : null;
  grille.innerHTML = liste.length ? liste.map(carte).join('') : `<div class="resultats-vides"><p>${t('aucun')}</p><button class="btn btn--ligne" type="button" data-reinit>${t('reinitialiser')}</button></div>`;
  compte.textContent = liste.length === 1 ? t('modele1') : t('modeles', { n: liste.length });
  if (avant) {
    window.Flip.from(avant, {
      targets: grille.querySelectorAll('.carte-produit'), duration: 0.7, ease: 'expo.inOut', absolute: true, scale: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.4 }),
    });
  }
  inclinaisons();
}

/* ---------- inclinaison 3D au survol ---------- */
function inclinaisons() {
  if (estTactile() || estCalme()) return;
  grille.querySelectorAll('.carte-produit').forEach((c) => {
    const rx = gsap.quickTo(c, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(c, 'rotationY', { duration: 0.6, ease: 'power3' });
    gsap.set(c, { transformPerspective: 900 });
    c.addEventListener('pointermove', (e) => {
      if (c.querySelector('.ajout-rapide')) return;
      const r = c.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 8);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
    });
    c.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ---------- ajout rapide (coloris + taille) ---------- */
function panneauAjout(cartEl, p) {
  fermerAjout();
  const choix = { fin: p.finitions[0].id, couleur: p.finitions[0].couleurs[0].slug, taille: p.finitions[0].tailles[0]?.id };
  const div = document.createElement('div');
  div.className = 'ajout-rapide';
  const rendre = () => {
    const f = finition(p, choix.fin);
    const tl = f.tailles.findIndex((x) => x.id === choix.taille);
    div.innerHTML = `
      <div class="ajout-rapide__titre"><b>${p.nom}</b><button class="fermer" type="button" data-fermer-ajout aria-label="${t('general.fermer')}" style="width:32px;height:32px">×</button></div>
      ${p.finitions.length > 1 ? `<div class="finitions">${p.finitions.map((x) => `<button class="puce" type="button" data-a-fin="${x.id}" aria-pressed="${x.id === choix.fin}">${t(x.id)} · ${x.des ? `${t('des')} ` : ''}${prix(x.prix)}</button>`).join('')}</div>` : ''}
      <div class="pile-s"><span class="mono muet">${nomCouleur(couleur(p, choix.couleur, choix.fin).c)}</span>
        <div class="mini-nuancier">${f.couleurs.map((c) => `<button type="button" style="background:${fondNuance(c)}" data-a-coul="${c.slug}" aria-pressed="${c.slug === choix.couleur}" aria-label="${nomCouleur(c)}"></button>`).join('')}</div></div>
      ${f.tailles.length > 1 ? `<div class="tailles">${f.tailles.map((x) => `<button class="taille" type="button" data-a-taille="${x.id}" aria-pressed="${x.id === choix.taille}">${x.int ? t('intExt', { i: cm(x.int) }) : `Ø ${cm(x.ext)} · H ${cm(x.h)}`}</button>`).join('')}</div>` : ''}
      ${tl > 0 ? `<span class="ligne-panier__note">${t('prixTaille')}</span>` : ''}
      <button class="btn btn--orange btn--plein btn--petit" type="button" data-a-ok>${t('ajouter')} · ${prix(f.prix)}</button>`;
  };
  rendre();
  div.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.fermerAjout !== undefined) { fermerAjout(); return; }
    if (b.dataset.aFin) { choix.fin = b.dataset.aFin; const f = finition(p, choix.fin); choix.couleur = f.couleurs[0].slug; choix.taille = f.tailles[0]?.id; }
    if (b.dataset.aCoul) {
      choix.couleur = b.dataset.aCoul;
      const im = cartEl.querySelector('.carte-produit__img img');
      if (im) im.src = couleur(p, choix.couleur, choix.fin).c.img(1200);
    }
    if (b.dataset.aTaille) choix.taille = b.dataset.aTaille;
    if (b.dataset.aOk !== undefined) {
      ajouterAuPanier({ slug: p.slug, fin: choix.fin, couleur: choix.couleur, taille: choix.taille }, cartEl.querySelector('.carte-produit__img'));
      fermerAjout();
      return;
    }
    rendre();
  });
  cartEl.append(div);
  gsap.set(cartEl, { rotationX: 0, rotationY: 0 });
  if (!estCalme()) gsap.from(div, { y: 20, opacity: 0, duration: 0.4, ease: 'expo.out' });
  etat.ouvert = div;
  div.querySelector('[data-a-coul]')?.focus();
}
function fermerAjout() {
  if (etat.ouvert) { etat.ouvert.remove(); etat.ouvert = null; }
}

/* ---------- événements ---------- */
document.querySelector('[data-filtres]').addEventListener('click', (e) => {
  const c = e.target.closest('[data-cat]');
  const tl = e.target.closest('[data-taille]');
  if (c) { etat.cat = c.dataset.cat; history.replaceState(null, '', etat.cat === 'tout' ? location.pathname : `#${etat.cat}`); }
  if (tl) etat.taille = etat.taille === tl.dataset.taille ? null : tl.dataset.taille;
  if (c || tl) { fermerAjout(); rendreFiltres(); rendreGrille(); }
});
document.querySelector('[data-tri]').addEventListener('change', (e) => { etat.tri = e.target.value; fermerAjout(); rendreGrille(); });
grille.addEventListener('click', (e) => {
  const o = e.target.closest('[data-ouvrir-ajout]');
  if (o) panneauAjout(o.closest('.carte-produit'), produit(o.dataset.ouvrirAjout));
  if (e.target.closest('[data-reinit]')) { etat.cat = 'tout'; etat.taille = null; rendreFiltres(); rendreGrille(); }
  const lien = e.target.closest('a[href^="produit.html"]');
  if (lien) {
    const c = lien.closest('[data-carte]');
    const im = c?.querySelector('.carte-produit__img img');
    const p = produit(c?.dataset.carte);
    if (p && im && !p.aCompleter) {
      const cs = toutesCouleurs(p).find((x) => im.src.includes(`-${x.slug}-`));
      if (cs) memoriserChoix(p.slug, cs.slug, cs.finition);
    }
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerAjout(); });
onLangue(() => { rendreFiltres(); rendreGrille(false); });

titre();
plateau();
rendreFiltres();
rendreGrille(false);
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (CATS.includes(h)) { etat.cat = h; rendreFiltres(); rendreGrille(); } });
magnetiques();
if (!estCalme()) {
  const cartes = grille.querySelectorAll('.carte-produit');
  gsap.set(cartes, { y: 70, opacity: 0 });
  ScrollTrigger.batch(cartes, {
    start: 'top 94%', once: true,
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.08 }),
  });
  gsap.from('.reassurance > div', { y: 20, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07, delay: 0.5 });
}
