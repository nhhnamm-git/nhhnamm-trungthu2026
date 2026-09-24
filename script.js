const container = document.getElementById("webgl-container");
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  window.innerWidth < 768;
const rnd = (a, b) => a + Math.random() * (b - a);
const LCOL = [0xe63946, 0xffc107, 0xff7a1a, 0x3ea34a, 0x2f7fd6];

const scene = new THREE.Scene();
// NỀN TRỜI XANH
(function () {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, "#1a2f9c");
  g.addColorStop(0.45, "#2a52c4");
  g.addColorStop(0.8, "#4a82e0");
  g.addColorStop(1, "#7fb0f0");
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 70; i++) {
    x.fillStyle = "rgba(150,190,255," + (0.05 + Math.random() * 0.07) + ")";
    x.beginPath();
    x.ellipse(Math.random() * 1024, Math.random() * 900, 90 + Math.random() * 200, 10 + Math.random() * 25, -0.15, 0, Math.PI * 2);
    x.fill();
  }
  for (let i = 0; i < 500; i++) {
    x.fillStyle = "rgba(255,240,190," + (0.2 + Math.random() * 0.5) + ")";
    x.beginPath();
    x.arc(Math.random() * 1024, Math.random() * 800, Math.random() * 1.8 + 0.4, 0, Math.PI * 2);
    x.fill();
  }
  scene.background = new THREE.CanvasTexture(c);
})();
scene.fog = new THREE.FogExp2(0x3a68d0, 0.0045);

const camera = new THREE.PerspectiveCamera(isMobile ? 60 : 45, window.innerWidth / window.innerHeight, 0.1, 1000);
const DEFAULT_CAM_POS = isMobile ? new THREE.Vector3(0, 11, 36) : new THREE.Vector3(0, 9, 30);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 3, -3);
camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.03; // không xuống dưới mặt đất
controls.minDistance = 6;
controls.maxDistance = 65;
controls.target.copy(DEFAULT_CAM_TARGET);

// LIGHTS
scene.add(new THREE.AmbientLight(0x5a6fc0, 1.6));
const yardLight = new THREE.PointLight(0xffb070, 2.4, 50);
yardLight.position.set(0, 8, 2);
scene.add(yardLight);
const stageLight = new THREE.PointLight(0xffe0a0, 2.2, 28);
stageLight.position.set(0, 6, -11);
scene.add(stageLight);

// TEXTURES + VẬT LIỆU
function createParticleTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.4, "rgba(240,182,188,0.6)");
  g.addColorStop(1, "rgba(240,182,188,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}
function createSoftTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.6, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}
const glowTex = createParticleTexture();
const leafTex = createSoftTexture();

const _mc = {};
const M = (c, e = 0.15) => {
  const k = c + "_" + e;
  return _mc[k] || (_mc[k] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, emissive: c, emissiveIntensity: e }));
};
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2216, roughness: 0.95, flatShading: true });
const skinM = M(0xf2c9a0, 0.2);
const hairM = M(0x111111, 0);
const SPH = new THREE.SphereGeometry(1, 12, 10);
const mkGlow = (c, s, o = 0.5) => {
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.scale.set(s, s, 1);
  return g;
};
const sph = (mat, sx, sy, sz, x, y, z) => {
  const m = new THREE.Mesh(SPH, mat);
  m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
  m.position.set(x || 0, y || 0, z || 0);
  return m;
};

// TRĂNG + CHÚ CUỘI
function createMoonTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  const h = x.createRadialGradient(256, 256, 120, 256, 256, 256);
  h.addColorStop(0, "rgba(255,220,120,0.55)");
  h.addColorStop(1, "rgba(255,220,120,0)");
  x.fillStyle = h; x.fillRect(0, 0, 512, 512);
  const d = x.createRadialGradient(236, 236, 20, 256, 256, 150);
  d.addColorStop(0, "#ffe27a"); d.addColorStop(1, "#f2c14e");
  x.fillStyle = d;
  x.beginPath(); x.arc(256, 256, 150, 0, Math.PI * 2); x.fill();
  for (let i = 0; i < 700; i++) {
    const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 148;
    x.fillStyle = Math.random() < 0.5 ? "rgba(255,245,190,0.35)" : "rgba(214,160,60,0.25)";
    x.beginPath(); x.arc(256 + Math.cos(a) * r, 256 + Math.sin(a) * r, Math.random() * 2.2 + 0.4, 0, 6.283); x.fill();
  }
  x.fillStyle = "#2a52c4";
  x.beginPath(); x.ellipse(320, 372, 70, 16, 0, 0, 6.283); x.fill();
  x.fillStyle = "#6b3a1e"; x.fillRect(296, 345, 40, 18);
  x.fillStyle = "#e0453a"; x.beginPath(); x.ellipse(316, 330, 22, 24, 0, 0, 6.283); x.fill();
  x.strokeStyle = "#e0453a"; x.lineWidth = 8; x.lineCap = "round";
  x.beginPath(); x.moveTo(330, 320); x.lineTo(352, 288); x.stroke();
  x.fillStyle = "#f2c9a0"; x.beginPath(); x.arc(316, 298, 13, 0, 6.283); x.fill();
  x.fillStyle = "#8e1f1f"; x.beginPath(); x.ellipse(316, 288, 15, 8, 0, Math.PI, 0); x.fill();
  return new THREE.CanvasTexture(c);
}
const moon = new THREE.Sprite(new THREE.SpriteMaterial({
  map: createMoonTexture(), transparent: true, fog: false, toneMapped: false, depthWrite: false,
}));
moon.scale.set(46, 46, 1);
moon.position.set(26, 40, -95);
moon.renderOrder = -1;
scene.add(moon);

// ================= MẶT ĐẤT (thay cho đảo nổi) =================
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(220, 64),
  new THREE.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 1, flatShading: true })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// sân đình: nơi rước đèn, múa lân, văn nghệ
const YARD_R = 18;
const yard = new THREE.Mesh(new THREE.CircleGeometry(YARD_R, 64), new THREE.MeshStandardMaterial({ color: 0x9a7548, roughness: 0.95 }));
yard.rotation.x = -Math.PI / 2;
yard.position.y = 0.04;
scene.add(yard);
const yardEdge = new THREE.Mesh(new THREE.TorusGeometry(YARD_R, 0.2, 6, 72), new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 }));
yardEdge.rotation.x = Math.PI / 2;
yardEdge.position.y = 0.1;
scene.add(yardEdge);

