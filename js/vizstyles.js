// v13 selectable visual styles (Visual mix > STYLE): 'rings' (the original page 1 / page 4 visuals),
// 'cymatics' (sand on a vibrating plate: grains settle on the nodal lines of a Chladni mode set by the
// carrier and beat; when the frequency moves, the figure dissolves and re-forms) and 'water' (Faraday-wave
// cymatics on a round pool seen from above). Gold only, no text.
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
  for (let i = 0; i < CYM.n; i++) { const r = Math.sqrt(rnd()) * 0.97, a = rnd() * TAU_VS; CYM.x[i] = r * Math.cos(a); CYM.y[i] = r * Math.sin(a); }
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
  const f1 = S.car, two = S.eng === 'binaural' || S.eng === 'monaural', f2 = S.car + S.bt;
  S.bph = ((S.bph || 0) + d * TAU_VS * S.bt) % VS_TAU20;
  const cross = two ? Math.cos(S.bph) * Math.max(0, Math.min(1, (14 - S.bt) / 6)) : 0;
  // Modal weights for each tone, and the overall resonance strength (1 = right on a mode).
  const G = CYM.G, N = G * G, M = CYM_MODES, wa = S.wa || (S.wa = new Float32Array(M.length)), wb = S.wb || (S.wb = new Float32Array(M.length));
  let peak = 0;
  for (let m = 0; m < M.length; m++) { wa[m] = cymGain(f1, M[m][2]); wb[m] = two ? cymGain(f2, M[m][2]) : 0; peak = Math.max(peak, wa[m], wb[m]); }
  const res = Math.max(0, Math.min(1, Math.log(peak) / Math.log(CYM_Q)));
  vsEase(S, 'res', res, d, 0.12);
  const W1 = CYM.w1, W2 = CYM.w2, I = CYM.I; W1.fill(0); W2.fill(0);
  for (let m = 0; m < M.length; m++) {
    const a1 = wa[m] / peak, a2 = wb[m] / peak; if (a1 < 0.03 && a2 < 0.03) continue;
    const n = M[m][0];
    for (let k = 0; k < N; k++) { const r = CYM.rad[k]; if (r > 1) continue; const phi = cymProfile(M[m], r) * Math.cos(n * CYM.ang[k]); W1[k] += a1 * phi; W2[k] += a2 * phi; }
  }
  let mx = 1e-6;
  for (let k = 0; k < N; k++) { const v = W1[k] * W1[k] + W2[k] * W2[k] + 2 * W1[k] * W2[k] * cross; I[k] = v; if (v > mx) mx = v; }
  vsEase(S, 'imax', mx, d, 0.1);
  const inv = 1 / Math.max(1e-6, S.imax);
  for (let j = 1; j < G - 1; j++) for (let i = 1; i < G - 1; i++) { const k = j * G + i; CYM.gx[k] = (I[k + 1] - I[k - 1]) * inv; CYM.gy[k] = (I[k + G] - I[k - G]) * inv; }
  // Grain motion: kicks ~ local amplitude (off resonance the plate barely moves; we keep a floor so the
  // old figure visibly loosens instead of freezing), plus drift toward the nodal lines.
  const drive = (0.25 + 0.75 * S.res) * (0.7 + 0.6 * S.en) * Math.min(1, d * 30);
  let seed = (S.seed || 1) | 0; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) - 0.5;
  const X = CYM.x, Y = CYM.y;
  for (let p = 0; p < CYM.n; p++) {
    let x = X[p], y = Y[p];
    const amp = Math.sqrt(Math.max(0, cymSample(I, x, y)) * inv);
    const k = 0.16 * amp * drive;
    x += rnd() * k - cymSample(CYM.gx, x, y) * 0.12 * drive; y += rnd() * k - cymSample(CYM.gy, x, y) * 0.12 * drive;
    const rr = Math.hypot(x, y); if (rr > 0.975) { x *= 0.975 / rr; y *= 0.975 / rr; }
    X[p] = x; Y[p] = y;
  }
  S.seed = seed;
  const R = Math.min(w, h) * 0.46, cx = w / 2, cy = h / 2;
  const pg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 1.05);
  pg.addColorStop(0, `rgba(255,199,31,${(0.04 + 0.05 * S.res).toFixed(3)})`); pg.addColorStop(1, 'rgba(255,199,31,0)');
  g.fillStyle = pg; g.beginPath(); g.arc(cx, cy, R * 1.05, 0, TAU_VS); g.fill();
  g.strokeStyle = `rgba(255,199,31,${(0.18 + 0.2 * S.res).toFixed(3)})`; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, TAU_VS); g.stroke();
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
// --- Water: Faraday-wave cymatics on a round pool, seen from straight above (v14) ---------------------
// A shallow water pool (20 mm across) is shaken vertically at the carrier f. Faraday waves answer at f/2,
// with the capillary dispersion w^2 = (sigma/rho) k^3 (sigma 0.072 N/m, rho 1000 kg/m^3), so k grows as f^(2/3):
// more, finer ripples at higher frequency. The pattern symmetry also climbs with frequency (rings -> square ->
// hexagonal -> 8, 10, 12-fold quasi-crystal) by superposing N standing waves at equally spaced angles; the
// symmetries cross-fade continuously in log-frequency so nothing ever switches abruptly. Density: the drawn
// wavenumber is doubled (x2 in each axis = 4x the cells of a plain square grid). The beat pulses the height.
const WAT = { G: 260, img: null, cv: null, H: null };
const WAT_SYM = [ // [log10 Hz centre, N wave vectors (0 = concentric rings)]
  [Math.log10(60), 0], [Math.log10(140), 2], [Math.log10(300), 3], [Math.log10(600), 4], [Math.log10(1000), 5], [Math.log10(1600), 6]];
