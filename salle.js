import * as THREE from 'three';
const $ = s => document.querySelector(s);
const V = window.VUES, PI = window.PIECES;

const canvas = $('#scene');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#nogl').hidden = false; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0B0D17); scene.fog = new THREE.Fog(0x0B0D17, 45, 90);
const camera = new THREE.PerspectiveCamera(55, 1, .1, 200);
const touch = matchMedia('(pointer:coarse)').matches;

// Dimensions (m) : salle 32 x 26, hauteur 8. Scène au fond (z négatif), entrée côté z positif.
const X = 16, Z = 13, HC = 8, SD = 5, SW = 12, SH = 1;
const STAGE_Z = -Z + SD; // nez de scène

const manager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(manager);
manager.onProgress = (u, a, b) => { const p = Math.round(a / b * 100); $('#loadbar').style.width = p + '%'; $('#pct').textContent = p + ' %'; };
manager.onLoad = () => { $('#load').style.opacity = 0; $('#loadtxt').hidden = true; $('#go').hidden = false; window.__salle.ready = true; };
function tex(u) { const t = loader.load(u + '?v=2'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; }
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); } return t;
}
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pickables = [];
function pickable(m, key) { m.userData.piece = key; pickables.push(m); return m; }
const blob = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const glowT = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
function shadow(w, d, x, z, o = .55) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, opacity: o })); m.rotation.x = -Math.PI / 2; m.position.set(x, .004, z); scene.add(m); }
function pool(r, x, z, col, o = .5, y = .006) { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: glowT, color: col, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; }

// ---------- Salle ----------
const carpet = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#141831'; g.fillRect(0, 0, w, h);
  const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.4; } g.putImageData(id, 0, 0);
  g.strokeStyle = 'rgba(232,137,43,.07)'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(w / 2, h / 2, 60 + k * 50, 0, 7); g.stroke(); }
}, [8, 6]);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, 2 * Z), new THREE.MeshStandardMaterial({ map: carpet, roughness: .95 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1d33, roughness: .9 });
const drape = canvasTex(256, 64, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 22 + 14 * Math.sin(x / 4) + 6 * Math.sin(x / 1.3); g.fillStyle = `rgb(${v},${v + 3},${v + 18})`; g.fillRect(x, 0, 1, h); } }, [24, 1]);
const drapeMat = new THREE.MeshStandardMaterial({ map: drape, roughness: 1 });
function wall(w, x, z, ry, mat) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, HC), mat); m.position.set(x, HC / 2, z); m.rotation.y = ry; scene.add(m); }
wall(2 * X, 0, -Z, 0, drapeMat); wall(2 * X, 0, Z, Math.PI, wallMat); wall(2 * Z, X, 0, -Math.PI / 2, drapeMat); wall(2 * Z, -X, 0, Math.PI / 2, drapeMat);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, 2 * Z), new THREE.MeshStandardMaterial({ color: 0x0B0D17, roughness: 1 }));
ceil.rotation.x = Math.PI / 2; ceil.position.y = HC; scene.add(ceil);
// porte d'entrée (double) au centre du mur côté z+
const door = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3), new THREE.MeshStandardMaterial({ color: 0x262C51, roughness: .6, metalness: .2 }));
door.position.set(0, 1.5, Z - .01); door.rotation.y = Math.PI; scene.add(door);

// ---------- Lumières ----------
scene.add(new THREE.HemisphereLight(0xb9c0e6, 0x0B0D17, .55));
const key = new THREE.DirectionalLight(0xdfe6ff, .55); key.position.set(4, 12, 10); scene.add(key);
const sp = new THREE.SpotLight(0xffffff, 260, 40, .5, .6, 1.6); sp.position.set(0, 9, 4); sp.target.position.set(0, 1, -9); scene.add(sp, sp.target);
const sp2 = new THREE.SpotLight(0xffe9d6, 120, 30, .55, .7, 1.6); sp2.position.set(9, 7, 6); sp2.target.position.set(9, 1, 12.5); scene.add(sp2, sp2.target);
const sp3 = new THREE.SpotLight(0xffe9d6, 120, 30, .6, .7, 1.6); sp3.position.set(-6, 7, 6); sp3.target.position.set(-5, 1, 11.5); scene.add(sp3, sp3.target);
const ptB = new THREE.PointLight(0xE8892B, 60, 22, 1.4); ptB.position.set(-10, 4, -6); scene.add(ptB);
const ptV = new THREE.PointLight(0x262C51, 60, 22, 1.4); ptV.position.set(10, 4, -6); scene.add(ptV);
const ptS = new THREE.PointLight(0xffb763, 40, 18, 1.4); ptS.position.set(0, 4, -8); scene.add(ptS);

