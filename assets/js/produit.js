/* Fiche produit D3CO (une page pour tous les modèles : produit.html#linea) */
import { init, gsap, ScrollTrigger, t, prix, cm, nomCouleur, langue, onLangue, estCalme, estTactile, ajouterAuPanier, magnetiques } from './core.js?v=20261028';
import { PRODUITS, produit, formeDe, finition, couleur, toutesCouleurs } from './data.js?v=20261028';
import { Impression, boiteUV } from './impression.js?v=20261028';
import { fondNuance, lireChoix, memoriserChoix, carteCollection, ajoutDirect, sceneManquante, prixDes } from './composants.js?v=20261028';

init();

const $ = (s) => document.querySelector(s);
const slugInitial = () => {
  const h = location.hash.slice(1);
  const q = new URLSearchParams(location.search).get('m');
  return produit(h) ? h : produit(q) ? q : 'linea';
};

let P = null;
let choix = null;
let impression = null;
let qte = 1;
const LIGNES_DECOR = { console: { y: 0.455, img: 'g16-fiche-console', alt: 'pro.alt.scene1', cx: 0.5 }, fenetre: { y: 0.665, img: 'g17-fiche-fenetre', alt: 'pro.alt.scene2', cx: 0.42 } };
let decor = 'console';

/* ---------- date de livraison estimée (jours ouvrables) ---------- */
function plusJoursOuvrables(d, n) {
  const r = new Date(d);
  let k = 0;
  while (k < n) { r.setDate(r.getDate() + 1); if (r.getDay() !== 0 && r.getDay() !== 6) k++; }
  return r;
}
function livraison() {
  const loc = langue() === 'de' ? 'de-CH' : 'fr-CH';
  const f = (d) => d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
  const auj = new Date();
  $('[data-livraison]').innerHTML = `<b>${t('livEstimee', { a: f(plusJoursOuvrables(auj, 2)), b: f(plusJoursOuvrables(auj, 5)) })}</b><span class="muet" style="font-size:.8125rem">${t('livNote')}</span>`;
}

/* ---------- rendu ---------- */
function libTaille(x) {
  if (x.int) return `${t('intExt', { i: cm(x.int) })}${x.ext ? ` · Ø ext. ${cm(x.ext)}` : ''}${x.h ? ` · H ${cm(x.h)}` : ''}`;
  return [x.ext && `Ø ${cm(x.ext)} cm`, x.h && `H ${cm(x.h)} cm`].filter(Boolean).join(' · ');
}

