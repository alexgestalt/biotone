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
const CYM = { n: 12000, x: null, y: null, G: 112, I: null, gx: null, gy: null, ang: null, rad: null, w1: null, w2: null };
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
// v14.3 Chladni figure selection, sound-first. Mode (n, s) of a free-edge circular plate:
//   n nodal diameters (2n rays / star points) <- MAIN frequency (beat, 1-45 Hz), distinct steps;
//   s nodal circles (rings, fineness)         <- carrier (60-400 Hz), distinct steps.
// W(r, th) = J_n(lambda r) cos(n th), lambda placed between the s-th and (s+1)-th zero of J_n so the figure has
// exactly s interior nodal circles. Each step is a plateau; neighbours morph (smoothstep over the middle 30%).
// Intensity is a sum of squared modes, so every figure is centred and mirror-symmetric. Low beats pulse the drive.
const CYM_NB = [[1, 2], [1.7, 3], [3, 4], [4, 5], [7, 6], [11, 7], [16, 8], [22, 9], [30, 10], [42, 12]];
const CYM_SC = [[60, 0], [100, 1], [170, 2], [330, 3]];
const CYM_PC = {};
function cymJ(n, x) { let t = 0; const K = 64; for (let i = 0; i < K; i++) { const u = (i + 0.5) / K * Math.PI; t += Math.cos(n * u - x * Math.sin(u)); } return t / K; }
function cymProf(n, s) { // radial profile, 161 samples, max |W| = 1 (cached)
  const key = n + ',' + s; if (CYM_PC[key]) return CYM_PC[key];
  const z = []; const x0 = Math.max(0.5, n * 0.9); let pv = cymJ(n, x0);
  for (let x = x0 + 0.05; z.length < s + 2 && x < 90; x += 0.05) { const v = cymJ(n, x); if (pv * v < 0) z.push(x); pv = v; }
  const lam = s === 0 ? 0.82 * z[0] : z[s - 1] + 0.72 * (z[s] - z[s - 1]);
  const P = new Float32Array(161); let mx = 1e-9;
  for (let i = 0; i <= 160; i++) { P[i] = cymJ(n, lam * i / 160); mx = Math.max(mx, Math.abs(P[i])); }
  for (let i = 0; i <= 160; i++) P[i] /= mx;
  return (CYM_PC[key] = P);
}
function cymStep(T, v) { // [[lo index, hi index, weight of hi]] on a log ladder with 30% morph band
  const lv = Math.log(v); let i = 0; while (i < T.length - 2 && Math.log(T[i + 1][0]) < lv) i++;
  const t = Math.max(0, Math.min(1, (lv - Math.log(T[i][0])) / (Math.log(T[i + 1][0]) - Math.log(T[i][0]))));
  const sm = t < 0.35 ? 0 : t > 0.65 ? 1 : (() => { const q = (t - 0.35) / 0.3; return q * q * (3 - 2 * q); })();
  return [T[i][1], T[i + 1][1], sm];
}
function drawCymatics(cv, w, h, f, dt) {
  const g = setupCanvas(cv, w, h);
  const { S, dt: d } = vsInputs(f, dt);
  if (!CYM.x) cymInit();
  const bt = S.bt > 0.05 ? S.bt : 1;
  const [n0, n1, wn] = cymStep(CYM_NB, Math.max(1, Math.min(45, bt)));
  const [s0, s1, ws] = cymStep(CYM_SC, Math.max(60, Math.min(400, S.car)));
  S.bph = ((S.bph || 0) + d * TAU_VS * Math.min(bt, 12)) % VS_TAU20;
  vsEase(S, 'res', 1 - 0.7 * Math.max(Math.sin(Math.PI * wn), Math.sin(Math.PI * ws)), d, 0.12); // loosens mid-morph
  // The field is evaluated analytically at every grain (no grid), so even 24 thin rays stay exact lines.
  // v14.4 curved figures: each (n, s) figure is a SIGNED superposition of degenerate-neighbour modes,
  //   F = J_n(l r) cos(n th) + A * J_0(l' r) + B * J_2n(l'' r) cos(2n th)
  // (the ring mode closes the rays into petals/loops, the 2n mode adds the rosette/star inner curve). All terms are
  // cos-only, so the figure is mirror-symmetric about the axis and has n-fold rotational symmetry. Neighbour figures
  // are blended as signed fields, so nodal lines bend continuously from one shape into the next (no snapping).
  const mixA = 0.55 + 0.25 * Math.sin(0.9 * Math.log(Math.max(60, S.car) / 60)), mixB = 0.35;
  const MS = [];
  for (const [n, a] of [[n0, 1 - wn], [n1, wn]]) for (const [s, b] of [[s0, 1 - ws], [s1, ws]]) if (a * b >= 0.005)
    MS.push([a * b, n, cymProf(n, s), cymProf(0, s + 1), cymProf(2 * n, Math.max(0, s - 1))]);
  const fld = (x, y) => {
    const r = Math.hypot(x, y), th = Math.atan2(y, x), u = Math.min(1, r) * 160, i = Math.min(159, u | 0), t = u - i;
    const L = (P) => P[i] + (P[i + 1] - P[i]) * t;
    let W = 0;
    for (const [wg, n, P1, P0, P2] of MS) W += wg * (L(P1) * Math.cos(n * th) + mixA * L(P0) + mixB * L(P2) * Math.cos(2 * n * th));
    W /= (1 + mixA + mixB) * 0.6;
    return W * W + 0.15 * Math.exp(-r * r / 0.0012); // keep the exact centre clear
  };
  const E = 0.004;
  // Grains: kicks ~ local amplitude, strong drift onto the nodal lines (crisp lines, little scatter); pulse at low beat.
  const pul = bt < 12 ? 0.75 + 0.25 * Math.cos(S.bph) : 1;
  const drive = (0.25 + 0.75 * S.res) * (0.7 + 0.6 * S.en) * pul * Math.min(1, d * 30);
  let seed = (S.seed || 1) | 0; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) - 0.5;
  const X = CYM.x, Y = CYM.y;
  for (let p = 0; p < CYM.n; p++) {
    let x = X[p], y = Y[p];
    const I0 = fld(x, y), amp = Math.sqrt(I0);
    const k = (0.11 * amp + 0.007) * drive; // the small floor lets sand spread along the lines instead of balling up
    // pull down the gradient of |W| (a cone, not a bowl): same speed everywhere along a line, so sand spreads
    // evenly along each nodal line instead of collecting at the crossings
    let gx = (Math.sqrt(fld(x + E, y)) - amp) / E, gy = (Math.sqrt(fld(x, y + E)) - amp) / E; const gm = Math.hypot(gx, gy), cl = gm > 1e-6 ? Math.min(1, amp * 4) / gm : 0;
    x += rnd() * k - gx * cl * 0.006 * drive; y += rnd() * k - gy * cl * 0.006 * drive;
    const rr = Math.hypot(x, y); if (rr > 0.975) { const nr = Math.sqrt(rnd() + 0.5) * 0.9, na = (rnd() + 0.5) * TAU_VS; x = nr * Math.cos(na); y = nr * Math.sin(na); }
    X[p] = x; Y[p] = y;
  }
  S.seed = seed;
  const R = vsFrame(g, w, h, S) * 0.96, cx = w / 2, cy = h / 2; // same frame as Waves
  const pg = g.createRadialGradient(cx, cy, 0, cx, cy, R); // faint plate glow
  pg.addColorStop(0, 'rgba(255,199,31,0.07)'); pg.addColorStop(1, 'rgba(255,199,31,0.025)');
  g.fillStyle = pg; g.beginPath(); g.arc(cx, cy, R, 0, TAU_VS); g.fill();
  g.globalCompositeOperation = 'lighter'; // piles brighten where grains accumulate
  const sz = Math.max(1.2, R / 150);
  for (let p = 0; p < CYM.n; p++) {
    const amp = Math.sqrt(fld(X[p], Y[p]));
    const a = Math.max(0.08, 0.95 - amp * 2.4);
    g.fillStyle = `rgba(255,${(190 + a * 40) | 0},${(31 + a * 60) | 0},${a.toFixed(3)})`;
    g.fillRect(cx + X[p] * R - sz / 2, cy + Y[p] * R - sz / 2, sz, sz);
  }
  g.globalCompositeOperation = 'source-over';
}
function drawVizStyle(style, cv, w, h, f, dt) {
  if (style === 'cymatics') { drawCymatics(cv, w, h, f, dt); return true; }
  return false;
}
