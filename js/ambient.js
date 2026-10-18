// Ambient sound bed: generated with Web Audio (no audio files), layered on top of the existing tones on
// its own path to the speakers, so the existing synth is untouched. One sub-graph per type, all summed
// into one level gain; switching type cross-fades the per-type gains (setTargetAtTime, no clicks).
// An AnalyserNode on the ambient sum feeds the visualizers (Amb.level / onset / low / high).
const Amb = {
  ctx: null, out: null, an: null, buf: null, fbuf: null, types: {}, built: false,
  tgt: { level: -1, type: '' },
  level: 0, slow: 0, onset: 0, low: 0, high: 0,
  w: {},              // eased visual weight per type (0..1), cross-fades with the audio
  noise(ctx, kind, sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, br = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'white') d[i] = w * 0.5;
        else if (kind === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else { br = (br + 0.02 * w) / 1.02; d[i] = br * 3.2; }
      }
      // Cross-fade the loop seam (last 50 ms into the first) so the loop point is inaudible.
      const f = Math.floor(ctx.sampleRate * 0.05);
      for (let i = 0; i < f; i++) { const a = i / f; d[n - f + i] = d[n - f + i] * (1 - a) + d[i] * a; }
    }
    return b;
  },
  drops(ctx, sec) {
    const sr = ctx.sampleRate, n = Math.floor(sr * sec), b = ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let k = 0; k < 70; k++) {
        const at = Math.floor(Math.random() * (n - sr * 0.06)), f0 = 1800 + Math.random() * 3200, a = 0.05 + Math.random() * 0.22;
        const len = Math.floor(sr * (0.012 + Math.random() * 0.03));
        for (let i = 0; i < len; i++) { const t = i / sr; d[at + i] += a * Math.sin(TAU * f0 * t * (1 - 0.3 * t / 0.04)) * Math.exp(-t / 0.008); }
      }
    }
    return b;
  },
  src(buf) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(this.ctx.currentTime + Math.random() * 0.01); return s; },
  lfo(freq, depth, param, offset) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.value = freq; g.gain.value = depth;
    o.connect(g); g.connect(param); if (offset != null) param.value = offset; o.start(); return o;
  },
  filt(type, f, q) { const x = this.ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q != null) x.Q.value = q; return x; },
  build(ctx) {
    this.ctx = ctx;
    this.out = ctx.createGain(); this.out.gain.value = 0;
    this.an = ctx.createAnalyser(); this.an.fftSize = 1024; this.an.smoothingTimeConstant = 0.5;
    this.buf = new Float32Array(this.an.fftSize); this.fbuf = new Uint8Array(this.an.frequencyBinCount);
    this.out.connect(ctx.destination); this.out.connect(this.an);
    const W = this.noise(ctx, 'white', 6), P = this.noise(ctx, 'pink', 6), B = this.noise(ctx, 'brown', 6), D = this.drops(ctx, 5);
    const mk = (name, gainOut) => { const g = ctx.createGain(); g.gain.value = 0; g.connect(this.out); this.types[name] = g; gainOut(g); };
    mk('pink', (g) => { const s = this.src(P), v = ctx.createGain(); v.gain.value = 0.9; s.connect(v); v.connect(g); });
    mk('brown', (g) => { const s = this.src(B), f = this.filt('lowpass', 520), v = ctx.createGain(); v.gain.value = 1.1; s.connect(f); f.connect(v); v.connect(g); });
    mk('white', (g) => { const s = this.src(W), f = this.filt('lowpass', 7000), v = ctx.createGain(); v.gain.value = 0.45; s.connect(f); f.connect(v); v.connect(g); });
    mk('waterfall', (g) => {
      const s = this.src(W), bp = this.filt('bandpass', 1300, 0.45), v = ctx.createGain(); v.gain.value = 0.8;
      s.connect(bp); bp.connect(v); v.connect(g);
      const r = this.src(P), lp = this.filt('lowpass', 380), rv = ctx.createGain(); rv.gain.value = 0.9; r.connect(lp); lp.connect(rv); rv.connect(g);
      this.lfo(0.31, 0.12, v.gain);
    });
    mk('rain', (g) => {
      const s = this.src(P), hp = this.filt('highpass', 2200), v = ctx.createGain(); v.gain.value = 0.5; s.connect(hp); hp.connect(v); v.connect(g);
      const d = this.src(D), dv = ctx.createGain(); dv.gain.value = 0.9; d.connect(dv); dv.connect(g);
    });
    mk('ocean', (g) => {
      const s = this.src(B), lp = this.filt('lowpass', 850), v = ctx.createGain(); s.connect(lp); lp.connect(v); v.connect(g);
      this.lfo(0.085, 0.55, v.gain, 0.6);
    });
    mk('wind', (g) => {
      const s = this.src(P), bp = this.filt('bandpass', 520, 1.4), v = ctx.createGain(); s.connect(bp); bp.connect(v); v.connect(g);
      this.lfo(0.055, 300, bp.frequency, 560); this.lfo(0.11, 0.6, v.gain, 1.1);
    });
    mk('drone', (g) => {
      const lp = this.filt('lowpass', 700), v = ctx.createGain(); v.gain.value = 0.16; lp.connect(v); v.connect(g);
      for (const [f, a, ty] of [[55, 1, 'sine'], [82.6, 0.6, 'sine'], [110.3, 0.5, 'sine'], [164.9, 0.18, 'triangle']]) {
        const o = ctx.createOscillator(), og = ctx.createGain(); o.type = ty; o.frequency.value = f; og.gain.value = a; o.connect(og); og.connect(lp); o.start();
      }
      this.lfo(0.07, 0.05, v.gain);
    });
    mk('pads', (g) => {
      const lp = this.filt('lowpass', 900, 0.7), v = ctx.createGain(); v.gain.value = 0.05; lp.connect(v); v.connect(g);
      for (const f of [110, 164.81, 220, 246.94, 329.63]) for (const det of [-6, 5]) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start();
      }
      this.lfo(0.045, 450, lp.frequency, 950);
    });
    this.built = true;
  },
  // Called every frame by the app. playing: the app is sounding; gainMul: session fade / soft start.
  tick(dt, playing, gainMul) {
    const type = VP.get('amb'), lvl = VP.get('ambLevel');
    for (const [k] of AMB_TYPES) {
      if (k === 'off') continue;
      const tw = type === k ? 1 : 0, cur = this.w[k] || 0;
      this.w[k] = cur + (tw - cur) * (1 - Math.exp(-dt / 0.9));   // visual cross-fade ~1 s
    }
    if (!this.built && typeof Snd !== 'undefined' && Snd.ctx && Snd.ready) { try { this.build(Snd.ctx); } catch (e) { this.built = true; this.out = null; } }
    if (this.out) {
      const level = type === 'off' || !playing ? 0 : 0.55 * Math.pow(lvl, 1.4) * gainMul;
      const now = this.ctx.currentTime;
      if (Math.abs(level - this.tgt.level) > 0.002) { this.out.gain.cancelScheduledValues(now); this.out.gain.setTargetAtTime(level, now, 0.35); this.tgt.level = level; }
      if (type !== this.tgt.type) {
        for (const k in this.types) { const g = this.types[k].gain; g.cancelScheduledValues(now); g.setTargetAtTime(k === type ? 1 : 0, now, 0.45); }
        this.tgt.type = type;
      }
      // Analyser: loudness, a slow reference, onsets (fast rise above the slow level) and low/high energy.
      this.an.getFloatTimeDomainData(this.buf);
      let s = 0; for (let i = 0; i < this.buf.length; i += 2) s += this.buf[i] * this.buf[i];
      const rms = Math.sqrt(s / (this.buf.length >> 1));
      this.an.getByteFrequencyData(this.fbuf);
      let lo = 0, hi = 0; const nb = this.fbuf.length;
      for (let i = 1; i < 12; i++) lo += this.fbuf[i]; for (let i = nb >> 3; i < nb >> 1; i++) hi += this.fbuf[i];
      lo /= 11 * 255; hi /= ((nb >> 1) - (nb >> 3)) * 255;
      const norm = Math.min(1.5, rms / 0.12);
      this.level += (norm - this.level) * (1 - Math.exp(-dt / (norm > this.level ? 0.12 : 0.35)));
      this.slow += (this.level - this.slow) * (1 - Math.exp(-dt / 1.6));
      const on = Math.max(0, this.level - this.slow * 1.05);
      this.onset += (on - this.onset) * (1 - Math.exp(-dt / (on > this.onset ? 0.1 : 0.3)));
      this.low += (lo - this.low) * (1 - Math.exp(-dt / 0.2));
      this.high += (hi - this.high) * (1 - Math.exp(-dt / 0.2));
    } else {
      this.level *= Math.exp(-dt / 0.5); this.onset *= Math.exp(-dt / 0.3); this.low *= Math.exp(-dt / 0.5); this.high *= Math.exp(-dt / 0.5);
    }
  },
};