// ---------- Scène ----------
const black = new THREE.MeshStandardMaterial({ color: 0x0b0c18, roughness: .7 });
const metal = new THREE.MeshStandardMaterial({ color: 0x9aa0b8, roughness: .35, metalness: .8 });
const stage = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, SD), black); stage.position.set(0, SH / 2, -Z + SD / 2); scene.add(stage);
const stageTop = new THREE.Mesh(new THREE.PlaneGeometry(SW, SD), new THREE.MeshStandardMaterial({ color: 0x12142b, roughness: .25, metalness: .3 }));
stageTop.rotation.x = -Math.PI / 2; stageTop.position.set(0, SH + .002, -Z + SD / 2); scene.add(stageTop);
// front de scène
const front = pickable(new THREE.Mesh(new THREE.PlaneGeometry(SW, .6), new THREE.MeshBasicMaterial({ map: tex('img/front.jpg'), toneMapped: false })), 'front');
front.position.set(0, .5, STAGE_Z + .005); scene.add(front);
// marches
for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.4, SH * (k + 1) / 3, .35), black); s.position.set(-SW / 2 + 1.6, SH * (k + 1) / 6, STAGE_Z + .35 * (3 - k) - .17); scene.add(s); }
// écran LED 9 x 5 m
const SCW = 9, SCH = 5.06;
const scr = pickable(new THREE.Mesh(new THREE.PlaneGeometry(SCW, SCH), new THREE.MeshBasicMaterial({ map: tex('img/ecran.jpg'), toneMapped: false })), 'ecran');
scr.position.set(0, SH + .6 + SCH / 2, -Z + .25); scene.add(scr);
const frame = new THREE.Mesh(new THREE.BoxGeometry(SCW + .3, SCH + .3, .2), black); frame.position.set(0, scr.position.y, -Z + .14); scene.add(frame);
const halo = new THREE.Mesh(new THREE.PlaneGeometry(SCW * 1.8, SCH * 1.9), new THREE.MeshBasicMaterial({ map: glowT, color: 0xE8892B, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false }));
halo.position.set(0, scr.position.y, -Z + .03); scene.add(halo);
// totems de structure (truss) de part et d'autre
function truss(x) {
  const g = new THREE.Group(); const h = 7;
  [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]].forEach(([a, b]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, h, 6), metal); t.position.set(a, h / 2, b); g.add(t); });
  for (let y = .3; y < h; y += .5) { const r = new THREE.Mesh(new THREE.BoxGeometry(.4, .02, .4), metal); r.position.y = y; g.add(r); }
  g.position.set(x, SH, -Z + 1.2); scene.add(g);
}
truss(-SW / 2 + .4); truss(SW / 2 - .4);
const bar = new THREE.Mesh(new THREE.BoxGeometry(SW - .4, .4, .4), metal); bar.position.set(0, SH + 7, -Z + 1.2); scene.add(bar);
// faisceaux lumineux (lyres)
const beams = [];
[-4.5, -1.5, 1.5, 4.5].forEach((x, k) => {
  const fix = new THREE.Mesh(new THREE.CylinderGeometry(.14, .18, .35, 12), black); fix.position.set(x, SH + 6.6, -Z + 1.2); scene.add(fix);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: k % 2 ? 0x262C51 : 0xE8892B, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  cone.geometry.translate(0, -4.5, 0); cone.position.copy(fix.position); cone.rotation.x = .55; cone.rotation.z = (k - 1.5) * .18; scene.add(cone); beams.push(cone);
});
// pupitre (60 x 110 cm)
const pup = new THREE.Group();
const pbody = new THREE.Mesh(new THREE.BoxGeometry(.66, 1.12, .5), black); pbody.position.y = .56; pup.add(pbody);
const pface = pickable(new THREE.Mesh(new THREE.PlaneGeometry(.6, 1.1), new THREE.MeshBasicMaterial({ map: tex('img/pupitre.jpg'), toneMapped: false })), 'pupitre');
pface.position.set(0, .56, .252); pup.add(pface);
const ptop = new THREE.Mesh(new THREE.BoxGeometry(.7, .04, .55), black); ptop.position.set(0, 1.14, -.02); ptop.rotation.x = -.18; pup.add(ptop);
const mic = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .4, 6), metal); mic.position.set(.12, 1.32, .1); mic.rotation.x = .5; pup.add(mic);
pup.position.set(-3.4, SH, STAGE_Z - 1.4); pup.rotation.y = .25; scene.add(pup);
pool(1.4, -3.4, STAGE_Z - 1.4, 0xffffff, .25, SH + .01);
// kakémonos
const kakT = tex('img/kakemono.jpg');
function kakemono(x, z, ry, y0 = 0) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(.9, .09, .25), metal); base.position.y = .045; g.add(base);
  const k = pickable(new THREE.Mesh(new THREE.PlaneGeometry(.8, 2), new THREE.MeshBasicMaterial({ map: kakT, toneMapped: false })), 'kakemono'); k.position.set(0, 1.09, 0); g.add(k);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(.8, 2), black); back.position.set(0, 1.09, -.004); back.rotation.y = Math.PI; g.add(back);
  g.position.set(x, y0, z); g.rotation.y = ry; scene.add(g); shadow(1.4, .7, x, z, .5);
}
kakemono(-SW / 2 - 1.2, STAGE_Z + .4, .3); kakemono(SW / 2 + 1.2, STAGE_Z + .4, -.3);
kakemono(-2.4, Z - .9, Math.PI); kakemono(2.4, Z - .9, Math.PI);

