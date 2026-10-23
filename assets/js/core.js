/* Socle commun : langue, défilement, curseur, panier, transitions. */
import { Lenis } from '../vendor/lenis/lenis.js';
import { DE, T } from './i18n.js';
import { PRODUITS, produit, finition, couleur, SITE } from './data.js';

const { gsap, ScrollTrigger } = window;
const plugins = ['ScrollTrigger', 'SplitText', 'DrawSVGPlugin', 'MotionPathPlugin', 'Flip'].map((n) => window[n]).filter(Boolean);
gsap.registerPlugin(...plugins);

/* ---------- stockage tolérant ---------- */
export const stock = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
  sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* rien */ } },
};

const html = document.documentElement;
const systemeCalme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let calmeChoisi = stock.get('d3co-calme', null);
export const estCalme = () => (calmeChoisi == null ? systemeCalme : calmeChoisi);
if (estCalme()) html.classList.add('calme');
export const estTactile = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;
export const webglOk = (() => {
  if (/[?&]nowebgl/.test(location.search)) return false;
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
})();

/* ---------- langue ---------- */
let LANGUE = stock.get('d3co-langue', 'fr') === 'de' ? 'de' : 'fr';
const ecouteursLangue = new Set();
export const langue = () => LANGUE;
export const onLangue = (fn) => ecouteursLangue.add(fn);
export function t(cle, vars = {}) {
  const e = T[cle];
  let s = e ? (e[LANGUE] ?? e.fr) : (LANGUE === 'de' && DE[cle]) || cle;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
export const prix = (n) => (LANGUE === 'de'
  ? 'CHF\u00a0' + new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  : new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + '\u00a0CHF');
export const cm = (n) => (n == null ? '–' : (LANGUE === 'de' ? String(n) : String(n).replace('.', ',')));
export const nomCouleur = (c) => (c ? (LANGUE === 'de' ? c.de : c.fr) : '');

const frOrig = new WeakMap();
const splits = new Map();

function appliquerTextes(racine = document) {
  racine.querySelectorAll('[data-i18n],[data-i18n-html]').forEach((el) => {
    const cle = el.dataset.i18n || el.dataset.i18nHtml;
    const split = splits.get(el);
    if (split) split.revert();
    if (!frOrig.has(el)) frOrig.set(el, el.innerHTML);
    const val = LANGUE === 'de' ? DE[cle] : null;
    el.innerHTML = val ?? frOrig.get(el);
    if (split) splits.set(el, decouper(el));
  });
  racine.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((paire) => {
      const [attr, cle] = paire.split(':');
      const k = `fr:${attr}`;
      if (!el.dataset[k.replace(/[^a-z]/gi, '')]) el.dataset[k.replace(/[^a-z]/gi, '')] = el.getAttribute(attr) || '';
      const fr = el.dataset[k.replace(/[^a-z]/gi, '')];
      el.setAttribute(attr, LANGUE === 'de' && DE[cle] ? DE[cle] : fr);
    });
  });
  html.lang = LANGUE === 'de' ? 'de-CH' : 'fr-CH';
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === LANGUE)));
}

export function changerLangue(l, anime = true) {
  if (l === LANGUE) return;
  LANGUE = l;
  stock.set('d3co-langue', l);
  appliquerTextes();
  ecouteursLangue.forEach((fn) => fn(l));
  if (anime && !estCalme()) reimprimerTextes();
  ScrollTrigger.refresh();
}

/* effet « bobine » : les textes visibles se réimpriment de bas en haut */
function reimprimerTextes() {
  const vh = window.innerHeight;
  const vis = [...document.querySelectorAll('[data-i18n],[data-i18n-html]')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < vh && r.width > 0 && !el.closest('[hidden]');
  });
  gsap.fromTo(vis, { clipPath: 'inset(100% 0% 0% 0%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'steps(14)', stagger: 0.025,
    clearProps: 'clipPath',
  });
}