function rendreFiche(premier = false) {
  const f = finition(P, choix.fin);
  const { c } = couleur(P, choix.couleur, f.id);
  const idx = f.tailles.findIndex((x) => x.id === choix.taille);
  document.title = `${P.nom} · D3CO`;
  $('[data-nom]').textContent = P.nom;
  $('[data-cat]').textContent = t(`cat1.${P.cat}`);
  $('[data-fil-nom]').textContent = P.nom;
  const filCat = $('[data-fil-cat]');
  filCat.textContent = t(`cat.${P.cat}`);
  filCat.setAttribute('href', `boutique.html#${P.cat}`);
  $('[data-montant]').textContent = prix(f.prix);
  $('[data-prix-note]').textContent = P.aCompleter ? t('aCompleter') : idx > 0 ? t('prixTaille') : (f.des && f.tailles.length > 1 ? `${t('des')} · ${libTaille(f.tailles[0])}` : '');
  /* finitions */
  $('[data-bloc-fin]').hidden = P.finitions.length < 2;
  $('[data-finitions]').innerHTML = P.finitions.map((x) => `<button class="puce" type="button" data-fin="${x.id}" aria-pressed="${x.id === f.id}">${t(x.id)} · ${x.des ? `${t('des')} ` : ''}${prix(x.prix)}</button>`).join('');
  /* couleurs */
  $('[data-nom-couleur]').textContent = c ? nomCouleur(c) : t('aCompleter');
  $('[data-nuancier]').innerHTML = f.couleurs.map((x) => `<button class="nuance" type="button" style="background:${fondNuance(x)}" data-couleur="${x.slug}" aria-pressed="${c && x.slug === c.slug}" aria-label="${nomCouleur(x)}"></button>`).join('') || `<span class="muet">${t('aCompleter')}</span>`;
  $('[data-vignettes]').innerHTML = f.couleurs.map((x) => `<button class="vignette" type="button" data-couleur="${x.slug}" aria-pressed="${c && x.slug === c.slug}" aria-label="${nomCouleur(x)}"><img src="${x.img(240)}" alt="" loading="lazy" width="240" height="240"></button>`).join('');
  /* tailles */
  const tailles = f.tailles;
  $('[data-taille-note]').textContent = f.noteTailles ? t('autresTailles') : '';
  $('[data-tailles]').innerHTML = !tailles.length ? `<span class="muet">${t('aCompleter')}</span>`
    : tailles.length === 1 ? `<span class="taille">${t('tailleUnique')} · ${libTaille(tailles[0])}</span>`
      : tailles.map((x) => `<button class="taille" type="button" data-taille="${x.id}" aria-pressed="${x.id === choix.taille}">${libTaille(x)}</button>`).join('');
  $('[data-tailles-plan]').innerHTML = tailles.length > 1 ? tailles.map((x) => `<button class="taille" type="button" data-taille="${x.id}" aria-pressed="${x.id === choix.taille}">${libTaille(x)}</button>`).join('') : '';
  $('[data-ajouter]').disabled = !!P.aCompleter;
  $('[data-ajouter-barre]').disabled = !!P.aCompleter;
  $('[data-q-val]').textContent = qte;
  $('[data-barre-nom]').textContent = `${P.nom}${c ? ' · ' + nomCouleur(c) : ''}`;
  $('[data-barre-prix]').textContent = prix(f.prix * qte);
  $('[data-livraison]').hidden = !!P.aCompleter;
  if (!P.aCompleter) livraison();
  accordeons();
  plan(!premier);
  chezVous();
}

function accordeons() {
  const f = finition(P, choix.fin);
  const ouverts = [...document.querySelectorAll('[data-accordeons] details')].map((d) => d.open);
  const lignes = P.finitions.flatMap((fi) => fi.tailles.map((x) => ({ fi, x })));
  const aInt = lignes.some((l) => l.x.int);
  const tableau = lignes.length ? `<div class="table-defile"><table>
    <thead><tr>${P.finitions.length > 1 ? `<th>${t('pro.finition')}</th>` : ''}${aInt ? `<th>${t('diamInt')}</th>` : ''}<th>${t('diamExt')}</th><th>${t('hauteur')}</th></tr></thead>
    <tbody>${lignes.map(({ fi, x }) => `<tr>${P.finitions.length > 1 ? `<td>${t(fi.id)}</td>` : ''}${aInt ? `<td>${x.int ? cm(x.int) + ' cm' : '–'}</td>` : ''}<td>${x.ext ? cm(x.ext) + ' cm' : t('aCompleter')}</td><td>${x.h ? cm(x.h) + ' cm' : t('aCompleter')}</td></tr>`).join('')}</tbody></table></div>` : `<p>${t('aCompleter')}</p>`;
  const cons = P.conseil === 'vase' ? t('consVase') : P.conseil === 'cachepot' ? t('consCachepot') : t('consBac');
  const blocs = [
    [t('pro.acc.dim'), `${tableau}${f.noteTailles ? `<p class="tag">${t('autresTailles')}</p>` : ''}`],
    [t('pro.acc.mat'), `<p>${t('matiereTxt')}</p><p>${t('matiereTxt2')}</p>`],
    [t('pro.acc.cons'), `<p>${cons}</p>`],
    [t('pro.acc.livr'), `<p>${t('livrTxt')}</p><img src="assets/img/ambiance/g18-fiche-colis-900.webp" alt="${t('pro.alt.colis')}" loading="lazy" style="width:min(220px,60%);aspect-ratio:4/5;object-fit:cover;border:1px solid var(--trait)">`],
    [t('pro.acc.gar'), `<p>${t('garTxt')}</p>`],
  ];
  $('[data-accordeons]').innerHTML = blocs.map(([titre, corps], i) => `<details class="accordeon"${ouverts[i] ? ' open' : ''}><summary>${titre}</summary><div class="accordeon__corps">${corps}</div></details>`).join('');
}