function watK(f) { // drawn wavenumber in radians per pool radius
  const w = Math.PI * f, k = Math.cbrt(1000 * w * w / 0.072); // Faraday response at f/2: omega = 2 pi f / 2
  return Math.min(140, 2 * k * 0.01); // pool radius 10 mm, x2 density
}
function watW(lf) { // continuous weights over the symmetry list
  const W = WAT_SYM.map(([c]) => Math.exp(-Math.pow((lf - c) / 0.11, 2)));
  const s = W.reduce((a, b) => a + b, 0) || 1; return W.map((x) => x / s);
}
function drawWater(cv, w, h, f, dt) {
  const g = setupCanvas(cv, w, h);
  const { S, dt: d, bhz } = vsInputs(f, dt);
  const G = WAT.G;
  if (!WAT.cv) { WAT.cv = document.createElement('canvas'); WAT.cv.width = WAT.cv.height = G; WAT.img = WAT.cv.getContext('2d').createImageData(G, G); WAT.H = new Float32Array(G * G); }
  const fc = Math.min(1600, Math.max(40, S.car)), lf = Math.log10(fc), k = watK(fc), Wt = watW(lf);
  // Slow visible standing oscillation (the real f/2 is far above frame rate; we show an aliased sway) + beat pulse.
  S.wph = ((S.wph || 0) + d * TAU_VS * 0.35) % VS_TAU20;
  S.wbp = ((S.wbp || 0) + d * TAU_VS * Math.min(bhz, 12)) % VS_TAU20;
  const bf = Math.max(0, 1 - Math.max(0, bhz - 12) / 8);
  const pulse = (S.bt > 0.05 ? 0.62 + 0.38 * bf * Math.cos(S.wbp) : 1) * (0.7 + 0.3 * S.en);
  const tc = 0.6 + 0.4 * Math.cos(S.wph), ts = Math.sin(S.wph * 0.5);
  const H = WAT.H, D = WAT.img.data;
  for (let j = 0; j < G; j++) {
    const y = j / (G - 1) * 2 - 1;
    for (let i = 0; i < G; i++) {
      const x = i / (G - 1) * 2 - 1, r = Math.hypot(x, y), id = j * G + i;
      if (r > 1) { H[id] = 0; continue; }
      let v = 0;
      for (let s = 0; s < WAT_SYM.length; s++) {
        const ww = Wt[s]; if (ww < 0.01) continue;
        const N = WAT_SYM[s][1]; let p = 0;
        if (!N) p = Math.cos(k * r) * 1.4;
        else for (let q = 0; q < N; q++) { const a = q * Math.PI / N + 0.2; p += Math.cos(k * (x * Math.cos(a) + y * Math.sin(a)) + 0.6 * q * ts); }
        if (N) p /= Math.sqrt(N);
        v += ww * p;
      }
      H[id] = v * tc * pulse * (1 - Math.pow(r, 10)); // meniscus: pinned at the rim
    }
  }
  // Glossy shading: normals from the height field, Blinn-Phong with a soft key light top-left.
  const L = [-0.45, -0.55, 0.7], ln = Math.hypot(...L), lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
  const hx = lx, hy = ly, hz = lz + 1, hn = Math.hypot(hx, hy, hz), sl = 1.5 * Math.pow(140 / Math.max(8, k), 0.6);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const id = j * G + i, o = id * 4, x = i / (G - 1) * 2 - 1, y = j / (G - 1) * 2 - 1, r = Math.hypot(x, y);
    if (r > 1) { D[o + 3] = 0; continue; }
    const dx = (H[id + (i < G - 1 ? 1 : 0)] - H[id - (i > 0 ? 1 : 0)]) * sl, dy = (H[id + (j < G - 1 ? G : 0)] - H[id - (j > 0 ? G : 0)]) * sl;
    const nn = Math.hypot(dx, dy, 1), nx = -dx / nn, ny = -dy / nn, nz = 1 / nn;
    const dif = Math.max(0, nx * lx + ny * ly + nz * lz), spec = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hn), 60);
    const fres = 0.25 + 0.75 * Math.pow(1 - nz, 2);
    const base = 0.07 + 0.33 * dif + 0.55 * fres;
    D[o] = Math.min(255, 255 * (base * 0.9 + spec * 1.2)); D[o + 1] = Math.min(255, 199 * base * 0.95 + 255 * spec);
    D[o + 2] = Math.min(255, 31 * base + 200 * spec); D[o + 3] = 255 * Math.min(1, (1 - r) * 60);
  }
  WAT.cv.getContext('2d').putImageData(WAT.img, 0, 0);
  const R = Math.min(w, h) * 0.46, cx = w / 2, cy = h / 2;
  g.imageSmoothingEnabled = true; g.drawImage(WAT.cv, cx - R, cy - R, 2 * R, 2 * R);
  g.strokeStyle = 'rgba(255,199,31,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, R, 0, TAU_VS); g.stroke();
}
function drawVizStyle(style, cv, w, h, f, dt) {
  if (style === 'cymatics') { drawCymatics(cv, w, h, f, dt); return true; }
  if (style === 'water' || style === 'ripple' || style === 'liquid') { drawWater(cv, w, h, f, dt); return true; }
  return false;
}