// cột đèn quanh sân
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2 + 0.4, c = LCOL[i % 5];
  const g = new THREE.Group();
  g.position.set(Math.cos(a) * 18.8, 0, Math.sin(a) * 18.8);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.6, 6), trunkMat);
  pole.position.y = 2.3;
  const lamp = sph(M(c, 0.85), 0.55, 0.5, 0.55, 0, 4.9, 0);
  const glow = mkGlow(c, 4.5, 0.45);
  glow.position.y = 4.9;
  g.add(pole, lamp, glow);
  scene.add(g);
}

// ================= CÂY CỔ THỤ (đứng dưới đất) =================
const leafCols = [0x2f6b3a, 0x3f8a4a, 0x5aa04f, 0x1f4f36, 0x8fb24a, 0xc9b04a].map((h) => new THREE.Color(h));
const leafPerTree = isMobile ? 2300 : 3800;

function createAncientTree(x, z, s, rot) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  g.rotation.y = rot;

  const tg = new THREE.CylinderGeometry(0.6, 1.15, 6, 10, 6);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    const n = (Math.random() - 0.5) * 0.12;
    tp.setX(i, tp.getX(i) + n + Math.sin(tp.getY(i) * 0.7) * 0.12);
    tp.setZ(i, tp.getZ(i) + n);
  }
  tg.computeVertexNormals();
  const trunk = new THREE.Mesh(tg, trunkMat);
  trunk.position.y = 3;
  g.add(trunk);

  for (let i = 0; i < 6; i++) { // rễ nổi
    const a = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.32, 1.7, 6), trunkMat);
    r.position.set(Math.cos(a) * 0.95, 0.45, Math.sin(a) * 0.95);
    r.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
    g.add(r);
  }

  const clusters = [{ c: new THREE.Vector3(0, 8.2, 0), r: 3.4 }, { c: new THREE.Vector3(0, 6.2, 0), r: 3.6 }];
  const bn = 7;
  for (let i = 0; i < bn; i++) {
    const a = (i / bn) * Math.PI * 2 + Math.random() * 0.4;
    const y0 = 3.6 + Math.random() * 2.2, len = 3 + Math.random() * 1.8;
    const st = new THREE.Vector3(Math.cos(a) * 0.4, y0, Math.sin(a) * 0.4);
    const en = new THREE.Vector3(Math.cos(a) * len, y0 + 1.6 + Math.random() * 1.2, Math.sin(a) * len);
    const mid = st.clone().add(en).multiplyScalar(0.5);
    mid.y -= 0.3;
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([st, mid, en]), 10, 0.2, 6, false), trunkMat));
    clusters.push({ c: en, r: 2.5 + Math.random() * 0.6 });
  }

  const pos = new Float32Array(leafPerTree * 3), col = new Float32Array(leafPerTree * 3);
  for (let i = 0; i < leafPerTree; i++) {
    const cl = clusters[Math.floor(Math.random() * clusters.length)];
    const r = Math.pow(Math.random(), 0.6) * cl.r;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = cl.c.x + r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = cl.c.y + r * Math.sin(ph) * Math.sin(th) * 0.75;
    pos[i * 3 + 2] = cl.c.z + r * Math.cos(ph);
    const k = Math.random();
    const c = leafCols[k < 0.3 ? 0 : k < 0.55 ? 1 : k < 0.75 ? 3 : k < 0.9 ? 2 : k < 0.97 ? 4 : 5];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  lg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.add(new THREE.Points(lg, new THREE.PointsMaterial({
    size: isMobile ? 0.75 : 0.62, vertexColors: true, map: leafTex, transparent: true, opacity: 0.92, depthWrite: false,
  })));
  scene.add(g);
}
// cây xung quanh sân, phía sau sân khấu và hai bên (không chắn camera)
[[-22, -6, 1.5], [22, -6, 1.5], [-16, -19, 1.6], [16, -19, 1.6], [0, -26, 1.7],
 [-27, 8, 1.4], [27, 8, 1.4], [-9, -25, 1.4], [9, -25, 1.4]]
  .forEach(([x, z, s], i) => createAncientTree(x, z, s, i * 1.3));

// HOA TULIP trên nền cỏ
const tulipCols = [0xe63946, 0xffd23f, 0xff7eb6, 0xff8c2a, 0xfff5f0].map((c) => M(c, 0.3));
const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 0.8 });
const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.45, 5);
const cupGeo = new THREE.SphereGeometry(0.13, 8, 6);
const tulipN = isMobile ? 130 : 280;
for (let i = 0; i < tulipN; i++) {
  const a = Math.random() * Math.PI * 2, d = rnd(19.5, 55);
  const t = new THREE.Group();
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.22;
  const cup = new THREE.Mesh(cupGeo, tulipCols[Math.floor(Math.random() * 5)]);
  cup.scale.set(1, 1.4, 1);
  cup.position.y = 0.5;
  t.add(stem, cup);
  t.scale.setScalar(rnd(0.9, 1.6));
  t.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
  t.rotation.z = (Math.random() - 0.5) * 0.25;
  scene.add(t);
}

// ================= NHÂN VẬT =================
const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.42, 6);
const bodyGeo = new THREE.CylinderGeometry(0.17, 0.21, 0.42, 8);
const armGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.3, 6);

// người (trẻ em / người lớn / nghệ sĩ) dùng chung một khung
function createPerson(o) {
  const { shirt = 0xe63946, pants = 0x2a2a4a, hair = "short", dress = false, holdSide = 1, scale = 1 } = o;
  const g = new THREE.Group();
  const legs = [-0.09, 0.09].map((x) => {
    const p = new THREE.Group();
    p.position.set(x, 0.45, 0);
    const l = new THREE.Mesh(legGeo, M(pants, 0.05));
    l.position.y = -0.21;
    p.add(l);
    g.add(p);
    return p;
  });
  const body = dress
    ? new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.3, 0.6, 10), M(shirt, 0.25))
    : new THREE.Mesh(bodyGeo, M(shirt, 0.2));
  body.position.y = dress ? 0.6 : 0.66;
  g.add(body, sph(skinM, 0.2, 0.2, 0.2, 0, 1.0, 0));
  [-0.07, 0.07].forEach((x) => g.add(sph(hairM, 0.028, 0.028, 0.028, x, 1.02, 0.18)));
  [-0.11, 0.11].forEach((x) => g.add(sph(M(0xff8a80, 0.3), 0.04, 0.04, 0.04, x, 0.96, 0.16)));
  if (hair !== "none") {
    g.add(sph(hairM, 0.215, 0.215, 0.215, 0, 1.04, -0.04));
    if (hair === "bun") [-0.17, 0.17].forEach((x) => g.add(sph(hairM, 0.08, 0.08, 0.08, x, 1.17, 0)));
    if (hair === "top") g.add(sph(hairM, 0.1, 0.1, 0.1, 0, 1.25, -0.04));
    if (hair === "long") {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.5, 8), hairM);
      l.position.set(0, 0.85, -0.13);
      g.add(l);
    }
  }
  const mkArm = (x) => {
    const p = new THREE.Group();
    p.position.set(x, 0.8, 0);
    const a = new THREE.Mesh(armGeo, M(shirt, 0.2));
    a.position.y = -0.14;
    p.add(a, sph(skinM, 0.05, 0.05, 0.05, 0, -0.3, 0));
    g.add(p);
    return p;
  };
  const armL = mkArm(-0.2), armR = mkArm(0.2);
  const hold = new THREE.Group();
  hold.position.set(0.33 * holdSide, 0.8, 0.1);
  g.add(hold);
  g.scale.setScalar(scale);
  g.userData = { legL: legs[0], legR: legs[1], armL, armR, hold, holdSide, scale };
  return g;
}