/* ---------- dessin technique coté ---------- */
let planEtat = { k: 1 };
function plan(anim) {
  const zone = $('[data-plan]');
  const fo = formeDe(P);
  if (!fo) { zone.innerHTML = sceneManquante(P); return; }
  const f = finition(P, choix.fin);
  const x = f.tailles.find((y) => y.id === choix.taille) || f.tailles[0] || {};
  const mesure = (y) => y.h || y.ext || y.int || 1;
  const max = Math.max(...f.tailles.map(mesure), 1);
  const k = f.tailles.length > 1 ? 0.62 + 0.38 * (mesure(x) / max) : 1;
  const [x0, y0, x1, y1] = fo.bbox;
  const cxB = (x0 + x1) / 2;
  const marge = 0.9;
  const echelle = Math.min(780 / (y1 - y0), 700 / (x1 - x0)) * marge;
  const vis = $('[data-voir-trajet]').checked;
  const dessiner = (kk) => {
    const s = echelle * kk;
    const tx = 500 - cxB * s;
    const ty = 900 - y1 * s;
    const X0 = x0 * s + tx; const X1 = x1 * s + tx; const Y0 = y0 * s + ty; const Y1 = y1 * s + ty;
    const hTxt = x.h ? `H ${cm(x.h)} cm` : `H ${t('aCompleter')}`;
    const dTxt = x.ext ? `Ø ${cm(x.ext)} cm` : x.int ? t('intExt', { i: cm(x.int) }) : `Ø ${t('aCompleter')}`;
    const xc = X1 + 60; const yc = Y0 - 50;
    return `<svg viewBox="0 0 1000 1000" aria-label="${P.nom} : ${hTxt}, ${dTxt}" role="img">
      <g transform="translate(${tx} ${ty}) scale(${s})">
        <path class="silhouette" d="${fo.contour}"/>
        <path class="trajet" d="${fo.toolpath}" style="opacity:${vis ? 0.9 : 0}"/>
      </g>
      <line class="cote-fine" x1="${X1 - 30}" y1="${Y0}" x2="${xc + 14}" y2="${Y0}"/>
      <line class="cote-fine" x1="${X1 - 30}" y1="${Y1}" x2="${xc + 14}" y2="${Y1}"/>
      <line class="cote" x1="${xc}" y1="${Y0}" x2="${xc}" y2="${Y1}"/>
      <path class="cote" d="M${xc - 8} ${Y0 + 14} L${xc} ${Y0} L${xc + 8} ${Y0 + 14} M${xc - 8} ${Y1 - 14} L${xc} ${Y1} L${xc + 8} ${Y1 - 14}"/>
      <text class="fond" x="${xc + 14}" y="${(Y0 + Y1) / 2 + 9}">${hTxt}</text>
      <line class="cote-fine" x1="${X0}" y1="${Y0 + 30}" x2="${X0}" y2="${yc - 14}"/>
      <line class="cote-fine" x1="${X1}" y1="${Y0 + 30}" x2="${X1}" y2="${yc - 14}"/>
      <line class="cote" x1="${X0}" y1="${yc}" x2="${X1}" y2="${yc}"/>
      <path class="cote" d="M${X0 + 14} ${yc - 8} L${X0} ${yc} L${X0 + 14} ${yc + 8} M${X1 - 14} ${yc - 8} L${X1} ${yc} L${X1 - 14} ${yc + 8}"/>
      <text class="fond" x="${(X0 + X1) / 2}" y="${yc - 16}" text-anchor="middle">${dTxt}</text>
      <line class="cote-fine" x1="60" y1="${Y1 + 2}" x2="940" y2="${Y1 + 2}"/>
      <text x="60" y="970" style="font-size:20px;fill:var(--muet)">${P.nom.toUpperCase()} · ${langue() === 'de' ? 'MASSSTAB FREI' : 'ÉCHELLE LIBRE'} · D3CO BIEL/BIENNE</text>
    </svg>`;
  };
  if (!anim || estCalme()) { planEtat.k = k; zone.innerHTML = dessiner(k); return; }
  gsap.to(planEtat, { k, duration: 0.7, ease: 'expo.out', onUpdate: () => { zone.innerHTML = dessiner(planEtat.k); } });
}

