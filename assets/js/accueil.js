/* Page d'accueil D3CO */
import {
  init, gsap, ScrollTrigger, t, prix, cm, nomCouleur, langue, onLangue, estCalme, estTactile,
  ajouterAuPanier, allerA, stock, magnetiques, totaux, toast,
} from './core.js';
import { PRODUITS, HEROS, SAISON, SITE, produit, formeDe, finition, couleur, toutesCouleurs } from './data.js';
import { FORMES } from './formes.js';
import { Impression, boiteUV } from './impression.js';
import { carteCollection, ajoutDirect, memoriserChoix, fondNuance, estBicolore, lienProduit } from './composants.js';
import { carteSuisse } from './carte.js';
import { matiere } from './matiere.js';

init();

const mm = gsap.matchMedia();
const grandEcran = '(min-width: 901px)';

/* ================= INTRO ================= */
function intro() {
  const el = document.querySelector('.intro');
  const vue = stock.sget('d3co-intro');
  if (!el || estCalme() || vue || location.hash) { document.documentElement.classList.add('sans-intro'); el?.remove(); return Promise.resolve(); }
  stock.sset('d3co-intro', '1');
  const N = 12;
  const zone = el.querySelector('[data-intro-strates]');
  zone.style.gridTemplateRows = `repeat(${N}, 1fr)`;
  zone.innerHTML = '<span></span>'.repeat(N);
  const logo = el.querySelector('.intro__logo svg');
  const buse = el.querySelector('.intro__buse');
  const z = el.querySelector('[data-intro-z]');
  const pct = el.querySelector('[data-intro-pct]');
  const etat = { p: 0 };
  document.documentElement.style.overflow = 'hidden';
  return new Promise((ok) => {
    const tl = gsap.timeline({ onComplete: () => { el.remove(); document.documentElement.style.overflow = ''; ok(); } });
    tl.set(logo, { clipPath: 'inset(100% 0 0 0)' })
      .to(etat, {
        p: 1, duration: 1.7, ease: 'power1.inOut',
        onUpdate: () => {
          const q = Math.round(etat.p * 24) / 24;
          logo.style.clipPath = `inset(${(1 - q) * 100}% 0 0 0)`;
          buse.style.bottom = `${q * 100}%`;
          buse.style.transform = `translateX(${Math.sin(etat.p * 60) * 3}%)`;
          z.textContent = `Z ${(etat.p * 12.6).toFixed(1).padStart(5, '0')}`;
          pct.textContent = `${String(Math.round(etat.p * 100)).padStart(3, '0')} %`;
        },
      })
      .to(buse, { opacity: 0, duration: 0.2 })
      .to(el.querySelector('.intro__centre'), { yPercent: -30, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.1')
      .to(zone.children, { scaleY: 0, transformOrigin: 'top', duration: 0.7, ease: 'expo.inOut', stagger: { each: 0.035, from: 'end' } }, '-=0.25');
  });
}

/* ================= HÉROS ================= */
const BOITE_HEROS = [0.053, 0.037, 0.947, 0.963];
let impressionHeros = null;

function heros() {
  const scene = document.querySelector('[data-heros-scene]');
  const fit = 0.8;
  impressionHeros = new Impression(scene, {
    src: HEROS.img(window.innerWidth > 700 ? 1400 : 700), box: BOITE_HEROS, ratio: HEROS.ratio, fit, couches: 72,
    progres: estCalme() ? 1 : 0,
  });
  /* cotes : Ø 18,2 cm et H 25 cm (fiche Linea) */
  const svg = scene.querySelector('[data-cotes]');
  const W = 1000; const H = 1163;
  const hImg = H * fit; const wImg = hImg * HEROS.ratio;
  const x0 = (W - wImg) / 2 + BOITE_HEROS[0] * wImg;
  const x1 = (W - wImg) / 2 + BOITE_HEROS[2] * wImg;
  const yT = (H - hImg) / 2 + (1 - BOITE_HEROS[3]) * hImg;
  const yB = (H - hImg) / 2 + (1 - BOITE_HEROS[1]) * hImg;
  const xc = Math.min(W - 40, x1 + 70);
  const yc = Math.min(H - 30, yB + 60);
  svg.innerHTML = `
    <line class="fine" x1="${x1 - 120}" y1="${yT}" x2="${xc + 12}" y2="${yT}"/>
    <line class="fine" x1="${x1 - 20}" y1="${yB}" x2="${xc + 12}" y2="${yB}"/>
    <line data-c="h" x1="${xc}" y1="${yT}" x2="${xc}" y2="${yB}"/>
    <path d="M${xc - 7} ${yT + 12} L${xc} ${yT} L${xc + 7} ${yT + 12} M${xc - 7} ${yB - 12} L${xc} ${yB} L${xc + 7} ${yB - 12}"/>
    <rect class="fond-texte" x="${xc - 40}" y="${(yT + yB) / 2 - 16}" width="80" height="30"/>
    <text x="${xc}" y="${(yT + yB) / 2 + 5}" text-anchor="middle" data-cote-h>H 25</text>
    <line class="fine" x1="${x0}" y1="${yB - 40}" x2="${x0}" y2="${yc + 12}"/>
    <line class="fine" x1="${x1}" y1="${yB - 40}" x2="${x1}" y2="${yc + 12}"/>
    <line data-c="d" x1="${x0}" y1="${yc}" x2="${x1}" y2="${yc}"/>
    <path d="M${x0 + 12} ${yc - 7} L${x0} ${yc} L${x0 + 12} ${yc + 7} M${x1 - 12} ${yc - 7} L${x1} ${yc} L${x1 - 12} ${yc + 7}"/>
    <rect class="fond-texte" x="${(x0 + x1) / 2 - 62}" y="${yc - 16}" width="124" height="30"/>
    <text x="${(x0 + x1) / 2}" y="${yc + 5}" text-anchor="middle" data-cote-d>Ø 18,2 cm</text>`;
  const ecrire = (h, d) => {
    svg.querySelector('[data-cote-h]').textContent = `H ${cm(Math.round(h))}`;
    svg.querySelector('[data-cote-d]').textContent = `Ø ${cm(d.toFixed(1))} cm`;
  };
  onLangue(() => ecrire(25, 18.2));

  return () => {
    const tl = gsap.timeline();
    if (estCalme()) { impressionHeros.pret.then(() => { impressionHeros.progres = 1; }); return tl; }
    const v = { h: 0, d: 0 };
    tl.from(svg.querySelectorAll('line, path'), { drawSVG: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.05 }, 0.2)
      .from(svg.querySelectorAll('rect, text'), { opacity: 0, duration: 0.3, stagger: 0.05 }, 0.6)
      .to(v, { h: 25, d: 18.2, duration: 2.6, ease: 'power1.inOut', onUpdate: () => ecrire(v.h, v.d) }, 0.2);
    impressionHeros.pret.then(() => impressionHeros.imprimer({ duree: 2.8, ease: 'power1.inOut' }));
    return tl;
  };
}

function herosDefilement() {
  const scene = document.querySelector('[data-heros-scene]');
  if (estCalme()) return;
  /* inclinaison au curseur */
  if (!estTactile()) {
    const rx = gsap.quickTo(scene, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(scene, 'rotationY', { duration: 0.8, ease: 'power3' });
    gsap.set(scene, { transformPerspective: 1200 });
    document.querySelector('#heros').addEventListener('pointermove', (e) => {
      ry((e.clientX / window.innerWidth - 0.5) * 10);
      rx(-(e.clientY / window.innerHeight - 0.5) * 6);
    });
  }
  /* vue éclatée au défilement */
  mm.add(grandEcran, () => {
    const etat = { e: 0 };
    gsap.timeline({
      scrollTrigger: { trigger: '#heros', start: 'top top', end: '+=70%', scrub: 0.6, pin: true, anticipatePin: 1 },
    })
      .to(etat, { e: 1, ease: 'power1.in', onUpdate: () => { if (impressionHeros) impressionHeros.eclate = etat.e; } }, 0)
      .to(scene.querySelector('[data-cotes]'), { opacity: 0, ease: 'none', duration: 0.3 }, 0)
      .to('.heros__titre, .heros__bas, .heros__eyebrow', { yPercent: -10, opacity: 0.15, ease: 'none' }, 0);
  });
  mm.add('(max-width: 900px)', () => {
    const etat = { e: 0 };
    gsap.to(etat, {
      e: 0.8, ease: 'none',
      scrollTrigger: { trigger: scene, start: 'center 40%', end: 'bottom top', scrub: true },
      onUpdate: () => { if (impressionHeros) impressionHeros.eclate = etat.e; },
    });
  });
  const fond = document.querySelector('[data-parallaxe]');
  if (fond) gsap.to(fond, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '#heros', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ================= BANDEAU ================= */
function bandeau() {
  const piste = document.querySelector('[data-bandeau-piste]');
  const groupe = piste.firstElementChild;
  piste.append(groupe.cloneNode(true), groupe.cloneNode(true));
  piste.querySelectorAll('.bandeau__groupe + .bandeau__groupe').forEach((g) => g.setAttribute('aria-hidden', 'true'));
  if (estCalme()) return;
  const largeur = () => groupe.getBoundingClientRect().width;
  const tween = gsap.to(piste, { x: () => -largeur(), duration: 26, ease: 'none', repeat: -1 });
  tween.totalTime(tween.duration() * 500);
  let sens = 1;
  ScrollTrigger.create({
    trigger: '[data-bandeau]', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = self.getVelocity();
      if (v !== 0) sens = v > 0 ? 1 : -1;
      gsap.to(tween, { timeScale: sens * (1 + Math.min(Math.abs(v) / 300, 6)), duration: 0.2, overwrite: true });
      gsap.to(tween, { timeScale: sens, duration: 1.2, delay: 0.2, overwrite: false });
    },
  });
}

/* ================= COLLECTION ================= */
const ORDRE = ['linea', 'flow', 'twist', 'paper', 'concrete', 'dia', 'solo', 'fluffy'];
function collection() {
  const section = document.querySelector('[data-collection]');
  const piste = section.querySelector('[data-collection-piste]');
  const rendre = () => {
    piste.innerHTML = ORDRE.map((s) => carteCollection(produit(s))).join('');
    magnetiques(piste);
  };
  rendre();
  onLangue(() => { rendre(); piste.querySelectorAll('.modele').forEach(revelerCarteSansAnim); });

  piste.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ajout-rapide]');
    if (!b) return;
    const carte = b.closest('.modele');
    ajoutDirect(b.dataset.ajoutRapide, carte.querySelector('.modele__img') || b, PRODUITS);
  });
  piste.addEventListener('pointerover', (e) => {
    const s = e.target.closest('.modele__scene');
    if (s) gsap.to(s.querySelector('.modele__img--2'), { opacity: 1, duration: 0.5 });
  });
  piste.addEventListener('pointerout', (e) => {
    const s = e.target.closest('.modele__scene');
    if (s && !s.contains(e.relatedTarget)) gsap.to(s.querySelector('.modele__img--2'), { opacity: 0, duration: 0.5 });
  });

  if (estCalme()) { section.classList.add('sans-epingle'); return; }

  mm.add(grandEcran, () => {
    const distance = () => piste.scrollWidth - window.innerWidth;
    const tw = gsap.to(piste, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: 0.8, pin: true, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    piste.querySelectorAll('.modele').forEach((carte) => {
      preparerCarte(carte);
      ScrollTrigger.create({
        trigger: carte, containerAnimation: tw, start: 'left 92%', once: true,
        onEnter: () => revelerCarte(carte),
      });
    });
    return () => section.classList.remove('sans-epingle');
  });
  mm.add('(max-width: 900px)', () => {
    section.classList.add('sans-epingle');
    const fen = section.querySelector('[data-collection-fenetre]');
    const io = new IntersectionObserver((entrees) => entrees.forEach((en) => {
      if (en.isIntersecting) { revelerCarte(en.target); io.unobserve(en.target); }
    }), { root: fen, threshold: 0.4 });
    piste.querySelectorAll('.modele').forEach((c) => { preparerCarte(c); io.observe(c); });
    return () => { io.disconnect(); section.classList.remove('sans-epingle'); };
  });
}
function revelerCarteSansAnim(carte) {
  carte.dataset.revele = '1';
  gsap.set(carte.querySelectorAll('.modele__trajet path'), { clearProps: 'all' });
  gsap.set(carte.querySelector('.modele__img:not(.modele__img--2)'), { clearProps: 'clipPath' });
  const tr = carte.querySelector('.modele__trajet .trajet');
  if (tr) gsap.set(tr, { opacity: 0.18 });
}
function preparerCarte(carte) {
  const img = carte.querySelector('.modele__img:not(.modele__img--2)');
  const chemins = carte.querySelectorAll('.modele__trajet path');
  if (!img || !chemins.length) return;
  gsap.set(chemins, { drawSVG: 0 });
  gsap.set(img, { clipPath: 'inset(100% 0% 0% 0%)' });
}
function revelerCarte(carte) {
  if (carte.dataset.revele) return;
  carte.dataset.revele = '1';
  const contour = carte.querySelector('.modele__trajet .contour');
  const trajet = carte.querySelector('.modele__trajet .trajet');
  const img = carte.querySelector('.modele__img:not(.modele__img--2)');
  if (!trajet || !img) return;
  gsap.timeline()
    .to(contour, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut' })
    .to(trajet, { drawSVG: '100%', duration: 1.5, ease: 'none' }, 0.2)
    .to(img, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'steps(20)' }, 1.1)
    .to(trajet, { opacity: 0.18, duration: 0.6 }, 1.6);
}

/* ================= FABRICATION ================= */
function fabrication() {
  const canvas = document.querySelector('[data-process-canvas]');
  const g = canvas.getContext('2d');
  const lecture = document.querySelector('[data-process-couche]');
  const etapes = [...document.querySelectorAll('[data-etapes] .etape')];
  const fo = FORMES.flow.forme;
  const N = 120;
  /* interpolation des rangées de la vraie silhouette Flow */
  const rangs = fo.couches;
  const couche = (i) => {
    const f = (i / (N - 1)) * (rangs.length - 1);
    const a = rangs[Math.floor(f)]; const b = rangs[Math.min(rangs.length - 1, Math.ceil(f))];
    const k = f - Math.floor(f);
    return { y: a[0] + (b[0] - a[0]) * k, x0: a[1] + (b[1] - a[1]) * k, x1: a[2] + (b[2] - a[2]) * k };
  };
  const C = Array.from({ length: N }, (_, i) => couche(i));
  const yMin = Math.min(...C.map((c) => c.y)); const yMax = Math.max(...C.map((c) => c.y));
  let W = 0; let H = 0;
  const taille = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    dessiner(etat.p);
  };
  const etat = { p: estCalme() ? 1 : 0 };
  function dessiner(p) {
    g.clearRect(0, 0, W, H);
    const marge = 0.12;
    const sc = Math.min(W, H) * (1 - marge * 2) / Math.max(yMax - yMin, 520);
    const ox = W / 2 - 500 * sc;
    const oy = H * (1 - marge) - yMax * sc;
    /* grille */
    g.strokeStyle = 'rgba(238,234,227,0.06)';
    g.lineWidth = 1;
    for (let x = 0; x < W; x += W / 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += H / 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    /* plateau */
    const yPlateau = oy + yMax * sc + 4;
    g.fillStyle = '#2e2c2a';
    g.fillRect(W * 0.12, yPlateau, W * 0.76, 6);
    const actu = p * N;
    const n = Math.floor(actu);
    const ep = Math.max(1.4, ((yMax - yMin) * sc) / N * 0.86);
    for (let i = 0; i < Math.min(n, N); i++) {
      const c = C[i];
      const age = actu - i;
      const chaud = Math.max(0, 1 - age / 14);
      const r = Math.round(200 + 55 * chaud); const gg = Math.round(195 - 105 * chaud); const b = Math.round(185 - 154 * chaud);
      g.fillStyle = `rgb(${r},${gg},${b})`;
      g.fillRect(ox + c.x0 * sc, oy + c.y * sc - ep / 2, (c.x1 - c.x0) * sc, ep);
    }
    if (p > 0 && p < 1) {
      const c = C[Math.min(n, N - 1)];
      const k = actu - n;
      const sens = n % 2 ? -1 : 1;
      const xa = ox + c.x0 * sc; const xb = ox + c.x1 * sc;
      const xn = sens > 0 ? xa + (xb - xa) * k : xb - (xb - xa) * k;
      const yn = oy + c.y * sc;
      g.fillStyle = '#ff5a1f';
      g.fillRect(Math.min(xa, xn), yn - ep / 2, Math.abs(xn - xa) * (sens > 0 ? 1 : 0) + (sens < 0 ? Math.abs(xb - xn) : 0), ep);
      const grad = g.createRadialGradient(xn, yn, 0, xn, yn, 26);
      grad.addColorStop(0, 'rgba(255,90,31,0.9)');
      grad.addColorStop(1, 'rgba(255,90,31,0)');
      g.fillStyle = grad;
      g.beginPath(); g.arc(xn, yn, 26, 0, Math.PI * 2); g.fill();
      /* buse */
      g.fillStyle = '#c9a23a';
      g.beginPath(); g.moveTo(xn - 9, yn - 26); g.lineTo(xn + 9, yn - 26); g.lineTo(xn + 3, yn - 6); g.lineTo(xn - 3, yn - 6); g.closePath(); g.fill();
      g.fillStyle = '#3a3836';
      g.fillRect(xn - 22, yn - 58, 44, 32);
    }
    lecture.textContent = `${t('couche')} ${String(Math.min(N, Math.ceil(actu))).padStart(3, '0')} / ${N}`;
  }
  new ResizeObserver(taille).observe(canvas);
  onLangue(() => dessiner(etat.p));
  const activer = (p) => {
    const k = Math.min(etapes.length - 1, Math.floor(p * etapes.length * 0.999));
    etapes.forEach((e, i) => e.classList.toggle('est-active', estCalme() || i <= k));
  };
  if (estCalme()) { activer(1); return; }
  mm.add(grandEcran, () => {
    gsap.to(etat, {
      p: 1, ease: 'none',
      scrollTrigger: {
        trigger: '.process__grid', start: 'top 14%', end: () => `+=${Math.max(900, document.querySelector('[data-etapes]').offsetHeight * 1.6)}`,
        scrub: 0.5, pin: true, pinSpacing: true, anticipatePin: 1,
        onUpdate: (self) => activer(self.progress),
      },
      onUpdate: () => dessiner(etat.p),
    });
  });
  mm.add('(max-width: 900px)', () => {
    const tw = gsap.to(etat, { p: 1, duration: 9, ease: 'none', repeat: -1, repeatDelay: 1.2, onUpdate: () => dessiner(etat.p), paused: true });
    const st = ScrollTrigger.create({ trigger: canvas, start: 'top 80%', end: 'bottom top', onToggle: (s) => (s.isActive ? tw.play() : tw.pause()) });
    etapes.forEach((e) => e.classList.add('est-active'));
    return () => { tw.kill(); st.kill(); };
  });
}

/* ================= COULEURS ================= */
const MODELES_COULEURS = ['linea', 'flow', 'twist', 'paper', 'dia', 'concrete'];
function couleurs() {
  const section = document.querySelector('[data-couleurs]');
  const onglets = section.querySelector('[data-couleurs-onglets]');
  const nuancier = section.querySelector('[data-couleurs-nuancier]');
  const nomEl = section.querySelector('[data-couleurs-nom]');
  const infoEl = section.querySelector('[data-couleurs-info]');
  const lien = section.querySelector('[data-couleurs-lien]');
  const scene = section.querySelector('[data-couleurs-scene]');
  let choix = { slug: 'linea', fin: 'unis', couleur: 'bleu-nuit' };
  const p0 = produit('linea');
  const imp = new Impression(scene, {
    src: couleur(p0, 'bleu-nuit', 'unis').c.img(1200), box: boiteUV(formeDe(p0).bbox), ratio: 1, fit: 0.98, couches: 50, progres: estCalme() ? 1 : 0,
  });
  ScrollTrigger.create({ trigger: scene, start: 'top 70%', once: true, onEnter: () => imp.pret.then(() => imp.imprimer({ duree: 2, ease: 'power1.inOut' })) });

  const teinte = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255; const gg = (n >> 8) & 255; const b = n & 255;
    const m = (a, c) => Math.round(a * 0.91 + c * 0.09);
    return `rgb(${m(238, r)},${m(234, gg)},${m(227, b)})`;
  };
  const majTextes = () => {
    const p = produit(choix.slug);
    const { c, f } = couleur(p, choix.couleur, choix.fin);
    nomEl.textContent = nomCouleur(c);
    infoEl.textContent = `${p.nom} · ${p.finitions.length > 1 ? `${t(f.id)} · ` : ''}${f.des ? `${t('des')} ` : ''}${prix(f.prix)}`;
    lien.setAttribute('href', lienProduit(p.slug));
  };
  const rendreOnglets = () => {
    onglets.innerHTML = MODELES_COULEURS.map((s) => `<button class="onglet" type="button" data-modele-coul="${s}" aria-pressed="${s === choix.slug}">${produit(s).nom}</button>`).join('');
  };
  const rendreNuancier = () => {
    const p = produit(choix.slug);
    nuancier.innerHTML = p.finitions.map((f) => f.couleurs.map((c) => `<button class="nuance" type="button" style="background:${fondNuance(c)}" data-nuance="${c.slug}" data-fin="${f.id}" aria-pressed="${c.slug === choix.couleur && f.id === choix.fin}" aria-label="${nomCouleur(c)}${p.finitions.length > 1 ? ` (${t(f.id)})` : ''}"></button>`).join('')).join('');
  };
  const appliquer = async (anim = true) => {
    const p = produit(choix.slug);
    const { c, f } = couleur(p, choix.couleur, choix.fin);
    choix.fin = f.id; choix.couleur = c.slug;
    majTextes();
    rendreNuancier();
    gsap.to(section, { backgroundColor: teinte(c.hex), duration: estCalme() ? 0 : 0.9 });
    if (anim) await imp.changer(c.img(1200), { box: boiteUV(formeDe(p).bbox), duree: 1.4 });
  };
  rendreOnglets(); rendreNuancier(); majTextes();
  gsap.set(section, { backgroundColor: teinte(couleur(p0, 'bleu-nuit').c.hex) });
  onLangue(() => { rendreOnglets(); appliquer(false); });

  onglets.addEventListener('click', (e) => {
    const b = e.target.closest('[data-modele-coul]');
    if (!b || b.dataset.modeleCoul === choix.slug) return;
    const p = produit(b.dataset.modeleCoul);
    choix = { slug: p.slug, fin: p.finitions[0].id, couleur: p.finitions[0].couleurs[0].slug };
    rendreOnglets();
    appliquer();
  });
  nuancier.addEventListener('click', (e) => {
    const b = e.target.closest('[data-nuance]');
    if (!b) return;
    choix.couleur = b.dataset.nuance; choix.fin = b.dataset.fin;
    appliquer();
  });
  section.querySelector('[data-couleurs-ajouter]').addEventListener('click', (e) => {
    const p = produit(choix.slug);
    const f = finition(p, choix.fin);
    ajouterAuPanier({ slug: p.slug, fin: f.id, couleur: choix.couleur, taille: f.tailles[0]?.id }, scene);
  });
  lien.addEventListener('click', () => memoriserChoix(choix.slug, choix.couleur, choix.fin));
}

/* ================= SAISON ================= */
function saison() {
  const zone = document.querySelector('[data-saison]');
  const rendre = () => {
    zone.innerHTML = SAISON.articles.map(({ slug, couleur: cs }) => {
      const p = produit(slug);
      const { c, f } = couleur(p, cs);
      return `<a class="saison__item" href="${lienProduit(slug)}" data-saison-lien="${slug}|${c.slug}|${f.id}" data-curseur-label="voir.curseur">
        <img src="${c.img(600)}" alt="${p.nom}, ${nomCouleur(c).toLowerCase()}" loading="lazy" width="600" height="600">
        <div><b>${p.nom}</b><span class="mono muet">${nomCouleur(c)} · ${f.des ? `${t('des')} ` : ''}${prix(f.prix)}</span></div></a>`;
    }).join('');
  };
  rendre();
  onLangue(rendre);
  zone.addEventListener('click', (e) => {
    const a = e.target.closest('[data-saison-lien]');
    if (!a) return;
    const [slug, c, fin] = a.dataset.saisonLien.split('|');
    memoriserChoix(slug, c, fin);
  });
  if (!estCalme()) {
    gsap.from(zone.children, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: zone, start: 'top 85%', once: true } });
  }
}