// ---- ĐÈN LỒNG CẦM TAY: ông sao + đèn lồng con vật ----
const poleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.95, 5);
const starShape = new THREE.Shape();
for (let i = 0; i < 10; i++) {
  const r = i % 2 === 0 ? 0.32 : 0.14, a = Math.PI / 2 + (i / 10) * Math.PI * 2;
  i === 0 ? starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
}
starShape.closePath();
const childStarGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.1, bevelEnabled: false });
childStarGeo.center();
const helds = [];

function makeHeld(kind, c) {
  const L = new THREE.Group();
  const pole = new THREE.Mesh(poleGeo, trunkMat);
  pole.position.y = 0.45;
  const item = new THREE.Group();
  item.position.y = 1.05;
  L.add(pole, item);
  const ud = { item, kind, wings: [] };

  if (kind === "star") {
    const s = new THREE.Mesh(childStarGeo, M(c, 0.9));
    s.scale.setScalar(1.2);
    item.add(s);
  } else if (kind === "rabbit") { // đèn thỏ
    const wm = M(0xfff0f5, 0.55), pk = M(0xff9ebb, 0.65);
    item.add(sph(wm, 0.28, 0.26, 0.32, 0, 0, 0), sph(wm, 0.18, 0.18, 0.18, 0, 0.2, 0.24), sph(wm, 0.1, 0.1, 0.1, 0, -0.02, -0.32));
    [-1, 1].forEach((s) => {
      const ear = sph(pk, 0.055, 0.22, 0.05, s * 0.07, 0.5, 0.22);
      ear.rotation.z = -s * 0.15;
      item.add(ear, sph(M(0xd90429, 0.5), 0.028, 0.028, 0.028, s * 0.07, 0.24, 0.4));
    });
  } else if (kind === "fish") { // đèn cá chép
    const fm = M(c, 0.7), gd = M(0xffd700, 0.6);
    item.add(sph(fm, 0.2, 0.26, 0.48, 0, 0, 0));
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 4), gd);
    tail.position.z = -0.6; tail.rotation.x = Math.PI / 2; tail.scale.x = 0.25;
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 4), gd);
    fin.position.set(0, 0.3, -0.05); fin.scale.x = 0.25;
    item.add(tail, fin);
    [-1, 1].forEach((s) => item.add(sph(M(0xffffff, 0.6), 0.05, 0.05, 0.05, s * 0.16, 0.08, 0.4), sph(hairM, 0.025, 0.025, 0.025, s * 0.2, 0.08, 0.43)));
  } else { // đèn bướm
    item.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), M(0x3a1200, 0.1)), sph(M(0x3a1200, 0.1), 0.05, 0.05, 0.05, 0, 0.27, 0));
    const wm = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.88 });
    [-1, 1].forEach((s) => {
      [[0.08, 0.3, 1.15], [-0.12, 0.22, 1]].forEach(([y, r, sy]) => {
        const p = new THREE.Group();
        p.position.set(s * 0.03, y, 0);
        const w = new THREE.Mesh(new THREE.CircleGeometry(r, 20), wm);
        w.position.x = s * r * 0.95;
        w.scale.y = sy;
        p.add(w);
        item.add(p);
        ud.wings.push({ p, s });
      });
    });
  }
  const glow = mkGlow(c, 1.9, 0.5);
  item.add(glow);
  L.userData = ud;
  helds.push({ ud, id: helds.length });
  return L;
}

// ---- CHÚ CUỘI + CHỊ HẰNG ----
function createCuoi() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.95, 10), M(0x8b5a2b));
  body.position.y = 0.55;
  const head = sph(skinM, 0.26, 0.26, 0.26, 0, 1.28, 0);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.28, 14), M(0xd9b45a, 0.25));
  hat.position.y = 1.55;
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.04, 6, 12), M(0xb22222));
  belt.rotation.x = Math.PI / 2; belt.position.y = 0.7;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.1, 6), trunkMat);
  pole.position.set(0.5, 0.65, 0.1);
  const crown = sph(M(0x3f8a4a, 0.25), 0.32, 0.32, 0.32, 0.5, 1.3, 0.1);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6), M(0x8b5a2b));
  arm.position.set(0.36, 0.85, 0.05); arm.rotation.z = -1.1;
  g.add(body, head, hat, belt, pole, crown, arm);
  return g;
}
function createHang() {
  const g = new THREE.Group();
  const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.58, 1.15, 14), M(0xffc4d6, 0.3));
  dress.position.y = 0.6;
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 12), M(0xffd700, 0.4));
  belt.rotation.x = Math.PI / 2; belt.position.y = 1.0;
  const head = sph(skinM, 0.24, 0.24, 0.24, 0, 1.4, 0);
  const hair = sph(M(0x111111, 0), 0.26, 0.26, 0.26, 0, 1.45, -0.06);
  const bun = sph(M(0x111111, 0), 0.12, 0.12, 0.12, 0, 1.72, -0.02);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 12), M(0xffd700, 0.6));
  crown.rotation.x = Math.PI / 2; crown.position.y = 1.6;
  const sleeveM = new THREE.MeshStandardMaterial({ color: 0xfff0f5, emissive: 0xffc4d6, emissiveIntensity: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const sL = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.28), sleeveM);
  sL.position.set(-0.5, 0.95, 0.05); sL.rotation.z = 0.5;
  const sR = sL.clone(); sR.position.x = 0.5; sR.rotation.z = -0.5;
  const rib = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.9), sleeveM);
  rib.position.set(0, 0.8, -0.35);
  g.add(dress, belt, head, hair, bun, crown, sL, sR, rib);
  g.userData = { sL, sR, rib };
  return g;
}
const cuoi = createCuoi(), hang = createHang();
cuoi.scale.setScalar(1.6); hang.scale.setScalar(1.6);
cuoi.position.set(-11.5, 0, -4.5); cuoi.rotation.y = 0.9;
hang.position.set(-9.3, 0, -4.2); hang.rotation.y = 0.5;
scene.add(cuoi, hang);

