// Freqium synth: a JavaScript port of the iOS app's framework-free engine
// (DSP.swift, Nature.swift, MusicEngine.swift, Mood.swift recipes, SynthCore.swift).
// Runs inside an AudioWorklet (registerProcessor at the bottom). The same file also loads
// as a plain script/module so it can be tested outside the browser.
'use strict';

const TWO_PI = 2 * Math.PI;
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------- DSP.swift ----------
function polyBlep(t, dt) {
  if (!(dt > 0 && dt < 0.5)) return 0;
  if (t < dt) { const x = t / dt; return x + x - x * x - 1; }
  if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; }
  return 0;
}
function oscSample(w, t, inc) {
  switch (w) {
    case 'triangle': return (1 - 4 * Math.abs(t - 0.5)) * 0.9;
    case 'sawtooth': return (2 * t - 1 - polyBlep(t, inc)) * 0.6;
    case 'square': {
      let t2 = t + 0.5; if (t2 >= 1) t2 -= 1;
      const naive = t < 0.5 ? 1 : -1;
      return (naive + polyBlep(t, inc) - polyBlep(t2, inc)) * 0.55;
    }
    default: return Math.sin(TWO_PI * t);
  }
}
// Isochronic gate with raised-cosine edges (no clicks).
function pulseEnvelope(x, duty) {
  const d = Math.min(0.95, Math.max(0.05, duty));
  const ramp = Math.min(d, 1 - d) * 0.3;
  if (x < ramp) return 0.5 - 0.5 * Math.cos(Math.PI * x / ramp);
  if (x < d - ramp) return 1;
  if (x < d) return 0.5 - 0.5 * Math.cos(Math.PI * (d - x) / ramp);
  return 0;
}
// xorshift white, Paul Kellet pink, leaky-integrator brown.
class NoiseSource {
  constructor(seed) {
    this.s = (seed >>> 0) || 0x12345678;
    this.b0 = this.b1 = this.b2 = this.b3 = this.b4 = this.b5 = this.b6 = 0;
    this.brown = 0;
  }
  white() {
    let s = this.s;
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    this.s = s;
    return s / 4294967295 * 2 - 1;
  }
  next(color) {
    const w = this.white();
    switch (color) {
      case 'white': return w * 0.3;
      case 'pink': {
        this.b0 = 0.99886 * this.b0 + w * 0.0555179;
        this.b1 = 0.99332 * this.b1 + w * 0.0750759;
        this.b2 = 0.96900 * this.b2 + w * 0.1538520;
        this.b3 = 0.86650 * this.b3 + w * 0.3104856;
        this.b4 = 0.55000 * this.b4 + w * 0.5329522;
        this.b5 = -0.7616 * this.b5 - w * 0.0168980;
        const out = this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + w * 0.5362;
        this.b6 = w * 0.115926;
        return out * 0.1;
      }
      case 'brown':
        this.brown = (this.brown + 0.02 * w) / 1.02;
        return this.brown * 3.2;
      default: return 0;
    }
  }
}
// Soft limiter: transparent below 0.8, tanh knee above, never exceeds ±1.
function softLimit(x) {
  const a = Math.abs(x);
  if (a <= 0.8) return x;
  const y = 0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2);
  return x < 0 ? -y : y;
}
const isNature = (k) => k === 'rain' || k === 'ocean' || k === 'wind' || k === 'stream';

