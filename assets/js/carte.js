/* Carte de la Suisse : livraisons depuis l'atelier de Bienne (tracés illustratifs). */
import { SUISSE } from './suisse.js?v=20261028';
import { gsap, estCalme, langue, onLangue } from './core.js?v=20261028';

const LIBELLES = ['Zurich', 'Genève', 'Bâle', 'Berne', 'Lausanne', 'Lucerne', 'Lugano', 'Saint-Gall', 'Coire', 'Sion', 'Neuchâtel'];

export function carteSuisse(el) {
  const { w, h, outline, lakes, villes } = SUISSE;
  const bienne = villes.find((v) => v.fr === 'Bienne');
  const routes = villes.filter((v) => v !== bienne).map((v) => {
    const mx = (bienne.x + v.x) / 2;
    const my = (bienne.y + v.y) / 2 - Math.hypot(v.x - bienne.x, v.y - bienne.y) * 0.22;
    return `<path class="route" d="M${bienne.x} ${bienne.y} Q${mx.toFixed(1)} ${my.toFixed(1)} ${v.x} ${v.y}"/>`;
  }).join('');
  const nom = (v) => (langue() === 'de' ? v.de : v.fr);
  const pts = villes.filter((v) => v !== bienne).map((v) => `<g class="ville"><circle cx="${v.x}" cy="${v.y}" r="3.2"/>${LIBELLES.includes(v.fr) ? `<text x="${v.x + 7}" y="${v.y + 4}" data-ville="${v.fr}">${nom(v)}</text>` : ''}</g>`).join('');
  el.innerHTML = `<svg viewBox="-10 -10 ${w + 20} ${h + 20}" aria-hidden="true">
    <defs><clipPath id="clip-suisse"><path d="${outline}"/></clipPath></defs>
    <path class="pays" d="${outline}"/>
    <g clip-path="url(#clip-suisse)">${lakes.map((d) => `<path class="lac" d="${d}"/>`).join('')}</g>
    <g data-routes>${routes}</g>
    ${pts}
    <g class="bienne"><circle class="pulse" cx="${bienne.x}" cy="${bienne.y}" r="7"/><circle class="c" cx="${bienne.x}" cy="${bienne.y}" r="6"/><text x="${bienne.x - 12}" y="${bienne.y - 14}" text-anchor="end" data-ville="Bienne">${langue() === 'de' ? 'Biel/Bienne · Atelier D3CO' : 'Biel/Bienne · atelier D3CO'}</text></g>
  </svg>`;
  onLangue(() => {
    el.querySelectorAll('[data-ville]').forEach((tx) => {
      const v = villes.find((x) => x.fr === tx.dataset.ville);
      tx.textContent = v.fr === 'Bienne' ? (langue() === 'de' ? 'Biel/Bienne · Atelier D3CO' : 'Biel/Bienne · atelier D3CO') : nom(v);
    });
  });
  if (estCalme()) return;
  const chemins = el.querySelectorAll('.route');
  gsap.set(chemins, { strokeDasharray: 'none' });
  gsap.from(chemins, {
    drawSVG: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.07,
    scrollTrigger: { trigger: el, start: 'top 75%', once: true },
    onComplete: () => gsap.set(chemins, { clearProps: 'strokeDasharray,strokeDashoffset' }),
  });
  gsap.from(el.querySelectorAll('.ville'), {
    scale: 0, transformOrigin: 'center', opacity: 0, duration: 0.6, ease: 'back.out(3)', stagger: 0.05, delay: 0.6,
    scrollTrigger: { trigger: el, start: 'top 75%', once: true },
  });
}
