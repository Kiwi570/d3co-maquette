/* Section Matière : la macro des stries est ré-éclairée par le curseur (WebGL)
   et la buse dépose un filament orange qui refroidit en graphite (Canvas 2D). */
import { Renderer, Program, Mesh, Texture, Triangle } from '../vendor/ogl/ogl.js';
import { webglOk, estCalme, estTactile, t, onLangue } from './core.js?v=20261028';

const vertex = /* glsl */ `
attribute vec2 uv; attribute vec2 position; varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uRes;
uniform float uImgRatio;
uniform vec2 uMouse;
uniform float uForce;
varying vec2 vUv;
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  float ca = uRes.x / uRes.y;
  vec2 uv = vUv - 0.5;
  if (ca > uImgRatio) uv.y *= uImgRatio / ca; else uv.x *= ca / uImgRatio;
  uv += 0.5;
  vec2 e = vec2(1.5 / 1800.0, 1.5 / 1013.0);
  vec3 c = texture2D(tMap, uv).rgb;
  float dx = lum(texture2D(tMap, uv + vec2(e.x, 0.0)).rgb) - lum(texture2D(tMap, uv - vec2(e.x, 0.0)).rgb);
  float dy = lum(texture2D(tMap, uv + vec2(0.0, e.y)).rgb) - lum(texture2D(tMap, uv - vec2(0.0, e.y)).rgb);
  vec3 n = normalize(vec3(-dx * 7.0, -dy * 7.0, 1.0));
  vec2 frag = vUv * uRes;
  vec2 m = uMouse * uRes;
  vec3 L = normalize(vec3((m - frag) / max(uRes.x, uRes.y), 0.22));
  float diff = max(dot(n, L), 0.0);
  float dist = length((m - frag) / max(uRes.x, uRes.y));
  float spot = exp(-dist * dist * 9.0) * uForce;
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(n, H), 0.0), 40.0) * spot;
  vec3 col = c * (0.72 + 0.38 * diff * (0.45 + spot));
  col += vec3(1.0, 0.55, 0.3) * spec * 0.55;
  col = mix(col, col * vec3(1.03, 0.98, 0.95), spot * 0.4);
  gl_FragColor = vec4(col, 1.0);
}`;

export function matiere(section) {
  const repli = section.querySelector('[data-matiere-repli]');
  const aide = section.querySelector('.matiere__aide');
  if (estTactile() && aide) {
    const maj = () => { aide.textContent = t('mat.aide.tactile'); };
    aide.removeAttribute('data-i18n');
    maj();
    onLangue(maj);
  }
  const imgEl = repli?.querySelector('img');
  const trace = document.createElement('canvas');
  trace.className = 'matiere__trace';
  trace.setAttribute('aria-hidden', 'true');
  section.insertBefore(trace, section.querySelector('.matiere__aide'));
  const g = trace.getContext('2d');
  let pts = [];
  let souris = [0.62, 0.55];
  let force = 0.6;
  let rendu = null;
  let visible = false;

  if (webglOk && !estCalme()) {
    try {
      const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: false, antialias: false });
      const gl = renderer.gl;
      const canvas = gl.canvas;
      canvas.className = 'matiere__gl';
      canvas.setAttribute('aria-hidden', 'true');
      section.insertBefore(canvas, trace);
      const tex = new Texture(gl, { generateMipmaps: false });
      const program = new Program(gl, {
        vertex, fragment,
        uniforms: { tMap: { value: tex }, uRes: { value: [1, 1] }, uImgRatio: { value: 1800 / 1013 }, uMouse: { value: souris }, uForce: { value: force } },
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
      const im = new Image();
      im.onload = () => { tex.image = im; repli.style.visibility = 'hidden'; rendu(); };
      im.src = imgEl.currentSrc || imgEl.src;
      rendu = () => {
        program.uniforms.uMouse.value = souris;
        program.uniforms.uForce.value = force;
        renderer.render({ scene: mesh });
      };
      const taille = () => {
        const r = section.getBoundingClientRect();
        renderer.setSize(r.width, r.height);
        program.uniforms.uRes.value = [r.width, r.height];
        rendu();
      };
      new ResizeObserver(taille).observe(section);
      taille();
    } catch (e) { rendu = null; }
  }

  const tailleTrace = () => {
    const r = section.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    trace.width = r.width * dpr; trace.height = r.height * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(tailleTrace).observe(section);
  tailleTrace();

  let boucle = null;
  const dessiner = () => {
    const now = performance.now();
    pts = pts.filter((p) => now - p.t < 3800);
    const r = section.getBoundingClientRect();
    g.clearRect(0, 0, r.width, r.height);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]; const b = pts[i];
      if (b.t - a.t > 120) continue;
      const age = (now - b.t) / 3800;
      const chaud = Math.max(0, 1 - age * 3);
      const r1 = Math.round(21 + (255 - 21) * chaud);
      const g1 = Math.round(21 + (90 - 21) * chaud);
      const b1 = Math.round(21 + (31 - 21) * chaud);
      g.strokeStyle = `rgba(${r1},${g1},${b1},${(1 - age) * 0.92})`;
      g.lineWidth = 5.5;
      g.shadowColor = chaud > 0.2 ? 'rgba(255,90,31,0.7)' : 'transparent';
      g.shadowBlur = 14 * chaud;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
    if (rendu) rendu();
    if (pts.length && visible) boucle = requestAnimationFrame(dessiner); else boucle = null;
  };
  const relancer = () => { if (!boucle) boucle = requestAnimationFrame(dessiner); };

  section.addEventListener('pointermove', (e) => {
    const r = section.getBoundingClientRect();
    const x = e.clientX - r.left; const y = e.clientY - r.top;
    souris = [x / r.width, 1 - y / r.height];
    force = 1;
    if (!estCalme()) pts.push({ x, y, t: performance.now() });
    if (pts.length > 400) pts.shift();
    relancer();
  });
  section.addEventListener('pointerleave', () => { force = 0.6; relancer(); });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) relancer(); }).observe(section);
}
