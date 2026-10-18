// Shared visual layers for page 1 and page 4, driven by the shared mix (VP), the page's own sound
// parameters and the ambient analyser (Amb). Gold only. Everything is integrated per frame from eased
// rates (phase += speed * dt) and every element fades in and out, so nothing ever pops or jumps.
const VZ_POOL = { main: 48, fine: 72, casc: 64, drop: 28 };
function vzState() {
  const pool = (n) => ({ n, r: new Float32Array(n), a: new Float32Array(n), x: new Float32Array(n), y: new Float32Array(n), on: new Uint8Array(n), acc: 0 });
  const S = { e: {}, ph: new Float64Array(16), main: pool(VZ_POOL.main), fine: pool(VZ_POOL.fine), casc: pool(VZ_POOL.casc), drop: pool(VZ_POOL.drop),
    xl: { rot: new Float64Array(4), px: new Float64Array(4), py: new Float64Array(4) },
    tw: { x: new Float32Array(VZ_TW), y: new Float32Array(VZ_TW), p: new Float32Array(VZ_TW), s: new Float32Array(VZ_TW) },
    st: { x: new Float32Array(8), y: new Float32Array(80), v: new Float32Array(80) },
    wd: { r: new Float32Array(14), a: new Float64Array(14), s: new Float32Array(14) }, nw: {}, seed: 1 };
  for (let i = 0; i < VZ_TW; i++) { vzTwPlace(S, i); S.tw.p[i] = vzRnd(S); S.tw.s[i] = 0.15 + 0.35 * vzRnd(S); }
  for (let k = 0; k < 8; k++) S.st.x[k] = -0.7 + 1.4 * (k + 0.5) / 8 + 0.06 * (vzRnd(S) - 0.5);
  for (let i = 0; i < 80; i++) { S.st.y[i] = vzRnd(S) * 2 - 1; S.st.v[i] = 0.7 + 0.6 * vzRnd(S); }
  for (let i = 0; i < 14; i++) { S.wd.r[i] = 0.22 + 0.7 * vzRnd(S); S.wd.a[i] = vzRnd(S) * TAU; S.wd.s[i] = 0.6 + 0.8 * vzRnd(S); }
  return S;
}
// v12.1 white sparkles live in the outer band (0.55-0.9 R), clear of the centre loops.
const VZ_TW = 120;
function vzTwPlace(S, i) { const a = vzRnd(S) * TAU, r = Math.sqrt(0.3025 + vzRnd(S) * (0.81 - 0.3025)); S.tw.x[i] = Math.cos(a) * r; S.tw.y[i] = Math.sin(a) * r; }
function vzRnd(S) { S.seed = (S.seed * 16807) % 2147483647; return S.seed / 2147483647; }
function vzEase(S, k, v, dt, tau) { const c = S.e[k]; S.e[k] = c == null ? v : c + (v - c) * (1 - Math.exp(-dt / tau)); return S.e[k]; }
// Second-order (two stages of tau/2): starts from zero speed, for values that shape the loops.
function vzEase2(S, k, v, dt, tau) { const k2 = k + '$', c = S.e[k], a = 1 - Math.exp(-dt / (0.5 * tau)); if (c == null) { S.e[k] = S.e[k2] = v; return v; } S.e[k2] += (v - S.e[k2]) * a; S.e[k] = c + (S.e[k2] - c) * a; return S.e[k]; }
function vzSpawn(P, r, a, x, y) {
  let slot = -1; for (let i = 0; i < P.n; i++) if (!P.on[i]) { slot = i; break; }
  if (slot < 0) return;            // pool full: skip (never recycle a visible ring, that would pop)
  P.on[slot] = 1; P.r[slot] = r; P.a[slot] = a; P.x[slot] = x || 0; P.y[slot] = y || 0;
}
// Existing bed (page 4 noise/nature bed, page 1 mood ambience) -> signature it shares with the new sounds.
const VZ_NAT = { rain: 'rain', ocean: 'ocean', wind: 'wind', stream: 'waterfall', pink: 'pink', brown: 'brown', white: 'white' };
const VZ_SIGS = ['pink', 'brown', 'white', 'waterfall', 'rain', 'ocean', 'wind', 'drone', 'pads'];
// Per-frame prepare: eased params, signature weights, shared modulation (swell/tide) for the page layers.
// C: { dt, cu (carrier 0..1), bu (beat 0..1), pulseSpeed, energy, tone (0..1), music (0..1), nat, natLevel }
function vzPrepare(S, C) {
  const dt = C.dt;
  const E = (k, v, tau) => vzEase(S, k, v, dt, tau);
  const lay = E('layers', VP.get('layers'), 0.8), spin = E('spin', VP.get('spin'), 0.6);
  const circ = E('circles', VP.get('circles'), 0.6), csp = E('cspeed', VP.get('cspeed'), 0.6), al = E('ambLevel', VP.get('ambLevel'), 0.4);
  const E2 = (k, v, tau) => vzEase2(S, k, v, dt, tau);
  const cu = E2('cu', C.cu, 0.6), bu = E2('bu', C.bu, 0.6), energy = E('energy', C.energy || 0, 0.3);
  const tone = E2('tone', C.tone, 0.6), music = E2('music', C.music, 0.6);
  const lvl = Amb.level, on = Amb.onset;
  const sig = S.sig || (S.sig = {});
  for (const k of VZ_SIGS) {
    const natT = VZ_NAT[C.nat] === k ? (C.nat === 'stream' ? 0.6 : 1) * (C.natLevel || 0) : 0;
    const c0 = S.nw[k], nw = S.nw[k] = c0 == null ? natT : c0 + (natT - c0) * (1 - Math.exp(-dt / 0.9));
    const aw = Amb.w[k] || 0;
    sig[k] = Math.min(1.6, aw * (0.3 + 0.7 * al) * (0.45 + 0.9 * lvl) + nw * (0.5 + 0.7 * energy));
  }
  // Shared slow modulations (integrated phases): brown swell, ocean tide.
  S.ph[0] += dt * TAU * (0.07 + 0.05 * Amb.low);           // brown swell
  S.ph[1] += dt * TAU * (0.09 + 0.03 * lvl);               // ocean tide
  for (let i = 0; i < 2; i++) if (S.ph[i] > 1e4) S.ph[i] -= TAU * Math.floor(S.ph[i] / TAU); // bounded, exact per-term
  S.swell = 1 + 0.12 * sig.brown * Math.sin(S.ph[0]);
  // v12.1 make room: the subtle signatures (brown, white, drone, pads) dim the centre loops by up to 35%,
  // scaled by the strongest one's strength, eased so the dimming glides with the cross-fade.
  const sub = Math.min(1, Math.max(sig.brown, sig.white, sig.drone, sig.pads) / 0.8);
  S.dimC = 1 - 0.35 * E('sub', sub, 0.6);

  S.tide = 1 + 0.08 * sig.ocean * Math.sin(S.ph[1]);
  // Ambient onsets -> layer jitter. v12.2: eased (0.5 s): the jitter feeds the loop frequency ratio, where
  // even a small step moves the far end of a trace a lot, so it must never change within one frame.
  S.jit = E('jit', 0.06 * on + 0.03 * sig.wind, 0.5);
  // Ambient -> brightness pulses. v12.2: second-order eased and gentler: it multiplies the dense extra
  // layers, so a sudden ambient onset (e.g. a sound starting) brightened the whole disc in one frame.
  S.bright = E2('bright', 1 + 0.3 * on + 0.15 * lvl, 0.35);
  Object.assign(S.k || (S.k = {}), { lay, spin, circ, csp, al, cu, bu, energy, tone, music, lvl, on });
  return S;
}
function vzPulseSpeed(C, S) { return Math.max(0.05, C.pulseSpeed || 0.12) * (0.75 + 0.6 * S.k.cu) * S.k.csp; }
function vzStepPool(P, dt, f) { for (let i = 0; i < P.n; i++) if (P.on[i]) f(i); }
// Back pass: expanding circles, pink fine rings, brown swells, ocean tide, drone standing rings, pads aurora.
function vzDrawBack(g, R, S, C) {
  const dt = C.dt, K = S.k, sig = S.sig;
  const PALG = (u) => PAL[palIndex(u)];
  g.globalCompositeOperation = 'lighter';
  // Main expanding circles: count = how many are in flight at once; they ride the frequency-tied pulse speed.
  const v = vzPulseSpeed(C, S);
  const M = S.main;
  M.acc += dt * (K.circ * v / 0.95) * (1 + 1.4 * K.on + 0.4 * K.lvl);
  while (M.acc >= 1) { M.acc -= 1; vzSpawn(M, 0, 0.5 + 0.5 * Math.min(1, K.energy + K.on)); }
  g.strokeStyle = PALG(0.02);
  vzStepPool(M, dt, (i) => {
    M.r[i] += dt * v; if (M.r[i] >= 1) { M.on[i] = 0; return; }
    const u = M.r[i], env = Math.pow(Math.sin(Math.PI * u), 1.4);
    g.globalAlpha = env * (0.16 + 0.3 * M.a[i]) * S.bright;
    g.lineWidth = 0.9 + 1.8 * M.a[i] * (1 - 0.5 * u);
    g.beginPath(); g.arc(0, 0, R * 0.96 * u, 0, TAU); g.stroke();
  });
  // Pink: more and denser fine rings.
  const F = S.fine, vp = v * 1.25 + 0.04;
  F.acc += dt * 14 * sig.pink * (1 + K.on);
  while (F.acc >= 1) { F.acc -= 1; vzSpawn(F, 0, 0.6 + 0.4 * vzRnd(S)); }
  g.strokeStyle = PALG(0.05);
  vzStepPool(F, dt, (i) => {
    F.r[i] += dt * vp; if (F.r[i] >= 1) { F.on[i] = 0; return; }
    const u = F.r[i]; g.globalAlpha = Math.pow(Math.sin(Math.PI * u), 1.2) * 0.38 * F.a[i] * Math.min(1, sig.pink + 0.05);
    g.lineWidth = 0.8; g.beginPath(); g.arc(0, 0, R * 0.95 * u, 0, TAU); g.stroke();
  });
  // ph[2]/ph[3] are used with non-integer multipliers, so they are never wrapped (float64 stays exact for years).
}
// v12.1 subtle signatures (brown swells, ocean tide, drone rings, pads aurora), drawn after the loops in
// the outer band so they read clearly; called from vzDrawFront.
function vzDrawSubtle(g, R, S, C) {
  const dt = C.dt, K = S.k, sig = S.sig;
  const PALG = (u) => PAL[palIndex(u)];
  g.globalCompositeOperation = 'lighter';
  // Brown: slow heavy swells (two soft glows breathing in counter-phase).
  if (sig.brown > 0.005) {
    g.fillStyle = PALG(0.04);
    g.strokeStyle = PALG(0.03);
    for (let j = 0; j < 2; j++) {
      const s = Math.sin(S.ph[0] + j * Math.PI), rr = R * (0.6 + 0.16 * s + 0.1 * j);
      g.globalAlpha = 0.2 * sig.brown * (0.6 + 0.4 * s);
      g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.fill();
      g.globalAlpha = Math.min(1, 0.45 * sig.brown) * (0.55 + 0.45 * s); g.lineWidth = 1.6;   // bright swell edge
      g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke();
    }
  }
  // Ocean: tidal breathing, a broad band that rolls in and out.
  if (sig.ocean > 0.005) {
    const tdd = Math.sin(S.ph[1]), rr = R * (0.58 + 0.28 * tdd);
    g.strokeStyle = PALG(0.03);
    g.globalAlpha = 0.13 * sig.ocean; g.lineWidth = 20; g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke();
    g.globalAlpha = 0.5 * sig.ocean * (0.6 + 0.4 * Math.cos(S.ph[1])); g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, rr + 9, 0, TAU); g.stroke();
  }
  // Drone: standing concentric rings shimmering with slow beating (moire with the moving layers).
  if (sig.drone > 0.005) {
    S.ph[2] += dt * (0.6 + 0.8 * K.lvl);
    g.strokeStyle = PALG(0.06);
    for (let j = 0; j < 7; j++) {
      g.globalAlpha = Math.min(1, sig.drone) * (0.16 + 0.24 * (0.5 + 0.5 * Math.sin(S.ph[2] * (1 + 0.13 * j) + j)));
      g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, R * (0.55 + 0.06 * j), 0, TAU); g.stroke();
    }
  }
  // Pads: soft aurora lobes slowly turning.
  if (sig.pads > 0.005) {
    S.ph[3] += dt * (0.07 + 0.1 * K.lvl) * (0.4 + K.spin);
    g.strokeStyle = PALG(0.05); g.lineCap = 'round';
    for (let j = 0; j < 3; j++) {
      const a0 = S.ph[3] + j * TAU / 3, br = 0.5 + 0.5 * Math.sin(S.ph[3] * 1.7 + j * 2);
      const pr = R * (0.78 + 0.05 * Math.sin(a0 * 2));
      g.globalAlpha = Math.min(1, sig.pads) * (0.18 + 0.2 * br); g.lineWidth = 22;
      g.beginPath(); g.arc(0, 0, pr, a0, a0 + 1.3); g.stroke();
      g.globalAlpha = Math.min(1, sig.pads) * (0.3 + 0.3 * br); g.lineWidth = 1.4;   // fine crest line
      g.beginPath(); g.arc(0, 0, pr + 11, a0 + 0.1, a0 + 1.2); g.stroke();
    }
  }
}
// Extra harmonograph layers (layer count), alternating carrier- and beat-led, faded in/out by the count.
function vzDrawLayers(g, R, S, C) {
  const dt = C.dt, K = S.k, X = S.xl;
  const t = C.t;
  const MIX = [[0.65, 0.35], [0.35, 0.65], [1, 0], [0, 1]], FY = [1.75, 2.35, 1.15, 2.8], DIR = [1, -1, -1, 1];
  const rin0 = 0.5 * Math.max(0, (K.cu * K.cu * (3 - 2 * K.cu) - 0.2) / 0.8);
  const rg = Math.max(0, Math.min(1, (K.cu - 0.35) / 0.6)), ring = 0.85 * rg * rg * (3 - 2 * rg);
  for (let i = 0; i < 4; i++) {
    const u = MIX[i][0] * K.cu + MIX[i][1] * K.bu;
    const sp = (0.05 + 0.6 * u) * K.spin;
    X.rot[i] += dt * sp * DIR[i];
    X.px[i] += dt * (0.2 + 0.7 * u) * (0.5 + 0.5 * K.spin) * (0.7 + 0.6 * K.music);
    X.py[i] -= dt * (0.3 + 0.9 * u) * (0.5 + 0.5 * K.spin) * (0.7 + 0.6 * K.music);
    if (Math.abs(X.rot[i]) > 1e4) X.rot[i] -= TAU * Math.trunc(X.rot[i] / TAU);
    if (Math.abs(X.px[i]) > 1e4) X.px[i] -= 20 * Math.PI * Math.trunc(X.px[i] / (20 * Math.PI)); // px is also used x0.3
    if (Math.abs(X.py[i]) > 1e4) X.py[i] -= TAU * Math.trunc(X.py[i] / TAU);
    const w = Math.max(0, Math.min(1, K.lay - i));
    if (w < 0.004) continue;
    const uS = C.buSize != null ? MIX[i][0] * K.cu + MIX[i][1] * C.buSize : u;   // page 4: beat sets spin, not size
    const size = R * (0.2 + 0.6 * uS) * S.swell * S.tide;
    const fy = FY[i] * (0.8 + 1.1 * K.cu) + 0.08 * (noise2(t * 0.03 + i * 5.1, 7.7 + i) - 0.5) + S.jit * (noise2(t * 0.9 + i * 3.3, 2.2) - 0.5);
    const b = 0.24 + 0.2 * K.tone;
    traceFreeHarmonograph(g, size, fy, b, X.px[i], X.py[i], (0.05 - 0.02 * K.tone) * (1 - 0.8 * rg), X.rot[i], rin0 * (0.9 - 0.15 * i), ring, 5 + 4 * K.cu + i);
    g.strokeStyle = PAL[palIndex(0.03 * i)];
    g.globalAlpha = w * (0.07 + 0.08 * K.music) * S.bright * S.dimC; g.lineWidth = 4; g.stroke();
    g.globalAlpha = w * (0.22 + 0.18 * K.music + 0.15 * K.energy) * S.bright * S.dimC; g.lineWidth = 1; g.stroke();
  }
}
// Front pass: waterfall cascade + falling streams, rain ripples, wind sweeps, white sparkle.
function vzDrawFront(g, R, S, C) {
  const dt = C.dt, K = S.k, sig = S.sig;
  const PALG = (u) => PAL[palIndex(u)];
  vzDrawSubtle(g, R, S, C);
  const v = vzPulseSpeed(C, S);
  // Waterfall: a cascading train of fine gold circles that accelerate outward...
  const Q = S.casc;
  Q.acc += dt * 16 * sig.waterfall * (1 + 0.8 * K.on);
  while (Q.acc >= 1) { Q.acc -= 1; vzSpawn(Q, 0.02, 0.5 + 0.5 * vzRnd(S)); }
  g.strokeStyle = PALG(0.03);
  vzStepPool(Q, dt, (i) => {
    Q.r[i] += dt * (0.06 + 0.9 * Q.r[i]) * (0.5 + v * 2.2); if (Q.r[i] >= 1) { Q.on[i] = 0; return; }
    const u = Q.r[i]; g.globalAlpha = Math.pow(Math.sin(Math.PI * u), 1.3) * 0.7 * Q.a[i] * Math.min(1, sig.waterfall);
    g.lineWidth = 0.8 + 0.8 * u; g.beginPath(); g.arc(0, 0, R * 0.95 * u, 0, TAU); g.stroke();
  });
  // ...plus streams of fine particles falling down through the disc.
  if (sig.waterfall > 0.005) {
    const T = S.st, fall = (0.28 + 0.35 * K.cu) * (0.7 + 0.8 * K.lvl);
    g.fillStyle = PALG(0.02);
    for (let i = 0; i < 80; i++) {
      T.y[i] += dt * fall * T.v[i]; if (T.y[i] > 1) T.y[i] -= 2;
      const x = T.x[i % 8] + 0.02 * Math.sin(T.y[i] * 6 + i), y = T.y[i];
      const rr = x * x + y * y; if (rr > 0.88) continue;
      const edge = Math.min(1, (0.88 - rr) / 0.2);
      g.globalAlpha = 0.75 * edge * Math.min(1, sig.waterfall) * (0.6 + 0.4 * T.v[i]);
      g.fillRect(x * R - 0.9, y * R - 3 * T.v[i], 1.8, 6 * T.v[i]);
    }
  }
  // Rain: scattered droplet ripples.
  const D = S.drop;
  D.acc += dt * 9 * sig.rain * (1 + 3 * K.on);
  while (D.acc >= 1) { D.acc -= 1; const a = vzRnd(S) * TAU, r = Math.sqrt(vzRnd(S)) * 0.82; vzSpawn(D, 0, 0.5 + 0.5 * vzRnd(S), Math.cos(a) * r, Math.sin(a) * r); }
  g.strokeStyle = PALG(0.04);
  vzStepPool(D, dt, (i) => {
    D.r[i] += dt / 1.3; if (D.r[i] >= 1) { D.on[i] = 0; return; }
    const p = D.r[i], al = Math.sin(Math.PI * Math.sqrt(p)) * (1 - p) * 1.25 * D.a[i] * Math.min(1, sig.rain + 0.05);
    for (let j = 0; j < 2; j++) {
      const rr = R * (0.015 + 0.17 * p) * (1 - 0.35 * j); if (rr <= 0) continue;
      g.globalAlpha = al * (1 - 0.4 * j); g.lineWidth = 1.2;
      g.beginPath(); g.arc(D.x[i] * R, D.y[i] * R, rr, 0, TAU); g.stroke();
    }
  });
  // Wind: sweeping drift streaks travelling around the disc.
  if (sig.wind > 0.005) {
    const W = S.wd; g.strokeStyle = PALG(0.03); g.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      W.a[i] += dt * (0.25 + 0.9 * K.lvl) * W.s[i] * (0.5 + 0.5 * K.spin) * (i % 3 ? 1 : -1);
      if (Math.abs(W.a[i]) > 1e4) W.a[i] -= 20 * Math.PI * Math.trunc(W.a[i] / (20 * Math.PI)); // also used x0.7
      const br = 0.5 + 0.5 * Math.sin(W.a[i] * 0.7 + i);
      g.globalAlpha = sig.wind * (0.25 + 0.5 * br); g.lineWidth = 1.4 + 2 * br;
      g.beginPath(); g.arc(0, 0, R * W.r[i], W.a[i], W.a[i] + 0.3 + 0.25 * br); g.stroke();
    }
  }
  // White: shimmering sparkle grain; a sparkle only moves while it is fully dark.
  if (sig.white > 0.005) {
    const T = S.tw; g.fillStyle = PAL_HOT[palIndex(0.02)];
    for (let i = 0; i < VZ_TW; i++) {
      T.p[i] += dt * T.s[i] * (1 + 1.5 * Amb.high);
      if (T.p[i] >= 1) { T.p[i] -= 1; vzTwPlace(S, i); }   // moves only while fully dark
      const x = T.x[i], y = T.y[i];
      const s = Math.sin(Math.PI * T.p[i]), a = s * s * s * s;
      g.globalAlpha = Math.min(1, 1.2 * sig.white) * a; g.beginPath(); g.arc(x * R, y * R, 1.6 + 2.4 * a, 0, TAU); g.fill();
    }
  }
}