// ---------- Tables et chaises (30 x 10 couverts) ----------
const TX = [-10.2, -6.6, -3, 3, 6.6, 10.2], TZ = [-4.4, -1.2, 2, 5.2, 8.4];
const tables = []; TX.forEach(x => TZ.forEach(z => tables.push([x, z])));
const cloth = new THREE.MeshStandardMaterial({ color: 0xf2f3f8, roughness: .85 });
const tGeo = new THREE.CylinderGeometry(.9, .98, .76, 32, 1, true); const tTop = new THREE.CircleGeometry(.9, 32);
const chairSeat = new THREE.BoxGeometry(.44, .07, .44), chairBack = new THREE.BoxGeometry(.44, .5, .05);
const chairMat = new THREE.MeshStandardMaterial({ color: 0xc8ccd8, roughness: .3, metalness: .6 });
const cushion = new THREE.MeshStandardMaterial({ color: 0x262C51, roughness: .9 });
const N = tables.length * 10;
const seats = new THREE.InstancedMesh(chairSeat, cushion, N), backs = new THREE.InstancedMesh(chairBack, chairMat, N);
const dm = new THREE.Object3D(); let ci = 0;
const cartonGeo = new THREE.PlaneGeometry(.15, .105); const cartonMat = new THREE.MeshBasicMaterial({ map: tex('img/carton-face.jpg'), toneMapped: false, side: THREE.DoubleSide });
const centre = new THREE.MeshBasicMaterial({ color: 0xffc98a, toneMapped: false });
tables.forEach(([x, z]) => {
  const t = new THREE.Mesh(tGeo, cloth); t.position.set(x, .38, z); scene.add(t);
  const top = new THREE.Mesh(tTop, cloth); top.rotation.x = -Math.PI / 2; top.position.set(x, .761, z); scene.add(top);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, .32, 16), centre); c.position.set(x, .92, z); scene.add(c);
  pool(.7, x, z, 0xffb763, .35, .765);
  const ct = pickable(new THREE.Mesh(cartonGeo, cartonMat), 'carton'); ct.position.set(x + .38, .82, z + .2); ct.rotation.y = .9; ct.rotation.x = -.18; scene.add(ct);
  const ct2 = new THREE.Mesh(cartonGeo, cartonMat); ct2.position.set(x + .38 - .06 * Math.sin(.9), .82, z + .2 - .06 * Math.cos(.9)); ct2.rotation.y = .9 + Math.PI; ct2.rotation.x = -.18; scene.add(ct2);
  shadow(3.2, 3.2, x, z, .55);
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2 + .3, r = 1.32;
    dm.position.set(x + Math.sin(a) * r, .46, z + Math.cos(a) * r); dm.rotation.set(0, a, 0); dm.updateMatrix(); seats.setMatrixAt(ci, dm.matrix);
    dm.position.set(x + Math.sin(a) * (r + .21), .74, z + Math.cos(a) * (r + .21)); dm.updateMatrix(); backs.setMatrixAt(ci, dm.matrix); ci++;
  }
});
scene.add(seats, backs);
// régie technique au fond de salle
const regie = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.2), black); regie.position.set(0, .5, 10.4); scene.add(regie);
const regieL = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .35), new THREE.MeshBasicMaterial({ color: 0xE8892B, toneMapped: false, transparent: true, opacity: .6 })); regieL.position.set(0, 1.01, 10.4); regieL.rotation.x = -Math.PI / 2; scene.add(regieL);