// ---- MÚA LÂN ----
function createLion() {
  const g = new THREE.Group();
  const red = M(0xd62828, 0.3), gold = M(0xffc107, 0.5);
  const head = new THREE.Group();
  const face = sph(red, 0.5, 0.45, 0.5, 0, 0, 0);
  const mane = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 6, 14), gold);
  mane.position.z = -0.1;
  [-0.2, 0.2].forEach((x) => head.add(sph(M(0xffffff, 0.5), 0.13, 0.13, 0.13, x, 0.15, 0.4), sph(M(0x111111, 0), 0.06, 0.06, 0.06, x, 0.15, 0.5)));
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 6), gold);
  horn.position.set(0, 0.6, 0.1);
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 6), M(0xffffff, 0.4));
  beard.position.set(0, -0.5, 0.25); beard.rotation.x = Math.PI;
  head.add(face, mane, horn, beard, sph(gold, 0.1, 0.1, 0.1, 0, -0.05, 0.5));
  head.position.set(0, 1.0, 0.3);
  const b1 = sph(M(0xe63946, 0.3), 0.5, 0.5, 0.5, 0, 0.85, -0.55);
  const b2 = sph(gold, 0.42, 0.42, 0.42, 0, 0.8, -1.2);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), red);
  tail.position.set(0, 1.1, -1.65); tail.rotation.x = -1.0;
  const legM = M(0x1d3a70, 0.05);
  [[-0.2, 0.3], [0.2, 0.3], [-0.2, -1.0], [0.2, -1.0]].forEach(([x, z]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 6), legM);
    l.position.set(x, 0.3, z);
    g.add(l);
  });
  g.add(head, b1, b2, tail);
  g.userData = { head, tail };
  g.scale.setScalar(1.7);
  return g;
}
const lion = createLion();
scene.add(lion);

// Ông Địa dẫn lân
function createOngDia() {
  const p = createPerson({ shirt: 0xffd23f, pants: 0xd62828, hair: "none", scale: 2.0 });
  const mask = sph(M(0xf7e3c0, 0.3), 0.3, 0.28, 0.28, 0, 1.05, 0.02);
  const belly = sph(M(0xf6d7a7, 0.25), 0.3, 0.26, 0.26, 0, 0.6, 0.12);
  p.add(mask, belly, sph(M(0xff6a5a, 0.5), 0.07, 0.07, 0.07, -0.15, 1.0, 0.22), sph(M(0xff6a5a, 0.5), 0.07, 0.07, 0.07, 0.15, 1.0, 0.22));
  [-0.09, 0.09].forEach((x) => p.add(sph(hairM, 0.03, 0.03, 0.03, x, 1.1, 0.27)));
  const fan = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), new THREE.MeshStandardMaterial({ color: 0xd90429, emissive: 0x600010, side: THREE.DoubleSide }));
  fan.position.set(0, -0.4, 0.05);
  p.userData.armR.add(fan);
  return p;
}
const ongDia = createOngDia();
scene.add(ongDia);

// Đội trống cổ vũ cho lân
const drummers = [];
[[12.5, -2.5], [13.5, 1.0], [12.5, 4.5]].forEach(([x, z], i) => {
  const p = createPerson({ shirt: [0xd62828, 0x1d3a70, 0xffc107][i], pants: 0x222233, hair: "short", scale: 2.2 });
  p.position.set(x, 0, z);
  p.rotation.y = Math.atan2(-x, -z);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16), M(0xd62828, 0.3));
  drum.position.set(0, 0.55, 0.42);
  [-0.2, 0.2].forEach((y) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 16), M(0xffc107, 0.5));
    r.rotation.x = Math.PI / 2; r.position.set(0, 0.55 + y, 0.42);
    p.add(r);
  });
  p.add(drum);
  scene.add(p);
  drummers.push(p);
});

// Bàn mâm cỗ Trung Thu
(function () {
  const t = new THREE.Group();
  t.position.set(-13, 0, 5);
  const wood = M(0x7a4a26, 0.1);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.14, 20), wood);
  top.position.y = 1.1;
  t.add(top);
  [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(([x, z]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6), wood);
    l.position.set(x, 0.55, z);
    t.add(l);
  });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 20), M(0xffd700, 0.5));
  plate.position.y = 1.2;
  t.add(plate, sph(M(0x9acd32, 0.25), 0.3, 0.3, 0.3, 0, 1.5, 0));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12), M(0xc98a3c, 0.3));
    cake.position.set(Math.cos(a) * 0.6, 1.27, Math.sin(a) * 0.6);
    t.add(cake);
  }
  [-0.85, 0.85].forEach((x) => t.add(sph(M(0xff9d2a, 0.3), 0.18, 0.18, 0.18, x, 1.32, 0.7)));
  scene.add(t);
})();

// ---- SÂN KHẤU VĂN NGHỆ ----
(function () {
  const s = new THREE.Group();
  s.position.set(0, 0, -14);
  const red = M(0xb0161e, 0.3), gold = M(0xffc107, 0.55);
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); s.add(m); return m; };
  add(new THREE.BoxGeometry(12, 0.7, 5.5), M(0x6b3a1e, 0.05), 0, 0.35, 0);
  add(new THREE.BoxGeometry(3, 0.35, 1), M(0x6b3a1e, 0.05), 0, 0.17, 3.2);
  add(new THREE.PlaneGeometry(12, 5.5), M(0x9c1420, 0.35), 0, 3.45, -2.6);
  [-5.2, 5.2].forEach((x) => add(new THREE.BoxGeometry(1.6, 5.5, 0.3), red, x, 3.45, -2.3));
  add(new THREE.CircleGeometry(1.5, 32), M(0xffd27a, 0.9), 0, 3.6, -2.5);
  [-6, 6].forEach((x) => {
    add(new THREE.CylinderGeometry(0.22, 0.25, 6.2, 10), red, x, 3.8, 2.5);
    add(new THREE.CylinderGeometry(0.34, 0.3, 0.3, 10), gold, x, 6.8, 2.5);
  });
  add(new THREE.BoxGeometry(13.4, 0.35, 6.4), red, 0, 7.0, 0);
  add(new THREE.BoxGeometry(13.7, 0.15, 6.7), gold, 0, 6.75, 0);
  for (let i = 0; i < 7; i++) {
    const c = LCOL[i % 5], x = -5.4 + i * 1.8;
    add(SPH, M(c, 0.85), x, 6.15, 2.9).scale.set(0.42, 0.38, 0.42);
    const gl = mkGlow(c, 3.2, 0.45);
    gl.position.set(x, 6.15, 2.9);
    s.add(gl);
  }
  scene.add(s);
})();