/* ---------- mise en scène ---------- */
function chezVous() {
  const zone = $('[data-chez]');
  const obj = $('[data-chez-objet]');
  const img = $('[data-chez-img]');
  const fo = formeDe(P);
  const f = finition(P, choix.fin);
  const { c } = couleur(P, choix.couleur, f.id);
  if (!fo || !c) { obj.hidden = true; return; }
  obj.hidden = false;
  if (!img.src.endsWith(c.img(600))) img.src = c.img(1200);
  const d = LIGNES_DECOR[decor];
  const r = zone.getBoundingClientRect();
  const largeur = r.width * (P.cat === 'bac' ? 0.5 : P.cat === 'vases' ? 0.4 : 0.36);
  obj.style.width = `${largeur}px`;
  obj.style.left = `${r.width * d.cx - largeur / 2}px`;
  obj.style.transform = 'none';
  obj.style.bottom = 'auto';
  obj.style.top = `${r.height * d.y - largeur * (fo.bbox[3] / 1000)}px`;
}

/* ---------- loupe ---------- */
function loupe() {
  const scene = $('[data-scene]');
  const l = $('[data-loupe]');
  if (estTactile()) return;
  scene.addEventListener('pointermove', (e) => {
    const f = finition(P, choix.fin);
    const { c } = couleur(P, choix.couleur, f.id);
    if (!c) return;
    const r = scene.getBoundingClientRect();
    const x = e.clientX - r.left; const y = e.clientY - r.top;
    const z = 2.6;
    l.classList.add('est-active');
    l.style.left = `${x - 90}px`;
    l.style.top = `${y - 90}px`;
    l.style.backgroundImage = `url(${c.img(1200)})`;
    l.style.backgroundSize = `${r.width * 0.96 * z}px ${r.height * 0.96 * z}px`;
    const ox = (x - r.width * 0.02) * z - 90; const oy = (y - r.height * 0.02) * z - 90;
    l.style.backgroundPosition = `${-ox}px ${-oy}px`;
  });
  scene.addEventListener('pointerleave', () => l.classList.remove('est-active'));
}

/* ---------- connexes ---------- */
function connexes() {
  const autres = PRODUITS.filter((x) => x.slug !== P.slug && !x.aCompleter);
  const debut = PRODUITS.indexOf(P) % autres.length;
  const trois = [0, 1, 2].map((i) => autres[(debut + i) % autres.length]);
  const zone = $('[data-connexes]');
  zone.innerHTML = trois.map((x) => carteCollection(x)).join('');
  zone.querySelectorAll('.modele').forEach((m) => { m.style.width = 'auto'; });
  magnetiques(zone);
}

/* ---------- scène d'impression ---------- */
function scene(premier) {
  const zone = $('[data-scene]');
  const f = finition(P, choix.fin);
  const { c } = couleur(P, choix.couleur, f.id);
  const fo = formeDe(P);
  if (!c || !fo) {
    zone.querySelector('canvas')?.remove();
    impression = null;
    zone.querySelector('.ph')?.remove();
    zone.insertAdjacentHTML('afterbegin', sceneManquante(P));
    $('[data-repli]').hidden = true;
    return;
  }
  zone.querySelector('.ph')?.remove();
  const repli = $('[data-repli]');
  repli.hidden = false;
  repli.src = c.img(1200);
  repli.alt = `${P.nom}, ${nomCouleur(c).toLowerCase()}`;
  if (!impression) {
    impression = new Impression(zone, { src: c.img(1200), box: boiteUV(fo.bbox), ratio: 1, fit: 0.96, couches: 56, progres: estCalme() ? 1 : 0 });
    impression.pret.then(() => impression.imprimer({ duree: 2.2, delai: premier ? 0.5 : 0, ease: 'power1.inOut' }));
  } else {
    impression.changer(c.img(1200), { box: boiteUV(fo.bbox), duree: 1.3 });
  }
}

