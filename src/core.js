// Núcleo geométrico: anatomia procedural (SDF), cinemática do joelho, malhas (surface nets)
(function (root) {
  const DEG = Math.PI / 180, C = [0, 22, -4]; // eixo de flexão (mm). +X medial (joelho D), +Y proximal, +Z anterior
  const P = { flex: 90, vv: 0, R: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0], pat: { c: [0, 40, 30], a: 30 * DEG } };
  const les = { condral: false, mmTear: false, lmTear: false, lca: false, livre: null };
  const PORTAL = { al: [-14, 10, 34], am: [14, 10, 34] };
  const ATT = { aclF: [-13.5, 28, -18], aclT: [2, -1, 10], pclF: [11.5, 14, 2], pclT: [0, -6, -27] };
  const MEN = {
    1: { cx: 24, ax: 16.5, az: 23, rin: 0.52, H: 5.5, A0: 50 * DEG },
    '-1': { cx: -24, ax: 16.5, az: 19.5, rin: 0.45, H: 5.5, A0: 36 * DEG }
  };
  const YB = -1.7;
  const cM = [24, 22, -4], rM = [13, 22, 22];
  // lesão condral: zona de carga do côndilo medial
  const LS = (function () {
    let u = [0.1, -0.78, -0.62], n = Math.hypot(u[0], u[1], u[2]); u = u.map(v => v / n);
    const S = [cM[0] + rM[0] * u[0], cM[1] + rM[1] * u[1], cM[2] + rM[2] * u[2]];
    let g = [u[0] / rM[0], u[1] / rM[1], u[2] / rM[2]]; n = Math.hypot(g[0], g[1], g[2]); g = g.map(v => v / n);
    return { S, c: [S[0] + g[0] * 4.6, S[1] + g[1] * 4.6, S[2] + g[2] * 4.6] };
  })();

  function ell(x, y, z, c, r) {
    const a = (x - c[0]) / r[0], b = (y - c[1]) / r[1], d = (z - c[2]) / r[2];
    const k0 = Math.sqrt(a * a + b * b + d * d);
    if (k0 < 1e-6) return -Math.min(r[0], r[1], r[2]);
    const a2 = a / r[0], b2 = b / r[1], d2 = d / r[2];
    return k0 * (k0 - 1) / Math.sqrt(a2 * a2 + b2 * b2 + d2 * d2);
  }
  function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
  function cap(x, y, z, a, b, r) {
    const pax = x - a[0], pay = y - a[1], paz = z - a[2], bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
    let h = (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz); h = h < 0 ? 0 : h > 1 ? 1 : h;
    return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r;
  }

  function setPose(flex, vv) {
    P.flex = flex; P.vv = vv;
    const a = -flex * DEG, ca = Math.cos(a), sa = Math.sin(a), f = vv * DEG, cf = Math.cos(f), sf = Math.sin(f);
    P.R = [cf, -sf * ca, sf * sa, sf, cf * ca, -cf * sa, 0, sa, ca];
    const pv = [vv >= 0 ? -24 : 24, 0, 0];
    const v = [C[0] - C[0] - pv[0], C[1] - (ca * C[1] - sa * C[2]) - pv[1], C[2] - (sa * C[1] + ca * C[2]) - pv[2]];
    P.t = [cf * v[0] - sf * v[1] + pv[0], sf * v[0] + cf * v[1] + pv[1], v[2] + pv[2]];
    P.t[2] -= 7 * Math.min(1, Math.max(0, (flex - 15) / 95)); // rolamento posterior do fêmur com a flexão
    // patela: acompanha a tíbia (tendão), apoiada na superfície femoral
    const al = (38 - 14 * flex / 90) * DEG, dy = Math.sin(al), dz = Math.cos(al);
    let best = 20;
    for (const x of [-12, 12]) for (let s = 75; s > 15; s -= 0.5) {
      if (femurW(x, C[1] + dy * s, C[2] + dz * s) < 0) { if (s > best) best = s; break; }
    }
    const s = best + 8.5 + 9 - 4 * flex / 90;
    P.pat = { c: [0, C[1] + dy * s, C[2] + dz * s], a: al };
  }
  function toWorld(l) {
    const R = P.R, t = P.t;
    return [R[0] * l[0] + R[1] * l[1] + R[2] * l[2] + t[0], R[3] * l[0] + R[4] * l[1] + R[5] * l[2] + t[1], R[6] * l[0] + R[7] * l[1] + R[8] * l[2] + t[2]];
  }
  function toLocal(w) {
    const R = P.R, x = w[0] - P.t[0], y = w[1] - P.t[1], z = w[2] - P.t[2];
    return [R[0] * x + R[3] * y + R[6] * z, R[1] * x + R[4] * y + R[7] * z, R[2] * x + R[5] * y + R[8] * z];
  }

  function femurL(x, y, z) {
    let d = ell(x, y, z, cM, rM);
    d = smin(d, ell(x, y, z, [-24.5, 22, -4], [14.5, 22, 22]), 3);
    d = smin(d, ell(x, y, z, [22, 30, 8], [12, 20, 19]), 4);
    d = smin(d, ell(x, y, z, [-23, 32, 10], [13, 22, 21]), 4);
    d = smin(d, ell(x, y, z, [0, 38, 8], [26, 26, 18]), 5);
    d = smin(d, ell(x, y, z, [0, 44, 2], [33, 26, 20]), 6);
    d = smin(d, cap(x, y, z, [0, 50, 2], [0, 140, 5], 15), 9);
    if (les.condral) d = Math.max(d, 6.6 - Math.hypot(x - LS.c[0], y - LS.c[1], z - LS.c[2]));
    return d;
  }
  function femurW(x, y, z) { const l = toLocal([x, y, z]); return femurL(l[0], l[1], l[2]); }
  function tibia(x, y, z) {
    const ux = Math.abs(x / 38), uz = Math.abs((z + 4) / 27);
    const e = (Math.cbrt(ux * ux * ux + uz * uz * uz) - 1) * 27 + 5, dy = Math.abs(y + 31.5) - 30 + 5;
    let d = Math.min(Math.max(e, dy), 0) + Math.hypot(Math.max(e, 0), Math.max(dy, 0)) - 5;
    d = smin(d, ell(x, y, z, [4, 1, -3], [4, 6, 6.5]), 3);
    d = smin(d, ell(x, y, z, [-4, 0.5, -5], [4, 5.5, 6.5]), 3);
    return d;
  }
  function menParam(x, z, side) {
    const m = MEN[side], u = (x - m.cx) * -side, qx = u / m.ax, qz = (z + 4) / m.az;
    return { rho: Math.hypot(qx, qz), ang: Math.atan2(qz, qx), m };
  }
  function menPoint(side, rho, angDeg, lift) {
    const m = MEN[side], a = angDeg * DEG, t = Math.max(0, (rho - m.rin) / (1 - m.rin));
    return [m.cx - side * rho * m.ax * Math.cos(a), YB + m.H * Math.pow(t, 0.9) + (lift || 0), -4 + rho * m.az * Math.sin(a)];
  }
  function meniscus(x, y, z, side) {
    const q = menParam(x, z, side), m = q.m, rho = q.rho, ang = q.ang;
    const t = Math.min(1, Math.max(0, (rho - m.rin) / (1 - m.rin)));
    const top = YB + m.H * Math.pow(t, 0.9);
    let f = Math.max((rho - 1) * m.ax, YB - y, y - top, (m.A0 - Math.abs(ang)) * rho * m.ax, (m.rin - rho) * m.ax) - 0.25;
    if (side === 1 && les.mmTear) {
      const cl = Math.max(Math.abs(rho - 0.8) * m.ax - 0.9, (ang + 75 * DEG) * 14, (-160 * DEG - ang) * 14);
      f = Math.max(f, -cl);
    }
    if (side === -1 && les.lmTear) {
      const da = ang - 170 * DEG;
      const cl = Math.max(Math.abs(Math.sin(da)) * rho * m.ax - 1.0, (rho - 0.86) * m.ax, -Math.cos(da));
      f = Math.max(f, -cl);
    }
    return f;
  }
  function patellaL(x, y, z) {
    return smin(ell(x, y, z, [0, 0, 0], [21, 20, 9]), ell(x, y, z, [0, -1, -6.5], [6, 15, 4.5]), 3);
  }
  function patToLocal(w) {
    const c = P.pat.c, ca = Math.cos(P.pat.a), sa = Math.sin(P.pat.a), y = w[1] - c[1], z = w[2] - c[2];
    return [w[0] - c[0], ca * y - sa * z, sa * y + ca * z];
  }
  function patellaW(x, y, z) { const l = patToLocal([x, y, z]); return patellaL(l[0], l[1], l[2]); }
  function capsule(x, y, z) {
    const l = toLocal([x, y, z]);
    const q = patToLocal([x, y, z]);
    let d = smin(ell(x, y, z, [0, 12, -2], [46, 36, 40]), ell(l[0], l[1], l[2], [0, 78, 24], [30, 40, 17]), 8);
    return smin(d, ell(q[0], q[1], q[2], [0, 0, -9], [31, 32, 15]), 8);
  }
  function ligEnds() { return { aclF: toWorld(ATT.aclF), aclT: ATT.aclT, pclF: toWorld(ATT.pclF), pclT: ATT.pclT }; }

  // consulta de cena por SDF (usada nos testes)
  function sceneAt(x, y, z) {
    const L = ligEnds();
    const c = [[femurW(x, y, z), 'femur'], [tibia(x, y, z), 'tibia'], [meniscus(x, y, z, 1), 'mm'], [meniscus(x, y, z, -1), 'lm'],
    [patellaW(x, y, z), 'patela'], [cap(x, y, z, L.aclT, L.aclF, 4.2), 'lca'], [cap(x, y, z, L.pclT, L.pclF, 5), 'lcp'], [-capsule(x, y, z), 'capsula']];
    let b = c[0]; for (const e of c) if (e[0] < b[0]) b = e; return b;
  }

  function classify(id, w) {
    const l = toLocal(w);
    if (id === 'femur') {
      if (l[1] > 62) return 'femur';
      if (l[2] > 12 && l[1] > 20) return 'troclea';
      if (l[0] > 9.5) return 'cfm';
      if (l[0] < -9.5) return 'cfl';
      return 'notch';
    }
    if (id === 'tibia') {
      if (w[1] < -7) return 'tibia';
      if (Math.abs(w[0]) < 8.5 && w[1] > 0.5) return 'eminencia';
      return w[0] > 0 ? 'plato_med' : 'plato_lat';
    }
    if (id === 'mm' || id === 'lm') { const dz = w[2] + 4; return id + (dz > 9 ? '_ant' : dz < -9 ? '_post' : '_corpo'); }
    if (id === 'capsula') {
      if (l[1] > 50 && l[2] > 5) return 'recesso';
      if (w[0] > 33) return 'got_med';
      if (w[0] < -33) return 'got_lat';
      return 'sinovia';
    }
    return id;
  }
  const NOME = {
    femur: 'Fêmur (região metafisária)', troclea: 'Tróclea femoral', cfm: 'Côndilo femoral medial', cfl: 'Côndilo femoral lateral',
    notch: 'Intercôndilo', tibia: 'Tíbia', eminencia: 'Eminência intercondilar', plato_med: 'Platô tibial medial', plato_lat: 'Platô tibial lateral',
    mm_ant: 'Menisco medial — corno anterior', mm_corpo: 'Menisco medial — corpo', mm_post: 'Menisco medial — corno posterior',
    lm_ant: 'Menisco lateral — corno anterior', lm_corpo: 'Menisco lateral — corpo', lm_post: 'Menisco lateral — corno posterior',
    recesso: 'Recesso suprapatelar', got_med: 'Goteira medial', got_lat: 'Goteira lateral', sinovia: 'Sinóvia / cápsula',
    patela: 'Patela — superfície articular', lca: 'Ligamento cruzado anterior', lcp: 'Ligamento cruzado posterior', gordura: 'Gordura de Hoffa',
    livre: 'Corpo livre', coto: 'Coto do LCA', mucoso: 'Ligamento mucoso (plica infrapatelar)', popliteo: 'Tendão do poplíteo'
  };

  // Surface nets: malha suave a partir de função implícita
  function surfaceNets(f, mn, mx, h) {
    const nx = Math.ceil((mx[0] - mn[0]) / h) + 1, ny = Math.ceil((mx[1] - mn[1]) / h) + 1, nz = Math.ceil((mx[2] - mn[2]) / h) + 1;
    const vals = new Float32Array(nx * ny * nz), cell = new Int32Array(nx * ny * nz).fill(-1);
    let p = 0;
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) vals[p++] = f(mn[0] + i * h, mn[1] + j * h, mn[2] + k * h);
    const pos = [], sx = 1, sy = nx, sz = nx * ny;
    const EV = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    const cv = new Float32Array(8);
    for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const b = i + sy * j + sz * k; let neg = 0;
      for (let c = 0; c < 8; c++) { const v = vals[b + (c & 1) + ((c >> 1) & 1) * sy + ((c >> 2) & 1) * sz]; cv[c] = v; if (v < 0) neg++; }
      if (neg === 0 || neg === 8) continue;
      let ax = 0, ay = 0, az = 0, n = 0;
      for (let e = 0; e < 12; e++) {
        const a = EV[e][0], c = EV[e][1], va = cv[a], vc = cv[c];
        if ((va < 0) === (vc < 0)) continue;
        const t = va / (va - vc);
        ax += (a & 1) + t * ((c & 1) - (a & 1)); ay += ((a >> 1) & 1) + t * (((c >> 1) & 1) - ((a >> 1) & 1)); az += ((a >> 2) & 1) + t * (((c >> 2) & 1) - ((a >> 2) & 1)); n++;
      }
      cell[b] = pos.length / 3;
      pos.push(mn[0] + (i + ax / n) * h, mn[1] + (j + ay / n) * h, mn[2] + (k + az / n) * h);
    }
    const nv = pos.length / 3, nrm = new Float32Array(nv * 3), e = h * 0.5;
    for (let v = 0; v < nv; v++) {
      const x = pos[3 * v], y = pos[3 * v + 1], z = pos[3 * v + 2];
      let gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e);
      const l = Math.hypot(gx, gy, gz) || 1; nrm[3 * v] = gx / l; nrm[3 * v + 1] = gy / l; nrm[3 * v + 2] = gz / l;
    }
    const idx = [], st = [sx, sy, sz], dim = [nx, ny, nz];
    function tri(a, b, c) {
      const ux = pos[3 * b] - pos[3 * a], uy = pos[3 * b + 1] - pos[3 * a + 1], uz = pos[3 * b + 2] - pos[3 * a + 2];
      const vx = pos[3 * c] - pos[3 * a], vy = pos[3 * c + 1] - pos[3 * a + 1], vz = pos[3 * c + 2] - pos[3 * a + 2];
      const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      const d = fx * (nrm[3 * a] + nrm[3 * b] + nrm[3 * c]) + fy * (nrm[3 * a + 1] + nrm[3 * b + 1] + nrm[3 * c + 1]) + fz * (nrm[3 * a + 2] + nrm[3 * b + 2] + nrm[3 * c + 2]);
      if (d >= 0) idx.push(a, b, c); else idx.push(a, c, b);
    }
    const ijk = [0, 0, 0];
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      ijk[0] = i; ijk[1] = j; ijk[2] = k; const b = i + sy * j + sz * k;
      for (let a = 0; a < 3; a++) {
        if (ijk[a] >= dim[a] - 1) continue;
        if ((vals[b] < 0) === (vals[b + st[a]] < 0)) continue;
        const bb = (a + 1) % 3, cc = (a + 2) % 3;
        if (ijk[bb] < 1 || ijk[cc] < 1 || ijk[bb] >= dim[bb] - 1 || ijk[cc] >= dim[cc] - 1) continue;
        const v0 = cell[b - st[bb] - st[cc]], v1 = cell[b - st[cc]], v2 = cell[b], v3 = cell[b - st[bb]];
        if (v0 < 0 || v1 < 0 || v2 < 0 || v3 < 0) continue;
        tri(v0, v1, v2); tri(v0, v2, v3);
      }
    }
    return { pos: new Float32Array(pos), nrm, idx: new Uint32Array(idx) };
  }
  function hash(x, y, z) { let n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n); }
  function noise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const L = (a, b, t) => a + (b - a) * t;
    return L(L(L(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), L(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
      L(L(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), L(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w);
  }

  const K = { DEG, C, P, les, PORTAL, ATT, MEN, YB, LS, setPose, toWorld, toLocal, femurL, femurW, tibia, meniscus, menParam, menPoint, patellaL, patellaW, patToLocal, capsule, ligEnds, sceneAt, classify, NOME, surfaceNets, noise, cap };
  if (typeof module !== 'undefined') module.exports = K; else root.K = K;
})(typeof window !== 'undefined' ? window : globalThis);