// nghệ sĩ trên sân khấu: múa quạt + ca sĩ
const dancers = [];
[[-4.5, 0xff8fb1], [-1.5, 0xffd23f], [1.5, 0x8fd6ff], [4.5, 0xff8fb1]].forEach(([x, col], i) => {
  const p = createPerson({ shirt: col, pants: 0xffffff, hair: "long", dress: true, scale: 2.0 });
  p.position.set(x, 0.7, -14.8);
  const fan = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd90429, emissive: 0x600010, side: THREE.DoubleSide }));
  fan.position.set(0, -0.35, 0.05);
  p.userData.armR.add(fan);
  scene.add(p);
  dancers.push({ g: p, i });
});
const singer = createPerson({ shirt: 0x2f7fd6, pants: 0x222244, hair: "short", scale: 2.1 });
singer.position.set(0, 0.7, -12.4);
const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6), M(0x222222, 0));
mic.position.set(0, -0.38, 0.05);
singer.userData.armR.add(mic);
scene.add(singer);

// ---- ĐOÀN RƯỚC ĐÈN: trẻ em + người lớn ----
const crowd = [];
const kinds = ["star", "rabbit", "fish", "butterfly"];
const pal = [0xe63946, 0xffc107, 0x3ea34a, 0x2f7fd6, 0xff7a1a, 0xff7eb6];
const adultPal = [0x1d3a70, 0x8e1f1f, 0x2f6b3a, 0x6b3a8e];
let cnt = 0;
function addWalker(o, r, phase, handHold) {
  const p = createPerson(o);
  const kind = kinds[cnt % 4];
  const L = makeHeld(kind, pal[cnt % 6]);
  p.userData.hold.add(L);
  p.userData.handHold = handHold;
  scene.add(p);
  crowd.push({ g: p, r, phase, idx: cnt });
  cnt++;
}
const pairs = isMobile ? 4 : 6;
for (let k = 0; k < pairs; k++) { // người lớn (vòng trong) dắt tay em bé (vòng ngoài)
  const ph = (k / pairs) * Math.PI * 2;
  addWalker({ shirt: adultPal[k % 4], pants: 0x333a55, hair: k % 2 ? "bun" : "short", scale: 2.3, holdSide: -1 }, 7.2, ph, true);
  addWalker({ shirt: pal[k % 6], pants: k % 2 ? 0x2a2a4a : 0x3b2a1a, hair: k % 2 ? "short" : "bun", scale: 1.5, holdSide: 1 }, 8.8, ph + 0.01, true);
}
const solo = isMobile ? 6 : 10;
for (let k = 0; k < solo; k++) { // các em nhỏ đi riêng
  addWalker({ shirt: pal[(k + 2) % 6], pants: k % 2 ? 0x2a2a4a : 0x3b2a1a, hair: k % 2 ? "short" : "bun", scale: 1.5, holdSide: 1 }, 5.7, (k / solo) * Math.PI * 2 + 0.2, false);
}
for (let k = 0; k < 3; k++) { // người lớn vòng ngoài
  addWalker({ shirt: adultPal[(k + 1) % 4], pants: 0x333a55, hair: k % 2 ? "long" : "top", dress: k % 2 === 1, scale: 2.3, holdSide: 1 }, 11, (k / 3) * Math.PI * 2 + 0.6, false);
}

const lionPath = (t) => ({ x: 4.2 * Math.sin(0.28 * t), z: 2.2 * Math.sin(0.56 * t) + 0.5, dx: 4.2 * 0.28 * Math.cos(0.28 * t), dz: 2.2 * 0.56 * Math.cos(0.56 * t) });

function updateScene(t) {
  // đoàn rước đèn đi vòng quanh sân
  crowd.forEach(({ g, r, phase, idx }) => {
    const u = g.userData, a = phase + (t * 1.1) / r, w = t * 6 + idx;
    g.position.set(Math.cos(a) * r, Math.abs(Math.sin(w * 0.5)) * 0.06 * u.scale, Math.sin(a) * r);
    g.rotation.y = -a;
    u.legL.rotation.x = Math.sin(w) * 0.6;
    u.legR.rotation.x = -Math.sin(w) * 0.6;
    const hs = u.holdSide, holdArm = hs === 1 ? u.armR : u.armL, freeArm = hs === 1 ? u.armL : u.armR;
    holdArm.rotation.z = hs * 0.9;
    if (u.handHold) freeArm.rotation.z = -hs * 1.2;
    else freeArm.rotation.x = Math.sin(w) * 0.5;
  });
  // đèn lồng cầm tay: lắc lư, bướm vỗ cánh
  helds.forEach(({ ud, id }) => {
    ud.item.rotation.y = Math.sin(t * 1.5 + id) * 0.5;
    if (ud.kind === "butterfly") ud.wings.forEach(({ p, s }) => (p.rotation.y = s * (0.3 + Math.sin(t * 9 + id) * 0.7)));
  });
  // múa lân
  const lp = lionPath(t);
  lion.position.set(lp.x, Math.abs(Math.sin(t * 6)) * 0.2, lp.z);
  lion.rotation.y = Math.atan2(lp.dx, lp.dz);
  lion.rotation.z = Math.sin(t * 6) * 0.06;
  lion.userData.head.rotation.x = Math.sin(t * 6) * 0.25;
  lion.userData.head.rotation.y = Math.sin(t * 3) * 0.3;
  lion.userData.tail.rotation.z = Math.sin(t * 8) * 0.4;
  const od = lionPath(t + 1.8), w2 = t * 7;
  ongDia.position.set(od.x, Math.abs(Math.sin(w2 * 0.5)) * 0.12, od.z);
  ongDia.rotation.y = Math.atan2(od.dx, od.dz) + Math.PI + Math.sin(t * 2) * 0.4;
  ongDia.userData.legL.rotation.x = Math.sin(w2) * 0.6;
  ongDia.userData.legR.rotation.x = -Math.sin(w2) * 0.6;
  ongDia.userData.armR.rotation.z = 1.4 + Math.sin(t * 6) * 0.4;
  ongDia.userData.armL.rotation.z = -1.0 - Math.sin(t * 6 + 1) * 0.3;
  // đội trống
  drummers.forEach((d, i) => {
    d.userData.armL.rotation.x = -(1.0 + Math.sin(t * 9 + i) * 0.5);
    d.userData.armR.rotation.x = -(1.0 + Math.sin(t * 9 + i + Math.PI) * 0.5);
    d.position.y = Math.abs(Math.sin(t * 4.5 + i)) * 0.05;
  });
  // văn nghệ trên sân khấu
  dancers.forEach(({ g, i }) => {
    const w = t * 3 + i * 0.8;
    g.position.y = 0.7 + Math.abs(Math.sin(w)) * 0.08;
    g.rotation.y = Math.sin(w * 0.5) * 0.4;
    g.userData.armL.rotation.z = -(1.4 + Math.sin(w) * 0.5);
    g.userData.armR.rotation.z = 1.4 + Math.sin(w + 1.5) * 0.5;
  });
  singer.position.y = 0.7 + Math.abs(Math.sin(t * 2.5)) * 0.04;
  singer.userData.armR.rotation.x = -1.7;
  singer.userData.armL.rotation.z = -0.6 - Math.sin(t * 2) * 0.3;
  // Cuội & Hằng
  cuoi.position.y = Math.abs(Math.sin(t * 2)) * 0.04;
  cuoi.rotation.z = Math.sin(t * 1.5) * 0.04;
  hang.position.y = Math.sin(t * 1.3) * 0.05;
  const h = hang.userData;
  h.sL.rotation.z = 0.5 + Math.sin(t * 2) * 0.15;
  h.sR.rotation.z = -0.5 - Math.sin(t * 2) * 0.15;
  h.rib.rotation.x = Math.sin(t * 2.2) * 0.2;
}

