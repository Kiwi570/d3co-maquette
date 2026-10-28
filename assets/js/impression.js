/* Effet signature : une vraie photo s'imprime couche par couche.
   WebGL (OGL) avec buse incandescente, couches chaudes qui refroidissent, vue éclatée.
   Repli Canvas 2D quand WebGL n'est pas disponible. */
import { Renderer, Program, Mesh, Texture, Triangle } from '../vendor/ogl/ogl.js';
import { webglOk, estCalme, gsap } from './core.js?v=20261028';

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform sampler2D tPrev;
uniform float uPrev;
uniform vec2 uRes;
uniform float uImgRatio;
uniform float uFit;
uniform vec4 uBox;
uniform float uProgress;
uniform float uLayers;
uniform float uExplode;
uniform vec2 uOffset;
varying vec2 vUv;

vec4 lire(sampler2D t, vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(t, uv);
}

void main() {
  float ca = uRes.x / uRes.y;
  vec2 p = vUv - 0.5 - uOffset;
  if (ca > uImgRatio) p.x *= ca / uImgRatio; else p.y *= uImgRatio / ca;
  p /= uFit;
  vec2 uv = p + 0.5;

  float h0 = uBox.y;
  float span = uBox.w - uBox.y;
  vec2 suv = uv;

  if (uExplode > 0.001) {
    const int N = 11;
    float sh = span / float(N);
    float trouve = 0.0;
    for (int i = 0; i < N; i++) {
      float fi = float(i);
      float off = (fi - float(N - 1) * 0.5) * uExplode * sh * 0.6;
      float xo = (mod(fi, 2.0) < 0.5 ? 1.0 : -1.0) * uExplode * 0.03;
      float yy = uv.y - off;
      float lo = h0 + fi * sh;
      if (yy >= lo && yy < lo + sh) { suv = vec2(uv.x - xo, yy); trouve = 1.0; }
    }
    if (trouve < 0.5 && uv.y >= h0 - 0.02) { gl_FragColor = vec4(0.0); return; }
  }

  vec4 col = lire(tMap, suv);
  float lh = span / uLayers;
  float cur = h0 + span * uProgress;
  float coucheCur = floor((cur - h0) / lh);
  float couchePix = floor((suv.y - h0) / lh);
  float fracL = fract((cur - h0) / lh);
  float sens = mod(coucheCur, 2.0) < 0.5 ? 1.0 : -1.0;
  float nx = sens > 0.0 ? mix(uBox.x, uBox.z, fracL) : mix(uBox.z, uBox.x, fracL);

  float imprime = 0.0;
  if (suv.y < h0) imprime = smoothstep(0.0, 0.5, uProgress);
  else if (couchePix < coucheCur) imprime = 1.0;
  else if (couchePix == coucheCur) imprime = sens > 0.0 ? step(suv.x, nx) : step(nx, suv.x);
  if (uProgress >= 0.9999) imprime = 1.0;

  vec4 prec = uPrev > 0.5 ? lire(tPrev, suv) : vec4(0.0);
  vec4 sortie = mix(prec, col, imprime);

  vec3 orange = vec3(1.0, 0.353, 0.122);
  if (uProgress < 0.9999) {
    float age = max(coucheCur - couchePix, 0.0);
    float chaleur = (imprime > 0.5 && suv.y >= h0) ? exp(-age * 0.42) : 0.0;
    sortie.rgb = mix(sortie.rgb, orange, chaleur * 0.8 * col.a);
    float f = fract((suv.y - h0) / lh);
    float strie = smoothstep(0.0, 0.3, f) * smoothstep(1.0, 0.7, f);
    sortie.rgb *= mix(1.0, 0.8 + 0.2 * strie, (1.0 - uProgress) * imprime * col.a);

    if (uProgress > 0.0001) {
      vec2 d = vec2((uv.x - nx) * uImgRatio, uv.y - (h0 + (coucheCur + 0.5) * lh));
      float point = exp(-dot(d, d) * 7000.0);
      float halo = exp(-dot(d, d) * 600.0) * 0.35;
      float xmin = min(uBox.x, uBox.z) - 0.03;
      float xmax = max(uBox.x, uBox.z) + 0.03;
      float ligne = exp(-pow((uv.y - cur) * 320.0, 2.0)) * step(xmin, uv.x) * step(uv.x, xmax) * 0.45;
      float g = clamp(point + halo + ligne, 0.0, 1.0);
      sortie.rgb = mix(sortie.rgb, orange, g);
      sortie.a = max(sortie.a, g);
    }
  }
  gl_FragColor = sortie;
}`;

const charger = (src) => new Promise((ok, ko) => {
  const im = new Image();
  im.decoding = 'async';
  im.onload = () => ok(im);
  im.onerror = ko;
  im.src = src;
});

export class Impression {
  constructor(conteneur, { src, box = [0, 0, 1, 1], ratio = 1, fit = 0.92, couches = 60, offset = [0, 0], progres = 0 }) {
    this.el = conteneur;
    this.repli = conteneur.querySelector('.impression__repli');
    this.etat = { progres, eclate: 0 };
    this.box = box;
    this.ratio = ratio;
    this.fit = fit;
    this.couches = couches;
    this.offset = offset;
    this.gl = webglOk;
    this.pret = this.monter(src);
  }

  async monter(src) {
    const img = await charger(src);
    this.img = img;
    if (this.gl) {
      try { this.monterGL(img); } catch (e) { this.gl = false; }
    }
    if (!this.gl) this.monter2D(img);
    if (this.repli) {
      this.repli.style.visibility = 'hidden';
      // le canvas est décoratif : l'alternative texte de l'image passe sur la scène
      if (this.repli.alt && !this.el.hasAttribute('aria-label')) { this.el.setAttribute('role', this.el.getAttribute('role') || 'img'); this.el.setAttribute('aria-label', this.repli.alt); }
    }
    const ro = new ResizeObserver(() => this.taille());
    ro.observe(this.el);
    this.taille();
    return this;
  }

  monterGL(img) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new Renderer({ dpr, alpha: true, premultipliedAlpha: false, antialias: false });
    const gl = this.renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    this.canvas = gl.canvas;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.el.prepend(this.canvas);
    const opts = { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR };
    this.tex = new Texture(gl, opts);
    this.tex.image = img;
    this.texPrec = new Texture(gl, opts);
    this.texPrec.image = img;
    this.program = new Program(gl, {
      vertex,
      fragment,
      transparent: false,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tMap: { value: this.tex },
        tPrev: { value: this.texPrec },
        uPrev: { value: 0 },
        uRes: { value: [1, 1] },
        uImgRatio: { value: this.ratio },
        uFit: { value: this.fit },
        uBox: { value: this.box },
        uProgress: { value: this.etat.progres },
        uLayers: { value: this.couches },
        uExplode: { value: 0 },
        uOffset: { value: this.offset },
      },
    });
    this.mesh = new Mesh(gl, { geometry: new Triangle(gl), program: this.program });
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.perdu = true; if (this.repli) this.repli.style.visibility = 'visible'; this.canvas.style.display = 'none'; });
  }

  monter2D(img) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.el.prepend(this.canvas);
    this.prec = null;
  }

  taille() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (this.renderer) {
      this.renderer.setSize(r.width, r.height);
      this.program.uniforms.uRes.value = [r.width, r.height];
    } else if (this.ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = r.width * dpr;
      this.canvas.height = r.height * dpr;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
    }
    this.rendre();
  }

  rendre() {
    if (this.perdu) return;
    if (this.renderer) {
      const u = this.program.uniforms;
      u.uProgress.value = this.etat.progres;
      u.uExplode.value = this.etat.eclate;
      this.renderer.render({ scene: this.mesh });
      return;
    }
    if (!this.ctx) return;
    const c = this.canvas; const g = this.ctx;
    g.clearRect(0, 0, c.width, c.height);
    const ca = c.width / c.height;
    let w; let h;
    if (ca > this.ratio) { h = c.height * this.fit; w = h * this.ratio; } else { w = c.width * this.fit; h = w / this.ratio; }
    const x = (c.width - w) / 2 + this.offset[0] * c.width;
    const y = (c.height - h) / 2 - this.offset[1] * c.height;
    const [, by0, , by1] = this.box;
    const p = this.etat.progres;
    const yCoupe = y + h * (1 - (by0 + (by1 - by0) * p));
    if (this.prec && p < 1) {
      g.save(); g.beginPath(); g.rect(0, 0, c.width, yCoupe); g.clip();
      g.drawImage(this.prec, x, y, w, h); g.restore();
    }
    g.save(); g.beginPath(); g.rect(0, p >= 1 ? 0 : yCoupe, c.width, c.height); g.clip();
    g.drawImage(this.img, x, y, w, h); g.restore();
    if (p > 0 && p < 1) {
      g.fillStyle = '#ff5a1f';
      g.fillRect(x + w * this.box[0], yCoupe - 1, w * (this.box[2] - this.box[0]), 2);
    }
  }

  set progres(v) { this.etat.progres = v; this.rendre(); }
  get progres() { return this.etat.progres; }
  set eclate(v) { this.etat.eclate = v; this.rendre(); }

  imprimer({ duree = 2.4, delai = 0, ease = 'none' } = {}) {
    if (estCalme()) { this.progres = 1; return Promise.resolve(); }
    gsap.killTweensOf(this.etat, 'progres');
    return new Promise((ok) => {
      gsap.fromTo(this.etat, { progres: 0 }, {
        progres: 1, duration: duree, delay: delai, ease,
        onUpdate: () => this.rendre(),
        onComplete: () => { this.rendre(); ok(); },
      });
    });
  }

  /* change d'image ; la nouvelle s'imprime par-dessus l'ancienne */
  async changer(src, { box, ratio, duree = 1.5 } = {}) {
    await this.pret;
    const img = await charger(src);
    const ancienne = this.img;
    this.img = img;
    if (box) this.box = box;
    if (ratio) this.ratio = ratio;
    if (this.renderer) {
      const u = this.program.uniforms;
      this.texPrec.image = ancienne;
      this.tex.image = img;
      u.uPrev.value = 1;
      u.uBox.value = this.box;
      u.uImgRatio.value = this.ratio;
    } else {
      this.prec = ancienne;
    }
    this.etat.progres = 0;
    await this.imprimer({ duree, ease: 'power1.inOut' });
    if (this.renderer) this.program.uniforms.uPrev.value = 0;
    this.prec = null;
  }
}

/* boîte de l'objet (coordonnées 0..1000, y vers le bas) vers uv (y vers le haut) */
export const boiteUV = (bbox) => [bbox[0] / 1000, 1 - bbox[3] / 1000, bbox[2] / 1000, 1 - bbox[1] / 1000];