/* ---------- découpe des titres en lignes ---------- */
function decouper(el) {
  return new window.SplitText(el, { type: 'lines', linesClass: 'ligne', mask: 'lines' });
}
function titres() {
  document.querySelectorAll('[data-split]').forEach((el) => {
    if (estCalme()) return;
    const s = decouper(el);
    splits.set(el, s);
    gsap.from(s.lines, {
      yPercent: 105,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

/* ---------- défilement fluide ---------- */
export let lenis = null;
/* verrou du défilement derrière menu, panier et modale (avec ou sans Lenis) */
function verrou(on) {
  if (on) lenis?.stop(); else lenis?.start();
  document.documentElement.classList.toggle('verrou', on);
}
function defilement() {
  if (estCalme()) return;
  lenis = new Lenis({ autoRaf: false, lerp: 0.11, wheelMultiplier: 1, smoothWheel: true, anchors: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
export function allerA(cible) {
  const el = typeof cible === 'string' ? document.querySelector(cible) : cible;
  if (!el) return;
  const h = document.querySelector('.entete')?.offsetHeight || 0;
  if (lenis) lenis.scrollTo(el, { offset: -h + 1, duration: 1.4 });
  else el.scrollIntoView({ behavior: estCalme() ? 'auto' : 'smooth' });
}

/* ---------- en-tête ---------- */
function entete() {
  const e = document.querySelector('.entete');
  if (!e) return;
  let dernier = 0;
  const maj = () => {
    const y = window.scrollY;
    e.classList.toggle('est-plein', y > 30);
    const menuOuvert = !document.getElementById('menu-mobile')?.hidden;
    e.classList.toggle('est-cache', y > 400 && y > dernier + 4 && !menuOuvert && !document.body.classList.contains('panier-ouvert'));
    if (y < dernier - 4) e.classList.remove('est-cache');
    html.classList.toggle('entete-cachee', e.classList.contains('est-cache'));
    dernier = y;
  };
  window.addEventListener('scroll', maj, { passive: true });
  maj();
  const page = document.body.dataset.page;
  document.querySelectorAll(`.nav [data-page="${page}"]`).forEach((a) => a.setAttribute('aria-current', 'page'));

  /* liens d'ancre de la même page */
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href]');
    if (!a) return;
    const url = new URL(a.getAttribute('href'), location.href);
    const memePage = url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
    if (memePage && url.hash && document.querySelector(url.hash)) {
      ev.preventDefault();
      fermerMenu();
      allerA(url.hash);
    }
  });
}

/* ---------- menu mobile ---------- */
function ouvrirMenu() {
  const m = document.getElementById('menu-mobile');
  m.hidden = false;
  document.querySelector('[data-ouvrir-menu]')?.setAttribute('aria-expanded', 'true');
  verrou(true);
  if (!estCalme()) {
    gsap.fromTo(m, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.out' });
    gsap.from(m.querySelectorAll('nav a'), { yPercent: 110, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06, delay: 0.15 });
  }
  m.querySelector('[data-fermer-menu]')?.focus();
  pieger(m);
}
function fermerMenu() {
  const m = document.getElementById('menu-mobile');
  if (!m || m.hidden) return;
  m.hidden = true;
  liberer(m);
  document.querySelector('[data-ouvrir-menu]')?.focus();
  document.querySelector('[data-ouvrir-menu]')?.setAttribute('aria-expanded', 'false');
  verrou(false);
}

/* ---------- curseur buse ---------- */
function curseur() {
  if (estTactile()) return;
  const c = document.querySelector('.curseur');
  if (!c) return;
  html.classList.add('curseur-on');
  const label = c.querySelector('.curseur__label');
  const x = gsap.quickTo(c, 'x', { duration: 0.18, ease: 'power3' });
  const y = gsap.quickTo(c, 'y', { duration: 0.18, ease: 'power3' });
  gsap.set(c, { x: -100, y: -100 });
  window.addEventListener('pointermove', (e) => {
    x(e.clientX); y(e.clientY);
    const cible = e.target instanceof Element ? e.target : null;
    if (!cible) return;
    const lab = cible.closest('[data-curseur-label]');
    const lien = cible.closest('a, button, [data-curseur="lien"], label, select, summary');
    c.classList.toggle('est-actif', !!lab);
    c.classList.toggle('est-lien', !lab && !!lien);
    if (lab) label.textContent = t(lab.dataset.curseurLabel);
    const sombre = cible.closest('.sombre, .menu-mobile');
    c.classList.toggle('sur-sombre', !!sombre && !lab);
  }, { passive: true });
  document.addEventListener('pointerleave', () => gsap.set(c, { x: -100, y: -100 }));
}
T['heros.curseur'] = { fr: 'Imprimer', de: 'Drucken' };
T['voir.curseur'] = { fr: 'Voir', de: 'Ansehen' };

/* ---------- boutons magnétiques ---------- */
export function magnetiques(racine = document) {
  if (estTactile() || estCalme()) return;
  racine.querySelectorAll('[data-magnet]').forEach((el) => {
    if (el.dataset.magnetOk) return;
    el.dataset.magnetOk = '1';
    const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      qx((e.clientX - r.left - r.width / 2) * 0.28);
      qy((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' }); });
  });
}

/* ---------- rail Z ---------- */
function rail() {
  const r = document.querySelector('.rail');
  if (!r) return;
  const buse = r.querySelector('.rail__buse');
  const lecture = r.querySelector('.rail__lecture');
  const maj = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    buse.style.top = `${(p * 100).toFixed(2)}%`;
    const z = p * 250;
    lecture.textContent = `Z ${z.toFixed(1).padStart(5, '0')} · ${t('couche')} ${String(Math.round(z / 0.2)).padStart(4, '0')}`;
    const sous = document.elementFromPoint(window.innerWidth - 30, window.innerHeight / 2);
    r.classList.toggle('sur-sombre-rail', !!sous?.closest('.sombre'));
  };
  window.addEventListener('scroll', maj, { passive: true });
  onLangue(maj);
  maj();
}

/* ---------- parallaxes et tracés ---------- */
function parallaxes() {
  if (estCalme()) return;
  document.querySelectorAll('[data-parallaxe-img]').forEach((img) => {
    gsap.set(img, { scale: 1.14 });
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  document.querySelectorAll('[data-reveler]').forEach((fig) => {
    if (fig.getBoundingClientRect().top < window.innerHeight) return;
    gsap.set(fig, { clipPath: 'inset(100% 0% 0% 0%)' });
    ScrollTrigger.create({
      trigger: fig, start: 'top 88%', once: true,
      onEnter: () => gsap.to(fig, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'steps(22)', clearProps: 'clipPath' }),
    });
  });
  document.querySelectorAll('[data-trace]').forEach((svg) => {
    gsap.from(svg.querySelectorAll('path'), {
      drawSVG: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.18,
      scrollTrigger: { trigger: svg, start: 'top 85%', once: true },
    });
  });
}

/* ---------- copier ---------- */
function copier() {
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copier]');
    if (!b) return;
    try {
      await navigator.clipboard.writeText(b.dataset.copier);
      toast(t('copie'));
    } catch (err) {
      const v = b.parentElement.querySelector('.valeur');
      if (v) { const sel = window.getSelection(); const rg = document.createRange(); rg.selectNodeContents(v); sel.removeAllRanges(); sel.addRange(rg); }
      toast(t('copieImpossible'));
    }
  });
}

/* ---------- toasts ---------- */
export function toast(msg, action = null) {
  const zone = document.querySelector('[data-toasts]');
  if (!zone) return;
  const el = document.createElement('div');
  el.className = 'toast';
  const txt = document.createElement('span');
  txt.textContent = msg;
  el.append(txt);
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toast__action';
    b.textContent = action.label;
    b.addEventListener('click', () => { action.fn(); el.remove(); });
    el.append(b);
  }
  zone.append(el);
  gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'expo.out' });
  gsap.to(el, { y: 10, opacity: 0, duration: 0.3, delay: action ? 4 : 2.6, onComplete: () => el.remove() });
}

/* ---------- piège à focus pour tiroir, modale et menu ---------- */
const pieges = new Map();
function pieger(conteneur) {
  const fn = (e) => {
    if (e.key !== 'Tab') return;
    const f = [...conteneur.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const premier = f[0]; const dernier = f[f.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    else if (!conteneur.contains(document.activeElement)) { e.preventDefault(); premier.focus(); }
  };
  document.addEventListener('keydown', fn);
  pieges.set(conteneur, fn);
}
function liberer(conteneur) {
  const fn = pieges.get(conteneur);
  if (fn) document.removeEventListener('keydown', fn);
  pieges.delete(conteneur);
}

/* ---------- panier ---------- */
let PANIER = (stock.get('d3co-panier', []) || []).filter((l) => produit(l.slug));
const ecouteursPanier = new Set();
export const onPanier = (fn) => ecouteursPanier.add(fn);

export function lignePrix(l) {
  const p = produit(l.slug);
  const f = finition(p, l.fin);
  const idx = f.tailles.findIndex((x) => x.id === l.taille);
  return { unitaire: f.prix, estime: f.tailles.length > 1 && idx > 0 };
}
export function totaux(lignes = PANIER) {
  const sous = lignes.reduce((s, l) => s + lignePrix(l).unitaire * l.qte, 0);
  const liv = sous === 0 ? 0 : (sous >= SITE.livraison.seuil ? 0 : SITE.livraison.frais);
  return { sous, liv, total: sous + liv, manque: Math.max(0, SITE.livraison.seuil - sous) };
}
export function libelleTaille(p, f, idTaille) {
  const tl = f.tailles.find((x) => x.id === idTaille);
  if (!tl) return f.tailles.length ? '' : t('aCompleter');
  if (f.tailles.length === 1) return [tl.ext && t('ext', { e: cm(tl.ext) }), tl.h && t('haut', { h: cm(tl.h) })].filter(Boolean).join(' · ');
  if (tl.int) return t('intExt', { i: cm(tl.int) });
  return [tl.ext && `Ø ${cm(tl.ext)}`, tl.h && t('haut', { h: cm(tl.h) })].filter(Boolean).join(' · ');
}

function sauver() {
  stock.set('d3co-panier', PANIER.map(({ slug, fin, couleur: c, taille, qte }) => ({ slug, fin, couleur: c, taille, qte })));
  rendrePanier();
  ecouteursPanier.forEach((fn) => fn(PANIER));
}

export function ajouterAuPanier({ slug, fin, couleur: c, taille, qte = 1 }, source, silencieux = false) {
  const p = produit(slug);
  if (!p) return;
  const f = finition(p, fin);
  const tl = taille || f.tailles[0]?.id || 'u';
  const id = `${slug}|${f.id}|${c}|${tl}`;
  const ex = PANIER.find((l) => l.id === id);
  if (ex) ex.qte += qte; else PANIER.push({ id, slug, fin: f.id, couleur: c, taille: tl, qte });
  if (source) voler(source, p, f, c);
  sauver();
  const badge = document.querySelector('[data-compte]');
  if (badge && !estCalme()) gsap.fromTo(badge, { scale: 1.6 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)', delay: source ? 0.75 : 0 });
  if (!silencieux) toast(t('ajoute', { nom: `${p.nom}${c ? ' · ' + nomCouleur(couleur(p, c, f.id).c) : ''}` }), { label: t('voirPanier'), fn: ouvrirPanier });
}

export function imageLigne(l, s = 600) {
  const p = produit(l.slug);
  const { c } = couleur(p, l.couleur, l.fin);
  return c ? c.img(s) : null;
}

/* vol vers le panier, l'arc se trace en pointillés orange */
function voler(source, p, f, slugC) {
  const cible = document.querySelector('[data-ouvrir-panier]');
  const imgSrc = couleur(p, slugC, f.id).c?.img(240);
  if (!cible || !imgSrc || estCalme()) return;
  const a = source.getBoundingClientRect();
  const b = cible.getBoundingClientRect();
  const vol = document.createElement('div');
  vol.className = 'vol';
  vol.innerHTML = `<img src="${imgSrc}" alt="">`;
  const svgNS = 'http://www.w3.org/2000/svg';
  const trace = document.createElementNS(svgNS, 'svg');
  trace.setAttribute('class', 'vol-trace');
  const x0 = a.left + a.width / 2; const y0 = a.top + a.height / 2;
  const x1 = b.left + b.width / 2; const y1 = b.top + b.height / 2;
  const cx = (x0 + x1) / 2 + (x1 - x0) * 0.1; const cy = Math.min(y0, y1) - Math.max(120, Math.abs(x1 - x0) * 0.25);
  const d = `M${x0},${y0} Q${cx},${cy} ${x1},${y1}`;
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', d);
  trace.append(path);
  document.body.append(trace, vol);
  const tl = gsap.timeline({ onComplete: () => { vol.remove(); trace.remove(); } });
  gsap.set(vol, { xPercent: -50, yPercent: -50, x: x0, y: y0 });
  tl.from(path, { drawSVG: '0%', duration: 0.5, ease: 'power2.out' }, 0)
    .to(vol, {
      motionPath: { path: d },
      scale: 0.18, rotation: -18, duration: 0.8, ease: 'power2.inOut',
    }, 0.05)
    .to(path, { drawSVG: '100% 100%', duration: 0.4, ease: 'power2.in' }, 0.5);
}

function rendrePanier() {
  const n = PANIER.reduce((s, l) => s + l.qte, 0);
  document.querySelectorAll('[data-compte]').forEach((b) => { b.textContent = n; });
  const liste = document.querySelector('[data-panier-liste]');
  const bas = document.querySelector('[data-panier-bas]');
  if (!liste) return;
  if (!PANIER.length) {
    liste.innerHTML = `<div class="tiroir__vide"><p>${t('panierVide')}</p><a class="btn" href="boutique.html">${t('voirBoutique')}</a></div>`;
    bas.innerHTML = '';
    return;
  }
  liste.innerHTML = PANIER.map((l, i) => {
    const p = produit(l.slug);
    const f = finition(p, l.fin);
    const { c } = couleur(p, l.couleur, f.id);
    const { unitaire, estime } = lignePrix(l);
    const finTxt = p.finitions.length > 1 ? `${t(f.id)} · ` : '';
    return `<div class="ligne-panier">
      ${c ? `<img src="${c.img(240)}" alt="" width="76" height="76">` : '<span class="ph" style="width:76px;height:76px"></span>'}
      <div>
        <div class="ligne-panier__nom">${p.nom}</div>
        <div class="ligne-panier__det">${finTxt}${nomCouleur(c) || t('aCompleter')} · ${libelleTaille(p, f, l.taille)}</div>
        ${estime ? `<div class="ligne-panier__note">${t('prixEstime')}</div>` : ''}
        <div class="quantite"><button type="button" data-qte="-1" data-i="${i}" aria-label="${t('moins')}">−</button><span>${l.qte}</span><button type="button" data-qte="1" data-i="${i}" aria-label="${t('plus')}">+</button></div>
      </div>
      <div class="ligne-panier__droite"><span>${prix(unitaire * l.qte)}</span><button class="retirer" type="button" data-retirer="${i}">${t('retirer')}</button></div>
    </div>`;
  }).join('');
  const { sous, liv, total, manque } = totaux();
  const pct = Math.min(100, (sous / SITE.livraison.seuil) * 100);
  bas.innerHTML = `
    <div class="jauge"><div class="jauge__texte">${manque > 0 ? t('plusQue', { x: `<b>${prix(manque)}</b>` }) : `<b>${t('livraisonOfferte')}</b>`}</div><div class="jauge__barre"><div class="jauge__rempli" style="width:${pct}%"></div></div></div>
    <div class="totaux">
      <div><span>${t('sousTotal')}</span><span>${prix(sous)}</span></div>
      <div><span>${t('livraison')}</span><span>${liv === 0 ? t('offerte') : prix(liv)}</span></div>
      <div class="total"><span>${t('total')}</span><span>${prix(total)}</span></div>
    </div>
    <p class="muet" style="font-size:.8125rem">${t('ttc')}</p>
    <button class="btn btn--orange btn--plein" type="button" data-commander>${t('commander')}</button>`;
}

function panierEvenements() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-ouvrir-panier]')) ouvrirPanier();
    if (e.target.closest('[data-fermer-panier]') || e.target.closest('[data-voile]')) fermerPanier();
    if (e.target.closest('[data-ouvrir-menu]')) ouvrirMenu();
    if (e.target.closest('[data-fermer-menu]')) fermerMenu();
    const q = e.target.closest('[data-qte]');
    if (q) {
      const l = PANIER[+q.dataset.i];
      l.qte += +q.dataset.qte;
      if (l.qte <= 0) PANIER.splice(+q.dataset.i, 1);
      sauver();
    }
    const r = e.target.closest('[data-retirer]');
    if (r) { PANIER.splice(+r.dataset.retirer, 1); sauver(); }
    if (e.target.closest('[data-commander]')) { fermerPanier(); commande(); }
    if (e.target.closest('[data-fermer-modale]')) fermerModale();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    fermerPanier(); fermerMenu(); fermerModale();
  });
}
let focusAvant = null;
export function ouvrirPanier() {
  const tr = document.getElementById('tiroir');
  focusAvant = document.activeElement;
  tr.classList.add('est-ouvert');
  tr.setAttribute('aria-hidden', 'false');
  tr.inert = false;
  document.querySelector('[data-voile]').classList.add('est-visible');
  document.body.classList.add('panier-ouvert');
  verrou(true);
  tr.querySelector('[data-fermer-panier]').focus();
  pieger(tr);
  if (!estCalme()) gsap.from(tr.querySelectorAll('.ligne-panier'), { x: 40, opacity: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05, delay: 0.15 });
}
export function fermerPanier() {
  const tr = document.getElementById('tiroir');
  if (!tr?.classList.contains('est-ouvert')) return;
  tr.classList.remove('est-ouvert');
  tr.setAttribute('aria-hidden', 'true');
  tr.inert = true;
  document.querySelector('[data-voile]').classList.remove('est-visible');
  document.body.classList.remove('panier-ouvert');
  verrou(false);
  liberer(tr);
  focusAvant?.focus?.();
}

/* ---------- commande simulée ---------- */
let focusAvantModale = null;
function ouvrirModale(htmlContenu) {
  const m = document.getElementById('modale');
  if (m.hidden) focusAvantModale = document.activeElement;
  liberer(m);
  m.querySelector('[data-modale-boite]').innerHTML = htmlContenu;
  m.hidden = false;
  verrou(true);
  if (!estCalme()) gsap.fromTo(m.querySelector('.modale__boite'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
  m.querySelector('input, button:not(.fermer)')?.focus();
  pieger(m);
}
function fermerModale() {
  const m = document.getElementById('modale');
  if (!m || m.hidden) return;
  m.hidden = true;
  liberer(m);
  verrou(false);
  if (focusAvantModale?.isConnected) focusAvantModale.focus(); else document.querySelector('[data-ouvrir-panier]')?.focus();
  focusAvantModale = null;
}
function recap() {
  const { sous, liv, total } = totaux();
  return `<div class="totaux">
    <div><span>${t('sousTotal')}</span><span>${prix(sous)}</span></div>
    <div><span>${t('livraison')}</span><span>${liv === 0 ? t('offerte') : prix(liv)}</span></div>
    <div class="total"><span>${t('total')}</span><span>${prix(total)}</span></div></div>`;
}
function commande() {
  if (!PANIER.length) return;
  const fermer = `<button class="fermer" type="button" data-fermer-modale aria-label="${t('general.fermer')}">×</button>`;
  ouvrirModale(`${fermer}
    <span class="eyebrow">${t('cmdTitre')} · 1 / 2</span>
    <h2 class="titre-l" id="modale-titre">${t('cmdCoord')}</h2>
    <form class="pile" data-cmd1 novalidate>
      <div class="ligne-champs">
        <div class="champ"><label for="cmd-prenom">${t('form.prenom')}</label><input id="cmd-prenom" autocomplete="given-name" required></div>
        <div class="champ"><label for="cmd-nom">${t('form.nom')}</label><input id="cmd-nom" autocomplete="family-name" required></div>
      </div>
      <div class="champ"><label for="cmd-email">${t('form.email')}</label><input id="cmd-email" type="email" autocomplete="email" required></div>
      <div class="champ"><label for="cmd-adr">${t('cmdAdresse')}</label><input id="cmd-adr" autocomplete="street-address" required></div>
      <div class="ligne-champs">
        <div class="champ"><label for="cmd-npa">${t('cmdNpa')}</label><input id="cmd-npa" inputmode="numeric" maxlength="4" autocomplete="postal-code" required></div>
        <div class="champ"><label for="cmd-loc">${t('cmdLocalite')}</label><input id="cmd-loc" autocomplete="address-level2" required></div>
      </div>
      <p class="mono muet" style="text-transform:none;letter-spacing:0">${t('cmdPays')}</p>
      <p class="mono" data-err hidden style="color:var(--orange-texte);text-transform:none;letter-spacing:0"></p>
      ${recap()}
      <button class="btn btn--orange btn--plein" type="submit">${t('continuer')}</button>
    </form>`);
  const f = document.querySelector('[data-cmd1]');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (id) => f.querySelector(id).value.trim();
    const ok = v('#cmd-prenom') && v('#cmd-nom') && /\S+@\S+\.\S+/.test(v('#cmd-email')) && v('#cmd-adr') && /^\d{4}$/.test(v('#cmd-npa')) && v('#cmd-loc');
    const err = f.querySelector('[data-err]');
    if (!ok) { err.hidden = false; err.textContent = t('cmdErr'); return; }
    paiement();
  });
}
function paiement() {
  const { total } = totaux();
  const fermer = `<button class="fermer" type="button" data-fermer-modale aria-label="${t('general.fermer')}">×</button>`;
  ouvrirModale(`${fermer}
    <span class="eyebrow">${t('cmdTitre')} · 2 / 2</span>
    <h2 class="titre-l" id="modale-titre">${t('cmdPaiement')}</h2>
    <form class="pile" data-cmd2>
      <div class="moyens">
        <label class="moyen"><input type="radio" name="moyen" value="carte" id="cmd-carte" checked><span>${t('cmdCarte')}<small>${t('cmdCarteNote')}</small></span></label>
        <label class="moyen"><input type="radio" name="moyen" value="twint" id="cmd-twint"><span>TWINT<small>${t('cmdTwintNote')}</small></span></label>
      </div>
      <div data-twint hidden class="rangee"><canvas class="qr" width="29" height="29" data-qr></canvas><span class="mono muet">${t('qrSimule')}</span></div>
      <p class="tag">${t('cmdSimule')}</p>
      ${recap()}
      <button class="btn btn--orange btn--plein" type="submit">${t('cmdPayer', { x: prix(total) })}</button>
    </form>`);
  const f = document.querySelector('[data-cmd2]');
  const qr = f.querySelector('[data-qr]');
  dessinerQR(qr);
  f.addEventListener('change', () => { f.querySelector('[data-twint]').hidden = f.moyen.value !== 'twint'; });
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    PANIER = [];
    sauver();
    ouvrirModale(`<button class="fermer" type="button" data-fermer-modale aria-label="${t('general.fermer')}">×</button>
      <span class="eyebrow">${t('cmdTitre')}</span>
      <h2 class="titre-l" id="modale-titre">${t('cmdOk')}</h2>
      <p>${t('cmdOkTxt')}</p>
      <button class="btn" type="button" data-fermer-modale>${t('cmdFermer')}</button>`);
  });
}
function dessinerQR(c) {
  const g = c.getContext('2d');
  const n = 29;
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  g.fillStyle = '#fff'; g.fillRect(0, 0, n, n);
  g.fillStyle = '#111';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (rnd() > 0.52) g.fillRect(x, y, 1, 1);
  const repere = (x, y) => { g.fillStyle = '#111'; g.fillRect(x, y, 7, 7); g.fillStyle = '#fff'; g.fillRect(x + 1, y + 1, 5, 5); g.fillStyle = '#111'; g.fillRect(x + 2, y + 2, 3, 3); };
  repere(0, 0); repere(n - 7, 0); repere(0, n - 7);
}