/* ---------- chargement d'un modèle ---------- */
function charger(slug, premier = false) {
  P = produit(slug);
  const sauve = lireChoix(slug);
  const f0 = sauve ? finition(P, sauve.fin) : P.finitions[0];
  choix = {
    fin: f0.id,
    couleur: (sauve && f0.couleurs.find((c) => c.slug === sauve.couleur)?.slug) || f0.couleurs[0]?.slug,
    taille: f0.tailles[0]?.id,
  };
  qte = 1;
  rendreFiche(premier);
  scene(premier);
  connexes();
  if (!premier) window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ---------- événements ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !P) return;
  if (b.dataset.fin && b.dataset.fin !== choix.fin) {
    const f = finition(P, b.dataset.fin);
    choix = { fin: f.id, couleur: f.couleurs[0]?.slug, taille: f.tailles[0]?.id };
    rendreFiche(); scene(); return;
  }
  if (b.dataset.couleur && b.dataset.couleur !== choix.couleur) {
    choix.couleur = b.dataset.couleur;
    memoriserChoix(P.slug, choix.couleur, choix.fin);
    rendreFiche(); scene(); return;
  }
  if (b.dataset.taille && b.dataset.taille !== choix.taille) { choix.taille = b.dataset.taille; rendreFiche(); return; }
  if (b.dataset.q) { qte = Math.max(1, Math.min(20, qte + +b.dataset.q)); $('[data-q-val]').textContent = qte; $('[data-barre-prix]').textContent = prix(finition(P, choix.fin).prix * qte); return; }
  if (b.matches('[data-ajouter], [data-ajouter-barre]')) {
    ajouterAuPanier({ slug: P.slug, fin: choix.fin, couleur: choix.couleur, taille: choix.taille, qte }, $('[data-scene]'));
    return;
  }
  if (b.dataset.sceneId) {
    decor = b.dataset.sceneId;
    document.querySelectorAll('[data-scene-id]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const d = LIGNES_DECOR[decor];
    const im = $('[data-decor]');
    const changer = () => { im.src = `assets/img/ambiance/${d.img}-900.webp`; im.alt = t(d.alt); chezVous(); };
    if (estCalme()) changer();
    else gsap.timeline().to('[data-chez]', { clipPath: 'inset(0 0 100% 0)', duration: 0.4, ease: 'power2.in', onComplete: changer }).to('[data-chez]', { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'expo.out' });
  }
  if (b.dataset.ajoutRapide) ajoutDirect(b.dataset.ajoutRapide, b.closest('.modele')?.querySelector('.modele__img') || b, PRODUITS);
});
$('[data-voir-trajet]').addEventListener('change', () => plan(false));
window.addEventListener('hashchange', () => { if (produit(location.hash.slice(1))) charger(location.hash.slice(1)); });
new ResizeObserver(() => chezVous()).observe($('[data-chez]'));
onLangue(() => { rendreFiche(); connexes(); $('[data-decor]').alt = t(LIGNES_DECOR[decor].alt); });

/* barre d'achat collante (téléphone) */
const barre = $('[data-barre]');
new IntersectionObserver(([en]) => barre.classList.toggle('est-visible', !en.isIntersecting && en.boundingClientRect.top < 0)).observe($('[data-achat]'));

charger(slugInitial(), true);
loupe();
magnetiques();
if (!estCalme()) {
  gsap.from('.fiche > *', { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.15 });
  gsap.from('[data-plan]', { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'steps(24)', scrollTrigger: { trigger: '[data-plan]', start: 'top 80%', once: true } });
}
