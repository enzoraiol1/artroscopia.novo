window.__start = function () {
  const K = window.K, T = THREE, DEG = K.DEG;
  const $ = s => document.querySelector(s);
  const V = a => new T.Vector3(a[0], a[1], a[2]);
  const ss = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;

  // ---------- renderer / cena ----------
  const glc = $('#gl'), renderer = new T.WebGLRenderer({ canvas: glc, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(84, 1, 0.4, 400); cam.layers.enable(1); scene.add(cam);
  const light = new T.PointLight(0xfff3e4, 1.25, 170, 1.7); cam.add(light);
  const amb = new T.AmbientLight(0x3c2e2b, 0.5); amb.layers.set(1); scene.add(amb);
  const ext = new T.PerspectiveCamera(25, 1, 10, 1500); ext.layers.enable(2);
  ext.position.set(-95, 150, 300); ext.lookAt(0, 22, -8);
  const eD = new T.DirectionalLight(0xffffff, 0.85); eD.position.set(-1, 2, 3); eD.layers.set(2); scene.add(eD);
  const eA = new T.AmbientLight(0x8fa0b3, 0.75); eA.layers.set(2); scene.add(eA);

  // ---------- texturas ----------
  function canvasTex(n, draw) { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const synTex = canvasTex(512, (g, n) => {
    g.fillStyle = '#f4ece8'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${200 + rnd() * 55 | 0},${150 + rnd() * 60 | 0},${140 + rnd() * 60 | 0},0.18)`; g.beginPath(); g.arc(rnd() * n, rnd() * n, 8 + rnd() * 30, 0, 7); g.fill(); }
    function vessel(x, y, a, w, len) {
      g.strokeStyle = `rgba(${120 + rnd() * 40 | 0},18,22,${0.35 + w * 0.12})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, y);
      for (let i = 0; i < len; i++) { a += (rnd() - 0.5) * 0.7; x += Math.cos(a) * 7; y += Math.sin(a) * 7; g.lineTo(x, y); if (w > 0.9 && rnd() < 0.09) { g.stroke(); vessel(x, y, a + (rnd() < 0.5 ? 0.8 : -0.8), w * 0.6, len * 0.6 | 0); g.strokeStyle = `rgba(130,18,22,${0.35 + w * 0.12})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); } }
      g.stroke();
    }
    for (let i = 0; i < 26; i++) vessel(rnd() * n, rnd() * n, rnd() * 6.3, 1 + rnd() * 1.8, 30 + rnd() * 40 | 0);
  });
  const fibTex = canvasTex(256, (g, n) => {
    g.fillStyle = '#efe4d4'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 300; i++) { const y = rnd() * n; g.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.25)' : `rgba(170,120,95,${0.1 + rnd() * 0.18})`; g.lineWidth = 0.6 + rnd() * 1.6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(n / 3, y + rnd() * 6 - 3, 2 * n / 3, y + rnd() * 6 - 3, n, y); g.stroke(); }
    for (let i = 0; i < 7; i++) { const y = rnd() * n; g.strokeStyle = 'rgba(150,25,25,0.45)'; g.lineWidth = 0.8 + rnd(); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(n / 3, y + rnd() * 30 - 15, 2 * n / 3, y + rnd() * 30 - 15, n, y); g.stroke(); }
  });

  // ---------- materiais ----------
  const mCart = new T.MeshPhongMaterial({ vertexColors: true, shininess: 120, specular: 0x5a5a5a });
  const mMen = new T.MeshPhongMaterial({ vertexColors: true, shininess: 70, specular: 0x3a3a3a, side: T.DoubleSide });
  const mCaps = new T.MeshPhongMaterial({ vertexColors: true, map: synTex, side: T.BackSide, shininess: 28, specular: 0x2a1a1a });
  const mACL = new T.MeshPhongMaterial({ map: fibTex, color: 0xf2e6da, shininess: 45, specular: 0x2c2c2c });
  const mPCL = new T.MeshPhongMaterial({ map: fibTex, color: 0xe9c9bd, shininess: 45, specular: 0x2c2c2c });
  const mFat = new T.MeshPhongMaterial({ color: 0xe3bd52, shininess: 60, specular: 0x333322 });
  const mSteel = new T.MeshPhongMaterial({ color: 0x8e98a3, shininess: 220, specular: 0xffffff });
  const mLoose = new T.MeshPhongMaterial({ color: 0xf3ecd9, shininess: 90, specular: 0x444444 });
  const mStump = new T.MeshPhongMaterial({ map: fibTex, color: 0xd9a394, shininess: 30 });

  function geo(sn, colFn, uvFn) {
    const g = new T.BufferGeometry(), n = sn.pos.length / 3, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const c = colFn(sn.pos[3 * i], sn.pos[3 * i + 1], sn.pos[3 * i + 2]); col[3 * i] = c[0]; col[3 * i + 1] = c[1]; col[3 * i + 2] = c[2]; }
    g.setAttribute('position', new T.BufferAttribute(sn.pos, 3)); g.setAttribute('normal', new T.BufferAttribute(sn.nrm, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    if (uvFn) { const uv = new Float32Array(n * 2); for (let i = 0; i < n; i++) { const u = uvFn(sn.pos[3 * i], sn.pos[3 * i + 1], sn.pos[3 * i + 2]); uv[2 * i] = u[0]; uv[2 * i + 1] = u[1]; } g.setAttribute('uv', new T.BufferAttribute(uv, 2)); }
    g.setIndex(new T.BufferAttribute(sn.idx, 1)); g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  const CART = [0.93, 0.91, 0.85], SYN = [0.82, 0.47, 0.41], PERI = [0.80, 0.56, 0.49];
  function cFemur(x, y, z) {
    const n = K.noise(x * 0.3, y * 0.3, z * 0.3) - 0.5, n2 = K.noise(x * 1.7, y * 1.7, z * 1.7);
    let c = [CART[0] + 0.05 * n, CART[1] + 0.05 * n, CART[2] + 0.07 * n];
    const w = Math.max(ss(11.5, 8.5, Math.abs(x)) * ss(6, 11, y) * ss(12, 6, z), ss(50, 60, y));
    c = mix(c, [SYN[0] + 0.1 * n, SYN[1] + 0.12 * n2 - 0.06, SYN[2] + 0.1 * n], w);
    if (K.les.condral) {
      const S = K.LS.S, d = Math.hypot(x - S[0], y - S[1], z - S[2]);
      if (d < 10) { c = mix(c, [0.88, 0.8, 0.6], ss(10, 7.5, d) * 0.7); c = mix(c, [0.78 - 0.25 * n2, 0.42 - 0.2 * n2, 0.3 - 0.12 * n2], ss(7.6, 6.2, d)); }
    }
    return c;
  }
  function cTibia(x, y, z) {
    const n = K.noise(x * 0.3, y * 0.3, z * 0.3) - 0.5;
    let c = [CART[0] + 0.05 * n, CART[1] + 0.05 * n, CART[2] + 0.07 * n];
    c = mix(c, [SYN[0] + 0.1 * n, SYN[1], SYN[2]], ss(6.5, 3.5, Math.abs(x)) * (1 - 0.5 * ss(3, 7, y)));
    return mix(c, PERI, ss(-4, -8, y));
  }
  function cMen(side) {
    return (x, y, z) => {
      const q = K.menParam(x, z, side), n = K.noise(x * 0.5, y * 0.5, z * 0.5) - 0.5, st = 0.025 * Math.sin(q.ang * 46);
      let c = [0.9 + st + 0.04 * n, 0.855 + st + 0.04 * n, 0.73 + st + 0.05 * n];
      c = mix(c, [0.86, 0.58, 0.5], ss(0.84, 1.0, q.rho) * 0.8);
      if (side === 1 && K.les.mmTear && q.ang < -68 * DEG && q.ang > -166 * DEG) c = mix(c, [0.62, 0.2, 0.17], ss(2.6, 0.9, Math.abs(q.rho - 0.8) * q.m.ax));
      if (side === -1 && K.les.lmTear && Math.cos(q.ang - 170 * DEG) > 0 && q.rho < 0.92) c = mix(c, [0.62, 0.2, 0.17], ss(2.8, 1.0, Math.abs(Math.sin(q.ang - 170 * DEG)) * q.rho * q.m.ax));
      return c;
    };
  }
  function cPat(x, y, z) { const n = K.noise(x * 0.3, y * 0.3, z * 0.3) - 0.5; return mix([CART[0] + 0.05 * n, CART[1] + 0.05 * n, CART[2] + 0.07 * n], PERI, ss(-1, 3, z)); }
  function cCaps(x, y, z) {
    const n = K.noise(x * 0.09, y * 0.09, z * 0.09), n2 = K.noise(x * 0.3 + 9, y * 0.3, z * 0.3);
    return mix([0.9 + 0.1 * n2, 0.56 + 0.12 * n2, 0.5 + 0.1 * n2], [0.74, 0.3, 0.27], ss(0.5, 0.85, n));
  }

  // ---------- anatomia ----------
  const solids = [];
  const femG = new T.Group(); femG.matrixAutoUpdate = false; scene.add(femG);
  const patG = new T.Group(); patG.matrixAutoUpdate = false; scene.add(patG);
  const dyn = {}; // malhas reconstruídas
  let defMesh = null;
  function setSolid(key, mesh, id, parent, layer, soft) {
    if (dyn[key]) { const o = dyn[key], v = o.userData.vis; if (v) { if (defMesh === v) defMesh = null; v.parent.remove(v); v.geometry.dispose(); } o.parent.remove(o); o.geometry.dispose(); const i = solids.indexOf(o); if (i >= 0) solids.splice(i, 1); dyn[key] = null; }
    if (!mesh) return;
    mesh.userData.id = id; if (layer) mesh.layers.set(layer); (parent || scene).add(mesh); solids.push(mesh); dyn[key] = mesh;
    if (soft) { const v = new T.Mesh(mesh.geometry.clone(), mesh.material); v.userData.rest = new Float32Array(mesh.geometry.attributes.position.array); mesh.visible = false; mesh.userData.vis = v; (parent || scene).add(v); }
  }
  function buildFemur() { setSolid('femur', new T.Mesh(geo(K.surfaceNets(K.femurL, [-44, -4, -32], [44, 128, 40], 1.4), cFemur), mCart), 'femur', femG); }
  function buildTibia() { setSolid('tibia', new T.Mesh(geo(K.surfaceNets(K.tibia, [-44, -66, -38], [44, 12, 30], 1.5), cTibia), mCart), 'tibia'); }
  function menGeo(side) {
    const m = K.MEN[side], J = 16, N = 170, A0 = m.A0, pos = [], idx = [], P = J + 2;
    for (let i = 0; i <= N; i++) {
      const a = A0 + (2 * Math.PI - 2 * A0) * i / N, an = a > Math.PI ? a - 2 * Math.PI : a;
      const e = Math.min(a - A0, 2 * Math.PI - A0 - a), s = 0.05 + 0.95 * ss(0, 0.62, e);
      let rin = m.rin + (1 - s) * 0.12;
      if (side === -1 && K.les.lmTear && Math.abs(Math.sin(an - 170 * DEG)) * 0.62 * m.ax < 1.1 && Math.cos(an - 170 * DEG) > 0) rin = 0.87;
      const cleft = side === 1 && K.les.mmTear && an < -75 * DEG && an > -160 * DEG;
      const put = (rho, y) => pos.push(m.cx - side * rho * m.ax * Math.cos(a), y, -4 + rho * m.az * Math.sin(a));
      put(rin, K.YB);
      for (let j = 1; j <= J; j++) {
        const rho = rin + (1 - rin) * j / J; let y = K.YB + m.H * s * Math.pow(j / J, 0.9);
        if (cleft) { const d = Math.abs(rho - 0.8) * m.ax; if (d < 1.3) y = K.YB + (y - K.YB) * (0.12 + 0.88 * ss(0.3, 1.3, d)); }
        put(rho, y);
      }
      put(1, K.YB - 0.4);
      if (i > 0) for (let j = 0; j < P; j++) { const a0 = (i - 1) * P + j, a1 = (i - 1) * P + (j + 1) % P, b0 = i * P + j, b1 = i * P + (j + 1) % P; idx.push(a0, a1, b1, a0, b1, b0); }
    }
    for (const base of [0, N * P]) for (let j = 1; j < P - 1; j++) idx.push(base, base + j, base + j + 1);
    const g = new T.BufferGeometry(), p = new Float32Array(pos), col = new Float32Array(pos.length), cf = cMen(side);
    for (let i = 0; i < pos.length; i += 3) { const c = cf(pos[i], pos[i + 1], pos[i + 2]); col[i] = c[0]; col[i + 1] = c[1]; col[i + 2] = c[2]; }
    g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  function buildMen() { setSolid('mm', new T.Mesh(menGeo(1), mMen), 'mm', null, 0, 1); setSolid('lm', new T.Mesh(menGeo(-1), mMen), 'lm', null, 0, 1); }
  function buildPatella() { setSolid('patela', new T.Mesh(geo(K.surfaceNets(K.patellaL, [-24, -23, -14], [24, 23, 12], 1.3), cPat), mCart), 'patela', patG); }
  function buildCapsule() { setSolid('capsula', new T.Mesh(geo(K.surfaceNets(K.capsule, [-58, -36, -114], [58, 134, 58], 3), cCaps, (x, y, z) => [(x + z * 0.7) / 48, (y + z * 0.45) / 48]), mCaps), 'capsula', null, 1); }
  function tube(a, b, bow, r, mat, emb) {
    const A = V(a), B = V(b), M = A.clone().lerp(B, 0.5).add(V(bow)), dA = emb ? V(emb) : A.clone().sub(M).setLength(5), dB = B.clone().sub(M).setLength(5);
    const g = new T.TubeGeometry(new T.CatmullRomCurve3([A.clone().add(dA), A, M, B, B.clone().add(dB)]), 28, r, 12, false);
    return new T.Mesh(g, mat);
  }
  function buildLigs() {
    const L = K.ligEnds();
    if (K.les.lca) {
      const d = V(L.aclF).sub(V(L.aclT)).normalize(), e = V(L.aclT).addScaledVector(d, 9).add(new T.Vector3(1.5, -1, 2));
      setSolid('lca', tube(L.aclT, [e.x, e.y, e.z], [0.5, 0.5, 1.5], 3.9, mStump, [0, -7, 0]), 'coto', null, 0, 1);
      const s = new T.Mesh(blob(4.4, 1.3, 3), mStump); s.position.copy(e); setSolid('lcaEnd', s, 'coto');
    } else { setSolid('lcaEnd', null); setSolid('lca', tube(L.aclT, L.aclF, [1, 1.5, 1], 4.2, mACL, [0, -7, 0]), 'lca', null, 0, 1); }
    setSolid('lcp', tube(L.pclT, L.pclF, [-1.5, 3, -4.5], 5, mPCL, [0, -7, 2]), 'lcp', null, 0, 1);
    setSolid('mucoso', tube(K.toWorld([0, 13.5, 5]), [0, 6, 29.5], [0, -2.5, 0], 1.1, mPCL), 'mucoso'); solids.splice(solids.indexOf(dyn.mucoso), 1); // visual apenas: os instrumentos o afastam
    setSolid('popliteo', tube(K.toWorld([-36.5, 17, -8]), [-18, -12, -30], [-10, 2, -3], 2.6, mACL), 'popliteo', null, 0, 1);
  }
  function blob(r, amp, f) {
    const g = new T.SphereGeometry(r, 26, 18), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), s = 1 + (K.noise(x * f / r + 3, y * f / r, z * f / r) - 0.5) * amp / r * 2; p.setXYZ(i, x * s, y * s, z * s); }
    g.computeVertexNormals(); return g;
  }
  [[0, 2, 31.5, 5], [0, 13, 36.5, 4.5], [3, -3, 29.5, 4.5], [-3, -4, 30, 4]].forEach((f, i) => {
    const m = new T.Mesh(blob(f[3], 1.6, 2.2), mFat); m.position.set(f[0], f[1], f[2]); setSolid('fat' + i, m, 'gordura', null, 1);
  });
  function buildLoose() {
    if (!K.les.livre) return setSolid('livre', null);
    const m = new T.Mesh(blob(2.8, 0.9, 2), mLoose); m.position.copy(V(K.les.livre)); m.scale.set(1.15, 0.8, 1); setSolid('livre', m, 'livre');
  }
  // partículas em suspensão
  (function () {
    const n = 220, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[3 * i] = (rnd() - 0.5) * 80; p[3 * i + 1] = rnd() * 50 - 8; p[3 * i + 2] = (rnd() - 0.5) * 70; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3));
    const pts = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 0.28, transparent: true, opacity: 0.4, depthWrite: false, map: canvasTex(32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }) })); pts.layers.set(1); scene.add(pts); dyn.pts = pts;
  })();

  // ---------- instrumentos ----------
  const probeG = new T.Group(); scene.add(probeG);
  (function () {
    const sh = new T.CylinderGeometry(1.15, 1.15, 170, 14); sh.rotateX(Math.PI / 2); sh.translate(0, 0, 85); probeG.add(new T.Mesh(sh, mSteel));
    const hk = new T.CylinderGeometry(0.85, 0.7, 3.6, 10); hk.translate(0, -1.6, 0.5); probeG.add(new T.Mesh(hk, mSteel));
    const hd = new T.CylinderGeometry(4, 4, 60, 12); hd.rotateX(Math.PI / 2); hd.translate(0, 0, 200); const h = new T.Mesh(hd, new T.MeshPhongMaterial({ color: 0x2f6f8f })); h.layers.set(2); probeG.add(h);
  })();
  const scopeG = new T.Group(); scene.add(scopeG);
  (function () {
    const sh = new T.CylinderGeometry(2, 2, 170, 14); sh.rotateX(Math.PI / 2); sh.translate(0, 0, 85); const a = new T.Mesh(sh, mSteel); a.layers.set(2); scopeG.add(a);
    const hd = new T.CylinderGeometry(7, 7, 55, 12); hd.rotateX(Math.PI / 2); hd.translate(0, 0, 197); const h = new T.Mesh(hd, new T.MeshPhongMaterial({ color: 0x30343a })); h.layers.set(2); scopeG.add(h);
  })();
  const target = new T.Mesh(new T.SphereGeometry(1.5, 16, 12), new T.MeshBasicMaterial({ color: 0x3dff9a })); target.visible = false; scene.add(target);

  const scope = { yaw: 19, pitch: -4, depth: 12, rot: 0 }, probe = { yaw: -19, pitch: -6, depth: 12, roll: 0 };
  const pose = { flex: 90, vv: 0 };
  const set = { rot: true, pip: true, fulcro: true };
  const st = { mode: 'tour', t: 0, run: true, contacts: 0, pathS: 0, pathP: 0, cKey: null, cDist: 0, cPt: null, pKey: null, clampS: false, tipS: new T.Vector3(), tipP: new T.Vector3(), view: new T.Vector3() };
  let dirty = true, poseDirty = true, ctlMode = false;
  const remote = { y: 0, p: 0, d: 12, r: 0, m: -1, n: -1, t: -1e9 };

  function applyPose() {
    K.setPose(pose.flex, pose.vv);
    const R = K.P.R, t = K.P.t; femG.matrix.set(R[0], R[1], R[2], t[0], R[3], R[4], R[5], t[1], R[6], R[7], R[8], t[2], 0, 0, 0, 1);
    const c = K.P.pat.c, ca = Math.cos(K.P.pat.a), sa = Math.sin(K.P.pat.a); patG.matrix.set(1, 0, 0, c[0], 0, ca, sa, c[1], 0, -sa, ca, c[2], 0, 0, 0, 1);
    buildLigs(); buildCapsule(); scene.updateMatrixWorld(true); dirty = true; poseDirty = false;
    $('#flexV').textContent = Math.round(pose.flex) + '°';
    $('#vvV').textContent = pose.vv === 0 ? 'neutro' : (pose.vv > 0 ? 'valgo ' : 'varo ') + Math.abs(pose.vv).toFixed(0) + '°';
    $('#flex').value = pose.flex; $('#vv').value = pose.vv;
  }
  const rc = new T.Raycaster(); rc.layers.enableAll();
  function cast(o, d, far) { rc.set(o, d); rc.near = 0; rc.far = far; const h = rc.intersectObjects(solids, false); return h.length ? h[0] : null; }
  const keyOf = h => K.classify(h.object.userData.id, [h.point.x, h.point.y, h.point.z]);
  const dirOf = (y, p) => new T.Vector3(Math.sin(y * DEG) * Math.cos(p * DEG), Math.sin(p * DEG), -Math.cos(y * DEG) * Math.cos(p * DEG));
  const Zm = new T.Vector3(0, 0, -1), PAL = V(K.PORTAL.al), PAM = V(K.PORTAL.am);
  const SOFT = { mm: 2.2, lm: 2.2, lca: 1.6, lcp: 1.6, coto: 4.5, mucoso: 4.5, popliteo: 1.6 };
  const CARTK = { cfm: 1, cfl: 1, troclea: 1, plato_med: 1, plato_lat: 1, patela: 1 };

  function updateInstruments() {
    // óptica
    let d = dirOf(scope.yaw, scope.pitch), h = cast(PAL, d, 135), mx = h ? h.distance - 1.2 : 118;
    const cl = scope.depth > mx;
    if (cl) { scope.depth = Math.max(1, mx); if (!st.clampS && h && CARTK[keyOf(h)] && st.run) { st.contacts++; toast('Óptica tocou a cartilagem', 1); } }
    st.clampS = cl;
    const tip = PAL.clone().addScaledVector(d, scope.depth);
    const u0 = new T.Vector3(0, 1, 0).addScaledVector(d, -d.y).normalize(), r0 = new T.Vector3().crossVectors(d, u0);
    const b = u0.clone().multiplyScalar(-Math.cos(scope.rot * DEG)).addScaledVector(r0, Math.sin(scope.rot * DEG));
    const v = d.clone().multiplyScalar(Math.cos(30 * DEG)).addScaledVector(b, Math.sin(30 * DEG)).normalize();
    cam.position.copy(tip); cam.up.copy(u0); cam.lookAt(tip.clone().add(v)); cam.updateMatrixWorld(true);
    scopeG.position.copy(tip); scopeG.quaternion.setFromUnitVectors(Zm, d);
    if (st.run) st.pathS += tip.distanceTo(st.tipS); st.tipS.copy(tip); st.view.copy(v);
    const hc = cast(tip, v, 90);
    st.cKey = hc ? keyOf(hc) : null; st.cDist = hc ? hc.distance : 99; st.cPt = hc ? hc.point.clone() : null;
    // probe
    d = dirOf(probe.yaw, probe.pitch); h = cast(PAM, d, 135);
    const hid = h ? h.object.userData.id : null, lim = h ? h.distance - 0.5 : 118;
    let allow = hid ? SOFT[hid] || 0 : 0, unstable = false;
    if (hid === 'mm' && K.les.mmTear && h.point.distanceTo(V(LESIONS.mmTear.c())) < 10) { allow = 4.2; unstable = true; }
    if (hid === 'lm' && K.les.lmTear && h.point.distanceTo(V(LESIONS.lmTear.c())) < 8) { allow = 4.2; unstable = true; }
    if (probe.depth > lim + allow) probe.depth = Math.max(1, lim + allow);
    const push = h ? clamp(probe.depth - lim, 0, allow) : 0;
    if (defMesh) { const pa = defMesh.geometry.attributes.position; pa.array.set(defMesh.userData.rest); pa.needsUpdate = true; defMesh = null; }
    if (push > 0.05 && h.object.userData.vis) {
      const vm = h.object.userData.vis, pa = vm.geometry.attributes.position, a = pa.array, rs = vm.userData.rest, px = h.point.x, py = h.point.y, pz = h.point.z;
      for (let i = 0; i < a.length; i += 3) { const x = rs[i] - px, y = rs[i + 1] - py, z = rs[i + 2] - pz, q = x * x + y * y + z * z; if (q < 81) { const w = push * Math.exp(-q / 11); a[i] += d.x * w; a[i + 1] += d.y * w; a[i + 2] += d.z * w; } }
      pa.needsUpdate = true; defMesh = vm;
    }
    const tp = PAM.clone().addScaledVector(d, probe.depth);
    probeG.position.copy(tp); probeG.quaternion.setFromUnitVectors(Zm, d).multiply(new T.Quaternion().setFromAxisAngle(Zm, probe.roll * DEG));
    if (st.run) st.pathP += tp.distanceTo(st.tipP); st.tipP.copy(tp);
    st.pKey = h && h.distance - probe.depth < 1.7 ? keyOf(h) : null;
    $('#mark').style.transform = `rotate(${180 - scope.rot}deg)`;
    $('#red').style.opacity = clamp((3.2 - st.cDist) / 2.4, 0, 0.92);
    $('#clabel').textContent = set.rot && st.cKey ? `${K.NOME[st.cKey]} · ${st.cDist.toFixed(0)} mm` : '';
    st.push = push;
    $('#plabel').textContent = st.pKey ? 'Probe em contato: ' + K.NOME[st.pKey] + (unstable && push > 1 ? ' — fragmento instável, cede ' + push.toFixed(1) + ' mm' : hid === 'coto' && push > 1 ? ' — frouxo, sem tensão' : (hid === 'lca' || hid === 'lcp') && push > 1.2 ? ' — tenso, ponto final firme' : push > 0.3 ? ' — cede ' + push.toFixed(1) + ' mm' : '') : '';
  }

  // ---------- entrada ----------
  const keys = {}, acts = {}, pads = { s: { x: 0, y: 0 }, p: { x: 0, y: 0 } };
  const GAME = ['KeyZ', 'KeyX', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR', 'KeyF', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Period', 'Comma', 'KeyM', 'Enter'];
  addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox') return; if (GAME.includes(e.code)) { e.preventDefault(); if (!keys[e.code] && (e.code === 'KeyM' || e.code === 'Enter')) markFinding(); keys[e.code] = 1; } });
  addEventListener('keyup', e => { keys[e.code] = 0; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = 0; });
  document.querySelectorAll('.pad').forEach(el => {
    const s = pads[el.dataset.pad], knob = el.querySelector('i'); let id = null;
    const mv = e => { const r = el.getBoundingClientRect(), R = r.width / 2; let x = (e.clientX - r.left - R) / (R * 0.75), y = -(e.clientY - r.top - R) / (R * 0.75); const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } s.x = x; s.y = y; knob.style.transform = `translate(${x * R * 0.6}px,${-y * R * 0.6}px)`; };
    el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); mv(e); e.preventDefault(); });
    el.addEventListener('pointermove', e => { if (e.pointerId === id) mv(e); });
    const up = e => { if (e.pointerId === id) { id = null; s.x = s.y = 0; knob.style.transform = ''; } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
  document.querySelectorAll('[data-act]').forEach(el => {
    const a = el.dataset.act; const on = e => { acts[a] = 1; el.classList.add('on'); e.preventDefault(); }, off = () => { acts[a] = 0; el.classList.remove('on'); };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
    el.addEventListener('contextmenu', e => e.preventDefault());
  });
  (function () {
    const w = $('#scopeWrap'); let id = null, lx = 0, ly = 0;
    w.addEventListener('pointerdown', e => { id = e.pointerId; w.setPointerCapture(id); lx = e.clientX; ly = e.clientY; });
    w.addEventListener('pointermove', e => { if (e.pointerId !== id) return; const f = set.fulcro ? -1 : 1; scope.yaw += f * (e.clientX - lx) * 0.13; scope.pitch += f * -(e.clientY - ly) * 0.13; lx = e.clientX; ly = e.clientY; dirty = true; });
    const up = e => { if (e.pointerId === id) id = null; }; w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
    w.addEventListener('wheel', e => { e.preventDefault(); scope.depth -= e.deltaY * 0.03; dirty = true; }, { passive: false });
  })();
  function shaftBad(P0, o, r) {
    const d = dirOf(o.yaw, o.pitch);
    for (let s = 6; s < o.depth - 4; s += 3) { const x = P0.x + d.x * s, y = P0.y + d.y * s, z = P0.z + d.z * s; if (K.femurW(x, y, z) < r || K.tibia(x, y, z) < r || K.patellaW(x, y, z) < r) return true; }
    return false;
  }
  function constrain(P0, o, prev, r) {
    if (!shaftBad(P0, o, r) || shaftBad(P0, prev, r)) return;
    const ny = o.yaw, np = o.pitch;
    o.yaw = prev.yaw; if (!shaftBad(P0, o, r)) return;
    o.yaw = ny; o.pitch = prev.pitch; if (!shaftBad(P0, o, r)) return;
    o.yaw = prev.yaw; if (shaftBad(P0, o, r)) o.depth = Math.min(o.depth, prev.depth);
  }
  const lastS = Object.assign({}, scope), lastP = Object.assign({}, probe);
  function readInput(dt) {
    const k = c => keys[c] ? 1 : 0, a = c => acts[c] ? 1 : 0, f = set.fulcro ? -1 : 1, AR = 38 * dt, DR = 26 * dt;
    const sx = pads.s.x + k('KeyD') - k('KeyA'), sy = pads.s.y + k('KeyW') - k('KeyS'), sd = k('KeyR') - k('KeyF') + a('sIn') - a('sOut'), sr = k('KeyE') - k('KeyQ') + a('rR') - a('rL');
    const px = pads.p.x + k('ArrowRight') - k('ArrowLeft'), py = pads.p.y + k('ArrowUp') - k('ArrowDown'), pd = k('PageUp') + k('Period') - k('PageDown') - k('Comma') + a('pIn') - a('pOut');
    if (sx || sy || sd || sr || px || py || pd) dirty = true;
    scope.yaw += f * sx * AR; scope.pitch += f * sy * AR; scope.depth += sd * DR; scope.rot = (scope.rot + sr * 95 * dt + 360) % 360;
    probe.yaw += f * px * AR; probe.pitch += f * py * AR; probe.depth += pd * DR;
    probe.roll = clamp(probe.roll + (k('KeyX') - k('KeyZ')) * 120 * dt, -180, 180); if (k('KeyX') || k('KeyZ')) dirty = true;
    if (performance.now() - remote.t < 1500) { // celular no comando do probe
      const g = Math.min(1, dt * 20); probe.yaw += (remote.y - probe.yaw) * g; probe.pitch += (remote.p - probe.pitch) * g; probe.roll += (remote.r - probe.roll) * g; probe.depth = remote.d; dirty = true;
    }
    for (const o of [scope, probe]) { o.yaw = clamp(o.yaw, -78, 78); o.pitch = clamp(o.pitch, -58, 82); o.depth = clamp(o.depth, 1, 118); }
    if (dirty) { constrain(PAL, scope, lastS, 1.3); constrain(PAM, probe, lastP, 0.7); }
    Object.assign(lastS, scope); Object.assign(lastP, probe);
  }

  // ---------- modos ----------
  const TOUR = [
    { k: ['recesso'], n: 'Recesso suprapatelar', p: 'extensão' }, { k: ['patela'], n: 'Patela (superfície articular)', p: 'extensão' }, { k: ['troclea'], n: 'Tróclea', p: 'extensão' },
    { k: ['got_lat'], n: 'Goteira lateral', p: 'extensão' }, { k: ['got_med'], n: 'Goteira medial', p: 'extensão' },
    { k: ['cfm'], n: 'Côndilo femoral medial', p: '30° + valgo' }, { k: ['mm_ant', 'mm_corpo'], n: 'Menisco medial (corno anterior / corpo)', p: '30° + valgo' }, { k: ['mm_post'], n: 'Menisco medial — corno posterior', p: '30° + valgo' }, { k: ['plato_med'], n: 'Platô tibial medial', p: '30° + valgo' },
    { k: ['lca'], n: 'LCA', p: '90°' }, { k: ['lcp'], n: 'LCP', p: '90°' },
    { k: ['cfl'], n: 'Côndilo femoral lateral', p: 'figura-4' }, { k: ['lm_ant', 'lm_corpo', 'lm_post'], n: 'Menisco lateral', p: 'figura-4' }, { k: ['plato_lat'], n: 'Platô tibial lateral', p: 'figura-4' }
  ];
  const cL = [-24.5, 22, -4], rL = [14.5, 22, 22];
  const TARGETS = [
    { n: 'Corno anterior do menisco medial', f: () => K.menPoint(1, 0.75, 72, 1.5) }, { n: 'Corpo do menisco medial (borda livre)', f: () => K.menPoint(1, 0.6, 180, 1.5) },
    { n: 'Corno anterior do menisco lateral', f: () => K.menPoint(-1, 0.7, 62, 1.8) }, { n: 'Eminência intercondilar (espinha medial)', f: () => [4, 8.3, -3] },
    { n: 'Côndilo femoral medial (zona de carga)', f: () => K.toWorld([K.LS.S[0], K.LS.S[1] - 1.2, K.LS.S[2] - 1]) },
    { n: 'Côndilo femoral lateral (zona de carga)', f: () => K.toWorld([cL[0] - 1.5, cL[1] - 0.79 * rL[1] - 1.2, cL[2] - 0.62 * rL[2] - 1]) },
    { n: 'LCA — terço médio', f: () => { const L = K.ligEnds(), m = [0, 1, 2].map(i => (L.aclT[i] + L.aclF[i]) / 2), ax = [0, 1, 2].map(i => L.aclF[i] - L.aclT[i]), al = Math.hypot(ax[0], ax[1], ax[2]), q = [0, 1, 2].map(i => K.PORTAL.am[i] - m[i]), k = (q[0] * ax[0] + q[1] * ax[1] + q[2] * ax[2]) / al / al, d = q.map((v, i) => v - ax[i] * k), l = Math.hypot(d[0], d[1], d[2]); return m.map((v, i) => v + d[i] / l * 5.8); } },
    { n: 'Área intercondilar anterior da tíbia', f: () => [-7, 0.2, 15] }
  ];
  const LESIONS = {
    condral: { n: 'Lesão condral no côndilo femoral medial (zona de carga)', r: 10, c: () => K.toWorld(K.LS.S) },
    mmTear: { n: 'Ruptura longitudinal do menisco medial (corno posterior / corpo)', r: 10, c: () => K.menPoint(1, 0.8, -118, 1) },
    lmTear: { n: 'Ruptura radial do corpo do menisco lateral', r: 9, c: () => K.menPoint(-1, 0.62, 170, 1) },
    lca: { n: 'Ruptura do LCA (coto tibial, parede lateral vazia)', r: 13, c: () => { const L = K.ligEnds(); return [L.aclT[0], L.aclT[1] + 7, L.aclT[2] - 3]; } },
    livre: { n: 'Corpo livre intra-articular', r: 7, c: () => K.les.livre }
  };
  let tour, tri, caso;
  function resetMetrics() { st.t = 0; st.contacts = 0; st.pathS = 0; st.pathP = 0; st.run = true; }
  function setLesions(L) { const ch = JSON.stringify(L) !== JSON.stringify(K.les); Object.assign(K.les, L); if (ch || !dyn.femur) { buildFemur(); buildMen(); buildLoose(); poseDirty = true; } }
  const NOLES = { condral: false, mmTear: false, lmTear: false, lca: false, livre: null };
  function startMode(m) {
    st.mode = m; resetMetrics(); target.visible = false;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('sel', b.dataset.mode === m));
    if (m === 'tour') { setLesions(NOLES); tour = TOUR.map(() => 0); }
    if (m === 'tri') { setLesions(NOLES); setPose(90, 0); tri = { order: TARGETS.map((_, i) => i).sort(() => Math.random() - 0.5), i: 0, hold: 0, laps: [], t0: 0 }; target.visible = true; }
    if (m === 'caso') {
      const L = Object.assign({}, NOLES), r = Math.random;
      if (r() > 0.12) { const ks = ['condral', 'mmTear', 'lmTear', 'lca', 'livre'].sort(() => r() - 0.5).slice(0, 1 + (r() * 3 | 0)); ks.forEach(k => { L[k] = k === 'livre' ? [[-40.6, 12, 4], [40.6, 12, 4], [-7, 1.3, 15]][r() * 3 | 0] : true; }); }
      setLesions(L); caso = { found: {}, fp: 0 };
    }
    renderTask(); dirty = true;
  }
  function setPose(f, v) { pose.flex = f; pose.vv = v; poseDirty = true; }
  function markFinding() {
    if (st.mode !== 'caso' || !st.run) return;
    const pts = [st.tipP]; if (st.cPt && st.cDist < 55) pts.push(st.cPt);
    let hit = null;
    for (const k in LESIONS) { if (!K.les[k] || caso.found[k]) continue; const c = V(LESIONS[k].c()); if (pts.some(p => p.distanceTo(c) <= LESIONS[k].r)) { hit = k; break; } }
    if (hit) { caso.found[hit] = 1; toast('Achado registrado: ' + LESIONS[hit].n); } else { caso.fp++; toast('Nada de anormal neste ponto (falso-positivo)', 1); }
    renderTask();
  }
  const fmtT = t => `${(t / 60 | 0)}:${String(t % 60 | 0).padStart(2, '0')}`;
  function metricsHTML() { return `<div class="mt"><div><b>${fmtT(st.t)}</b><span>tempo</span></div><div><b>${st.contacts}</b><span>toques na cartilagem</span></div><div><b>${(st.pathS / 10).toFixed(0)} cm</b><span>percurso da óptica</span></div><div><b>${(st.pathP / 10).toFixed(0)} cm</b><span>percurso do probe</span></div></div>`; }
  function report(title, body) { st.run = false; $('#mTitle').textContent = title; $('#mBody').innerHTML = body + metricsHTML(); $('#modal').classList.add('show'); }
  function finishCase() {
    const real = Object.keys(LESIONS).filter(k => K.les[k]);
    let h = real.length ? '<ul class="rep">' + real.map(k => `<li class="${caso.found[k] ? 'ok' : 'miss'}">${caso.found[k] ? 'Identificada' : 'Não identificada'} — ${LESIONS[k].n}</li>`).join('') + '</ul>' : `<p>Joelho sem lesões. ${caso.fp ? '' : 'Exame normal corretamente concluído.'}</p>`;
    if (caso.fp) h += `<p class="miss">${caso.fp} marcação(ões) falso-positiva(s).</p>`;
    report('Relatório do caso', h);
  }
  function renderTask() {
    const el = $('#task'); let h = '';
    if (st.mode === 'tour') {
      const nx = tour.findIndex(v => v < 1);
      h = `<p class="hint">Centralize cada estrutura na imagem por meio segundo. Ajuste a posição da perna conforme o compartimento.</p><ol class="chk">` + TOUR.map((it, i) => `<li class="${tour[i] >= 1 ? 'ok' : i === nx ? 'cur' : ''}"><span>${it.n}</span><em>${it.p}</em></li>`).join('') + '</ol>';
    } else if (st.mode === 'tri') {
      const it = TARGETS[tri.order[tri.i]];
      h = `<p class="hint">Enquadre o alvo verde com a óptica e toque-o com a ponta do probe.</p><div class="big">Alvo ${tri.i + 1} / ${TARGETS.length}</div><div class="tg">${it ? it.n : ''}</div><button id="skip" class="btn">Pular alvo</button>`;
    } else {
      const f = Object.keys(caso.found);
      h = `<p class="hint">Joelho com achados desconhecidos (pode ser normal). Faça o inventário completo, palpe com o probe e registre cada lesão com a ponta do probe sobre ela ou com ela no centro da imagem.</p><div class="row"><button id="markB" class="btn pri">Marcar achado (M)</button><button id="endB" class="btn">Encerrar exame</button></div>` +
        (f.length ? '<ul class="rep">' + f.map(k => `<li class="ok">${LESIONS[k].n}</li>`).join('') + '</ul>' : '<p class="dim">Nenhum achado registrado.</p>');
    }
    el.innerHTML = h;
    const b = (id, fn) => { const e = $(id); if (e) e.onclick = fn; };
    b('#skip', () => { tri.laps.push(null); nextTarget(); }); b('#markB', markFinding); b('#endB', finishCase);
  }
  function nextTarget() {
    tri.i++; tri.hold = 0; tri.t0 = st.t;
    if (tri.i >= TARGETS.length) { target.visible = false; const ok = tri.laps.filter(v => v !== null); report('Triangulação concluída', `<p>${ok.length} de ${TARGETS.length} alvos tocados${ok.length ? ` · média de ${(ok.reduce((a, b) => a + b, 0) / ok.length).toFixed(1)} s por alvo` : ''}.</p>`); return; }
    renderTask();
  }
  function modeTick(dt) {
    if (!st.run) return;
    st.t += dt;
    if (st.mode === 'tour') {
      if (st.cKey && st.cDist < 55) {
        let ch = false;
        TOUR.forEach((it, i) => { if (tour[i] < 1 && it.k.includes(st.cKey)) { tour[i] += dt / 0.5; if (tour[i] >= 1) { ch = true; toast('Visualizado: ' + it.n); } } });
        if (ch) { renderTask(); if (tour.every(v => v >= 1)) report('Inventário articular completo', '<p>Todas as estruturas do roteiro foram visualizadas.</p>'); }
      }
    } else if (st.mode === 'tri' && tri.i < TARGETS.length) {
      const p = V(TARGETS[tri.order[tri.i]].f()); target.position.copy(p);
      const to = p.clone().sub(st.tipS), dist = to.length(), ang = to.normalize().angleTo(st.view) / DEG;
      const ok = st.tipP.distanceTo(p) < 4.5 && ang < 40 && dist < 75;
      target.material.color.setHex(ok ? 0xffffff : 0x3dff9a);
      tri.hold = ok ? tri.hold + dt : 0;
      if (tri.hold > 0.35) { tri.laps.push(st.t - tri.t0); toast('Alvo tocado em ' + (st.t - tri.t0).toFixed(1) + ' s'); nextTarget(); }
    }
  }
  let toastT = 0;
  function toast(msg, warn) { const e = $('#toast'); e.textContent = msg; e.className = 'show' + (warn ? ' warn' : ''); toastT = 2.2; }

  // ---------- UI ----------
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => startMode(b.dataset.mode));
  document.querySelectorAll('[data-pose]').forEach(b => b.onclick = () => { const [f, v] = b.dataset.pose.split(',').map(Number); setPose(f, v); });
  $('#flex').oninput = e => setPose(+e.target.value, pose.vv); $('#vv').oninput = e => setPose(pose.flex, +e.target.value);
  $('#oRot').onchange = e => { set.rot = e.target.checked; dirty = true; }; $('#oPip').onchange = e => { set.pip = e.target.checked; $('#pip').style.display = set.pip ? '' : 'none'; };
  $('#oFul').onchange = e => { set.fulcro = e.target.checked; };
  $('#restart').onclick = () => startMode(st.mode);
  $('#mAgain').onclick = () => { $('#modal').classList.remove('show'); startMode(st.mode); };
  $('#mClose').onclick = () => { $('#modal').classList.remove('show'); };


  // ---------- celular como probe ----------
  // Transportes: sala do artefato (presence), PeerJS (página hospedada em https) ou BroadcastChannel (arquivo local, duas janelas)
  const net = { kind: null, room: null, bc: null, peer: null, conn: null, code: String(1000 + Math.random() * 9000 | 0), onFb: null };
  function recvCtl(c) {
    if (ctlMode || !c || typeof c.y !== 'number' || c.n === remote.n) return;
    if (remote.m >= 0 && c.m !== remote.m) markFinding();
    remote.y = +c.y; remote.p = +c.p; remote.d = +c.d || 1; remote.r = +c.r || 0; remote.m = c.m; remote.n = c.n; remote.t = performance.now();
  }
  function netStatus(t, ok) { for (const id of ['#netStat', '#cStat']) { const e = $(id); e.textContent = t; e.classList.toggle('ok', !!ok); } }
  function sendCtl(c) {
    if (net.kind === 'room') net.room.presence({ ctl: c }).catch(() => { });
    else if (net.kind === 'bc') net.bc.postMessage({ ctl: c });
    else if (net.conn && net.conn.open) net.conn.send({ ctl: c });
  }
  let fbLast = '', fbT = 0;
  function sendFb(now) {
    if (now - fbT < 100 || now - remote.t > 1500) return; fbT = now;
    const fb = { d: +probe.depth.toFixed(1), c: st.pKey ? 1 : 0, y: +probe.yaw.toFixed(1), p: +probe.pitch.toFixed(1) }, j = JSON.stringify(fb);
    if (j === fbLast) return; fbLast = j;
    if (net.kind === 'room') net.room.presence({ fb }).catch(() => { });
    else if (net.kind === 'bc') net.bc.postMessage({ fb });
    else if (net.conn && net.conn.open) net.conn.send({ fb });
  }
  function netPoll() {
    if (net.kind !== 'room') return;
    let best = null; for (const p of net.room.peers()) { if (p.sameTab || !p.presence) continue; const v = ctlMode ? p.presence.fb : p.presence.ctl; if (v && (!best || p.updatedAt > best.u)) best = { v, u: p.updatedAt }; }
    if (best) { if (ctlMode) { if (net.onFb) net.onFb(best.v); } else recvCtl(best.v); }
  }
  const onMsg = m => { if (!m) return; if (m.ctl) recvCtl(m.ctl); if (m.fb && ctlMode && net.onFb) net.onFb(m.fb); };
  function loadScript(src) { return new Promise((ok, no) => { const e = document.createElement('script'); e.src = src; e.onload = ok; e.onerror = no; document.head.appendChild(e); }); }
  async function peerStart(asCtl, code) {
    try {
      if (!window.Peer) await loadScript('https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js');
      if (net.peer) { try { net.peer.destroy(); } catch (e) { } }
      const hook = c => { net.conn = c; c.on('data', onMsg); c.on('open', () => netStatus('celular e computador conectados', 1)); c.on('close', () => netStatus('conexão encerrada')); };
      if (asCtl) { net.peer = new Peer(); net.peer.on('open', () => hook(net.peer.connect('artrosim-' + code, { reliable: false }))); }
      else { net.peer = new Peer('artrosim-' + net.code); net.peer.on('open', () => netStatus('aguardando o celular — código ' + net.code)); net.peer.on('connection', hook); }
      net.peer.on('error', e => netStatus('falha na conexão: ' + (e.type || e.message)));
    } catch (e) { netStatus('não foi possível carregar a conexão direta'); }
  }
  (async function initNet() {
    netStatus('procurando conexão…');
    if (window.claude && typeof window.claude.use === 'function') {
      let r = null; try { r = await window.claude.use('room'); } catch (e) { }
      if (r) { net.kind = 'room'; net.room = r; netStatus('pronto — abra este mesmo link no celular'); return; }
      netStatus('conexão entre aparelhos indisponível nesta visualização'); return;
    }
    if (location.protocol === 'https:' || location.protocol === 'http:') { net.kind = 'peer'; $('#cCodeRow').style.display = 'flex'; peerStart(false); return; }
    if (window.BroadcastChannel) { net.kind = 'bc'; net.bc = new BroadcastChannel('artro'); net.bc.onmessage = e => onMsg(e.data); netStatus('modo local: abra em outra janela deste navegador'); return; }
    netStatus('conexão com o celular indisponível aqui');
  })();

  // ---- interface de controle (no celular) ----
  (function () {
    const c = { y: probe.yaw, p: probe.pitch, d: probe.depth, r: 0, m: 0, n: 0 }, hold = {};
    let mode = 'touch', cal = null, ori = null, gyroSeen = false, synced = false, lastSent = '', lastT = 0, contact = 0, timer = null;
    const wrap = a => ((a + 540) % 360) - 180, ful = () => $('#cFul').checked ? -1 : 1;
    net.onFb = fb => {
      if (!fb) return;
      if (!synced && typeof fb.y === 'number') { synced = true; c.y = fb.y; c.p = fb.p; c.d = fb.d; if (cal && ori) cal = { a: ori.a, b: ori.b, g: ori.g, y: c.y, p: c.p }; }
      if (typeof fb.d === 'number' && fb.d < c.d - 1.5) c.d = fb.d + 1;
      if (fb.c && !contact) { try { navigator.vibrate && navigator.vibrate(18); } catch (e) { } }
      contact = fb.c; $('#cPadA').classList.toggle('touching', !!fb.c);
      netStatus('conectado ao simulador', 1);
    };
    function drag(el, fn) { let id = null, lx = 0, ly = 0; el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); lx = e.clientX; ly = e.clientY; e.preventDefault(); }); el.addEventListener('pointermove', e => { if (e.pointerId !== id) return; fn(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY; }); const up = e => { if (e.pointerId === id) id = null; }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); }
    drag($('#cPadA'), (dx, dy) => { if (mode !== 'touch') return; c.y = clamp(c.y + ful() * dx * 0.16, -78, 78); c.p = clamp(c.p + ful() * -dy * 0.16, -58, 82); });
    drag($('#cDepth'), (dx, dy) => { c.d = clamp(c.d - dy * 0.22, 1, 118); });
    document.querySelectorAll('[data-c]').forEach(b => { const k = b.dataset.c; b.addEventListener('pointerdown', e => { hold[k] = 1; e.preventDefault(); }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { hold[k] = 0; }); });
    addEventListener('deviceorientation', e => {
      if (e.alpha == null || e.beta == null) return; ori = { a: e.alpha, b: e.beta, g: e.gamma || 0 }; gyroSeen = true;
      if (mode !== 'gyro') return; if (!cal) cal = { a: ori.a, b: ori.b, g: ori.g, y: c.y, p: c.p };
      c.y = clamp(cal.y - wrap(ori.a - cal.a), -78, 78); c.p = clamp(cal.p + (ori.b - cal.b), -58, 82); c.r = clamp(ori.g - cal.g, -180, 180);
    });
    function setMode(m) { mode = m; cal = null; $('#cTouch').classList.toggle('sel', m === 'touch'); $('#cGyro').classList.toggle('sel', m === 'gyro'); $('#cInfo').textContent = m === 'touch' ? 'Arraste aqui: mão do probe' : 'Aponte o topo do celular para a tela, como um cabo de instrumento'; }
    $('#cTouch').onclick = () => setMode('touch');
    $('#cGyro').onclick = () => {
      const go = () => { setMode('gyro'); setTimeout(() => { if (!gyroSeen) { setMode('touch'); $('#cHint').textContent = 'O sensor de movimento não respondeu nesta página. Dentro do Claude ele é bloqueado; para o modo Giro, abra a versão hospedada do simulador (arquivo index.html em qualquer endereço https).'; } }, 1500); };
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') D.requestPermission().then(r => { if (r === 'granted') go(); else $('#cHint').textContent = 'Permissão do sensor negada.'; }).catch(() => go()); else go();
    };
    $('#cCal').onclick = () => { if (ori) cal = { a: ori.a, b: ori.b, g: ori.g, y: c.y, p: c.p }; c.r = 0; };
    $('#cMark').onclick = () => { c.m++; };
    $('#cConn').onclick = () => { const v = $('#cCode').value.trim(); if (v.length === 4) { netStatus('conectando…'); peerStart(true, v); } };
    $('#beCtl').onclick = () => {
      ctlMode = true; synced = false; $('#ctlUI').classList.add('show'); setMode('touch');
      netStatus(net.kind === 'room' || net.kind === 'bc' ? 'aguardando o simulador no computador…' : net.kind === 'peer' ? 'digite o código mostrado no computador' : 'sem conexão disponível');
      try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => { }); } catch (e) { }
      timer = setInterval(() => {
        c.r = clamp(c.r + ((hold.rr || 0) - (hold.rl || 0)) * 4, -180, 180); netPoll();
        const now = performance.now(), j = [c.y.toFixed(1), c.p.toFixed(1), c.d.toFixed(1), c.r.toFixed(0), c.m].join();
        if (j !== lastSent || now - lastT > 500) { lastSent = j; lastT = now; c.n++; sendCtl({ y: +c.y.toFixed(1), p: +c.p.toFixed(1), d: +c.d.toFixed(1), r: +c.r.toFixed(0), m: c.m, n: c.n }); }
        $('#cVals').textContent = `giro ${c.y.toFixed(0)}° · inclinação ${c.p.toFixed(0)}° · profundidade ${c.d.toFixed(0)} mm`;
      }, 33);
    };
    $('#cExit').onclick = () => { ctlMode = false; clearInterval(timer); $('#ctlUI').classList.remove('show'); if (net.kind === 'room') net.room.presence({ ctl: null }).catch(() => { }); if (net.kind === 'peer') peerStart(false); };
  })();

  // ---------- laço ----------
  const pip = $('#pip'), pctx = pip.getContext('2d');
  let S = 0, last = performance.now(), frame = 0, hudT = 0;
  function resize() {
    const w = $('#scopeWrap').clientWidth; if (w === S || !w) return; S = w; renderer.setSize(S, S, false);
    const pr = renderer.getPixelRatio(); pip.width = pip.height = Math.round(Math.min(S, 240) * pr);
  }
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; frame++;
    if (ctlMode) return;
    resize(); if (!S) return;
    netPoll(); $('#netOn').style.display = now - remote.t < 1500 ? '' : 'none';
    if (poseDirty) applyPose();
    readInput(dt);
    if (dirty) { updateInstruments(); dirty = false; }
    modeTick(dt); sendFb(now);
    if (dyn.pts) { dyn.pts.rotation.y += dt * 0.05; dyn.pts.position.y = Math.sin(now / 3000) * 2; }
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('#toast').className = ''; }
    hudT -= dt; if (hudT <= 0) { hudT = 0.25; $('#hud').textContent = `${fmtT(st.t)}  ·  toques ${st.contacts}`; }
    renderer.setScissorTest(true);
    if (set.pip && frame % 3 === 0) {
      const pp = Math.min(S, 240), pr = renderer.getPixelRatio();
      renderer.setViewport(0, 0, pp, pp); renderer.setScissor(0, 0, pp, pp); renderer.setClearColor(0x121a22); renderer.render(scene, ext);
      pctx.drawImage(glc, 0, glc.height - pp * pr, pp * pr, pp * pr, 0, 0, pip.width, pip.height);
    }
    renderer.setViewport(0, 0, S, S); renderer.setScissor(0, 0, S, S); renderer.setClearColor(0x050101); renderer.render(scene, cam);
  }
  buildTibia(); buildPatella();
  startMode('tour');
  $('#loading').style.display = 'none';
  requestAnimationFrame(loop);
  window.__tp = () => TARGETS[tri.order[tri.i]].f();
  window.__sim = { scope, probe, pose, st, setPose, startMode, K, setLesions, mark: markFinding, touch: () => { dirty = true; } };
};