/* ---------- mot-symbole en strates (pied de page) ---------- */
function motStrates() {
  const zone = document.querySelector('[data-mot-strates]');
  if (!zone) return;
  const N = 9;
  const H = 441; const W = 1675;
  const h = H / N;
  zone.innerHTML = Array.from({ length: N }, (_, i) => `<span class="strate"><svg viewBox="0 ${(i * h).toFixed(2)} ${W} ${h.toFixed(2)}" preserveAspectRatio="none" style="display:block;width:100%;height:auto;aspect-ratio:${W}/${h.toFixed(2)}"><use href="#logo-d3co" width="${W}" height="${H}"/></svg></span>`).join('');
  if (estCalme()) return;
  const strates = [...zone.querySelectorAll('.strate svg')];
  gsap.from(strates, {
    xPercent: (i) => (i % 2 ? 18 : -18), opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.06,
    scrollTrigger: { trigger: zone, start: 'top 95%', once: true },
  });
  const qs = strates.map((s) => gsap.quickTo(s, 'x', { duration: 0.9, ease: 'power3' }));
  zone.parentElement.parentElement.addEventListener('pointermove', (e) => {
    const r = zone.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height;
    qs.forEach((q, i) => q(nx * 60 * Math.sin((i / N) * Math.PI + ny * 2)));
  });
}

