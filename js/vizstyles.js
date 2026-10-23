// v13 selectable visual styles (Visual mix > STYLE): 'rings' (the original page 1 / page 4 visuals),
// 'cymatics' (sand on a vibrating plate: grains settle on the nodal lines of a Chladni mode set by the
// carrier and beat; when the frequency moves, the figure dissolves and re-forms) and 'liquid' (a gold
// liquid surface whose waves follow the carrier, beat and live audio energy). Gold only, no text.
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
  vsEase(S, 'cu', cu, dt, 0.9); vsEase(S, 'bu', bu, dt, 0.9);
  vsEase(S, 'en', Math.min(1, f.energy || 0.2), dt, 0.35);
  const bhz = 0.5 * Math.pow(90, S.bu);                     // beat in Hz (same log map as the inputs)
  const sp = (typeof VP !== 'undefined' ? VP.get('spin') : 1);
  S.ph = ((S.ph || 0) + dt * TAU_VS * Math.min(bhz, 12) * 0.08) % VS_TAU20; // slow breath tied to the beat
  S.t = ((S.t || 0) + dt * (0.3 + 0.7 * sp)) % 1e5;
  return { S, dt, bhz, sp };
}
const TAU_VS = Math.PI * 2;
// --- Cymatics ---------------------------------------------------------------------------------------
const CYM = { n: 3200, x: null, y: null };
function cymField(x, y, n, m, mix) {
  // Square-plate Chladni form blended with a circular (radial x angular) form, continuous in n, m.
  const P = Math.PI;
  const sq = Math.cos(n * P * x) * Math.cos(m * P * y) - Math.cos(m * P * x) * Math.cos(n * P * y);
  const r = Math.hypot(x, y), a = Math.atan2(y, x);
  const ci = Math.cos(m * a) * Math.sin(n * P * r * 0.9);
  return sq * (1 - mix) + ci * mix;
}
function drawCymatics(cv, w, h, f, dt) {
  const g = setupCanvas(cv, w, h);
  const { S, dt: d, sp } = vsInputs(f, dt);
  if (!CYM.x) { CYM.x = new Float32Array(CYM.n); CYM.y = new Float32Array(CYM.n);
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < CYM.n; i++) { const r = Math.sqrt(rnd()) * 0.98, a = rnd() * TAU_VS; CYM.x[i] = r * Math.cos(a); CYM.y[i] = r * Math.sin(a); } }
  // Mode numbers: carrier picks the main order, beat adds asymmetry; both continuous.
  const n = 1.6 + S.cu * 5.2 + 0.25 * Math.sin(S.ph);
  const m = n + 1.1 + S.bu * 2.6 + 0.2 * Math.cos(S.ph * 0.5);
  const mix = 0.5 + 0.5 * Math.sin(S.t * 0.05);
  const shake = 0.010 + 0.03 * S.en;                        // grain agitation where the plate moves
  const pull = Math.min(1, d * 6 * (0.6 + 0.6 * sp));
  let seed = (S.seed || 1) | 0; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) - 0.5;
  const X = CYM.x, Y = CYM.y, e = 0.004;
  for (let i = 0; i < CYM.n; i++) {
    const x = X[i], y = Y[i], v = cymField(x, y, n, m, mix);
    const gx = (cymField(x + e, y, n, m, mix) - cymField(x - e, y, n, m, mix)) / (2 * e);
    const gy = (cymField(x, y + e, n, m, mix) - cymField(x, y - e, n, m, mix)) / (2 * e);
    const gg = gx * gx + gy * gy + 1e-3;
    // Newton step toward v = 0 (the nodal line), plus agitation proportional to |v|.
    let nx = x - pull * 0.5 * v * gx / gg, ny = y - pull * 0.5 * v * gy / gg;
    const k = Math.abs(v) * shake * 6 * Math.min(1, d * 30);
    nx += rnd() * k; ny += rnd() * k;
    const rr = Math.hypot(nx, ny); if (rr > 0.98) { nx *= 0.98 / rr; ny *= 0.98 / rr; }
    X[i] = nx; Y[i] = ny;
  }
  S.seed = seed;
  const R = Math.min(w, h) * 0.46, cx = w / 2, cy = h / 2;
  const pg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 1.05);
  pg.addColorStop(0, 'rgba(255,199,31,0.06)'); pg.addColorStop(1, 'rgba(255,199,31,0)');
  g.fillStyle = pg; g.beginPath(); g.arc(cx, cy, R * 1.05, 0, TAU_VS); g.fill();
  g.strokeStyle = 'rgba(255,199,31,0.18)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, TAU_VS); g.stroke();
  g.globalCompositeOperation = 'lighter';
  const sz = Math.max(1.2, R / 150);
  for (let i = 0; i < CYM.n; i++) {
    const v = Math.abs(cymField(X[i], Y[i], n, m, mix));
    const a = Math.max(0.12, 0.9 - v * 3.5);
    g.fillStyle = `rgba(255,${190 + (a * 40) | 0},${(31 + a * 60) | 0},${a.toFixed(3)})`;
    g.fillRect(cx + X[i] * R - sz / 2, cy + Y[i] * R - sz / 2, sz, sz);
  }
  g.globalCompositeOperation = 'source-over';
}
// --- Liquid wave -------------------------------------------------------------------------------------
function drawLiquid(cv, w, h, f, dt) {
  const g = setupCanvas(cv, w, h);
  const { S, dt: d, bhz, sp } = vsInputs(f, dt);
  S.lp = ((S.lp || 0) + d * (0.5 + 1.6 * S.cu) * (0.4 + 0.8 * sp)) % VS_TAU20;
  S.lb = ((S.lb || 0) + d * TAU_VS * Math.min(bhz, 8) * 0.12) % VS_TAU20;
  const bands = f.bands || [];
  const rows = 34, cols = 64, cx = w / 2, top = h * 0.2, bot = h * 0.86;
  const k1 = 1.4 + 3.2 * S.cu, k2 = 2.2 + 2.5 * S.bu, amp = h * (0.035 + 0.07 * S.en);
  g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  for (let j = 0; j < rows; j++) {
    const z = j / (rows - 1), p = 0.25 + 0.75 * z;               // depth: back rows small and dim
    const yb = top + (bot - top) * Math.pow(z, 1.4), half = w * (0.18 + 0.4 * p);
    const bj = bands.length ? (bands[Math.min(bands.length - 1, (z * bands.length) | 0)] || 0) : 0;
    g.beginPath();
    for (let i = 0; i <= cols; i++) {
      const u = i / cols * 2 - 1, x = u * 3.2, zz = z * 4;
      const hgt = Math.sin(k1 * x + S.lp + zz) * 0.55 + Math.sin(k2 * (x * 0.6 - zz) - S.lp * 0.7 + 1.3) * 0.35
        + Math.sin(Math.hypot(x, zz - 2) * 2.6 - S.lb) * 0.3 * (0.4 + S.bu) + bj * 0.6 * Math.sin(x * 5 + S.lp * 1.3);
      const env = Math.cos(u * Math.PI / 2);
      const X = cx + u * half, Yp = yb - hgt * amp * p * (0.4 + 0.6 * env);
      i ? g.lineTo(X, Yp) : g.moveTo(X, Yp);
    }
    const a = 0.08 + 0.5 * p * p;
    g.strokeStyle = `rgba(${VS_GOLD[0]},${VS_GOLD[1]},${VS_GOLD[2]},${a.toFixed(3)})`; g.lineWidth = 0.7 + 1.6 * p;
    g.stroke();
  }
  const gl = g.createRadialGradient(cx, h * 0.62, 0, cx, h * 0.62, w * 0.7);
  gl.addColorStop(0, `rgba(255,199,31,${(0.07 + 0.08 * S.en).toFixed(3)})`); gl.addColorStop(1, 'rgba(255,199,31,0)');
  g.fillStyle = gl; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
}
function drawVizStyle(style, cv, w, h, f, dt) {
  if (style === 'cymatics') { drawCymatics(cv, w, h, f, dt); return true; }
  if (style === 'liquid') { drawLiquid(cv, w, h, f, dt); return true; }
  return false;
}