// ---------- Accueil (côté entrée) ----------
function label(w, h, draw) { return canvasTex(w, h, draw); }
const counterFront = tex('img/comptoir.jpg');
const counter = new THREE.Group();
const cbody = new THREE.Mesh(new THREE.BoxGeometry(4, 1.05, .7), black); cbody.position.y = .525; counter.add(cbody);
const cface = pickable(new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: counterFront, toneMapped: false })), 'comptoir'); cface.position.set(0, .52, .352); counter.add(cface);
const ctop = new THREE.Mesh(new THREE.BoxGeometry(4.1, .05, .8), new THREE.MeshStandardMaterial({ color: 0xe9edf4, roughness: .4 })); ctop.position.y = 1.075; counter.add(ctop);
for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.12, .02, .17), new THREE.MeshBasicMaterial({ color: [0xE8892B, 0xffffff, 0x262C51][k] })); b.position.set(-.9 + k * .25, 1.11, 0); counter.add(b); }
counter.position.set(-9, 0, 11.3); counter.rotation.y = Math.PI; scene.add(counter); shadow(5, 1.6, -9, 11.3);
// chevalets
function easel(img, w, h, x, z, ry, key) {
  const g = new THREE.Group();
  const p = pickable(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(img), toneMapped: false })), key); p.position.set(0, .75 + h / 2, .03); p.rotation.x = -.06; g.add(p);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(w + .04, h + .04, .02), black); bk.position.set(0, .75 + h / 2, .01); bk.rotation.x = -.06; g.add(bk);
  [[-w / 2 + .05, .1], [w / 2 - .05, .1], [0, -.45]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .75 + h, 6), metal); l.position.set(a, (.75 + h) / 2, b); l.rotation.x = b < 0 ? .32 : -.05; g.add(l); });
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); shadow(1.4, 1, x, z, .45);
}
easel('img/accueil.jpg', .84, 1.19, -5.4, 11.2, Math.PI + .25, 'accueil');
easel('img/fleche-salle.jpg', .84, .59, 4.6, 10.9, Math.PI - .2, 'fleche');
// photocall 3 x 2,30 m
const pc = new THREE.Group();
const pcw = pickable(new THREE.Mesh(new THREE.PlaneGeometry(4, 2.25), new THREE.MeshBasicMaterial({ map: tex('img/photocall.jpg'), toneMapped: false, color: 0xdddddd })), 'photocall'); pcw.position.set(0, 1.125 + .05, 0); pc.add(pcw);
const pcf = new THREE.Mesh(new THREE.BoxGeometry(4.12, 2.37, .08), metal); pcf.position.set(0, 1.175, -.045); pc.add(pcf);
const rug = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.2), new THREE.MeshStandardMaterial({ color: 0x0B0D17, roughness: .9 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .006, 1.2); pc.add(rug);
const strip = new THREE.Mesh(new THREE.PlaneGeometry(4, .06), new THREE.MeshBasicMaterial({ color: 0xE8892B, toneMapped: false })); strip.rotation.x = -Math.PI / 2; strip.position.set(0, .008, 2.3); pc.add(strip);
pc.position.set(10, 0, 12.4); pc.rotation.y = Math.PI; scene.add(pc);
pool(2.6, 10, 11.4, 0xffffff, .18);
// potelets et cordon vers le photocall
const velvet = new THREE.MeshStandardMaterial({ color: 0xE8892B, roughness: .8 });
[[7.6, 9.6], [9, 9.4], [10.4, 9.4], [11.8, 9.6]].forEach(([x, z], k, a) => {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .95, 8), metal); p.position.set(x, .475, z); scene.add(p);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .03, 16), metal); b.position.set(x, .015, z); scene.add(b);
  if (k < a.length - 1) { const [x2, z2] = a[k + 1]; const len = Math.hypot(x2 - x, z2 - z); const c = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, len, 6), velvet); c.position.set((x + x2) / 2, .82, (z + z2) / 2); c.rotation.z = Math.PI / 2; c.rotation.y = -Math.atan2(z2 - z, x2 - x); scene.add(c); }
});