/* ================= ENSEMBLE ================= */
const CHOIX_ENSEMBLE = [
  ['linea', 'unis', 'bleu-nuit'], ['flow', 'unis', 'vert-olive'], ['twist', 'unis', 'orange'], ['paper', 'unis', 'bleu'],
  ['concrete', 'unis', 'gris-beton'], ['dia', 'unis', 'sable-rose'], ['linea', 'bicolores', 'cuivre'], ['flow', 'unis', 'lavande'],
];
function ensemble() {
  const etagere = document.querySelector('[data-etagere]');
  const objets = etagere.querySelector('[data-etagere-objets]');
  const vide = etagere.querySelector('[data-etagere-vide]');
  const liste = document.querySelector('[data-ensemble-choix]');
  const totauxEl = document.querySelector('[data-ensemble-totaux]');
  const jaugeEl = document.querySelector('[data-ensemble-jauge]');
  const bouton = document.querySelector('[data-ensemble-ajouter]');
  const depart = [0, 2, 5];
  let selection = estCalme() ? [...depart] : [];
  const ligne = () => (window.matchMedia('(max-width: 700px)').matches ? 0.575 : 0.555);

  const rendreListe = () => {
    liste.innerHTML = CHOIX_ENSEMBLE.map(([s, f, c], i) => {
      const p = produit(s);
      const cc = couleur(p, c, f).c;
      return `<button class="choix__btn" type="button" data-choix="${i}" aria-pressed="${selection.includes(i)}" aria-label="${t('choisir', { nom: `${p.nom} ${nomCouleur(cc).toLowerCase()}` })}"><img src="${cc.img(600)}" alt="" loading="lazy"><span class="choix__nom">${p.nom}</span></button>`;
    }).join('');
  };
  const placer = (el, i, n) => {
    const r = etagere.getBoundingClientRect();
    const [s] = CHOIX_ENSEMBLE[selection[i]];
    const fo = formeDe(produit(s));
    const largeur = r.width * (n === 1 ? 0.34 : 0.3);
    const basObjet = fo.bbox[3] / 1000;
    const yLigne = r.height * ligne();
    const centres = n === 1 ? [0.5] : n === 2 ? [0.36, 0.64] : [0.24, 0.5, 0.76];
    el.style.width = `${largeur}px`;
    el.style.left = `${r.width * centres[i] - largeur / 2}px`;
    el.style.top = `${yLigne - largeur * basObjet}px`;
    el.style.bottom = 'auto';
  };
  const rendreEtagere = (nouveau = null) => {
    const n = selection.length;
    const existants = new Map([...objets.children].map((el) => [+el.dataset.idx, el]));
    existants.forEach((el, idx) => {
      if (!selection.includes(idx)) {
        gsap.to(el, { y: -80, opacity: 0, duration: estCalme() ? 0 : 0.4, ease: 'power2.in', onComplete: () => el.remove() });
      }
    });
    selection.forEach((idx, i) => {
      let el = existants.get(idx);
      if (!el) {
        const [s, f, c] = CHOIX_ENSEMBLE[idx];
        el = document.createElement('div');
        el.className = 'etagere__objet';
        el.dataset.idx = idx;
        el.innerHTML = `<img src="${couleur(produit(s), c, f).c.img(600)}" alt="">`;
        objets.append(el);
      }
      const avant = el.getBoundingClientRect();
      placer(el, i, n);
      if (idx === nouveau && !estCalme()) {
        gsap.fromTo(el, { y: -etagere.offsetHeight * 0.75, rotation: gsap.utils.random(-16, 16), opacity: 1 }, { y: 0, rotation: 0, duration: 1.05, ease: 'bounce.out' });
        gsap.fromTo(el, { scaleY: 1 }, { scaleY: 0.94, duration: 0.08, yoyo: true, repeat: 1, delay: 0.55, transformOrigin: '50% 100%' });
      } else if (avant.width && !estCalme()) {
        const apres = el.getBoundingClientRect();
        gsap.from(el, { x: avant.left - apres.left, duration: 0.7, ease: 'expo.out' });
      }
    });
    vide.hidden = n > 0;
    const lignes = selection.map((idx) => { const [s, f, c] = CHOIX_ENSEMBLE[idx]; return { slug: s, fin: f, couleur: c, taille: finition(produit(s), f).tailles[0]?.id, qte: 1 }; });
    const tt = totaux(lignes);
    totauxEl.innerHTML = lignes.length ? `
      ${lignes.map((l) => `<div><span>${produit(l.slug).nom} · ${nomCouleur(couleur(produit(l.slug), l.couleur, l.fin).c)}</span><span>${prix(finition(produit(l.slug), l.fin).prix)}</span></div>`).join('')}
      <div><span>${t('livraison')}</span><span>${tt.liv === 0 ? t('offerte') : prix(tt.liv)}</span></div>
      <div class="total"><span>${t('total')}</span><span>${prix(tt.total)}</span></div>` : '';
    const pct = Math.min(100, (tt.sous / SITE.livraison.seuil) * 100);
    jaugeEl.innerHTML = lignes.length ? `<div class="jauge__texte">${tt.manque > 0 ? t('plusQue', { x: `<b>${prix(tt.manque)}</b>` }) : `<b>${t('livraisonOfferte')}</b>`}</div><div class="jauge__barre"><div class="jauge__rempli" style="width:${pct}%"></div></div>` : '';
    bouton.disabled = !lignes.length;
    liste.querySelectorAll('[data-choix]').forEach((b) => b.setAttribute('aria-pressed', String(selection.includes(+b.dataset.choix))));
  };
  rendreListe();
  liste.addEventListener('click', (e) => {
    const b = e.target.closest('[data-choix]');
    if (!b) return;
    const i = +b.dataset.choix;
    if (selection.includes(i)) { selection = selection.filter((x) => x !== i); rendreEtagere(); return; }
    if (selection.length >= 3) selection.shift();
    selection.push(i);
    rendreEtagere(i);
  });
  bouton.addEventListener('click', () => {
    selection.forEach((idx, k) => {
      const [s, f, c] = CHOIX_ENSEMBLE[idx];
      ajouterAuPanier({ slug: s, fin: f, couleur: c, taille: finition(produit(s), f).tailles[0]?.id }, objets.children[k], true);
    });
    toast(t('ensembleAjoute'));
  });
  onLangue(() => { rendreListe(); rendreEtagere(); });
  new ResizeObserver(() => { selection.forEach((idx, i) => { const el = objets.querySelector(`[data-idx="${idx}"]`); if (el) placer(el, i, selection.length); }); }).observe(etagere);
  /* premier rendu : les trois objets tombent quand l'étagère arrive à l'écran */
  ScrollTrigger.create({
    trigger: etagere, start: 'top 70%', once: true,
    onEnter: () => {
      if (estCalme()) return;
      depart.forEach((idx, k) => gsap.delayedCall(0.2 + k * 0.3, () => { if (!selection.includes(idx) && selection.length < 3) { selection.push(idx); rendreEtagere(idx); } }));
    },
  });
  rendreEtagere();
}