// ================= ĐÈN LỒNG BAY (có lời chúc) =================
const lanternsGroup = new THREE.Group();
scene.add(lanternsGroup);
const lanterns = [];
const interactiveObjects = [];

const wishList = [
  { text: "Đêm Trung Thu này, mình chúc cậu và gia đình quây quần bên mâm cỗ đầy đặn, cùng ngắm trăng rằm sáng tỏ, cùng nghe tiếng cười giòn tan của những người thương yêu nhất. Có nhau ở bên là món quà lớn nhất rồi.", img: "1.jpg" },
  { text: "Mong cậu luôn giữ được trái tim trong trẻo như thuở còn rước đèn ông sao ngoài ngõ. Dù lớn lên bao nhiêu, vẫn biết vui vì những điều giản dị, vẫn biết mỉm cười khi ngẩng lên nhìn trăng.", img: "2.jpg" },
  { text: "Trăng rằm tròn đầy, mong mọi điều cậu ấp ủ trong lòng cũng dần được tròn đầy. Những ước mơ còn dang dở sẽ có ngày thành hiện thực, những nỗ lực thầm lặng của cậu sẽ có ngày được đền đáp xứng đáng.", img: "3.jpg" },
  { text: "Chúc cậu một mùa Trung Thu bình yên: công việc thuận lợi, tâm trí nhẹ nhàng, những lo toan tạm gác lại sau lưng. Đêm nay chỉ cần ngồi xuống, uống chén trà nóng, ăn miếng bánh dẻo và tận hưởng ánh trăng thôi nhé.", img: "1.jpg" },
  { text: "Mình mong cậu luôn khỏe mạnh, ăn ngon ngủ yên và có đủ năng lượng để theo đuổi những điều mình yêu thích. Sức khỏe là ngọn đèn lồng giữ cho mọi hành trình của cậu luôn sáng.", img: "2.jpg" },
  { text: "Trăng đêm nay đẹp lắm, nhưng vẫn chưa đẹp bằng nụ cười của cậu. Chúc cậu ngày nào cũng có lý do để cười thật tươi, và mỗi khi mệt mỏi thì có ai đó ở cạnh nhắc rằng cậu đã làm rất tốt rồi.", img: "3.jpg" },
  { text: "Chúc tình cảm của chúng ta tròn đầy như trăng rằm: không cần quá ồn ào, chỉ cần bền bỉ, ấm áp và chân thành. Mình sẽ luôn ở đây, cùng cậu đi qua những đêm trăng thật nhiều nữa.", img: "1.jpg" },
  { text: "Mong cậu được sống giữa những người biết trân trọng cậu, làm những việc khiến cậu thấy mình có ý nghĩa, và mỗi tối trở về nhà đều thấy lòng nhẹ nhõm, bình an.", img: "2.jpg" },
  { text: "Như chú Cuội ngồi gốc đa nhìn xuống trần gian, mong cậu cũng luôn có một góc nhỏ bình yên để nghỉ ngơi sau những ngày dài bận rộn. Ở đó, mọi mỏi mệt đều được xoa dịu.", img: "3.jpg" },
  { text: "Chúc cậu năm nay gặp nhiều may mắn, quý nhân phù trợ, mở lòng đón những cơ hội mới. Những cánh cửa từng đóng lại sẽ nhường chỗ cho những con đường rộng mở hơn.", img: "1.jpg" },
  { text: "Đêm rằm, hàng ngàn chiếc đèn lồng cùng thắp sáng. Mong cậu cũng luôn tìm thấy ánh sáng của riêng mình, đủ ấm để sưởi lòng cậu và đủ rộng để soi đường cho những người cậu thương.", img: "2.jpg" },
  { text: "Cảm ơn cậu vì đã luôn là một người đáng quý. Trung Thu này, mình chúc cậu nhận lại thật nhiều yêu thương, đúng bằng những gì cậu đã âm thầm trao đi cho mọi người xung quanh.", img: "3.jpg" },
  { text: "Chúc cậu và những người thân yêu luôn đủ đầy: đủ ấm áp để chống chọi giá lạnh, đủ bình tĩnh để vượt qua sóng gió, và đủ hạnh phúc để mỗi bữa cơm đều có tiếng cười.", img: "1.jpg" },
  { text: "Mong rằng những điều buồn bã của năm qua sẽ trôi đi như mây bên trăng, và những điều tốt đẹp sẽ ở lại, tròn đầy như chiếc bánh nướng thơm bùi trên bàn cỗ đêm nay.", img: "2.jpg" },
  { text: "Có những điều không cần nói thành lời, chỉ cần cùng nhau ngước lên nhìn cùng một vầng trăng. Chúc cậu đêm nay thấy lòng mình dịu lại, biết rằng luôn có người nghĩ đến cậu.", img: "3.jpg" },
  { text: "Chúc cậu dũng cảm theo đuổi ước mơ, dù đường còn xa hay gập ghềnh. Cứ đi từng bước một, ánh trăng sẽ luôn soi đường, và mình sẽ luôn tin ở cậu.", img: "1.jpg" },
  { text: "Mong cậu luôn có thời gian cho chính mình: một buổi sáng thong thả, một tách trà thơm, một bản nhạc hay. Bởi hạnh phúc lớn thường bắt đầu từ những khoảnh khắc nhỏ như vậy.", img: "2.jpg" },
  { text: "Trung Thu là dịp để đoàn viên. Dù cậu đang ở gần hay xa gia đình, mong mỗi cuộc gọi, mỗi tin nhắn hôm nay đều mang theo hơi ấm, để cậu biết mình chưa bao giờ đơn độc.", img: "3.jpg" },
  { text: "Chúc riêng cậu một đêm trăng thật lãng mạn và ngọt ngào, có gió nhẹ, có hương hoa bưởi, có ánh đèn lồng lung linh và có một người nắm tay cậu thật lâu thật chặt.", img: "1.jpg" },
  { text: "Mong sự nghiệp của cậu như vầng trăng lên cao: thong thả nhưng vững vàng, ngày càng sáng rõ. Mọi cố gắng hôm nay đều đang lặng lẽ xây nên một tương lai rực rỡ cho cậu.", img: "2.jpg" },
  { text: "Chúc cậu luôn giữ được sự dịu dàng với chính mình. Cậu không cần hoàn hảo, cũng không cần vội vàng. Chỉ cần mỗi ngày trôi qua, cậu đều thấy bản thân đang lớn lên và tốt đẹp hơn một chút.", img: "3.jpg" },
  { text: "Đèn ông sao lấp lánh, tiếng trống lân rộn ràng, mong niềm vui của đêm hội hôm nay sẽ theo cậu đến tận những ngày sau, để mỗi khi nhớ lại, cậu đều mỉm cười.", img: "1.jpg" },
  { text: "Mong mọi điều cậu gửi vào chiếc đèn lồng đêm nay sẽ bay thật cao, chạm đến vầng trăng và quay về với cậu dưới dạng những tin vui, những cái ôm ấm áp và những ngày bình yên.", img: "2.jpg" },
  { text: "Trung Thu an lành, cậu nhé. Chúc cậu vạn sự như ý, tâm luôn an, người luôn khỏe, tình luôn đầy, và mỗi năm trăng rằm đến đều thấy mình hạnh phúc hơn năm trước.", img: "3.jpg" },
];