/* ---------- mode calme ---------- */
function boutonCalme() {
  const b = document.querySelector('[data-calme]');
  if (!b) return;
  const maj = () => {
    b.setAttribute('aria-pressed', String(estCalme()));
    b.textContent = estCalme() ? t('calmeOn') : t('calmeOff');
  };
  b.addEventListener('click', () => {
    calmeChoisi = !estCalme();
    stock.set('d3co-calme', calmeChoisi);
    location.reload();
  });
  onLangue(maj);
  maj();
}

/* ---------- transitions entre pages ---------- */
function transitions() {
  const N = 8;
  const rideau = document.createElement('div');
  rideau.className = 'rideau';
  rideau.style.gridTemplateRows = `repeat(${N}, 1fr)`;
  rideau.innerHTML = '<span></span>'.repeat(N);
  document.body.append(rideau);
  const bandes = rideau.querySelectorAll('span');
  if (stock.sget('d3co-transition') && !estCalme()) {
    gsap.set(bandes, { scaleX: 1, transformOrigin: 'right' });
    gsap.to(bandes, { scaleX: 0, duration: 0.7, ease: 'expo.inOut', stagger: 0.04, delay: 0.05 });
  }
  stock.sset('d3co-transition', '');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!/^(index|boutique|produit)\.html/.test(href)) return;
    const url = new URL(href, location.href);
    if (url.pathname === location.pathname && url.hash) return;
    if (estCalme()) return;
    e.preventDefault();
    stock.sset('d3co-transition', '1');
    gsap.set(bandes, { transformOrigin: 'left' });
    gsap.to(bandes, { scaleX: 1, duration: 0.55, ease: 'expo.in', stagger: 0.035, onComplete: () => { location.href = href; } });
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(bandes, { scaleX: 0 }); });
}

/* ---------- démarrage ---------- */
export function init() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (b) changerLangue(b.dataset.lang);
  });
  if (LANGUE !== 'fr') appliquerTextes();
  else document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === 'fr')));
  defilement();
  entete();
  curseur();
  magnetiques();
  rail();
  copier();
  rendrePanier();
  panierEvenements();
  motStrates();
  boutonCalme();
  transitions();
  /* les titres sont découpés une fois les polices prêtes */
  const pret = document.fonts?.ready || Promise.resolve();
  pret.then(() => { titres(); parallaxes(); ScrollTrigger.refresh(); });
}

export { gsap, ScrollTrigger, PRODUITS };