/* ================= SUR MESURE ================= */
function surMesure() {
  const f = document.querySelector('[data-mesure-form]');
  const pas = [...f.querySelectorAll('[data-pas]')];
  const barres = [...f.querySelectorAll('.formulaire__etapes span')];
  const etiquette = f.querySelector('[data-mesure-etape]');
  const prec = f.querySelector('[data-mesure-prec]');
  const suiv = f.querySelector('[data-mesure-suiv]');
  const err = f.querySelector('[data-mesure-erreur]');
  const ok = f.querySelector('[data-mesure-ok]');
  let k = 0;
  const maj = () => {
    pas.forEach((p, i) => { p.hidden = i !== k; });
    barres.forEach((b, i) => b.classList.toggle('est-fait', i <= k));
    etiquette.textContent = t('etape', { n: k + 1, t: pas.length });
    prec.hidden = k === 0;
    suiv.querySelector('span').textContent = k === pas.length - 1 ? t('envoyer') : t('continuer');
    err.hidden = true;
  };
  const valide = () => {
    if (k === 0 && !f.querySelector('#mes-desc').value.trim()) return t('errDesc');
    if (k === 2) {
      const v = (s) => f.querySelector(s).value.trim();
      if (!v('#mes-prenom') || !v('#mes-nom') || !/\S+@\S+\.\S+/.test(v('#mes-email'))) return t('errContact');
    }
    return null;
  };
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const m = valide();
    if (m) { err.hidden = false; err.textContent = m; return; }
    if (k < pas.length - 1) {
      k++; maj();
      if (!estCalme()) gsap.from(pas[k], { x: 40, opacity: 0, duration: 0.5, ease: 'expo.out' });
      pas[k].querySelector('input, textarea')?.focus();
      return;
    }
    pas.forEach((p) => { p.hidden = true; });
    ok.hidden = false;
    suiv.hidden = true; prec.hidden = true;
    etiquette.textContent = '';
    barres.forEach((b) => b.classList.add('est-fait'));
  });
  prec.addEventListener('click', () => { k = Math.max(0, k - 1); maj(); });
  onLangue(maj);
  maj();
}