const lm = (c, ei = 0.55, extra = {}) =>
  new THREE.MeshStandardMaterial(Object.assign({ color: c, emissive: c, emissiveIntensity: ei, roughness: 0.45 }, extra));
const goldM = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.5, roughness: 0.4, emissive: 0x664400 });
const redM = new THREE.MeshStandardMaterial({ color: 0xd90429, emissive: 0x600010, roughness: 0.5 });

function addTassel(group, y) {
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), redM);
  t.position.y = y - 0.25;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 6), redM);
  tip.position.y = y - 0.65;
  tip.rotation.x = Math.PI;
  group.add(t, tip);
}
function buildRoundLantern(c) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 12), lm(c));
  b.scale.y = 0.88;
  const top = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 12), goldM);
  top.rotation.x = Math.PI / 2; top.position.y = 0.55;
  const bot = top.clone(); bot.position.y = -0.55;
  g.add(b, top, bot);
  addTassel(g, -0.55);
  return { g };
}
function buildKeoQuan(c) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.3, 8, 1, true), lm(c, 0.5, { transparent: true, opacity: 0.78, side: THREE.DoubleSide }));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.45, 8), lm(0xd90429, 0.4));
  roof.position.y = 0.87;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8), goldM);
  base.position.y = -0.7;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), lm(0xffe08a, 1.2));
  const inner = new THREE.Group();
  const darkM = new THREE.MeshBasicMaterial({ color: 0x3a1200 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.05), darkM);
    f.position.set(Math.cos(a) * 0.3, (i % 2) * 0.3 - 0.15, Math.sin(a) * 0.3);
    f.rotation.y = -a;
    inner.add(f);
  }
  g.add(body, roof, base, core, inner);
  addTassel(g, -0.7);
  return { g, inner };
}
function buildStarLantern(c) {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.85 : 0.38, a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    i === 0 ? sh.moveTo(Math.cos(a) * r, Math.sin(a) * r) : sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 1 });
  geo.center();
  const edge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true }));
  edge.scale.setScalar(1.01);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.0, 5), redM);
  tail.position.set(0, -1.4, -0.05); tail.rotation.x = Math.PI;
  g.add(new THREE.Mesh(geo, lm(c, 0.6)), edge, new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), lm(0xffe08a, 1.2)), tail);
  return { g };
}
function createLanternMesh(type, c) {
  const built = type === 0 ? buildRoundLantern(c) : type === 1 ? buildKeoQuan(c) : buildStarLantern(c);
  const group = new THREE.Group();
  group.add(built.g, mkGlow(c, 3.0, 0.4));
  const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  group.add(hitMesh);
  return { group, hitMesh, inner: built.inner };
}

const lanternCount = isMobile ? 44 : 72;
for (let i = 0; i < lanternCount; i++) {
  const type = i % 3;
  const { group: lantern, hitMesh, inner } = createLanternMesh(type, LCOL[Math.floor(Math.random() * LCOL.length)]);
  const radius = rnd(10, 40), angle = Math.random() * Math.PI * 2, y = rnd(5, 24);
  let lz = Math.sin(angle) * radius;
  if (lz > 16) lz = -lz * 0.6; // không chắn phía trước camera
  lantern.position.set(Math.cos(angle) * radius, y, lz);
  const wishData = wishList[Math.floor(Math.random() * wishList.length)];
  lantern.userData = {
    speedY: 0.008 + Math.random() * 0.012,
    swingSpeed: 0.8 + Math.random() * 1.2,
    initialX: lantern.position.x,
    initialZ: lantern.position.z,
    wish: wishData.text,
    imgUrl: wishData.img,
    id: i, inner, type,
  };
  const sc = 0.6 + Math.random() * 0.9;
  lantern.scale.set(sc, sc, sc);
  hitMesh.userData.parentLantern = lantern;
  lanternsGroup.add(lantern);
  lanterns.push(lantern);
  interactiveObjects.push(hitMesh);
}

// CÁNH HOA RƠI & SAO
const fallingPetalsCount = isMobile ? 80 : 180;
const petalsGeo = new THREE.BufferGeometry();
const petalsPos = new Float32Array(fallingPetalsCount * 3);
const petalsData = [];
for (let i = 0; i < fallingPetalsCount; i++) {
  petalsPos[i * 3] = (Math.random() - 0.5) * 50;
  petalsPos[i * 3 + 1] = Math.random() * 30;
  petalsPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
  petalsData.push({ speedY: 0.02 + Math.random() * 0.03 });
}
petalsGeo.setAttribute("position", new THREE.BufferAttribute(petalsPos, 3));
scene.add(new THREE.Points(petalsGeo, new THREE.PointsMaterial({
  size: isMobile ? 0.35 : 0.3, color: 0xf7d1d5, transparent: true, opacity: 0.75, map: glowTex, depthWrite: false,
})));