// ---------- Caméra en orbite ----------
const target = new THREE.Vector3(...V[0].target); let dist = V[0].dist, az = V[0].az, el = V[0].el;
let anim = null, current = 0, touring = false, tourTimer = null;
function applyCam() { camera.position.set(target.x + dist * Math.sin(az) * Math.cos(el), target.y + dist * Math.sin(el), target.z + dist * Math.cos(az) * Math.cos(el)); camera.lookAt(target); }
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function go(i, dur = 2200, done) {
  current = (i + V.length) % V.length; const v = V[current];
  let a1 = v.az; while (a1 - az > Math.PI) a1 -= 2 * Math.PI; while (az - a1 > Math.PI) a1 += 2 * Math.PI;
  anim = { t0: performance.now(), dur, t0v: target.clone(), t1v: new THREE.Vector3(...v.target), d0: dist, d1: v.dist, a0: az, a1, e0: el, e1: v.el, done };
  $('#cap-t').textContent = v.t; $('#cap-d').textContent = v.d; $('#caption').hidden = false;
  document.querySelectorAll('#views button').forEach((b, k) => b.setAttribute('aria-pressed', k === current));
}
// boutons des vues
V.forEach((v, k) => { const b = document.createElement('button'); b.textContent = v.t; b.setAttribute('aria-pressed', k === 0); b.onclick = () => { stopTour(); closeFiche(); go(k); }; $('#views').appendChild(b); });

// ---------- Fiche d'une pièce ----------
function openFiche(key, move = true) {
  const p = PI[key]; if (!p) return; stopTour();
  $('#f-img').src = p.img + '?v=2'; $('#f-img').alt = p.t; $('#f-k').textContent = p.k; $('#f-t').textContent = p.t; $('#f-d').textContent = p.d;
  $('#fiche').hidden = false; $('#caption').hidden = true;
  if (move) { const k = V.findIndex(v => v.id === p.vue); if (k >= 0 && k !== current) go(k, 1600); }
}
function closeFiche() { $('#fiche').hidden = true; $('#caption').hidden = false; }
$('#fclose').onclick = closeFiche;