/* ================= COMMUNAUTÉ ================= */
function communaute() {
  const zone = document.querySelector('[data-communaute]');
  const IMGS = [
    ['flow', 'unis', 'rose'], ['paper', 'unis', 'vert-olive'], ['linea', 'bicolores', 'turquoise'], ['twist', 'unis', 'lavande'],
    ['dia', 'unis', 'bleu-nuit'], ['concrete', 'unis', 'noir'], ['linea', 'unis', 'orange'], ['flow', 'bicolores', 'cuivre'],
  ];
  const cols = [0, 1, 2, 3].map((k) => IMGS.filter((_, i) => i % 4 === k));
  zone.innerHTML = cols.map((col) => `<div class="communaute__col">${col.map(([s, f, c]) => {
    const p = produit(s); const cc = couleur(p, c, f).c;
    return `<a href="${lienProduit(s)}" data-saison-lien="${s}|${c}|${f}" data-curseur-label="voir.curseur"><img src="${cc.img(600)}" alt="${p.nom}, ${nomCouleur(cc).toLowerCase()}" loading="lazy"></a>`;
  }).join('')}</div>`).join('');
  zone.addEventListener('click', (e) => {
    const a = e.target.closest('[data-saison-lien]');
    if (a) { const [s, c, f] = a.dataset.saisonLien.split('|'); memoriserChoix(s, c, f); }
  });
  if (estCalme()) return;
  zone.querySelectorAll('.communaute__col').forEach((col, i) => {
    gsap.fromTo(col, { y: i % 2 ? 80 : 0 }, { y: i % 2 ? -40 : 40, ease: 'none', scrollTrigger: { trigger: zone, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

function newsletter() {
  const f = document.querySelector('[data-newsletter]');
  const retour = f.querySelector('[data-news-retour]');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = /\S+@\S+\.\S+/.test(f.querySelector('#news-email').value) && f.querySelector('#news-accord').checked;
    retour.hidden = false;
    retour.textContent = ok ? t('newsOk') : t('newsErr');
    retour.style.color = ok ? 'var(--succes)' : 'var(--orange-texte)';
  });
}

/* ================= DÉMARRAGE ================= */
const lancerHeros = heros();
herosDefilement();
bandeau();
collection();
fabrication();
couleurs();
saison();
ensemble();
carteSuisse(document.querySelector('[data-carte]'));
matiere(document.querySelector('[data-matiere]'));
surMesure();
communaute();
newsletter();

ScrollTrigger.sort();
(document.fonts?.ready || Promise.resolve()).then(() => {
  ScrollTrigger.refresh();
  intro().then(() => {
    lancerHeros();
    ScrollTrigger.refresh();
    if (location.hash && document.querySelector(location.hash)) setTimeout(() => allerA(location.hash), 120);
  });
});
