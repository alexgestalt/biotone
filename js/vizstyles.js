// v13 selectable visual styles (Visual mix > STYLE): 'waves' (formerly 'rings', the original page 1 / page 4 visuals),
// 'cymatics' (sand on a vibrating plate: grains settle on the nodal lines of a Chladni mode set by the
// carrier and beat; when the frequency moves, the figure dissolves and re-forms) (v14.2: the Water style was removed). Gold only, no text.
// Continuity: dt capped at 50 ms, every target eased (second order), phases wrap at 20pi, modes are
// continuous (non-integer) so the field never switches discontinuously.
const VS_TAU20 = Math.PI * 20;
const VS_GOLD = [255, 199, 31];
function vsEase(o, k, target, dt, tau) {
  if (o[k] == null) { o[k] = target; o[k + '_v'] = target; return; }
  const a = 1 - Math.exp(-dt / tau);
  o[k + '_v'] += (target - o[k + '_v']) * a; o[k] += (o[k + '_v'] - o[k]) * a;
}
function vsInputs(f, dt) {
  const vi = f.vzIn || {}, S = f.vs || (f.vs = {});
  dt = Math.min(0.05, Math.max(0, dt || 0));
  const cu = isFinite(vi.cu) ? vi.cu : 0.5, bu = isFinite(vi.bu) ? vi.bu : 0.3;
  vsEase(S, 'cu', cu, dt, 0.12); vsEase(S, 'bu', bu, dt, 0.12);
  vsEase(S, 'en', Math.min(1, f.energy || 0.2), dt, 0.35);
  // Live engine values (set every frame by updateVisAudio): fast-attack second-order easing in log-Hz.
  const car = isFinite(f.car) && f.car > 0 ? f.car : 200, bt = isFinite(f.bt) ? Math.max(0, f.bt) : 0;
  vsEase(S, 'lcar', Math.log(car), dt, 0.06); vsEase(S, 'lbt', Math.log(bt + 0.25), dt, 0.06);
  S.car = Math.exp(S.lcar); S.bt = Math.max(0, Math.exp(S.lbt) - 0.25); S.eng = f.eng || 'binaural';
  const bhz = S.bt > 0.05 ? S.bt : 0.5 * Math.pow(90, S.bu);
  const sp = (typeof VP !== 'undefined' ? VP.get('spin') : 1);
  S.ph = ((S.ph || 0) + dt * TAU_VS * Math.min(bhz, 12) * 0.08) % VS_TAU20; // slow breath tied to the beat
  S.t = ((S.t || 0) + dt * (0.3 + 0.7 * sp)) % 1e5;
  return { S, dt, bhz, sp };
}
const TAU_VS = Math.PI * 2;
// v14.1: the Waves frame (same radius, centre and gold living edge as drawLivingRing), used by Cymatics.
function vsFrame(g, w, h, S) {
  const R = Math.min(w, h) * 0.5 - 8;
  g.save(); g.translate(w / 2, h / 2); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  strokeLivingEdge(g, R, PAL[palIndex(0)], 0.8 + 0.15 * (S.en || 0), 0.5, 0, 0, S.t || 0);
  g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return R;
}
// --- Cymatics (physical, v13.1) -----------------------------------------------------------------------
// The plate (js/cymmodes.js) is driven by the real tones the engine is playing this frame: the carrier and
// the second tone at carrier + beat (binaural / monaural; isochronic and pure tones drive the carrier only).
// Each eigenmode responds with the damped-oscillator gain H = 1 / sqrt((1 - r^2)^2 + (r / Q)^2), r = f / f_mode,
// so a tone on a resonance excites that mode alone and a tone between resonances excites a weak mix. The
// grains feel the time-averaged vibration energy |W1|^2 + |W2|^2 + 2 W1 W2 cos(2 pi beat t): the two tones beat
// against each other at the beat rate (faded out above ~12 Hz, where the eye would only see the average).
// Grains are kicked in proportion to the local amplitude, so they random-walk off antinodes and pile up on
// the nodal lines; plus a small drift down the energy gradient.
const CYM = { n: 3600, x: null, y: null, G: 112, I: null, gx: null, gy: null, ang: null, rad: null, w1: null, w2: null };
const CYM_Q = 80; // modal quality factor of a sanded aluminium plate (order of magnitude)
function cymGain(f, fm) { const r = f / fm; return 1 / Math.sqrt((1 - r * r) * (1 - r * r) + (r / CYM_Q) * (r / CYM_Q)); }
function cymProfile(m, r) { const P = m[3], u = Math.min(1, r) * (P.length - 1), i = Math.min(P.length - 2, u | 0), t = u - i; return P[i] + (P[i + 1] - P[i]) * t; }
function cymInit() {
  const G = CYM.G, N = G * G;
  CYM.I = new Float32Array(N); CYM.gx = new Float32Array(N); CYM.gy = new Float32Array(N);
  CYM.ang = new Float32Array(N); CYM.rad = new Float32Array(N); CYM.w1 = new Float32Array(N); CYM.w2 = new Float32Array(N);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const x = i / (G - 1) * 2 - 1, y = j / (G - 1) * 2 - 1, k = j * G + i; CYM.rad[k] = Math.hypot(x, y); CYM.ang[k] = Math.atan2(y, x); }
  CYM.x = new Float32Array(CYM.n); CYM.y = new Float32Array(CYM.n);
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < CYM.n; i += 4) { const r = Math.sqrt(rnd()) * 0.97, a = rnd() * TAU_VS, x = r * Math.cos(a), y = r * Math.sin(a); // mirrored in 4 (symmetric start)
    CYM.x[i] = x; CYM.y[i] = y; CYM.x[i + 1] = -x; CYM.y[i + 1] = y; CYM.x[i + 2] = x; CYM.y[i + 2] = -y; CYM.x[i + 3] = -x; CYM.y[i + 3] = -y; }
}
function cymSample(A, x, y) { // bilinear sample of a grid field at plate coords in [-1, 1]
  const G = CYM.G, u = (x + 1) * 0.5 * (G - 1), v = (y + 1) * 0.5 * (G - 1);
  const i = Math.max(0, Math.min(G - 2, u | 0)), j = Math.max(0, Math.min(G - 2, v | 0)), fu = u - i, fv = v - j, k = j * G + i;
  return (A[k] * (1 - fu) + A[k + 1] * fu) * (1 - fv) + (A[k + G] * (1 - fu) + A[k + G + 1] * fu) * fv;
}
function drawCymatics(cv, w, h, f, dt) {
  const g = setupCanvas(cv, w, h);
  const { S, dt: d } = vsInputs(f, dt);
  if (!CYM.x) cymInit();
  // v14.1 Chladni figure selection. The app's carrier range (60-400 Hz) is mapped onto the plate's mode ladder:
  // f_plate = 86.3 * (f / 60)^(1 / 0.68), so 60-400 Hz sweeps the 16 lowest modes, (2,0) ... (0,3). Each mode is a
  // plateau (a distinct nodal figure: n diameters x s circles); between neighbours the figure morphs over the middle
  // 30% of the interval. Intensity is a sum of squared modes (|W|^2), so every figure is mirror-symmetric and
  // point-symmetric about the centre. The beat adds an inner figure (symmetry order 2/3/4/6/8 rising with the beat)
  // and pulses the drive.
  const M = CYM_MODES, fl = Math.log(86.3 * Math.pow(Math.max(30, S.car) / 60, 1 / 0.68));
  let ia = 0; while (ia < M.length - 2 && Math.log(M[ia + 1][2]) < fl) ia++;
  const la = Math.log(M[ia][2]), lb = Math.log(M[ia + 1][2]);
  const tt = Math.max(0, Math.min(1, (fl - la) / (lb - la))), sm = tt < 0.35 ? 0 : tt > 0.65 ? 1 : (() => { const q = (tt - 0.35) / 0.3; return q * q * (3 - 2 * q); })();
  const BO = [[0.5, 2], [2, 3], [6, 4], [15, 6], [40, 8]], lbt = Math.log(Math.max(0.5, Math.min(40, S.bt || 0.5)));
  let ib = 0; while (ib < BO.length - 2 && Math.log(BO[ib + 1][0]) < lbt) ib++;
  const tb = Math.max(0, Math.min(1, (lbt - Math.log(BO[ib][0])) / (Math.log(BO[ib + 1][0]) - Math.log(BO[ib][0]))));
  const two = S.eng === 'binaural' || S.eng === 'monaural', inW = two && S.bt > 0.05 ? 0.45 : 0;
  S.bph = ((S.bph || 0) + d * TAU_VS * Math.min(S.bt, 12)) % VS_TAU20;
  vsEase(S, 'res', 1 - 0.75 * Math.sin(Math.PI * sm), d, 0.12); // the figure loosens mid-morph, re-forms on the plateau
  const G = CYM.G, N = G * G, I = CYM.I, W1 = CYM.w1; I.fill(0);
  const parts = [[M[ia], 1 - sm], [M[ia + 1], sm]];
  for (const [m, wgt] of parts) {
    if (wgt < 0.005) continue;
    let mx = 1e-9; const n = m[0];
    for (let k = 0; k < N; k++) { const r = CYM.rad[k]; if (r > 1) { W1[k] = 0; continue; } const v = cymProfile(m, r) * Math.cos(n * CYM.ang[k]); W1[k] = v * v; if (W1[k] > mx) mx = W1[k]; }
    const sc = wgt / mx; for (let k = 0; k < N; k++) I[k] += W1[k] * sc;
  }
  if (inW) for (const [o, wgt] of [[BO[ib][1], 1 - tb], [BO[ib + 1][1], tb]]) {
    if (wgt < 0.005) continue;
    for (let k = 0; k < N; k++) { const r = CYM.rad[k]; if (r >= 0.42) continue; const v = Math.sin(Math.PI * r / 0.42) * Math.cos(o * CYM.ang[k]); I[k] += inW * wgt * v * v; }
  }
  // Centre: a node of every n > 0 mode, where real sand also piles up; keep a small antinode there so the middle
  // never fills with a blob (the v14 'stuck sand' look).
  for (let k = 0; k < N; k++) { const r = CYM.rad[k]; I[k] += 0.15 * Math.exp(-r * r / 0.0012); }
  let mx = 1e-6; for (let k = 0; k < N; k++) if (I[k] > mx) mx = I[k];
  vsEase(S, 'imax', mx, d, 0.1);
  const inv = 1 / Math.max(1e-6, S.imax);
  for (let j = 1; j < G - 1; j++) for (let i = 1; i < G - 1; i++) { const k = j * G + i; CYM.gx[k] = (I[k + 1] - I[k - 1]) * inv; CYM.gy[k] = (I[k + G] - I[k - G]) * inv; }
  // Grain motion: kicks ~ local amplitude (off resonance the plate barely moves; we keep a floor so the
  // old figure visibly loosens instead of freezing), plus drift toward the nodal lines.
  const drive = (0.25 + 0.75 * S.res) * (0.7 + 0.6 * S.en) * (inW ? 0.8 + 0.2 * Math.cos(S.bph) : 1) * Math.min(1, d * 30);
  let seed = (S.seed || 1) | 0; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) - 0.5;
  const X = CYM.x, Y = CYM.y;
  for (let p = 0; p < CYM.n; p++) {
    let x = X[p], y = Y[p];
    const amp = Math.sqrt(Math.max(0, cymSample(I, x, y)) * inv);
    const k = 0.16 * amp * drive;
    x += rnd() * k - cymSample(CYM.gx, x, y) * 0.2 * drive; y += rnd() * k - cymSample(CYM.gy, x, y) * 0.2 * drive;
    const rr = Math.hypot(x, y); if (rr > 0.975) { const nr = Math.sqrt(rnd() + 0.5) * 0.9, na = (rnd() + 0.5) * TAU_VS; x = nr * Math.cos(na); y = nr * Math.sin(na); } // sand bouncing off the free edge falls back onto the plate
    X[p] = x; Y[p] = y;
  }
  S.seed = seed;
  const R = vsFrame(g, w, h, S) * 0.96, cx = w / 2, cy = h / 2; // v14.1: same frame as Waves
  g.globalCompositeOperation = 'lighter';
  const sz = Math.max(1.2, R / 150);
  for (let p = 0; p < CYM.n; p++) {
    const amp = Math.sqrt(Math.max(0, cymSample(I, X[p], Y[p])) * inv);
    const a = Math.max(0.14, 0.92 - amp * 1.6);
    g.fillStyle = `rgba(255,${(190 + a * 40) | 0},${(31 + a * 60) | 0},${a.toFixed(3)})`;
    g.fillRect(cx + X[p] * R - sz / 2, cy + Y[p] * R - sz / 2, sz, sz);
  }
  g.globalCompositeOperation = 'source-over';
}
function drawVizStyle(style, cv, w, h, f, dt) {
  if (style === 'cymatics') { drawCymatics(cv, w, h, f, dt); return true; }
  return false;
}