// ---------- Visite guidée ----------
function tourStep() { if (!touring) return; go(current + 1, 2600, () => { tourTimer = setTimeout(tourStep, 2600); }); }
function startTour() { touring = true; closeFiche(); $('#tour .ico').textContent = '❚❚'; $('#tourlbl').textContent = 'Pause'; go(current, 1200, () => { tourTimer = setTimeout(tourStep, 2400); }); }
function stopTour() { touring = false; clearTimeout(tourTimer); $('#tour .ico').textContent = '▶'; $('#tourlbl').textContent = 'Visite guidée'; }
$('#tour').onclick = () => touring ? stopTour() : startTour();
$('#prev').onclick = () => { stopTour(); closeFiche(); go(current - 1); };
$('#next').onclick = () => { stopTour(); closeFiche(); go(current + 1); };
let hintT; function hint() { const h = $('#hint'); h.textContent = touch ? 'Glissez pour tourner autour, pincez pour zoomer. Touchez un écran, un kakémono ou le photocall pour voir la pièce.' : 'Glissez pour tourner autour, molette pour zoomer. Cliquez sur l’écran, un kakémono, le photocall ou l’accueil pour voir la pièce.'; h.hidden = false; clearTimeout(hintT); hintT = setTimeout(() => h.hidden = true, 6500); }
$('#help').onclick = hint;

// ---------- Commandes ----------
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
const ptrs = new Map(); let down = null, pinch0 = 0;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); down = { x: e.clientX, y: e.clientY, moved: 0 }; canvas.classList.add('drag');
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
canvas.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) { hover(e); return; }
  const [lx, ly] = ptrs.get(e.pointerId); const dx = e.clientX - lx, dy = e.clientY - ly; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (down) down.moved += Math.abs(dx) + Math.abs(dy);
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) { dist = THREE.MathUtils.clamp(dist * pinch0 / d, 3, 40); } pinch0 = d; return; }
  if (down && down.moved > 6) { if (touring) stopTour(); anim = null; const k = touch ? .006 : .0045; az -= dx * k; el = THREE.MathUtils.clamp(el + dy * k, .02, 1.35); }
});
canvas.addEventListener('pointerup', e => { ptrs.delete(e.pointerId); canvas.classList.remove('drag'); if (down && down.moved <= 6 && ptrs.size === 0) click(e); if (ptrs.size === 0) down = null; pinch0 = 0; });
canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); down = null; pinch0 = 0; });
function pick(e) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects(pickables, false)[0]; }
function hover(e) { if (touch) return; canvas.classList.toggle('hover', !!pick(e)); }
function click(e) { const h = pick(e); if (h) openFiche(h.object.userData.piece); }
canvas.addEventListener('wheel', e => { e.preventDefault(); stopTour(); anim = null; dist = THREE.MathUtils.clamp(dist * (1 + e.deltaY * .001), 3, 40); }, { passive: false });
addEventListener('keydown', e => { if (e.code === 'Escape') closeFiche(); if (e.code === 'ArrowRight') { stopTour(); go(current + 1); } if (e.code === 'ArrowLeft') { stopTour(); go(current - 1); } });

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < .8 ? 70 : 52; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

let last = performance.now();
function loop(now) {
  const t = now / 1000; last = now;
  if (anim) { const u = Math.min(1, (now - anim.t0) / anim.dur), k = ease(u); target.lerpVectors(anim.t0v, anim.t1v, k); dist = anim.d0 + (anim.d1 - anim.d0) * k; az = anim.a0 + (anim.a1 - anim.a0) * k; el = anim.e0 + (anim.e1 - anim.e0) * k;
    if (u >= 1) { const d = anim.done; anim = null; d && d(); } }
  beams.forEach((b, k) => { b.rotation.z = (k - 1.5) * .18 + Math.sin(t * .6 + k) * .22; b.rotation.x = .55 + Math.sin(t * .4 + k * 2) * .12; });
  halo.material.opacity = .3 + Math.sin(t * 1.2) * .06;
  applyCam(); renderer.render(scene, camera); requestAnimationFrame(loop);
}

function enter(withTour) { $('#intro').classList.add('out'); setTimeout(() => $('#intro').hidden = true, 800); canvas.focus(); go(0, 10); if (withTour) startTour(); else hint(); }
$('#enter').onclick = () => enter(false); $('#enter-tour').onclick = () => enter(true);

window.__salle = { ready: false, enter, go: (i, d) => go(i, d || 10), openFiche, closeFiche, startTour, stopTour,
  setView: (tx, ty, tz, d, a, e) => { anim = null; target.set(tx, ty, tz); dist = d; az = a; el = e; } };

document.fonts.load('700 40px Roboto').catch(() => {}).then(() => { applyCam(); requestAnimationFrame(loop); });