// ---------- Nature.swift ----------
class SVF {
  constructor() { this.ic1 = 0; this.ic2 = 0; this.a1 = 1; this.a2 = 0; this.a3 = 0; this.k = 1.4; this.lp = 0; this.bp = 0; this.hp = 0; }
  tune(hz, q, sr) {
    const f = Math.min(Math.max(hz, 10), sr * 0.45);
    const g = Math.tan(Math.PI * f / sr);
    this.k = 1 / Math.max(0.05, q);
    this.a1 = 1 / (1 + g * (g + this.k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
  }
  run(x) {
    const v3 = x - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.lp = v2; this.bp = this.k * v1; this.hp = x - this.k * v1 - v2;
    return this;
  }
  reset() { this.ic1 = 0; this.ic2 = 0; }
}

class NatureEngine {
  constructor(sr, seed) {
    this.sr = sr; this.control = 32; this.counter = 0; this.kind = 'off';
    this.nL = new NoiseSource(seed + 0x1111); this.nR = new NoiseSource(seed + 0x22223333);
    this.rng = new NoiseSource(seed + 0x0BADF00D); this.tick = new NoiseSource(seed + 0x5EED);
    this.fL1 = new SVF(); this.fR1 = new SVF(); this.fL2 = new SVF(); this.fR2 = new SVF(); this.fL3 = new SVF(); this.fR3 = new SVF();
    this.intensity = 0.8; this.intensityTarget = 0.8; this.center = 450; this.centerTarget = 450;
    this.gust = 0.6; this.gustTarget = 0.6; this.holdTimer = 0; this.holdTimer2 = 0;
    this.wavePhase = 0; this.wavePeriod = 9; this.waveStrength = 0.8; this.wavePan = 0; this.swell = 0; this.foam = 0;
    this.voices = [];
    for (let i = 0; i < 12; i++) this.voices.push({ amp: 0, decay: 0, phase: 0, inc: 0, chirp: 1, gl: 0.7, gr: 0.7, bubble: false, filter: new SVF() });
    this.outL = 0; this.outR = 0;
  }
  rand01() { return (this.rng.white() + 1) * 0.5; }
  randRange(a, b) { return a + (b - a) * this.rand01(); }
  randLog(a, b) { return a * Math.pow(b / a, this.rand01()); }
  reset(k) {
    this.kind = k; this.counter = 0;
    for (const f of [this.fL1, this.fR1, this.fL2, this.fR2, this.fL3, this.fR3]) f.reset();
    for (const v of this.voices) v.amp = 0;
    this.intensity = 0.8; this.intensityTarget = 0.8; this.gust = 0.6; this.gustTarget = 0.6;
    this.center = k === 'wind' ? 420 : 900; this.centerTarget = this.center;
    this.holdTimer = 0; this.holdTimer2 = 0;
    this.wavePhase = 0.55; this.wavePeriod = 9; this.waveStrength = 0.8; this.swell = 0.2; this.foam = 0;
  }
  spawn(bubble, freq, q, amp, tau, chirp) {
    let best = 0, bestAmp = Infinity;
    for (let i = 0; i < 12; i++) if (this.voices[i].amp < bestAmp) { bestAmp = this.voices[i].amp; best = i; }
    const v = this.voices[best];
    v.amp = amp; v.decay = Math.exp(-1 / (this.sr * tau)); v.bubble = bubble; v.phase = 0;
    v.inc = freq / this.sr; v.chirp = chirp;
    const p = this.rand01();
    v.gl = Math.cos(p * Math.PI / 2); v.gr = Math.sin(p * Math.PI / 2);
    if (!bubble) { v.filter.reset(); v.filter.tune(freq, q, this.sr); }
  }
  runVoices() {
    let l = 0, r = 0;
    for (let i = 0; i < 12; i++) {
      const v = this.voices[i];
      if (v.amp < 1e-5) continue;
      let x;
      if (v.bubble) {
        x = Math.sin(TWO_PI * v.phase) * v.amp;
        v.phase += v.inc; v.phase -= Math.floor(v.phase); v.inc *= v.chirp;
      } else {
        x = v.filter.run(this.tick.white() * v.amp).bp;
      }
      v.amp *= v.decay;
      l += x * v.gl; r += x * v.gr;
    }
    this.vl = l; this.vr = r;
  }
  controlUpdate() {
    const sr = this.sr, cdt = this.control / sr, slow = 1 - Math.exp(-cdt / 1.5);
    this.holdTimer -= cdt; this.holdTimer2 -= cdt;
    switch (this.kind) {
      case 'rain': {
        if (this.holdTimer <= 0) { this.intensityTarget = this.randRange(0.65, 1.0); this.holdTimer = this.randRange(4, 12); }
        this.intensity += (this.intensityTarget - this.intensity) * (1 - Math.exp(-cdt / 3));
        const tickRate = 26 * this.intensity;
        if (this.rand01() < tickRate * cdt)
          this.spawn(false, this.randLog(1800, 7000), this.randRange(1.5, 4), 0.05 + 0.35 * Math.pow(this.rand01(), 3), this.randRange(0.004, 0.012), 1);
        if (this.rand01() < 3 * this.intensity * cdt)
          this.spawn(false, this.randLog(600, 1600), this.randRange(2, 5), this.randRange(0.15, 0.35), this.randRange(0.010, 0.025), 1);
        if (this.rand01() < 2.5 * cdt)
          this.spawn(true, this.randLog(1200, 3200), 1, this.randRange(0.02, 0.06), this.randRange(0.008, 0.02), 1 + this.randRange(0.4, 1.2) / sr * 10);
        this.fL1.tune(450, 0.6, sr); this.fR1.tune(450, 0.6, sr);
        this.fL2.tune(5500 + 1500 * this.intensity, 0.6, sr); this.fR2.tune(5500 + 1500 * this.intensity, 0.6, sr);
        this.fL3.tune(320, 0.5, sr); this.fR3.tune(320, 0.5, sr);
        break;
      }
      case 'ocean': {
        this.wavePhase += cdt / this.wavePeriod;
        if (this.wavePhase >= 1) {
          this.wavePhase -= 1; this.wavePeriod = this.randRange(7, 13);
          this.waveStrength = this.randRange(0.55, 1.0); this.wavePan = this.randRange(-0.35, 0.35);
        }
        const x = this.wavePhase;
        let shape;
        if (x < 0.38) { const t = x / 0.38; shape = Math.pow(t * t * (3 - 2 * t), 1.6); } else shape = Math.exp(-(x - 0.38) * 4.2);
        const target = 0.12 + 0.88 * shape * this.waveStrength;
        this.swell += (target - this.swell) * (1 - Math.exp(-cdt / 0.35));
        const foamTarget = x > 0.33 && x < 0.75 ? Math.max(0, shape - 0.35) * this.waveStrength : 0;
        this.foam += (foamTarget - this.foam) * (1 - Math.exp(-cdt / (foamTarget > this.foam ? 0.4 : 1.0)));
        const cut = 220 + 1900 * this.swell;
        this.fL1.tune(cut * (1 - 0.12 * this.wavePan), 0.55, sr); this.fR1.tune(cut * (1 + 0.12 * this.wavePan), 0.55, sr);
        this.fL2.tune(2400, 0.5, sr); this.fR2.tune(2600, 0.5, sr);
        break;
      }
      case 'wind': {
        if (this.holdTimer <= 0) { this.centerTarget = this.randLog(230, 820); this.holdTimer = this.randRange(1.5, 4.5); }
        if (this.holdTimer2 <= 0) { this.gustTarget = this.randRange(0.25, 1.0); this.holdTimer2 = this.randRange(1.0, 5.0); }
        this.center += (this.centerTarget - this.center) * slow;
        this.gust += (this.gustTarget - this.gust) * (1 - Math.exp(-cdt / 1.2));
        this.fL1.tune(this.center, 1.1, sr); this.fR1.tune(this.center * 1.07, 1.1, sr);
        this.fL2.tune(this.center * 2.9, 9, sr); this.fR2.tune(this.center * 3.1, 9, sr);
        this.fL3.tune(180, 0.5, sr); this.fR3.tune(180, 0.5, sr);
        break;
      }
      case 'stream': {
        if (this.holdTimer <= 0) { this.intensityTarget = this.randRange(0.7, 1.0); this.holdTimer = this.randRange(3, 8); }
        this.intensity += (this.intensityTarget - this.intensity) * slow;
        const rate = 55 * this.intensity;
        if (this.rand01() < rate * cdt) {
          const f = this.randLog(380, 2400);
          const tau = this.randRange(0.006, 0.03) * Math.sqrt(900 / f);
          this.spawn(true, f, 1, this.randRange(0.03, 0.16), tau, 1 + this.randRange(0.15, 0.5) / (sr * tau) * 0.6);
        }
        this.fL1.tune(700, 0.5, sr); this.fR1.tune(760, 0.5, sr);
        this.fL2.tune(2600, 0.7, sr); this.fR2.tune(2800, 0.7, sr);
        break;
      }
    }
  }
  // Writes one stereo sample into outL/outR.
  next(k) {
    if (k !== this.kind) this.reset(k);
    if (this.counter === 0) this.controlUpdate();
    if (++this.counter >= this.control) this.counter = 0;
    const nL = this.nL, nR = this.nR;
    switch (this.kind) {
      case 'rain': {
        const hl = this.fL1.run(nL.next('pink')).hp, hr = this.fR1.run(nR.next('pink')).hp;
        const bl = this.fL2.run(hl).lp, br = this.fR2.run(hr).lp;
        const rl = this.fL3.run(nL.next('brown')).lp, rr = this.fR3.run(nR.next('brown')).lp;
        this.runVoices();
        const a = 1.25 * this.intensity;
        this.outL = (bl * a + rl * 0.35 + this.vl) * 1.3; this.outR = (br * a + rr * 0.35 + this.vr) * 1.3;
        return;
      }
      case 'ocean': {
        const bl = this.fL1.run(nL.next('brown')).lp, br = this.fR1.run(nR.next('brown')).lp;
        const wl = this.fL2.run(nL.white()).hp, wr = this.fR2.run(nR.white()).hp;
        const body = 0.25 + 0.9 * this.swell;
        const gl = body * (1 - 0.3 * this.wavePan), gr = body * (1 + 0.3 * this.wavePan);
        const f = 0.22 * this.foam * this.foam;
        this.outL = (bl * gl * 0.9 + wl * f) * 1.45; this.outR = (br * gr * 0.9 + wr * f) * 1.45;
        return;
      }
      case 'wind': {
        const xl = nL.white(), xr = nR.white();
        const bl = this.fL1.run(xl).bp, br = this.fR1.run(xr).bp;
        const wl = this.fL2.run(xl).bp, wr = this.fR2.run(xr).bp;
        const rl = this.fL3.run(nL.next('brown')).lp, rr = this.fR3.run(nR.next('brown')).lp;
        const g = 0.15 + 0.85 * this.gust, whistle = 0.18 * this.gust * this.gust;
        this.outL = (bl * 0.55 * g + wl * whistle + rl * 0.25 * g) * 2.5; this.outR = (br * 0.55 * g + wr * whistle + rr * 0.25 * g) * 2.5;
        return;
      }
      case 'stream': {
        const xl = nL.white(), xr = nR.white();
        const ll = this.fL1.run(xl).bp, lr = this.fR1.run(xr).bp;
        const hl = this.fL2.run(xl).bp, hr = this.fR2.run(xr).bp;
        this.runVoices();
        const a = 0.6 + 0.4 * this.intensity;
        this.outL = ((ll * 0.18 + hl * 0.08) * a + this.vl) * 2.1; this.outR = ((lr * 0.18 + hr * 0.08) * a + this.vr) * 2.1;
        return;
      }
      default: this.outL = 0; this.outR = 0;
    }
  }
}

// ---------- Mood.swift (music recipes) ----------

const MOOD_MUSIC = {
  sleep:    { rootMidi: 50, scaleMask: 0b010110101101, chords: [0, 5, 3, 6], sevenths: false, chordSeconds: 26, crossfadeSeconds: 9, brightness: 0.18, lfoRate: 0.025, lfoDepth: 0.35, driftCents: 6, detuneCents: 5, bellRate: 0.02, arpRate: 0, bellDecay: 6, reverbMix: 0.50, reverbSeconds: 6, delayMix: 0.12, delayFeedback: 0.35, droneLevel: 0.45 },
  rest:     { rootMidi: 53, scaleMask: 0b101011010101, chords: [0, 1, 4, 2], sevenths: true, chordSeconds: 20, crossfadeSeconds: 7, brightness: 0.30, lfoRate: 0.035, lfoDepth: 0.35, driftCents: 5, detuneCents: 6, bellRate: 0.05, arpRate: 0, bellDecay: 5, reverbMix: 0.45, reverbSeconds: 5, delayMix: 0.20, delayFeedback: 0.40, droneLevel: 0.35 },
  focus:    { rootMidi: 48, scaleMask: 0b011010110101, chords: [0, 3, 4, 6], sevenths: true, chordSeconds: 14, crossfadeSeconds: 5, brightness: 0.45, lfoRate: 0.06, lfoDepth: 0.25, driftCents: 3, detuneCents: 4, bellRate: 0, arpRate: 0.5, bellDecay: 3, reverbMix: 0.30, reverbSeconds: 3.5, delayMix: 0.30, delayFeedback: 0.45, droneLevel: 0.25 },
  active:   { rootMidi: 52, scaleMask: 0b011010101101, chords: [0, 3, 1, 4], sevenths: false, chordSeconds: 9, crossfadeSeconds: 3.5, brightness: 0.60, lfoRate: 0.10, lfoDepth: 0.30, driftCents: 3, detuneCents: 7, bellRate: 0, arpRate: 1.2, bellDecay: 2, reverbMix: 0.25, reverbSeconds: 2.5, delayMix: 0.30, delayFeedback: 0.40, droneLevel: 0.20 },
  calm:     { rootMidi: 55, scaleMask: 0b001010010101, chords: [0, 3, 1, 4], sevenths: false, chordSeconds: 18, crossfadeSeconds: 7, brightness: 0.32, lfoRate: 0.04, lfoDepth: 0.30, driftCents: 4, detuneCents: 5, bellRate: 0.08, arpRate: 0, bellDecay: 5, reverbMix: 0.50, reverbSeconds: 5.5, delayMix: 0.25, delayFeedback: 0.45, droneLevel: 0.30 },
  meditate: { rootMidi: 50, scaleMask: 0b001010100101, chords: [0, 2, 3, -1], sevenths: false, chordSeconds: 32, crossfadeSeconds: 10, brightness: 0.22, lfoRate: 0.02, lfoDepth: 0.40, driftCents: 4, detuneCents: 3, bellRate: 0.035, arpRate: 0, bellDecay: 9, reverbMix: 0.60, reverbSeconds: 8, delayMix: 0.15, delayFeedback: 0.35, droneLevel: 0.55 },
};

// ---------- MusicEngine.swift ----------
class DelayLine {
  constructor(size) { this.size = Math.max(1, size | 0); this.buf = new Float32Array(this.size); this.i = 0; }
  read() { return this.buf[this.i]; }
  write(v) { this.buf[this.i] = v; if (++this.i === this.size) this.i = 0; }
}
class FDNReverb {
  constructor(sr) {
    this.sr = sr; const ms = sr / 1000;
    this.d = [new DelayLine(53.1 * ms), new DelayLine(63.7 * ms), new DelayLine(73.3 * ms), new DelayLine(84.9 * ms)];
    this.ap1 = new DelayLine(5.3 * ms); this.ap2 = new DelayLine(7.9 * ms);
    this.z0 = this.z1 = this.z2 = this.z3 = 0; this.g = [0, 0, 0, 0];
    this.setDecay(4);
  }
  setDecay(seconds) {
    const rt = Math.max(0.3, seconds);
    for (let i = 0; i < 4; i++) this.g[i] = Math.pow(10, -3 * this.d[i].size / (this.sr * rt));
  }
  static allpass(line, x, g) { const d = line.read(); const w = x + g * d; line.write(w); return d - g * w; }
  process(x) {
    let v = FDNReverb.allpass(this.ap1, x, 0.6);
    v = FDNReverb.allpass(this.ap2, v, 0.6);
    const d = this.d;
    this.z0 += 0.4 * (d[0].read() - this.z0); this.z1 += 0.4 * (d[1].read() - this.z1);
    this.z2 += 0.4 * (d[2].read() - this.z2); this.z3 += 0.4 * (d[3].read() - this.z3);
    const z0 = this.z0, z1 = this.z1, z2 = this.z2, z3 = this.z3;
    d[0].write(v + (z0 + z1 + z2 + z3) * 0.5 * this.g[0]);
    d[1].write(v + (z0 - z1 + z2 - z3) * 0.5 * this.g[1]);
    d[2].write(v + (z0 + z1 - z2 - z3) * 0.5 * this.g[2]);
    d[3].write(v + (z0 - z1 - z2 + z3) * 0.5 * this.g[3]);
    this.oL = (z0 + z2) * 0.5; this.oR = (z1 + z3) * 0.5;
  }
}
class PingPongDelay {
  constructor(sr, seconds = 0.42) { this.left = new DelayLine(seconds * sr); this.right = new DelayLine(seconds * sr); this.lp = 0; }
  process(x, fb) {
    const yl = this.left.read(), yr = this.right.read();
    this.lp += 0.3 * (yr - this.lp);
    this.left.write(x + this.lp * fb); this.right.write(yl * fb);
    this.oL = yl; this.oR = yr;
  }
}
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

class MusicEngine {
  constructor(sr) {
    this.sr = sr; this.controlInterval = 64; this.counter = 0;
    this.rng = new NoiseSource(0xA5A51234);
    this.params = MOOD_MUSIC.sleep; this.mood = null;
    this.scale = new Array(12).fill(0); this.scaleCount = 7;
    this.chordNotes = [50, 50, 50, 50];
    this.pads = []; for (let i = 0; i < 8; i++) this.pads.push({ freq: 220, phaseA: 0, phaseB: 0, incA: 0, incB: 0, gain: 0, target: 0, level: 1, amp: 1, cents: 0, breathPhase: 0, breathRate: 0.07 });
    this.bells = []; for (let i = 0; i < 6; i++) this.bells.push({ active: false, phase: 0, inc: 0, env: 0, attackStep: 0, decayMul: 0, attacking: false, amp: 0, pan: 0 });
    this.bank = 0; this.chordIndex = 0; this.chordTimer = 0; this.arpTimer = 0; this.arpStep = 0; this.chordSerial = 0;
    this.h1 = 1; this.h2 = 0; this.h3 = 0; this.h4 = 0; this.lfoPhase = 0; this.brightWalk = 0; this.brightness = 0.2; this.padCoef = 0;
    this.droneFreq = 0; this.droneTarget = 0; this.dronePhase1 = 0; this.dronePhase2 = 0; this.droneBreath = 0; this.droneLevel = 0; this.droneAmp = 0;
    this.revMix = 0; this.delMix = 0; this.delFb = 0; this.revSeconds = 4;
    this.reverb = new FDNReverb(sr); this.delay = new PingPongDelay(sr);
    this.oL = 0; this.oR = 0;
  }
  rand01() { return (this.rng.white() + 1) * 0.5; }
  setMood(m) {
    if (m === this.mood) return;
    const first = this.mood === null;
    this.mood = m; this.params = MOOD_MUSIC[m] || MOOD_MUSIC.calm;
    this.scaleCount = 0;
    for (let s = 0; s < 12; s++) if (this.params.scaleMask & (1 << s)) this.scale[this.scaleCount++] = s;
    if (this.scaleCount === 0) { this.scale[0] = 0; this.scaleCount = 1; }
    this.droneTarget = midiHz(this.params.rootMidi - 24);
    if (first) {
      const p = this.params;
      this.droneFreq = this.droneTarget; this.revMix = p.reverbMix; this.delMix = p.delayMix; this.delFb = p.delayFeedback;
      this.revSeconds = p.reverbSeconds; this.reverb.setDecay(this.revSeconds); this.droneLevel = p.droneLevel;
    }
    this.chordIndex = -1;
    this.changeChord();
    this.arpTimer = 0.6;
  }
  chordCount() { let n = 0; for (let i = 0; i < 4; i++) if (this.params.chords[i] >= 0) n++; return Math.max(1, n); }
  changeChord() {
    const count = this.chordCount();
    let next = Math.min(count - 1, Math.floor(this.rand01() * count));
    if (this.chordIndex < 0) next = 0;
    else if (count > 1 && next === this.chordIndex) next = (next + 1) % count;
    this.chordIndex = next;
    const degree = Math.max(0, this.params.chords[next]);
    for (let k = 0; k < 4; k++) {
      const idx = degree + 2 * k;
      const semis = this.scale[idx % this.scaleCount] + 12 * Math.floor(idx / this.scaleCount);
      this.chordNotes[k] = this.params.rootMidi + semis;
    }
    for (let i = 0; i < 4; i++) this.pads[this.bank * 4 + i].target = 0;
    this.bank = 1 - this.bank;
    const base = this.bank * 4;
    this.padCoef = 1 - Math.exp(-1 / (this.sr * Math.max(0.5, this.params.crossfadeSeconds) / 3));
    const c = this.chordNotes;
    let notes = [c[0] - 12, c[0], c[1], c[2]];
    if (this.params.sevenths) notes = [c[0] - 12, c[1], c[2], c[3]];
    else if (this.rand01() < 0.5) notes[1] += 12;
    this.setPad(base + 0, notes[0], 0.9); this.setPad(base + 1, notes[1], 0.75);
    this.setPad(base + 2, notes[2], 0.7); this.setPad(base + 3, notes[3], 0.6);
    this.chordSerial++;
    this.chordTimer = this.params.chordSeconds * (0.8 + 0.4 * this.rand01());
  }
  setPad(i, midi, level) {
    const v = this.pads[i];
    v.freq = midiHz(midi); v.target = 1; v.level = level;
    if (v.gain < 0.001) {
      v.breathRate = 0.04 + 0.08 * this.rand01(); v.breathPhase = this.rand01();
      v.cents = this.rng.white() * this.params.driftCents * 0.5;
    }
  }
  triggerBell(arp) {
    const tones = this.params.sevenths ? 4 : 3;
    let k;
    if (arp) { k = this.arpStep % tones; this.arpStep++; } else k = Math.min(tones - 1, Math.floor(this.rand01() * tones));
    const octave = arp ? 12 : (this.rand01() < 0.5 ? 12 : 24);
    let slot = 0, quietest = Infinity;
    for (let j = 0; j < 6; j++) {
      if (!this.bells[j].active) { slot = j; quietest = -1; break; }
      if (this.bells[j].env < quietest) { quietest = this.bells[j].env; slot = j; }
    }
    const b = this.bells[slot];
    if (quietest < 0) { b.phase = 0; b.env = 0; }
    b.active = true; b.inc = midiHz(this.chordNotes[k] + octave) / this.sr; b.attacking = true;
    b.attackStep = 1 / (0.06 * this.sr); b.decayMul = Math.exp(-1 / (Math.max(0.3, this.params.bellDecay) * this.sr));
    b.amp = arp ? 0.65 : 0.45 + 0.45 * this.rand01(); b.pan = this.rng.white() * 0.6;
  }
  controlUpdate() {
    const p = this.params, cdt = this.controlInterval / this.sr;
    this.chordTimer -= cdt;
    if (this.chordTimer <= 0) this.changeChord();
    this.lfoPhase += p.lfoRate * cdt; this.lfoPhase -= Math.floor(this.lfoPhase);
    this.brightWalk = clampN((this.brightWalk + this.rng.white() * 0.01) * 0.998, -0.25, 0.25);
    const targetBright = clampN(p.brightness * (1 + p.lfoDepth * Math.sin(TWO_PI * this.lfoPhase)) + this.brightWalk * 0.3, 0.02, 1);
    this.brightness += (targetBright - this.brightness) * (1 - Math.exp(-cdt / 1.5));
    const b = this.brightness;
    this.h1 = 1; this.h2 = 0.55 * b; this.h3 = 0.35 * b * b; this.h4 = 0.25 * b * b * b;
    for (let i = 0; i < 8; i++) {
      const v = this.pads[i];
      if (v.target === 0 && v.gain < 1e-5) continue;
      const drift = p.driftCents;
      v.cents = clampN((v.cents + this.rng.white() * 0.02 * drift) * 0.9995, -drift, drift);
      v.breathPhase += v.breathRate * cdt; v.breathPhase -= Math.floor(v.breathPhase);
      const breath = 1 - 0.3 * (0.5 + 0.5 * Math.sin(TWO_PI * v.breathPhase));
      const det = p.detuneCents;
      v.incA = v.freq * Math.pow(2, (v.cents - det) / 1200) / this.sr;
      v.incB = v.freq * Math.pow(2, (v.cents + det) / 1200) / this.sr;
      v.amp = v.level * breath;
    }
    const slow = 1 - Math.exp(-cdt / 3);
    this.droneFreq += (this.droneTarget - this.droneFreq) * slow;
    this.droneLevel += (p.droneLevel - this.droneLevel) * slow;
    this.droneBreath += 0.05 * cdt; this.droneBreath -= Math.floor(this.droneBreath);
    this.droneAmp = this.droneLevel * (0.8 + 0.2 * Math.sin(TWO_PI * this.droneBreath));
    this.revMix += (p.reverbMix - this.revMix) * slow;
    this.delMix += (p.delayMix - this.delMix) * slow;
    this.delFb += (p.delayFeedback - this.delFb) * slow;
    const newRev = this.revSeconds + (p.reverbSeconds - this.revSeconds) * slow;
    if (Math.abs(newRev - this.revSeconds) > 0.001) { this.revSeconds = newRev; this.reverb.setDecay(newRev); }
    if (p.bellRate > 0 && this.rand01() < p.bellRate * cdt) this.triggerBell(false);
    if (p.arpRate > 0) {
      this.arpTimer -= cdt;
      if (this.arpTimer <= 0) { this.triggerBell(true); this.arpTimer = (1 / p.arpRate) * (0.92 + 0.16 * this.rand01()); }
    }
  }
  harmonics(s, c) {
    const s2 = 2 * s * c, c2 = 1 - 2 * s * s, s3 = s * (3 - 4 * s * s), s4 = 2 * s2 * c2;
    return this.h1 * s + this.h2 * s2 + this.h3 * s3 + this.h4 * s4;
  }
  next() {
    if (this.mood === null) { this.oL = 0; this.oR = 0; return; }
    if (this.counter === 0) this.controlUpdate();
    if (++this.counter >= this.controlInterval) this.counter = 0;
    let padL = 0, padR = 0;
    for (let i = 0; i < 8; i++) {
      const v = this.pads[i];
      if (v.target === 0 && v.gain < 1e-5) continue;
      v.gain += (v.target - v.gain) * this.padCoef;
      const g = v.gain * v.amp;
      const pa = TWO_PI * v.phaseA, pb = TWO_PI * v.phaseB;
      const va = this.harmonics(Math.sin(pa), Math.cos(pa));
      const vb = this.harmonics(Math.sin(pb), Math.cos(pb));
      padL += g * (0.7 * va + 0.3 * vb); padR += g * (0.3 * va + 0.7 * vb);
      v.phaseA += v.incA; if (v.phaseA >= 1) v.phaseA -= 1;
      v.phaseB += v.incB; if (v.phaseB >= 1) v.phaseB -= 1;
    }
    let bellL = 0, bellR = 0;
    for (let j = 0; j < 6; j++) {
      const b = this.bells[j];
      if (!b.active) continue;
      if (b.attacking) { b.env += b.attackStep; if (b.env >= 1) { b.env = 1; b.attacking = false; } }
      else { b.env *= b.decayMul; if (b.env < 1e-4) { b.active = false; continue; } }
      const ph = TWO_PI * b.phase, s = Math.sin(ph);
      const val = (s + 0.4 * s * Math.cos(ph)) * b.env * b.amp;
      bellL += val * (1 - b.pan) * 0.5; bellR += val * (1 + b.pan) * 0.5;
      b.phase += b.inc; if (b.phase >= 1) b.phase -= 1;
    }
    const drone = (0.7 * Math.sin(TWO_PI * this.dronePhase1) + 0.25 * Math.sin(TWO_PI * this.dronePhase2)) * this.droneAmp;
    this.dronePhase1 += this.droneFreq / this.sr; this.dronePhase1 -= Math.floor(this.dronePhase1);
    this.dronePhase2 += this.droneFreq * 1.5 / this.sr; this.dronePhase2 -= Math.floor(this.dronePhase2);
    const pl = padL * 0.12, pr = padR * 0.12, bl = bellL * 0.16, br = bellR * 0.16, dr = drone * 0.22;
    this.reverb.process((pl + pr) * 0.4 + (bl + br) * 0.5 + dr * 0.3);
    this.delay.process((bl + br) * 0.4 + (pl + pr) * 0.08, this.delFb);
    const dry = 1 - 0.4 * this.revMix;
    this.oL = (pl + bl + dr) * dry + this.reverb.oL * this.revMix * 1.2 + this.delay.oL * this.delMix;
    this.oR = (pr + br + dr) * dry + this.reverb.oR * this.revMix * 1.2 + this.delay.oR * this.delMix;
  }
}

// ---------- SynthCore.swift ----------
class LayerRenderer {
  constructor(sr, seed) {
    this.sr = sr; this.tag = 0; this.kind = 'tone'; this.texture = 'off'; this.gain = 0;
    this.f1 = 0; this.f2 = 0; this.rate = 10; this.pa = 0; this.pb = 0; this.pp = 0;
    this.nL = new NoiseSource(seed + 17); this.nR = new NoiseSource(seed + 0x7F4A7C15);
    this.nature = new NatureEngine(sr, seed + 99);
    this.oL = 0; this.oR = 0;
  }
  get silent() { return this.gain < 1e-5; }
  matches(s) { return s.tag === this.tag && s.kind === this.kind && s.texture === this.texture; }
  next(s, glide, smooth, dt) {
    if (!this.matches(s) && this.gain < 1e-4) {
      this.tag = s.tag; this.kind = s.kind; this.texture = s.texture;
      this.f1 = s.f1; this.f2 = s.f2; this.rate = s.rate; this.pa = 0; this.pb = 0; this.pp = 0; this.gain = 0;
    }
    const same = this.matches(s);
    const target = same ? Math.max(0, s.gain) : 0;
    this.gain += (target - this.gain) * smooth;
    if (this.gain < 1e-5) { if (target <= 0) this.gain = 0; this.oL = 0; this.oR = 0; return; }
    if (same) { this.f1 += (s.f1 - this.f1) * glide; this.f2 += (s.f2 - this.f2) * glide; this.rate += (s.rate - this.rate) * glide; }
    let l = 0, r = 0;
    switch (this.kind) {
      case 'tone': { const v = Math.sin(TWO_PI * this.pa) * 0.7; l = v; r = v; this.pa += this.f1 * dt; this.pa -= Math.floor(this.pa); break; }
      case 'binaural':
        l = Math.sin(TWO_PI * this.pa) * 0.7; r = Math.sin(TWO_PI * this.pb) * 0.7;
        this.pa += this.f1 * dt; this.pa -= Math.floor(this.pa); this.pb += this.f2 * dt; this.pb -= Math.floor(this.pb);
        break;
      case 'isochronic': {
        const v = Math.sin(TWO_PI * this.pa) * pulseEnvelope(this.pp, 0.5) * 0.7; l = v; r = v;
        this.pa += this.f1 * dt; this.pa -= Math.floor(this.pa); this.pp += this.rate * dt; this.pp -= Math.floor(this.pp);
        break;
      }
      case 'ambience':
        if (isNature(this.texture)) { this.nature.next(this.texture); l = this.nature.outL; r = this.nature.outR; }
        else { l = this.nL.next(this.texture); r = this.nR.next(this.texture); }
        break;
    }
    const pan = clampN(s.pan, -1, 1);
    if (pan > 0) l *= 1 - pan; else if (pan < 0) r *= 1 + pan;
    this.oL = l * this.gain; this.oR = r * this.gain;
  }
}

const EMPTY_SLOT = { tag: 0, kind: 'tone', f1: 200, f2: 200, rate: 10, texture: 'off', gain: 0, pan: 0 };
function defaultSnapshot() {
  return { running: false, layout: 'single', f1: 432, f2: 432, waveform: 'sine', pulseRate: 10, duty: 0.5, pan: 0, autoPanRate: 0,
    toneLevel: 0.8, noise: 'off', noiseLevel: 0.35, volume: 0.5, timerGain: 1, fadeInSeconds: 2, fadeOutSeconds: 1.5,
    mood: null, musicLevel: 0, layers: [EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT] };
}

class SynthCore {
  constructor(sr) {
    this.sr = sr;
    this.phase1 = 0; this.phase2 = 0; this.pulsePhase = 0; this.panPhase = 0;
    this.f1 = 0; this.f2 = 0; this.gain = 0; this.env = 0;
    this.noiseL = new NoiseSource(0x12345678); this.noiseR = new NoiseSource(0x9E3779B9);
    this.bedNature = new NatureEngine(sr, 0xC0FFEE11); this.bedKind = 'off'; this.bedGain = 0;
    this.music = new MusicEngine(sr); this.musicLevel = 0; this.musicLow = 0; this.musicHighLP = 0;
    this.layers = [new LayerRenderer(sr, 0x1001), new LayerRenderer(sr, 0x2002), new LayerRenderer(sr, 0x3003), new LayerRenderer(sr, 0x4004)];
    this.stats = { peak: 0, rms: 0, mRms: 0, mLow: 0, mHigh: 0, chordSerial: 0, env: 0 };
  }
  // Renders n frames into outL/outR (Float32Array). Returns stats for this block.
  render(p, outL, outR, n) {
    const dt = 1 / this.sr;
    const glide = 1 - Math.exp(-dt / 0.06), gainSmooth = 1 - Math.exp(-dt / 0.12);
    const upStep = dt / Math.max(0.01, p.fadeInSeconds), downStep = dt / Math.max(0.01, p.fadeOutSeconds);
    const targetGain = clampN(p.volume, 0, 1) * clampN(p.timerGain, 0, 1);
    let peak = 0, sumSq = 0;
    const musicTarget = p.mood ? clampN(p.musicLevel, 0, 1) : 0;
    if (p.mood) this.music.setMood(p.mood);
    const lowA = 1 - Math.exp(-TWO_PI * 300 / this.sr), highA = 1 - Math.exp(-TWO_PI * 2000 / this.sr);
    let mSum = 0, mLowSum = 0, mHighSum = 0;
    const bedTarget = p.noise !== 'off' ? clampN(p.noiseLevel, 0, 1) : 0;
    const mixer = p.layout === 'mixer';
    const slots = p.layers, L = this.layers;
    const wf = p.waveform, layout = p.layout, toneLevel = p.toneLevel;

    for (let i = 0; i < n; i++) {
      if (this.env <= 0) {
        if (!p.running) { outL[i] = 0; outR[i] = 0; continue; }
        this.f1 = p.f1; this.f2 = p.f2; this.gain = targetGain; this.musicLevel = musicTarget;
        this.bedKind = p.noise; this.bedGain = bedTarget;
      }
      this.env = p.running ? Math.min(1, this.env + upStep) : Math.max(0, this.env - downStep);
      this.f1 += (p.f1 - this.f1) * glide;
      this.f2 += (p.f2 - this.f2) * glide;
      this.gain += (targetGain - this.gain) * gainSmooth;
      const inc1 = this.f1 * dt, inc2 = this.f2 * dt;
      let l = 0, r = 0;
      switch (layout) {
        case 'single': { const v = oscSample(wf, this.phase1, inc1); l = v; r = v; break; }
        case 'binaural': l = Math.sin(TWO_PI * this.phase1); r = Math.sin(TWO_PI * this.phase2); break;
        case 'monaural': { const v = 0.5 * (Math.sin(TWO_PI * this.phase1) + Math.sin(TWO_PI * this.phase2)); l = v; r = v; break; }
        case 'isochronic': {
          const v = Math.sin(TWO_PI * this.phase1) * pulseEnvelope(this.pulsePhase, p.duty); l = v; r = v;
          this.pulsePhase += p.pulseRate * dt; this.pulsePhase -= Math.floor(this.pulsePhase);
          break;
        }
      }
      this.phase1 += inc1; this.phase1 -= Math.floor(this.phase1);
      this.phase2 += inc2; this.phase2 -= Math.floor(this.phase2);
      if (!mixer) {
        l *= toneLevel; r *= toneLevel;
        let pan = p.pan;
        if (p.autoPanRate > 0) {
          pan = clampN(pan + 0.8 * Math.sin(TWO_PI * this.panPhase), -1, 1);
          this.panPhase += p.autoPanRate * dt; this.panPhase -= Math.floor(this.panPhase);
        }
        if (pan > 0) l *= 1 - pan; else if (pan < 0) r *= 1 + pan;
      }
      // Background bed: a texture change fades out, then in.
      if (p.noise !== this.bedKind && this.bedGain < 1e-4) { this.bedKind = p.noise; this.bedGain = 0; }
      const bt = p.noise === this.bedKind ? bedTarget : 0;
      this.bedGain += (bt - this.bedGain) * gainSmooth;
      if (this.bedGain > 1e-5 && this.bedKind !== 'off') {
        if (isNature(this.bedKind)) { this.bedNature.next(this.bedKind); l += this.bedNature.outL * this.bedGain; r += this.bedNature.outR * this.bedGain; }
        else { l += this.noiseL.next(this.bedKind) * this.bedGain; r += this.noiseR.next(this.bedKind) * this.bedGain; }
      }
      for (let k = 0; k < 4; k++) {
        const s = slots[k] || EMPTY_SLOT, lr = L[k];
        if (s.gain > 0 || !lr.silent) { lr.next(s, glide, gainSmooth, dt); l += lr.oL; r += lr.oR; }
      }
      this.musicLevel += (musicTarget - this.musicLevel) * gainSmooth;
      if (this.musicLevel > 1e-4) {
        this.music.next();
        const sl = this.music.oL * this.musicLevel, sr2 = this.music.oR * this.musicLevel;
        l += sl; r += sr2;
        const mono = 0.5 * (sl + sr2);
        this.musicLow += lowA * (mono - this.musicLow);
        this.musicHighLP += highA * (mono - this.musicHighLP);
        const high = mono - this.musicHighLP;
        mSum += mono * mono; mLowSum += this.musicLow * this.musicLow; mHighSum += high * high;
      }
      const g = this.gain * this.env * this.env;
      const yl = l * g, yr = r * g;
      const a = Math.max(Math.abs(yl), Math.abs(yr));
      if (a > peak) peak = a;
      sumSq += (yl * yl + yr * yr) * 0.5;
      outL[i] = softLimit(yl); outR[i] = softLimit(yr);
    }
    const inv = 1 / Math.max(1, n), st = this.stats;
    st.peak = peak; st.rms = Math.sqrt(sumSq * inv);
    st.mRms = Math.sqrt(mSum * inv); st.mLow = Math.sqrt(mLowSum * inv); st.mHigh = Math.sqrt(mHighSum * inv);
    st.chordSerial = this.music.chordSerial; st.env = this.env;
    return st;
  }
}

// ---------- AudioWorklet wrapper ----------
if (typeof registerProcessor === 'function') {
  class FreqiumProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.core = new SynthCore(sampleRate);
      this.snap = defaultSnapshot();
      this.acc = { peak: 0, rms: 0, mRms: 0, mLow: 0, mHigh: 0, n: 0 };
      this.frames = 0;
      this.wasSilent = true;
      this.port.onmessage = (e) => {
        const m = e.data;
        if (m && m.type === 'snapshot') this.snap = m.snapshot;
      };
    }
    process(inputs, outputs) {
      const out = outputs[0];
      const L = out[0], R = out[1] || out[0];
      const st = this.core.render(this.snap, L, R, L.length);
      const a = this.acc;
      if (st.peak > a.peak) a.peak = st.peak;
      a.rms += st.rms; a.mRms += st.mRms; a.mLow += st.mLow; a.mHigh += st.mHigh; a.n++;
      this.frames += L.length;
      if (this.frames >= 1536) {   // ~30 stats per second
        const k = 1 / Math.max(1, a.n);
        const silent = st.env <= 0;
        if (!(silent && this.wasSilent)) {
          this.port.postMessage({ type: 'stats', peak: a.peak, rms: a.rms * k, mRms: a.mRms * k, mLow: a.mLow * k, mHigh: a.mHigh * k, chordSerial: st.chordSerial, env: st.env });
        }
        this.wasSilent = silent;
        a.peak = 0; a.rms = 0; a.mRms = 0; a.mLow = 0; a.mHigh = 0; a.n = 0; this.frames = 0;
      }
      return true;
    }
  }
  registerProcessor('freqium-synth', FreqiumProcessor);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SynthCore, defaultSnapshot, NatureEngine, MusicEngine, NoiseSource, softLimit, pulseEnvelope, MOOD_MUSIC };
}
if (typeof window !== 'undefined') window.SynthCore = SynthCore;