const starCount = isMobile ? 400 : 900;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 200;
  starPos[i * 3 + 1] = 20 + Math.random() * 90;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0.7 })));

// PHÁO HOA
let fireworks = [];
function createFirework(pos) {
  const pCount = 50;
  const pGeo = new THREE.BufferGeometry();
  const pp = new Float32Array(pCount * 3);
  const velocities = [];
  for (let i = 0; i < pCount; i++) {
    pp[i * 3] = pos.x; pp[i * 3 + 1] = pos.y; pp[i * 3 + 2] = pos.z;
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI, sp = 0.08 + Math.random() * 0.12;
    velocities.push(new THREE.Vector3(sp * Math.sin(ph) * Math.cos(th), sp * Math.sin(ph) * Math.sin(th), sp * Math.cos(ph)));
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const pMesh = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.35, color: 0xffd700, transparent: true, opacity: 1, blending: THREE.AdditiveBlending }));
  scene.add(pMesh);
  fireworks.push({ mesh: pMesh, velocities, life: 1.0 });
}

// RAYCASTER & TƯƠNG TÁC
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetCamPos = null, targetCamTarget = null, selectedLantern = null;

const wishModal = document.getElementById("wishModal");
const wishText = document.getElementById("wishText");
const wishImage = document.getElementById("wishImage");
const closeWishBtn = document.getElementById("closeWishBtn");
let pointerDownPos = { x: 0, y: 0 };

function onPointerDown(e) {
  pointerDownPos.x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  pointerDownPos.y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
}
function onPointerUp(e) {
  if (e.target.closest(".top-bar") || e.target.closest(".wish-modal")) return;
  const cx = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || 0;
  const cy = e.clientY || (e.changedTouches && e.changedTouches[0].clientY) || 0;
  if (Math.hypot(cx - pointerDownPos.x, cy - pointerDownPos.y) > 8) return;
  mouse.x = (cx / window.innerWidth) * 2 - 1;
  mouse.y = -(cy / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactiveObjects, false);
  if (hits.length > 0) {
    const hm = hits[0].object;
    selectedLantern = hm.userData.parentLantern || hm.parent;
    const lPos = selectedLantern.position;
    createFirework(lPos);
    const offset = new THREE.Vector3().subVectors(camera.position, lPos).normalize().multiplyScalar(5.5);
    targetCamPos = new THREE.Vector3().addVectors(lPos, offset);
    targetCamTarget = lPos.clone();
    wishText.textContent = `"${selectedLantern.userData.wish}"`;
    const imagePath = new URL(
  selectedLantern.userData.imgUrl,
  window.location.href
).href;

wishImage.src = imagePath;
    setTimeout(() => wishModal.classList.add("active"), 300);
  }
}
window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointerup", onPointerUp, { passive: true });

function resetCamera() {
  targetCamPos = DEFAULT_CAM_POS.clone();
  targetCamTarget = DEFAULT_CAM_TARGET.clone();
  selectedLantern = null;
}
function closeWishCard(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  wishModal.classList.remove("active");
  resetCamera();
}
closeWishBtn.addEventListener("click", closeWishCard);
closeWishBtn.addEventListener("touchend", closeWishCard);
wishModal.addEventListener("click", (e) => { if (e.target === wishModal) closeWishCard(e); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeWishCard(); });
const resetBtn = document.getElementById("reset-cam-btn");
if (resetBtn) resetBtn.addEventListener("click", resetCamera);

// ÂM THANH
const bgm = document.getElementById("bgm");
const audioBtn = document.getElementById("audio-btn");
let isPlaying = false;
audioBtn.addEventListener("click", () => {
  if (isPlaying) {
    bgm.pause();
    audioBtn.innerHTML = '<i class="fas fa-music" style="opacity:0.5;"></i>';
  } else {
    bgm.play().then(() => { audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>'; }).catch(() => {});
  }
  isPlaying = !isPlaying;
});

// ANIMATION
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  lanterns.forEach((l) => {
    const u = l.userData;
    l.position.y += u.speedY;
    l.position.x = u.initialX + Math.sin(time * u.swingSpeed + u.id) * 0.4;
    l.position.z = u.initialZ + Math.cos(time * u.swingSpeed + u.id) * 0.4;
    l.rotation.y += 0.005;
    if (u.inner) u.inner.rotation.y += 0.04;
    if (u.type === 2) l.rotation.z = Math.sin(time * u.swingSpeed + u.id) * 0.08;
    if (l.position.y > 25) l.position.y = 4.5;
  });

  const pPos = petalsGeo.attributes.position.array;
  for (let i = 0; i < fallingPetalsCount; i++) {
    pPos[i * 3 + 1] -= petalsData[i].speedY;
    pPos[i * 3] += Math.sin(time + i) * 0.01;
    pPos[i * 3 + 2] += Math.cos(time + i) * 0.01;
    if (pPos[i * 3 + 1] < 0) {
      pPos[i * 3 + 1] = 30;
      pPos[i * 3] = (Math.random() - 0.5) * 50;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
  }
  petalsGeo.attributes.position.needsUpdate = true;

  for (let i = fireworks.length - 1; i >= 0; i--) {
    const fw = fireworks[i];
    fw.life -= delta * 1.2;
    const arr = fw.mesh.geometry.attributes.position.array;
    for (let j = 0; j < fw.velocities.length; j++) {
      arr[j * 3] += fw.velocities[j].x;
      arr[j * 3 + 1] += fw.velocities[j].y;
      arr[j * 3 + 2] += fw.velocities[j].z;
    }
    fw.mesh.geometry.attributes.position.needsUpdate = true;
    fw.mesh.material.opacity = fw.life;
    if (fw.life <= 0) { scene.remove(fw.mesh); fireworks.splice(i, 1); }
  }

  updateScene(time);

  if (targetCamPos && targetCamTarget) {
    camera.position.lerp(targetCamPos, 0.04);
    controls.target.lerp(targetCamTarget, 0.04);
    if (camera.position.distanceTo(targetCamPos) < 0.1) { targetCamPos = null; targetCamTarget = null; }
  }

  controls.update();
  if (camera.position.y < 1.5) camera.position.y = 1.5;
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.fov = w < 768 ? 60 : 45;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 768 ? 1.5 : 2));
});
