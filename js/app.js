// Biotone web app: state, audio, pages. Mirrors the SwiftUI app (AppModel, SessionState,
// Preset, ToolsModel, the page views). Pure DOM + Canvas + Web Audio, no dependencies.
'use strict';

// ===================================================================== format
const F = {
  hz: (v) => Number(v).toFixed(2),
  short(v) { const r = Math.round(v * 100) / 100; return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0+$/, ''); },
  step: (s) => (s < 0.1 ? '0.01' : s < 1 ? '0.1' : String(Math.round(s))),
  minutes(m) { const t = Math.round(m); if (t <= 0) return 'Off'; const h = Math.floor(t / 60), mm = t % 60; if (h && mm) return `${h} h ${mm} m`; if (h) return `${h} h`; return `${mm} min`; },
  fade: (s) => (s < 60 ? `${s} s` : `${Math.round(s / 60)} min`),
  pan(p) { if (Math.abs(p) < 0.01) return 'Center'; return p < 0 ? `L ${Math.round(-p * 100)}%` : `R ${Math.round(p * 100)}%`; },
  dur(sec) { const t = Math.max(0, Math.round(sec)); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; const p2 = (x) => String(x).padStart(2, '0'); return h > 0 ? `${h}:${p2(m)}:${p2(s)}` : `${m}:${p2(s)}`; },
  khz: (hz) => (hz >= 1000 ? (hz / 1000).toFixed(2) + ' kHz' : Math.round(hz) + ' Hz'),
  ago(ts) { const s = Math.max(0, (Date.now() - ts) / 1000); if (s < 60) return 'just now'; const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`; const h = Math.floor(m / 60); if (h < 24) return `${h} h ago`; const d = Math.floor(h / 24); return d === 1 ? 'yesterday' : `${d} days ago`; },
  clock(ts) { return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); },
  band(hz) { const b = Math.abs(hz); if (b < 4) return 'Delta'; if (b < 8) return 'Theta'; if (b < 13) return 'Alpha'; if (b < 30) return 'Beta'; return 'Gamma'; },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cl = (v, a, b) => Math.min(b, Math.max(a, v));
const r2 = (v) => Math.round(v * 100) / 100;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ===================================================================== model data
const RANGES = { tone: [1, 22000], carrier: [20, 1500], beat: [0, 100], schumannCarrier: [60, 400], resonanceBeat: [0.5, 45], pulseRate: [0.5, 50], pulseCarrier: [40, 1500] };
const MOODS = [
  { key: 'sleep', label: 'Sleep', carrier: 120, beat: 2, tone: 0.30, music: 0.60 },
  { key: 'rest', label: 'Rest', carrier: 150, beat: 5, tone: 0.32, music: 0.65 },
  { key: 'focus', label: 'Focus', carrier: 200, beat: 16, tone: 0.38, music: 0.50 },
  { key: 'active', label: 'Active', carrier: 220, beat: 20, tone: 0.38, music: 0.55 },
  { key: 'calm', label: 'Calm Down', carrier: 180, beat: 9, tone: 0.32, music: 0.65 },
  { key: 'meditate', label: 'Meditate', carrier: 150, beat: 7.83, tone: 0.35, music: 0.60 },
  // Ten more, chosen from presets common in Brainwave, Insight Timer, myNoise, Moongate and Brain.fm-style apps.
  { key: 'dream', label: 'Dream', carrier: 136, beat: 6, tone: 0.30, music: 0.62, recipe: 'sleep' },
  { key: 'create', label: 'Create', carrier: 210, beat: 10, tone: 0.34, music: 0.55, recipe: 'calm' },
  { key: 'study', label: 'Study', carrier: 190, beat: 14, tone: 0.36, music: 0.48, recipe: 'focus' },
  { key: 'flow', label: 'Flow', carrier: 170, beat: 12, tone: 0.33, music: 0.58, recipe: 'rest' },
  { key: 'spark', label: 'Spark', carrier: 240, beat: 40, tone: 0.36, music: 0.45, recipe: 'active' },
  { key: 'still', label: 'Still', carrier: 100, beat: 1, tone: 0.28, music: 0.55, recipe: 'sleep' },
  { key: 'ease', label: 'Ease', pure: true, hz: 432, tone: 0.40, music: 0.50, recipe: 'meditate' },
  { key: 'glow', label: 'Glow', pure: true, hz: 528, tone: 0.36, music: 0.55, recipe: 'rest' },
  { key: 'release', label: 'Release', pure: true, hz: 396, tone: 0.38, music: 0.52, recipe: 'calm' },
  { key: 'unite', label: 'Unite', pure: true, hz: 639, tone: 0.34, music: 0.50, recipe: 'meditate' },
];
const moodOf = (k) => MOODS.find((m) => m.key === k) || MOODS[0];
const moodLine = (m) => (m.pure ? `${F.hz(m.hz)} Hz tone` : m.key === 'meditate' ? 'Schumann 7.83 Hz' : `${F.band(m.beat)} ${F.hz(m.beat)} Hz`);
const moodBand = moodLine;
const moodMusicKey = (m) => m.recipe || m.key;
const NOISE_LABEL = { off: 'Off', pink: 'Pink', brown: 'Brown', white: 'White', rain: 'Rain', ocean: 'Ocean', wind: 'Wind', stream: 'Stream' };
const isNat = (k) => ['rain', 'ocean', 'wind', 'stream'].includes(k);
const phrase = (k) => (isNat(k) ? NOISE_LABEL[k].toLowerCase() : `${NOISE_LABEL[k].toLowerCase()} noise`);
const ENGINE = { binaural: { label: 'Binaural', hint: 'Stereo headphones: a slightly different tone in each ear.' }, monaural: { label: 'Monaural', hint: 'Both tones in both ears. Works on speakers.' }, isochronic: { label: 'Isochronic', hint: 'One tone pulsing on and off. Works on speakers.' } };
const WAVES = [['sine', 'Sine'], ['square', 'Square'], ['triangle', 'Triangle'], ['sawtooth', 'Saw']];
const LAYER_KIND = { tone: 'Tone', binaural: 'Binaural', isochronic: 'Isochronic', ambience: 'Noise / nature' };
const PAGES = [
  { key: 'moods', title: 'Moods' }, { key: 'tone', title: 'Tone' }, { key: 'binaural', title: 'Binaural' },
  { key: 'schumann', title: 'Schumann 7.83' }, { key: 'pulse', title: 'Isochronic / Monaural' }, { key: 'mixer', title: 'Layers' },
  { key: 'presets', title: 'Presets' }, { key: 'tools', title: 'Tools' }, { key: 'timer', title: 'Timer & Settings' }, { key: 'library', title: 'Library' },
];
const SOURCE_PAGE = { tone: 'tone', binaural: 'binaural', schumann: 'schumann', pulse: 'pulse', mood: 'moods', mixer: 'mixer' };
const SCHUMANN = 7.83;
const APP_BUILD = 'biotone-v12.1'; // keep equal to the sw.js cache version

function makeLayer(kind) {
  const base = { id: uid(), tag: Math.floor(Math.random() * 1e9) + 1000, kind, frequency: 200, beat: 7.83, texture: 'rain', volume: 0.5, pan: 0, muted: false };
  if (kind === 'tone') Object.assign(base, { frequency: 432, volume: 0.4 });
  if (kind === 'binaural') Object.assign(base, { frequency: 200, beat: 7.83, volume: 0.45 });
  if (kind === 'isochronic') Object.assign(base, { frequency: 200, beat: 10, volume: 0.35 });
  if (kind === 'ambience') Object.assign(base, { texture: 'rain', volume: 0.5 });
  return base;
}
function defaultState() {
  return {
    tone: { frequency: 432, waveform: 'sine', pan: 0 },
    binaural: { left: 200, right: 207.83, linked: true, pan: 0, autoPan: false, autoPanRate: 0.05 },
    schumann: { carrier: 200, engine: 'binaural', beat: SCHUMANN, tone: null, shimmer: false, label: null, libraryID: null },
    pulse: { mode: 'isochronic', rate: 10, carrier: 200, duty: 0.5 },
    moods: { selected: 'sleep', levels: {} },
    mixer: { layers: [makeLayer('binaural'), makeLayer('ambience')] },
    noise: 'off', noiseLevel: 0.35, toneLevel: 0.8, volume: 0.5, sessionMinutes: 0, fadeSeconds: 60,
  };
}
const clone = (o) => JSON.parse(JSON.stringify(o));
// Tolerant merge (like SessionState's decoder): unknown or missing keys fall back to defaults.
function mergeState(raw) {
  const d = defaultState();
  if (!raw || typeof raw !== 'object') return d;
  for (const k of ['tone', 'binaural', 'schumann', 'pulse', 'moods']) if (raw[k] && typeof raw[k] === 'object') d[k] = Object.assign(d[k], raw[k]);
  if (raw.mixer && Array.isArray(raw.mixer.layers)) d.mixer.layers = raw.mixer.layers.slice(0, 4).map((l) => Object.assign(makeLayer(l.kind || 'tone'), l));
  for (const k of ['noise', 'noiseLevel', 'toneLevel', 'volume', 'sessionMinutes', 'fadeSeconds']) if (raw[k] !== undefined) d[k] = raw[k];
  if (!NOISE_LABEL[d.noise]) d.noise = 'off';
  const sc = d.schumann;
  sc.carrier = cl(+sc.carrier || 200, ...RANGES.schumannCarrier); sc.beat = cl(+sc.beat || SCHUMANN, ...RANGES.resonanceBeat);
  if (sc.tone != null) sc.tone = cl(+sc.tone, ...RANGES.tone);
  if (!ENGINE[sc.engine]) sc.engine = 'binaural';
  d.volume = cl(+d.volume, 0, 1);
  return d;
}
const moodLevels = (st, k) => Object.assign({ ambience: 'off', ambienceLevel: 0.4 }, (() => { const m = moodOf(k); return { tone: m.tone, music: m.music }; })(), st.moods.levels[k] || {});
const scDefault = (sc) => sc.tone == null && Math.abs(sc.beat - SCHUMANN) < 1e-4 && !sc.label;
const scMain = (sc) => (sc.tone != null ? sc.tone : sc.beat);

function titleFor(st, src) {
  switch (src) {
    case 'tone': return `Tone ${F.hz(st.tone.frequency)} Hz`;
    case 'binaural': return `Binaural · beat ${F.hz(Math.abs(st.binaural.right - st.binaural.left))} Hz`;
    case 'schumann': return scDefault(st.schumann) ? 'Schumann 7.83 Hz' : `${st.schumann.label || 'Resonance'} · ${F.short(scMain(st.schumann))} Hz`;
    case 'pulse': return `${ENGINE[st.pulse.mode].label} ${F.hz(st.pulse.rate)} Hz`;
    case 'mood': { const m = moodOf(st.moods.selected); return `${m.label} · ${moodBand(m)}`; }
    case 'mixer': { const n = audibleLayers(st).length; return `Layers · ${n} ${n === 1 ? 'layer' : 'layers'}`; }
  }
  return '';
}
const layerSummary = (L) => ({ tone: `tone ${F.hz(L.frequency)}`, binaural: `binaural ${F.hz(L.frequency)} + ${F.hz(L.beat)}`, isochronic: `isochronic ${F.hz(L.beat)} Hz`, ambience: phrase(L.texture) }[L.kind]);
const audibleLayers = (st) => st.mixer.layers.filter((l) => !l.muted && l.volume > 0.001);
function detailFor(st, src) {
  let s = '';
  switch (src) {
    case 'tone': s = WAVES.find((w) => w[0] === st.tone.waveform)[1]; break;
    case 'binaural': s = `L ${F.hz(st.binaural.left)} | R ${F.hz(st.binaural.right)} Hz`; break;
    case 'schumann': {
      const sc = st.schumann;
      if (sc.tone != null) s = `Pure tone ${F.hz(sc.tone)} Hz` + (sc.shimmer ? ' + 7.83 shimmer' : '');
      else if (Math.abs(sc.beat - SCHUMANN) < 1e-4) s = `${ENGINE[sc.engine].label} on ${F.hz(sc.carrier)} Hz`;
      else s = `${ENGINE[sc.engine].label} ${F.short(sc.beat)} Hz on ${F.hz(sc.carrier)} Hz`;
      break;
    }
    case 'pulse': s = `on ${F.hz(st.pulse.carrier)} Hz`; break;
    case 'mood': {
      const m = moodOf(st.moods.selected), lv = moodLevels(st, m.key);
      s = (m.pure ? `Tone ${F.hz(m.hz)} Hz` : `Binaural on ${F.hz(m.carrier)} Hz`) + (lv.music > 0.001 ? ' + music' : ', tone only');
      if (lv.ambience !== 'off') s += ` + ${phrase(lv.ambience)}`;
      return s;
    }
    case 'mixer': { const a = audibleLayers(st); return a.length ? a.map(layerSummary).join(' · ') : 'All layers muted'; }
  }
  if (st.noise !== 'off') s += ` + ${phrase(st.noise)}`;
  return s;
}
function needsHeadphones(st, src) {
  if (src === 'binaural') return true;
  if (src === 'mood') return !moodOf(st.moods.selected).pure;
  if (src === 'schumann') return st.schumann.tone == null && st.schumann.engine === 'binaural';
  if (src === 'mixer') return st.mixer.layers.some((l) => l.kind === 'binaural' && !l.muted && l.volume > 0.001);
  return false;
}

// ===================================================================== app state
// Storage keys keep the old 'freqium.' prefix on purpose: same github.io origin, so settings carry over to /biotone/.
const LS = { state: 'freqium.state.v1', app: 'freqium.app.v1', hearing: 'freqium.hearing.v1', tip: 'freqium.tip.v1', intro: 'freqium.intro.v1' };
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const A = {
  state: mergeState(load(LS.state, null)),
  activeSource: 'mood', isPlaying: false, page: 'moods', activePresetName: null,
  favorites: [], recents: [], presets: [], a4: 440, keepAwake: false,
  timerEnd: null, timerGain: 1,
  tool: null, toolStarted: false,
  stats: { peak: 0, rms: 0, mRms: 0, mLow: 0, mHigh: 0, chordSerial: 0, env: 0 },
  level: 0, duck: 1, soft: 1,
};
// The spoken welcome is postponed: the code stays, flip this to bring it back.
const INTRO_ENABLED = false;
// Level of the automatic Schumann start on open (pressing Play yourself restores full level).
const AUTOSTART_SOFT = 0.5;
(function loadApp() {
  const a = load(LS.app, {});
  A.activeSource = SOURCE_PAGE[a.activeSource] ? a.activeSource : 'mood';
  A.favorites = Array.isArray(a.favorites) ? a.favorites : [];
  A.recents = Array.isArray(a.recents) ? a.recents.map((r) => Object.assign(r, { state: mergeState(r.state) })) : [];
  A.presets = Array.isArray(a.presets) ? a.presets.map((p) => Object.assign(p, { state: mergeState(p.state) })) : [];
  A.a4 = a.a4 === 432 ? 432 : 440;
  A.keepAwake = !!a.keepAwake;
  A.activePresetName = a.activePresetName || null;
})();
let saveT = 0;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try {
      localStorage.setItem(LS.state, JSON.stringify(A.state));
      localStorage.setItem(LS.app, JSON.stringify({ activeSource: A.activeSource, favorites: A.favorites, recents: A.recents, presets: A.presets, a4: A.a4, keepAwake: A.keepAwake, activePresetName: A.activePresetName }));
    } catch (e) { /* storage full or private mode: keep running */ }
  }, 300);
}

// ===================================================================== snapshot (AppModel.snapshot)
const EMPTY = { tag: 0, kind: 'tone', f1: 200, f2: 200, rate: 10, texture: 'off', gain: 0, pan: 0 };
function snapshot() {
  const st = A.state;
  const s = { running: false, layout: 'single', f1: 432, f2: 432, waveform: 'sine', pulseRate: 10, duty: 0.5, pan: 0, autoPanRate: 0,
    toneLevel: st.toneLevel, noise: st.noise, noiseLevel: st.noiseLevel, volume: st.volume * A.duck * A.soft, timerGain: A.timerGain,
    fadeInSeconds: 2, fadeOutSeconds: 1.5, mood: null, musicLevel: 0, layers: [EMPTY, EMPTY, EMPTY, EMPTY] };
  if (A.tool) {
    const t = A.tool;
    return Object.assign(s, { running: A.toolStarted, layout: t.pulsed ? 'isochronic' : 'single', f1: t.frequency, f2: t.frequency, pulseRate: 2.5, duty: 0.55,
      pan: t.pan, toneLevel: t.level, noise: 'off', timerGain: 1, fadeInSeconds: 0.3, fadeOutSeconds: 0.25 });
  }
  s.running = A.isPlaying;
  switch (A.activeSource) {
    case 'tone': Object.assign(s, { layout: 'single', f1: st.tone.frequency, f2: st.tone.frequency, waveform: st.tone.waveform, pan: st.tone.pan }); break;
    case 'binaural': { const b = st.binaural; Object.assign(s, { layout: 'binaural', f1: b.left, f2: b.right, pan: b.pan, autoPanRate: b.autoPan ? b.autoPanRate : 0 }); break; }
    case 'schumann': {
      const sc = st.schumann, c = sc.carrier;
      if (sc.tone != null) {
        Object.assign(s, { layout: 'single', waveform: 'sine', f1: sc.tone, f2: sc.tone, pan: 0 });
        if (sc.shimmer) s.layers = [{ tag: 783, kind: 'binaural', f1: c, f2: c + SCHUMANN, rate: 10, texture: 'off', gain: cl(st.toneLevel * 0.3, 0, 1), pan: 0 }, EMPTY, EMPTY, EMPTY];
      } else {
        s.f1 = c; s.f2 = c + sc.beat;
        if (sc.engine === 'binaural') s.layout = 'binaural';
        else if (sc.engine === 'monaural') s.layout = 'monaural';
        else Object.assign(s, { layout: 'isochronic', f2: c, pulseRate: sc.beat, duty: 0.5 });
      }
      break;
    }
    case 'mood': {
      const m = moodOf(st.moods.selected), lv = moodLevels(st, m.key);
      const music = moodMusicKey(m);
      if (m.pure) Object.assign(s, { layout: 'single', waveform: 'sine', f1: m.hz, f2: m.hz, toneLevel: lv.tone, mood: music, musicLevel: lv.music, noise: lv.ambience, noiseLevel: lv.ambienceLevel });
      else Object.assign(s, { layout: 'binaural', f1: m.carrier, f2: m.carrier + m.beat, toneLevel: lv.tone, mood: music, musicLevel: lv.music, noise: lv.ambience, noiseLevel: lv.ambienceLevel });
      break;
    }
    case 'mixer': {
      s.layout = 'mixer'; s.noise = 'off';
      const L = st.mixer.layers;
      s.layers = [0, 1, 2, 3].map((i) => {
        const l = L[i]; if (!l) return EMPTY;
        return { tag: l.tag, kind: l.kind, f1: l.frequency, f2: l.kind === 'binaural' ? l.frequency + l.beat : l.frequency, rate: l.beat,
          texture: l.kind === 'ambience' ? (l.texture === 'off' ? 'pink' : l.texture) : 'off', gain: l.muted ? 0 : cl(l.volume, 0, 1), pan: l.pan };
      });
      const first = L.find((l) => !l.muted && l.kind !== 'ambience');
      s.f1 = first ? first.frequency : 200;
      break;
    }
    case 'pulse': {
      const p = st.pulse; s.f1 = p.carrier;
      if (p.mode === 'monaural') Object.assign(s, { layout: 'monaural', f2: p.carrier + p.rate });
      else Object.assign(s, { layout: 'isochronic', f2: p.carrier, pulseRate: p.rate, duty: p.duty });
      break;
    }
  }
  return s;
}

// ===================================================================== audio
const Snd = {
  ctx: null, node: null, anL: null, anR: null, bufL: null, bufR: null, ready: false, starting: null, fallback: false,
  silentEl: null,
  // Must be called from a user gesture (iOS). Creates/resumes the AudioContext.
  unlock() {
    if (navigator.audioSession) { try { navigator.audioSession.type = 'playback'; } catch (e) {} }
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { banner('This browser has no Web Audio support.'); return Promise.resolve(false); }
      try { this.ctx = new AC({ latencyHint: 'playback' }); } catch (e) { this.ctx = new AC(); }
      this.ctx.onstatechange = () => { if (this.ctx.state !== 'running' && (A.isPlaying || A.toolStarted)) banner('Audio paused by the system. Tap ▶ to resume.', 4000); };
      // Older iOS without navigator.audioSession: a silent looping media element puts the page in
      // "playback" mode so the ringer switch doesn't mute it.
      if (!navigator.audioSession) this.playSilent();
    }
    const resumed = this.ctx.resume ? this.ctx.resume().catch(() => {}) : Promise.resolve();
    if (!this.starting) this.starting = this.build();
    return Promise.all([resumed, this.starting]).then(() => this.ready);
  },
  playSilent() {
    try {
      // 0.5 s of 8 kHz mono silence as a WAV data URI.
      const n = 4000, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
      const w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
      b.fill(128, 44);
      let bin = ''; for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
      const el = document.createElement('audio');
      el.setAttribute('playsinline', ''); el.loop = true; el.src = 'data:audio/wav;base64,' + btoa(bin);
      el.play().catch(() => {});
      this.silentEl = el;
    } catch (e) {}
  },
  async build() {
    const ctx = this.ctx;
    const split = ctx.createChannelSplitter(2);
    this.anL = ctx.createAnalyser(); this.anR = ctx.createAnalyser();
    this.anL.fftSize = 4096; this.anR.fftSize = 4096;
    this.bufL = new Float32Array(4096); this.bufR = new Float32Array(4096);
    split.connect(this.anL, 0); split.connect(this.anR, 1);
    try {
      if (!ctx.audioWorklet) throw new Error('no worklet');
      await ctx.audioWorklet.addModule('js/synth.js');
      this.node = new AudioWorkletNode(ctx, 'biotone-synth', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      this.node.port.onmessage = (e) => { if (e.data && e.data.type === 'stats') onStats(e.data); };
    } catch (e) {
      // Fallback for browsers without AudioWorklet: the same synth on the main thread.
      await new Promise((res, rej) => { if (window.SynthCore) return res(); const s = document.createElement('script'); s.src = 'js/synth.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      const core = new window.SynthCore(ctx.sampleRate);
      const sp = ctx.createScriptProcessor(2048, 0, 2);
      let acc = 0;
      sp.onaudioprocess = (ev) => {
        const L = ev.outputBuffer.getChannelData(0), R = ev.outputBuffer.getChannelData(1);
        const st = core.render(this.fallbackSnap || snapshot(), L, R, L.length);
        if (++acc % 1 === 0) onStats({ peak: st.peak, rms: st.rms, mRms: st.mRms, mLow: st.mLow, mHigh: st.mHigh, chordSerial: st.chordSerial, env: st.env });
      };
      this.node = sp; this.fallback = true;
    }
    this.node.connect(ctx.destination);
    this.node.connect(split);
    // Analyser on the master output (the mix that feeds the speakers: tone, beat, and bed).
    // Downmixed to mono so both ears count. The tap is not connected onward to the speakers.
    const tap = ctx.createGain();
    tap.channelCount = 1;
    tap.channelCountMode = 'explicit';
    tap.channelInterpretation = 'speakers';
    this.anBreath = ctx.createAnalyser();
    this.anBreath.fftSize = 1024;
    this.anBreath.smoothingTimeConstant = 0.62;
    this.anBreath.minDecibels = -88;
    this.anBreath.maxDecibels = -18;
    this.breathBuf = new Float32Array(this.anBreath.fftSize);
    this.freqBuf = new Uint8Array(this.anBreath.frequencyBinCount);
    this.bandLo = new Uint16Array(VIS_BANDS);
    this.bandHi = new Uint16Array(VIS_BANDS);
    prepSpectrumEdges(ctx.sampleRate, this.anBreath.fftSize, this.bandLo, this.bandHi);
    this.node.connect(tap);
    tap.connect(this.anBreath);
    this.ready = true;
    this.push();
    return true;
  },
  push() {
    if (!this.ready) return;
    const s = snapshot();
    if (this.fallback) this.fallbackSnap = s; else this.node.port.postMessage({ type: 'snapshot', snapshot: s });
  },
  get sampleRate() { return this.ctx ? this.ctx.sampleRate : 48000; },
};
let pushQueued = false;
function pushAudio() {
  if (pushQueued) return;
  pushQueued = true;
  // Microtask: coalesce several edits in one handler, but stay fast while dragging.
  Promise.resolve().then(() => { pushQueued = false; Snd.push(); });
}
function onStats(m) {
  Object.assign(A.stats, m);
}

// ===================================================================== playback
const isPlayingSource = (src) => A.isPlaying && !A.tool && A.activeSource === src;
function play(src, opts) {
  A.soft = opts && opts.soft ? AUTOSTART_SOFT : 1;
  if (A.tool) stopTool(true);
  const was = A.isPlaying && A.activeSource === src;
  A.activeSource = src; A.isPlaying = true;
  if (!was) startTimer();
  recordRecent();
  Snd.unlock().then(() => pushAudio());
  pushAudio(); afterPlayChange();
}
function stop() {
  A.isPlaying = false; A.timerEnd = null; A.timerGain = 1;
  pushAudio(); afterPlayChange();
}
function playOrStop(src) { if (isPlayingSource(src)) stop(); else play(src); }
function toggle() { if (A.tool) { Tools.cancel(); return; } if (A.isPlaying) stop(); else play(A.activeSource); }
function afterPlayChange() {
  save(); renderAll(); updateMediaSession(); updateWakeLock();
}
// Selecting a source while something else plays switches to it (the Switch button).
function edited(src, keepName) {
  if (!keepName && src) A.activePresetName = null;
  pushAudio(); save();
}
function startTimer() {
  const m = A.state.sessionMinutes;
  A.timerEnd = m > 0 ? Date.now() + m * 60000 : null; A.timerGain = 1;
}
let swReloadPending = false;
function timerTick() {
  if (swReloadPending && !A.isPlaying && !A.toolStarted && !document.querySelector('.sheet')) { swReloadPending = false; location.reload(); return; }
  if (A.isPlaying && A.timerEnd) {
    const rem = (A.timerEnd - Date.now()) / 1000, fade = A.state.fadeSeconds;
    const g = rem <= 0 ? 0 : rem < fade ? rem / fade : 1;
    if (Math.abs(g - A.timerGain) > 0.002) { A.timerGain = g; pushAudio(); }
    if (rem <= 0) { stop(); return; }
  }
  updateMiniTimer();
  if (A.page === 'timer') updateTimerReadout();
}
function recordRecent() {
  if (A.tool) return;
  const name = A.activePresetName || titleFor(A.state, A.activeSource);
  const item = { id: uid(), name, source: A.activeSource, state: clone(A.state), date: Date.now() };
  A.recents = [item].concat(A.recents.filter((r) => !(r.name === name && r.source === item.source))).slice(0, 8);
}

// ---------------------------------------------------------- presets / favorites
const STARTERS = (() => {
  const list = [];
  const make = (name, source, edit) => { const s = defaultState(); edit(s); list.push({ id: 'starter:' + name, name, source, state: s, builtIn: true }); };
  make('Delta 2 Hz · binaural', 'binaural', (s) => { s.binaural.left = 150; s.binaural.right = 152; s.sessionMinutes = 480; s.fadeSeconds = 300; s.noise = 'brown'; s.noiseLevel = 0.25; });
  make('Theta 6 Hz · binaural', 'binaural', (s) => { s.binaural.left = 200; s.binaural.right = 206; s.sessionMinutes = 30; });
  make('Alpha 10 Hz · binaural', 'binaural', (s) => { s.binaural.left = 200; s.binaural.right = 210; s.sessionMinutes = 20; });
  make('Schumann 7.83 Hz', 'schumann', (s) => { s.schumann.engine = 'binaural'; s.sessionMinutes = 30; });
  make('Schumann 7.83 Hz · speaker + brown noise', 'schumann', (s) => { s.schumann.engine = 'isochronic'; s.noise = 'brown'; s.noiseLevel = 0.3; s.sessionMinutes = 480; s.fadeSeconds = 300; });
  make('Schumann 7.83 Hz · ocean', 'schumann', (s) => { s.schumann.engine = 'binaural'; s.noise = 'ocean'; s.noiseLevel = 0.45; s.toneLevel = 0.55; s.sessionMinutes = 60; s.fadeSeconds = 180; });
  make('Rain + delta 2 Hz · layers', 'mixer', (s) => { s.mixer.layers = [Object.assign(makeLayer('binaural'), { frequency: 120, beat: 2, volume: 0.4 }), Object.assign(makeLayer('ambience'), { texture: 'rain', volume: 0.55 })]; s.sessionMinutes = 480; s.fadeSeconds = 300; });
  make('Stream + alpha 10 Hz + wind · layers', 'mixer', (s) => { s.mixer.layers = [Object.assign(makeLayer('binaural'), { frequency: 200, beat: 10, volume: 0.4 }), Object.assign(makeLayer('ambience'), { texture: 'stream', volume: 0.45, pan: -0.3 }), Object.assign(makeLayer('ambience'), { texture: 'wind', volume: 0.25, pan: 0.3 })]; s.sessionMinutes = 30; });
  make('Gamma 40 Hz · isochronic', 'pulse', (s) => { s.pulse.mode = 'isochronic'; s.pulse.rate = 40; s.pulse.carrier = 300; s.sessionMinutes = 20; });
  make('432 Hz tone', 'tone', (s) => { s.tone.frequency = 432; s.sessionMinutes = 15; });
  for (const hz of [174, 285, 396, 417, 528, 639, 741, 852, 963]) make(`Solfeggio ${hz} Hz`, 'tone', (s) => { s.tone.frequency = hz; s.sessionMinutes = 15; });
  return list;
})();
const presetSummary = (p) => detailFor(p.state, p.source) + (p.state.sessionMinutes > 0 ? ` · ${F.minutes(p.state.sessionMinutes)}` : '');
const isFav = (key) => A.favorites.includes(key);
function toggleFav(key) { A.favorites = isFav(key) ? A.favorites.filter((k) => k !== key) : [key].concat(A.favorites); save(); }
function applyPreset(p, opts = {}) {
  const keepVolume = p.builtIn || opts.keepVolume;
  const vol = A.state.volume;
  const s = mergeState(clone(p.state));
  if (keepVolume) s.volume = vol;
  // Fresh tags so the engine crossfades instead of reusing old layer identities.
  s.mixer.layers.forEach((l) => { l.tag = Math.floor(Math.random() * 1e9) + 1000; });
  A.state = s;
  if (A.tool) stopTool(true);
  A.activeSource = p.source;
  A.activePresetName = p.name;
  if (A.isPlaying) startTimer();
  pushAudio(); save();
}
function savePreset(name) {
  A.presets.unshift({ id: uid(), name, source: A.activeSource, state: clone(A.state), builtIn: false, date: Date.now() });
  save();
}

// ---------------------------------------------------------- library (Library.swift)
const tradLabel = (e) => LIBRARY_TRADITIONS[e.trad] || e.trad;
const libTitle = (e) => `${e.use} · ${F.short(e.hz)} Hz`;
const isBeat = (e) => e.hz <= 40;
const LIB_CATS = ['wellbeing', 'mind', 'sleep', 'mood', 'body', 'cosmic'].filter((c) => (typeof LIBRARY_CATEGORIES !== 'undefined' && LIBRARY_CATEGORIES[c]));
const catLabel = (c) => (typeof LIBRARY_CATEGORIES !== 'undefined' && LIBRARY_CATEGORIES[c]) || c;
const catCount = (c) => LIBRARY.filter((e) => e.cat === c).length;
const fold = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function libFilter(q, list = LIBRARY) {
  q = q.trim(); if (!q) return list;
  const lower = q.toLowerCase();
  const numeric = lower.endsWith('hz') ? lower.slice(0, -2).trim() : lower;
  const isNum = numeric.length > 0 && /^[0-9.,]+$/.test(numeric);
  const num = numeric.replace(/,/g, '.');
  return list.filter((e) => {
    if (isNum) return F.short(e.hz).startsWith(num) || e.hz.toFixed(2).startsWith(num);
    const hay = fold(`${e.use} ${tradLabel(e)} ${e.keywords} ${F.short(e.hz)}`);
    return q.split(/\s+/).every((w) => hay.includes(fold(w)));
  });
}
function libSections(list) {
  const sorted = list.slice().sort((a, b) => a.use.localeCompare(b.use, 'en', { sensitivity: 'base' }));
  const out = [];
  for (const e of sorted) {
    const c = fold(e.use)[0] || '#'; const letter = /[a-z]/.test(c) ? c.toUpperCase() : '#';
    if (!out.length || out[out.length - 1].letter !== letter) out.push({ letter, entries: [] });
    out[out.length - 1].entries.push(e);
  }
  return out;
}
function playLibrary(e) {
  const sc = A.state.schumann;
  if (isBeat(e)) { sc.tone = null; sc.beat = cl(e.hz, ...RANGES.resonanceBeat); }
  else { sc.tone = cl(e.hz, ...RANGES.tone); sc.beat = SCHUMANN; }
  sc.label = e.use; sc.libraryID = e.id;
  A.activePresetName = libTitle(e);
  play('schumann');
  goTo('schumann');
}
function resetResonance() {
  const sc = A.state.schumann;
  sc.beat = SCHUMANN; sc.tone = null; sc.label = null; sc.libraryID = null;
  if (A.activeSource === 'schumann') A.activePresetName = null;
  edited(null); renderPage('schumann'); renderMini();
}
function libraryPreset(e) {
  const s = clone(A.state); const sc = s.schumann;
  if (isBeat(e)) { sc.tone = null; sc.beat = e.hz; } else { sc.tone = e.hz; sc.beat = SCHUMANN; }
  sc.label = e.use; sc.libraryID = e.id;
  return { id: 'library:' + e.id, name: libTitle(e), source: 'schumann', state: s, builtIn: true, libraryID: e.id };
}

// ---------------------------------------------------------- tools (ToolsModel.swift)
const Tools = {
  ear: 'both', sweep: null, frequency: 1000, speaker: null, side: 0, alt: true, t0: 0, timer: 0,
  results: load(LS.hearing, {}),
  HIGH: { start: 1000, end: 20000, secs: 32 }, LOW: { start: 250, end: 20, secs: 22 },
  earPan: (e) => ({ both: 0, left: -1, right: 1 }[e]),
  signal() {
    const side = this.ear === 'both' ? '' : ` · ${this.ear}`;
    return { title: `Hearing test · ${F.khz(this.frequency)}${side}`, frequency: this.frequency, pan: this.earPan(this.ear), pulsed: false, level: this.sweep === 'high' ? 0.3 : 0.45 };
  },
  startSweep(kind) {
    this.stopSpeaker(true);
    this.sweep = kind; this.t0 = performance.now();
    this.frequency = kind === 'high' ? this.HIGH.start : this.LOW.start;
    startTool(this.signal());
    this.run();
  },
  run() { clearInterval(this.timer); this.timer = setInterval(() => this.tick(), 33); },
  tick() {
    const el = (performance.now() - this.t0) / 1000;
    if (this.speaker === 'alternate') {
      if (el >= 0.9) { this.t0 = performance.now(); this.alt = !this.alt; this.side = this.alt ? -1 : 1; updateTool(this.speakerSignal('alternate')); renderPage('tools'); }
      return;
    }
    if (!this.sweep) return;
    const R = this.sweep === 'high' ? this.HIGH : this.LOW;
    const x = Math.min(1, el / R.secs);
    this.frequency = R.start * Math.pow(R.end / R.start, x);
    if (x >= 1) { this.record(true); this.finish(); return; }
    updateTool(this.signal());
    updateToolsReadout();
  },
  cantHear() { if (!this.sweep) return; this.record(false); this.finish(); },
  record(open) {
    const r = this.results[this.ear] || {};
    const f = Math.round(this.frequency * 10) / 10;
    if (this.sweep === 'high') { r.high = f; r.highOpen = open; } else { r.low = f; r.lowOpen = open; }
    r.date = Date.now(); this.results[this.ear] = r;
    try { localStorage.setItem(LS.hearing, JSON.stringify(this.results)); } catch (e) {}
  },
  finish() { clearInterval(this.timer); this.sweep = null; stopTool(); renderPage('tools'); },
  cancel() { clearInterval(this.timer); this.sweep = null; this.speaker = null; stopTool(); renderPage('tools'); },
  externalStop() { clearInterval(this.timer); this.sweep = null; this.speaker = null; },
  clear() { this.results = {}; try { localStorage.removeItem(LS.hearing); } catch (e) {} renderPage('tools'); },
  toggleSpeaker(s) {
    if (this.speaker === s) { this.stopSpeaker(); return; }
    if (this.sweep) { clearInterval(this.timer); this.sweep = null; }
    this.speaker = s; this.alt = true; this.t0 = performance.now();
    const sig = this.speakerSignal(s); this.side = sig.pan;
    startTool(sig);
    if (s === 'alternate') this.run(); else clearInterval(this.timer);
    renderPage('tools');
  },
  stopSpeaker(silent) { if (!this.speaker) return; clearInterval(this.timer); this.speaker = null; if (!silent) { stopTool(); renderPage('tools'); } },
  speakerSignal(s) {
    const pan = { left: -1, right: 1, both: 0 }[s] ?? (this.alt ? -1 : 1);
    return { title: `Speaker check · ${pan < 0 ? 'left' : pan > 0 ? 'right' : 'both sides'}`, frequency: 523.25, pan, pulsed: true, level: 0.45 };
  },
};
function startTool(sig) {
  if (A.isPlaying) { A.isPlaying = false; A.timerEnd = null; A.timerGain = 1; }
  A.tool = sig; A.toolStarted = true;
  Snd.unlock().then(() => pushAudio());
  pushAudio(); renderMini(); renderAll();
}
function updateTool(sig) { A.tool = sig; pushAudio(); renderMini(); }
function stopTool(silent) {
  A.toolStarted = false; pushAudio();
  // Let the short fade-out finish before dropping the tool snapshot.
  const t = A.tool;
  setTimeout(() => { if (A.tool === t && !A.toolStarted) { A.tool = null; pushAudio(); } }, 400);
  if (!silent) Tools.externalStop();
  renderMini(); if (!silent) renderAll();
}
// Leaving the Tools page stops test signals (like the app).
function onPageChange(prev, next) {
  if (next === 'moods') setTimeout(revealSelectedMood, 150); // after the pager has settled and the page is laid out
  if (prev === 'tools' && next !== 'tools' && (Tools.sweep || Tools.speaker)) Tools.cancel();
  if (prev === 'library') { const i = document.getElementById('libq'); if (i) i.blur(); }
}

// ---------------------------------------------------------- media session / wake lock
// Scroll the inline mood window just enough to show the selected tile (page entry and launch only, never on tap).
function revealSelectedMood() {
  const win = document.querySelector('#page-moods .moodwin'); if (!win) return;
  const t = win.querySelector('.tile.sel'); if (!t) return;
  const wr = win.getBoundingClientRect(), tr = t.getBoundingClientRect();
  if (tr.top < wr.top) win.scrollTop -= wr.top - tr.top + 6;
  else if (tr.bottom > wr.bottom) win.scrollTop += tr.bottom - wr.bottom + 6;
  moodScrollTop = win.scrollTop;
}
function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: A.activePresetName || titleFor(A.state, A.activeSource), artist: 'Biotone', album: detailFor(A.state, A.activeSource),
      artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
    navigator.mediaSession.playbackState = A.isPlaying ? 'playing' : 'paused';
    navigator.mediaSession.setActionHandler('play', () => { if (!A.isPlaying) play(A.activeSource); });
    navigator.mediaSession.setActionHandler('pause', () => { if (A.isPlaying) stop(); });
    navigator.mediaSession.setActionHandler('stop', () => { if (A.isPlaying) stop(); });
  } catch (e) {}
}
let wakeLock = null;
async function updateWakeLock() {
  const want = A.keepAwake && (A.isPlaying || A.toolStarted) && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    if (!want && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}

// ===================================================================== controls registry
// Every numeric control: get/set, range, text and keypad options. Ids are used in data-* attributes.
const STEPS = [0.01, 0.1, 1, 10];
const stepOf = { 'tone.f': 1, 'bin.base': 0.1, 'bin.beat': 0.1, 'bin.left': 0.1, 'bin.right': 0.1, 'pulse.rate': 1 };
function ctrl(id) {
  const st = A.state, b = st.binaural;
  const parts = id.split('.');
  const pct = (v) => `${Math.round(v * 100)}%`;
  switch (id) {
    case 'tone.f': return { get: () => st.tone.frequency, set: (v) => { st.tone.frequency = v; }, range: RANGES.tone, src: 'tone', title: 'Tone frequency', piano: true };
    case 'tone.pan': return { get: () => st.tone.pan, set: (v) => { st.tone.pan = v; }, range: [-1, 1], src: 'tone', text: F.pan, pan: true };
    case 'bin.base': return { get: () => b.left, set: (v) => { const beat = b.right - b.left; b.left = v; b.right = cl(r2(v + beat), ...RANGES.carrier); }, range: RANGES.carrier, src: 'binaural', title: 'Base (left ear)', piano: true };
    case 'bin.beat': return { get: () => r2(b.right - b.left), set: (v) => { b.right = cl(r2(b.left + v), ...RANGES.carrier); }, range: RANGES.beat, src: 'binaural', title: 'Beat' };
    case 'bin.left': return { get: () => b.left, set: (v) => { b.left = v; }, range: RANGES.carrier, src: 'binaural', title: 'Left ear', piano: true };
    case 'bin.right': return { get: () => b.right, set: (v) => { b.right = v; }, range: RANGES.carrier, src: 'binaural', title: 'Right ear', piano: true };
    case 'bin.pan': return { get: () => b.pan, set: (v) => { b.pan = v; }, range: [-1, 1], src: 'binaural', text: F.pan, pan: true };
    case 'bin.apr': return { get: () => b.autoPanRate, set: (v) => { b.autoPanRate = v; }, range: [0.02, 0.5], src: 'binaural', text: (v) => `one sweep every ${Math.round(1 / v)} s` };
    // v12 shared visual mix (js/vizParams.js): the same values drive page 1 and page 4.
    case 'viz.layers': return { get: () => VP.get('layers'), set: (v) => VP.set('layers', Math.round(v)), range: VIZ_RANGES.layers, src: '*', step: 1, text: (v) => String(Math.round(v)), title: 'Extra layers' };
    case 'viz.circles': return { get: () => VP.get('circles'), set: (v) => VP.set('circles', Math.round(v)), range: VIZ_RANGES.circles, src: '*', step: 1, text: (v) => String(Math.round(v)), title: 'Circles' };
    case 'viz.spin': return { get: () => VP.get('spin'), set: (v) => VP.set('spin', Math.round(v * 100) / 100), range: VIZ_RANGES.spin, src: '*', text: (v) => '×' + (+v).toFixed(2) };
    case 'viz.cspeed': return { get: () => VP.get('cspeed'), set: (v) => VP.set('cspeed', Math.round(v * 100) / 100), range: VIZ_RANGES.cspeed, src: '*', text: (v) => '×' + (+v).toFixed(2) };
    case 'viz.ambLevel': return { get: () => VP.get('ambLevel'), set: (v) => VP.set('ambLevel', Math.round(v * 100) / 100), range: VIZ_RANGES.ambLevel, src: '*', text: pct };
    case 'sch.carrier': return { get: () => st.schumann.carrier, set: (v) => { st.schumann.carrier = v; }, range: RANGES.schumannCarrier, src: 'schumann', title: 'Carrier', step: 1 };
    case 'sch.main': {
      const sc = st.schumann;
      return { get: () => scMain(sc), set: (v) => { if (sc.tone != null) sc.tone = v; else sc.beat = v; sc.label = null; sc.libraryID = null; },
        range: sc.tone != null ? RANGES.tone : RANGES.resonanceBeat, src: 'schumann', text: F.short, title: sc.tone != null ? 'Resonance tone' : 'Resonance beat', piano: sc.tone != null };
    }
    case 'pulse.rate': return { get: () => st.pulse.rate, set: (v) => { st.pulse.rate = v; }, range: RANGES.pulseRate, src: 'pulse', title: st.pulse.mode === 'monaural' ? 'Beat rate' : 'Pulse rate' };
    case 'pulse.carrier': return { get: () => st.pulse.carrier, set: (v) => { st.pulse.carrier = v; }, range: RANGES.pulseCarrier, src: 'pulse', title: 'Carrier', step: 1, piano: true };
    case 'pulse.duty': return { get: () => st.pulse.duty, set: (v) => { st.pulse.duty = v; }, range: [0.1, 0.9], src: 'pulse', text: pct };
    case 'toneLevel': return { get: () => st.toneLevel, set: (v) => { st.toneLevel = v; }, range: [0, 1], src: '*', text: pct };
    case 'noiseLevel': return { get: () => st.noiseLevel, set: (v) => { st.noiseLevel = v; }, range: [0, 1], src: '*', text: pct };
    case 'volume': return { get: () => st.volume, set: (v) => { st.volume = v; }, range: [0, 1], text: pct, keepName: true };
    case 'timer.min': return { get: () => st.sessionMinutes, set: (v) => { st.sessionMinutes = Math.round(v / 5) * 5; if (A.isPlaying) startTimer(); }, range: [0, 720], text: F.minutes, keepName: true };
    case 'mood.tone': case 'mood.music': case 'mood.ambLevel': {
      const key = { 'mood.tone': 'tone', 'mood.music': 'music', 'mood.ambLevel': 'ambienceLevel' }[id];
      const k = st.moods.selected;
      return { get: () => moodLevels(st, k)[key], set: (v) => { st.moods.levels[k] = Object.assign(moodLevels(st, k), { [key]: v }); }, range: [0, 1], src: 'mood', text: pct };
    }
  }
  if (parts[0] === 'layer') {
    const L = st.mixer.layers.find((l) => l.id === parts[2]);
    if (!L) return null;
    const f = parts[1];
    if (f === 'vol') return { get: () => L.volume, set: (v) => { L.volume = v; }, range: [0, 1], src: 'mixer', text: pct };
    if (f === 'pan') return { get: () => L.pan, set: (v) => { L.pan = v; }, range: [-1, 1], src: 'mixer', text: F.pan, pan: true };
    const fr = L.kind === 'tone' ? RANGES.tone : L.kind === 'binaural' ? RANGES.carrier : RANGES.pulseCarrier;
    if (f === 'freq') return { get: () => L.frequency, set: (v) => { L.frequency = v; }, range: fr, src: 'mixer', piano: L.kind !== 'isochronic', title: L.kind === 'binaural' ? 'Layer base (left ear)' : L.kind === 'tone' ? 'Layer tone' : 'Layer carrier' };
    if (f === 'beat') return { get: () => L.beat, set: (v) => { L.beat = v; }, range: L.kind === 'isochronic' ? RANGES.pulseRate : RANGES.beat, src: 'mixer', title: L.kind === 'isochronic' ? 'Layer pulse rate' : 'Layer beat' };
  }
  return null;
}
function setCtrl(id, v, opts = {}) {
  const c = ctrl(id); if (!c) return;
  v = cl(v, c.range[0], c.range[1]);
  if (c.pan && !opts.exact && Math.abs(v) < 0.06) v = 0;
  if (!c.text) v = r2(v);
  c.set(v);
  if (c.src && c.src !== '*' && c.src === A.activeSource && !c.keepName) A.activePresetName = null;
  pushAudio(); save();
  for (const el of document.querySelectorAll(`[data-vt="${id}"]`)) el.textContent = c.text ? c.text(c.get()) : F.hz(c.get());
  for (const el of document.querySelectorAll(`[data-slider="${id}"]`)) placeSlider(el, c.get(), c.range);
}

// ===================================================================== components
const hpBadge = (on) => (on ? `<div class="badge">${I.head}Headphones</div>` : '');
const hdr = (t, right = '') => `<div class="hdr"><div class="ttl"><img class="hicon" src="icons/header-icon-96.png" srcset="icons/header-icon-96.png 2x, icons/header-icon-144.png 3x" width="30" height="30" alt="Biotone" decoding="async"><div class="t">${esc(t.toUpperCase())}</div></div>${right}</div>`;
const pill = (id, opts, sel, cls = '') => `<div class="pill ${cls}" data-pill="${id}">${opts.map(([v, l]) => `<div class="${v === sel ? 'on' : ''}" data-v="${esc(v)}">${esc(l)}</div>`).join('')}</div>`;
const sliderEl = (id) => { const c = ctrl(id); const t = (c.get() - c.range[0]) / (c.range[1] - c.range[0]); return `<div class="slider" data-slider="${id}"><div class="tr"></div><div class="fl" style="width:calc(13.5px + (100% - 27px)*${t})"></div><div class="th" style="left:calc((100% - 27px)*${t})"></div></div>`; };
function placeSlider(el, v, range) {
  const t = (v - range[0]) / (range[1] - range[0]);
  el.querySelector('.fl').style.width = `calc(13.5px + (100% - 27px)*${t})`;
  el.querySelector('.th').style.left = `calc((100% - 27px)*${t})`;
}
const vt = (id) => { const c = ctrl(id); return `<span data-vt="${id}">${esc(c.text ? c.text(c.get()) : F.hz(c.get()))}</span>`; };
const lslider = (id, label) => `<div class="lslider"><div class="h"><span class="k">${esc(label)}</span>${vt(id)}</div><div style="margin-top:2px">${sliderEl(id)}</div></div>`;
const panSlider = (id) => `<div class="lslider"><div class="h"><span class="k">PAN</span>${vt(id)}</div><div class="panrow" style="margin-top:2px"><span class="lr">L</span>${sliderEl(id)}<span class="lr">R</span></div></div>`;
const ruler = (id) => `<div class="ruler" data-ruler="${id}"><canvas></canvas></div>`;
const tuning = (id, size) => `<div style="display:flex;flex-direction:column;gap:6px"><div class="bignum" data-act="keypad" data-arg="${id}"><span class="n" style="font-size:${size}px" data-vt="${id}">${F.hz(ctrl(id).get())}</span><span class="u">Hz</span></div>${ruler(id)}</div>`;
const nudge = (id) => `<div class="nudge"><div class="b" data-nudge="${id}" data-dir="-1" aria-label="Down">${I.down}</div><div class="s" data-act="step" data-arg="${id}">step ${F.step(stepOf[id] || 1)} Hz</div><div class="b" data-nudge="${id}" data-dir="1" aria-label="Up">${I.up}</div></div>`;
const compact = (id, label) => `<div class="cf"><div style="flex:1" data-act="keypad" data-arg="${id}"><div class="k">${esc(label.toUpperCase())}</div><div class="v"><span data-vt="${id}">${F.hz(ctrl(id).get())}</span> Hz</div></div><div class="b" data-nudge="${id}" data-dir="-1">${I.minus}</div><div class="b" data-nudge="${id}" data-dir="1">${I.plus}</div></div>`;
const labeledPill = (label, id, opts, sel) => `<div style="display:flex;align-items:center;gap:8px"><span class="lbl" style="width:52px">${label}</span><div style="flex:1">${pill(id, opts, sel)}</div></div>`;
const bed = (id, sel, showNoise = true) => `<div class="bed">${showNoise ? `<div class="r"><span class="lbl">NOISE</span><div style="flex:1">${pill(id, ['off', 'pink', 'brown', 'white'].map((k) => [k, NOISE_LABEL[k]]), sel)}</div></div>` : ''}<div class="r"><span class="lbl">NATURE</span><div style="flex:1">${pill(id, (showNoise ? ['rain', 'ocean', 'wind', 'stream'] : ['off', 'rain', 'ocean', 'wind', 'stream']).map((k) => [k, NOISE_LABEL[k]]), sel)}</div></div></div>`;
function playBtn(src) {
  if (isPlayingSource(src)) return `<button class="playbtn stop" data-act="play" data-arg="${src}" aria-label="Stop">${I.stop}STOP</button>`;
  const other = (A.isPlaying || A.toolStarted) && !isPlayingSource(src);
  return `<button class="playbtn play" data-act="play" data-arg="${src}" aria-label="${other ? 'Switch' : 'Play'}">${I.play}${other ? 'Switch' : 'PLAY'}</button>`;
}
const scope = (h) => `<canvas class="scope" data-scope="${h}" style="height:${h}px"></canvas>`;
const bedLevel = () => (A.state.noise !== 'off' ? lslider('noiseLevel', isNat(A.state.noise) ? 'NATURE LEVEL' : 'NOISE LEVEL') : '');

// v12 visual mix: a compact panel (sheet) reachable from page 1 and page 4; all values live in VP.
const mixBtn = () => `<button class="mixbtn" data-act="vizmix" aria-label="Visual mix">${I.sliders || ''}<span>Mix</span></button>`;
const hdrRight = (badge) => `<div style="display:flex;align-items:center;gap:6px">${mixBtn()}${badge}</div>`;
const vzStep = (id, label) => `<div class="cf vzs"><div style="flex:1"><div class="k">${esc(label)}</div><div class="v" data-vt="${id}">${esc(ctrl(id).text(ctrl(id).get()))}</div></div><div class="b" data-nudge="${id}" data-dir="-1">${I.minus}</div><div class="b" data-nudge="${id}" data-dir="1">${I.plus}</div></div>`;
function openVizMix() {
  const amb = VP.get('amb');
  const pr = VZM.preset || 'custom';
  const html = `<h3>VISUAL MIX</h3><div class="caption" style="text-align:center;margin-top:-6px">Shared by Moods and Resonance</div>
    <div class="lslider"><div class="h"><span class="k">PRESETS</span></div></div>
    ${pill('viz.preset', VIZ_PRESET_ROWS[0], pr, 'vzamb vzpre')}${pill('viz.preset', VIZ_PRESET_ROWS[1], pr, 'vzamb vzpre')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${vzStep('viz.layers', 'EXTRA LAYERS')}${vzStep('viz.circles', 'CIRCLES')}</div>
    ${lslider('viz.spin', 'MOVEMENT')}${lslider('viz.cspeed', 'CIRCLE SPEED')}
    <div class="lslider"><div class="h"><span class="k">AMBIENT</span></div></div>
    ${pill('viz.amb', AMB_TYPES.slice(0, 5), amb, 'vzamb')}${pill('viz.amb', AMB_TYPES.slice(5), amb, 'vzamb')}
    ${lslider('viz.ambLevel', 'AMBIENT LEVEL')}
    <button class="kbtn ok" id="vzdone" style="flex:none">Done</button>`;
  openSheet(html, (sh, close) => { sh.parentElement.classList.add('lite'); sh.querySelector('#vzdone').onclick = close; });
}
// v12.1 one-tap presets (the v12 sweep winners), shared by both pages. Each sets its sound source values
// (mood, or carrier/beat/engine/bed) plus the visual mix; every value is eased by the renderers, so a
// preset glides in. 'Custom' returns to the user's own mix (snapshot taken when leaving it); any manual
// change to the mix while a preset is active makes that the new Custom.
const VIZ_PRESETS = {
  spark: { mood: 'spark', vp: { layers: 4, spin: 1.5, circles: 8, cspeed: 2, amb: 'waterfall', ambLevel: 0.9 } },
  glow: { mood: 'glow', vp: { layers: 2, spin: 0.8, circles: 5, cspeed: 0.8, amb: 'pads', ambLevel: 0.9 } },
  create: { mood: 'create', vp: { layers: 4, spin: 2, circles: 12, cspeed: 2.5, amb: 'pink', ambLevel: 1 } },
  active: { mood: 'active', vp: { layers: 3, spin: 1.6, circles: 5, cspeed: 1.3, amb: 'wind', ambLevel: 0.8 } },
  ease: { mood: 'ease', vp: { layers: 0, spin: 1, circles: 2, cspeed: 1, amb: 'white', ambLevel: 1 } },
  drone: { sch: { carrier: 60, beat: SCHUMANN, engine: 'binaural' }, bed: ['off', null], vp: { layers: 1, spin: 0.5, circles: 6, cspeed: 0.7, amb: 'drone', ambLevel: 0.9 } },
  falls: { sch: { carrier: 320, beat: 10, engine: 'binaural' }, bed: ['off', null], vp: { layers: 2, spin: 1.2, circles: 6, cspeed: 1.5, amb: 'waterfall', ambLevel: 0.8 } },
  stream: { sch: { carrier: 240, beat: 12, engine: 'monaural' }, bed: ['stream', 0.6], vp: { layers: 2, spin: 1, circles: 6, cspeed: 1, amb: 'off', ambLevel: 0.4 } },
  pinkslow: { sch: { carrier: 120, beat: 4, engine: 'binaural' }, bed: ['off', null], vp: { layers: 3, spin: 0.5, circles: 12, cspeed: 0.6, amb: 'pink', ambLevel: 0.6 } },
};
const VIZ_PRESET_ROWS = [[['custom', 'Custom'], ['spark', 'Spark'], ['glow', 'Glow'], ['create', 'Create'], ['active', 'Active']],
  [['ease', 'Ease'], ['drone', 'Drone'], ['falls', 'Waterfall'], ['stream', 'Stream'], ['pinkslow', 'Pink slow']]];
const VZM = (() => { try { const o = JSON.parse(localStorage.getItem('freqium.vizp') || 'null'); if (o && typeof o === 'object') return { preset: VIZ_PRESETS[o.preset] ? o.preset : '', custom: o.custom || null }; } catch (e) {} return { preset: '', custom: null }; })();
let vzmApplying = false;
function vzmSave() { try { localStorage.setItem('freqium.vizp', JSON.stringify(VZM)); } catch (e) {} }
function vzmSnapshot() {
  const st = A.state, sc = st.schumann;
  return { vp: Object.assign({}, VP.v), mood: st.moods.selected, sch: { carrier: sc.carrier, beat: sc.beat, engine: sc.engine }, bed: [st.noise, st.noiseLevel] };
}
function vzmPills() { const p = VZM.preset || 'custom'; for (const el of document.querySelectorAll('[data-pill="viz.preset"] > [data-v]')) el.classList.toggle('on', el.dataset.v === p); }
function vzmApplyValues(P) {
  const st = A.state; let mood = false, sch = false, bed = false;
  vzmApplying = true;
  try {
    for (const k in P.vp) VP.set(k, P.vp[k]);
    if (P.mood && MOODS.some((m) => m.key === P.mood) && st.moods.selected !== P.mood) { st.moods.selected = P.mood; mood = true; }
    if (P.sch) { const sc = st.schumann; if (sc.tone != null) { sc.tone = null; } Object.assign(sc, P.sch); sc.label = null; sc.libraryID = null; sch = true; }
    if (P.bed) { if (P.bed[0] != null && st.noise !== P.bed[0]) { st.noise = P.bed[0]; bed = true; } if (P.bed[1] != null && st.noiseLevel !== P.bed[1]) { st.noiseLevel = P.bed[1]; bed = true; } }
  } finally { vzmApplying = false; }
  if (A.isPlaying && !A.tool && ((mood && A.activeSource === 'mood') || (sch && A.activeSource === 'schumann') || (bed && A.activeSource !== 'mood'))) edited(A.activeSource);
  else if (mood || sch || bed) save();
  if (mood || sch || bed) { for (const k of ['moods', 'schumann']) renderPage(k); renderMini(); }
}
function applyVizPreset(key) {
  if (key === 'custom') {
    if (VZM.preset && VZM.custom) vzmApplyValues(VZM.custom);
    VZM.preset = ''; vzmSave(); vzmPills(); return;
  }
  const P = VIZ_PRESETS[key]; if (!P) return;
  if (!VZM.preset) VZM.custom = vzmSnapshot();   // leaving the user's own mix: remember it
  VZM.preset = key; vzmSave();
  vzmApplyValues(P); vzmPills();
}
VP.on(() => { if (!vzmApplying && VZM.preset) { VZM.preset = ''; VZM.custom = vzmSnapshot(); vzmSave(); vzmPills(); } });
// Keep any open panel in sync with the store (changes can also come from another tab).
VP.on((k, v) => {
  if (k === 'amb') for (const p of document.querySelectorAll('[data-pill="viz.amb"] > [data-v]')) p.classList.toggle('on', p.dataset.v === v);
  const id = 'viz.' + k, c = ctrl(id); if (!c) return;
  for (const el of document.querySelectorAll(`[data-vt="${id}"]`)) el.textContent = c.text(c.get());
  for (const el of document.querySelectorAll(`[data-slider="${id}"]`)) placeSlider(el, c.get(), c.range);
});

// ===================================================================== pages
const PAGE_RENDER = {
  moods() {
    const st = A.state, m = moodOf(st.moods.selected), lv = moodLevels(st, m.key), playing = isPlayingSource('mood');
    const tiles = MOODS.map((x) => `<button class="tile ${x.key === m.key ? 'sel' : ''}" data-act="mood" data-arg="${x.key}"><div class="ic">${moodIcon[x.key] || I.spark}</div><div style="flex:1;min-width:0"><div class="nm">${x.label}</div><div class="bd">${moodLine(x)}</div></div>${x.key === m.key && playing ? `<div class="mw" style="width:20px;color:var(--accent)">${I.wave}</div>` : ''}</button>`).join('');
    return hdr('Moods', hdrRight(hpBadge(needsHeadphones(A.state, 'mood')))) +
      `<div class="orbflex"><div class="orbstage"><canvas data-orb="1"></canvas></div></div>
      <div style="text-align:center"><div style="font-family:var(--rounded);font-size:24px;font-weight:300;line-height:1.2">${m.label}</div><div class="caption" style="margin-top:2px">${moodBand(m)}</div></div>
      <div class="moodwin"><div class="grid2">${tiles}</div></div>` +
      lslider('mood.tone', m.pure ? 'TONE' : 'BINAURAL TONE') + lslider('mood.music', 'MUSIC') + bed('mood.amb', lv.ambience, false) +
      (lv.ambience !== 'off' ? lslider('mood.ambLevel', `${NOISE_LABEL[lv.ambience].toUpperCase()} LEVEL`) : '');
  },
  tone() {
    const t = A.state.tone;
    const warn = t.frequency < 150 ? 'Phone speakers play little below ~150 Hz; use headphones for low tones.' : t.frequency > 16000 ? 'Tones above ~16 kHz may be inaudible. Keep the volume low.' : '';
    return hdr('Tone') + scope(110) + tuning('tone.f', 76) + nudge('tone.f') + pill('tone.wave', WAVES, t.waveform) + panSlider('tone.pan') +
      (warn ? `<div class="caption">${warn}</div>` : '') + '<div class="spacer"></div>' + playBtn('tone');
  },
  binaural() {
    const b = A.state.binaural, beat = b.right - b.left;
    const target = UI.binTarget[b.linked ? 'linked' : 'free'];
    const id = b.linked ? (target === 'beat' ? 'bin.beat' : 'bin.base') : (target === 'right' ? 'bin.right' : 'bin.left');
    const ear = (k, lab, cid) => `<div class="ear ${!b.linked && target === k ? 'on' : ''}" data-act="ear" data-arg="${k}"><div class="k">${lab}</div><div class="v" data-vt="${cid}">${F.hz(ctrl(cid).get())}</div><div class="u">Hz</div></div>`;
    return hdr('Binaural', hpBadge(true)) + scope(84) +
      `<div style="display:flex;align-items:center;gap:6px">${ear('left', 'L', 'bin.left')}<div class="beatchip" data-act="keypad" data-arg="bin.beat"><div class="k">BEAT</div><div class="v" data-vt="bin.beat">${F.hz(Math.abs(beat))}</div><div class="b">${F.band(beat)}</div></div>${ear('right', 'R', 'bin.right')}</div>` +
      pill('bin.mode', [['linked', 'Base + Beat'], ['free', 'Independent L/R']], b.linked ? 'linked' : 'free') +
      pill('bin.target', b.linked ? [['base', 'Tune Base'], ['beat', 'Tune Beat']] : [['left', 'Tune Left'], ['right', 'Tune Right']], target) +
      ruler(id) + nudge(id) + panSlider('bin.pan') +
      `<div style="display:flex;align-items:center;gap:10px"><button class="press" data-act="swap" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:8px 12px;border-radius:99px;background:var(--panelHi)"><span style="width:14px;height:14px;display:inline-block">${I.swap}</span>Swap ears</button><span style="flex:1"></span><span style="font-size:13px;font-weight:600">Auto-pan</span><div class="toggle ${b.autoPan ? 'on' : ''}" data-act="autopan"></div></div>` +
      (b.autoPan ? lslider('bin.apr', 'AUTO-PAN SPEED') : '') + '<div class="spacer"></div>' + playBtn('binaural');
  },
  schumann() {
    const sc = A.state.schumann, def = scDefault(sc), e = sc.libraryID ? LIBRARY.find((x) => x.id === sc.libraryID) : null;
    const value = def ? '7.83' : F.short(scMain(sc));
    const ring = `<div class="ringflex"><div class="ringstage"><canvas data-ring="1"></canvas></div></div>`;
    const readout = `<div class="ringread">${sc.label ? `<div class="ringtag">${esc(sc.label)}</div>` : ''}<div class="ringnum"><span class="vnum${value.length > 5 ? ' long' : ''}" data-vdrag="sch.main" data-vt="sch.main" role="slider" aria-label="Frequency" aria-valuenow="${scMain(sc)}">${value}</span><span class="ringhz">Hz</span></div></div>`;
    const libRow = def ? '' : `<div class="resrow">${I.books}<span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e ? esc(tradLabel(e)) + ' · traditional use' : 'From the Library'}</span><button class="back783" data-act="reset783">${I.back}Back to 7.83</button></div>`;
    let controls;
    if (sc.tone != null) {
      controls = `<div class="caption">An audible tone from the Library: a pure sine in both ears. Works on speakers.</div>
        <div style="display:flex;align-items:center;gap:10px"><div style="flex:1"><div style="font-size:15px;font-weight:600">7.83 Hz shimmer</div><div style="font-size:11px;color:var(--muted)">A quiet binaural pair under the tone. Headphones.</div></div><div class="toggle ${sc.shimmer ? 'on' : ''}" data-act="shimmer"></div></div>` +
        (sc.shimmer ? compact('sch.carrier', 'Shimmer carrier') : '');
    } else {
      controls = pill('sch.engine', Object.keys(ENGINE).map((k) => [k, ENGINE[k].label]), sc.engine) + `<div class="caption">${ENGINE[sc.engine].hint}</div>` + compact('sch.carrier', 'Carrier');
    }
    return hdr(def ? 'Schumann 7.83' : 'Resonance', hdrRight(hpBadge(needsHeadphones(A.state, 'schumann')))) + libRow + ring + readout +
      `<div class="sch-controls">` + controls +
      bed('bed', A.state.noise) + bedLevel() + lslider('toneLevel', 'TONE LEVEL') +
      labeledPill('SESSION', 'session', [[0, 'Off'], [15, '15 min'], [30, '30 min'], [60, '1 h'], [480, '8 h']].map(([v, l]) => [String(v), l]), String(A.state.sessionMinutes)) +
      playBtn('schumann') + `</div>`;
  },
  pulse() {
    const p = A.state.pulse;
    return hdr('Isochronic / Monaural') + scope(90) + pill('pulse.mode', [['isochronic', 'Isochronic'], ['monaural', 'Monaural']], p.mode) + tuning('pulse.rate', 64) + nudge('pulse.rate') +
      `<div class="caption">${F.band(p.rate)} range · ${ENGINE[p.mode].hint}</div>` + compact('pulse.carrier', 'Carrier') +
      (p.mode === 'isochronic' ? lslider('pulse.duty', 'DUTY CYCLE (TONE ON)') : '') + '<div class="spacer"></div>' + playBtn('pulse');
  },
  mixer() {
    const L = A.state.mixer.layers;
    const icon = (l) => (l.kind === 'tone' ? I.wave : l.kind === 'binaural' ? I.head : l.kind === 'isochronic' ? I.metro : ({ rain: I.rain, ocean: I.ocean, wind: I.wind, stream: I.drop }[l.texture] || I.wave));
    const chip = (act, id, text) => `<button class="pchip" data-act="${act}" data-arg="${id}">${text}</button>`;
    const ms = (id, label) => `<div class="ms"><div class="h"><span class="k">${label}</span>${vt(id)}</div>${sliderEl(id)}</div>`;
    const cards = L.map((l) => {
      let chips = '';
      if (l.kind === 'tone') chips = chip('keypad', `layer.freq.${l.id}`, `<span data-vt="layer.freq.${l.id}">${F.hz(l.frequency)}</span>&nbsp;Hz`);
      if (l.kind === 'binaural') chips = chip('keypad', `layer.freq.${l.id}`, `L <span data-vt="layer.freq.${l.id}">${F.hz(l.frequency)}</span>`) + chip('keypad', `layer.beat.${l.id}`, `beat <span data-vt="layer.beat.${l.id}">${F.hz(l.beat)}</span>`);
      if (l.kind === 'isochronic') chips = chip('keypad', `layer.freq.${l.id}`, `carrier <span data-vt="layer.freq.${l.id}">${F.hz(l.frequency)}</span>`) + chip('keypad', `layer.beat.${l.id}`, `pulse <span data-vt="layer.beat.${l.id}">${F.hz(l.beat)}</span>`);
      if (l.kind === 'ambience') chips = chip('texture', l.id, `${NOISE_LABEL[l.texture]} ${I.ud}`);
      const name = l.kind === 'ambience' ? (isNat(l.texture) ? 'Nature' : 'Noise') : LAYER_KIND[l.kind];
      return `<div class="lcard ${l.muted ? 'muted' : ''}"><div class="top"><div class="ic" style="${l.muted ? 'color:var(--muted)' : ''}">${icon(l)}</div><div class="nm">${name}</div><button class="mute ${l.muted ? 'on' : ''}" data-act="mute" data-arg="${l.id}" aria-label="${l.muted ? 'Unmute' : 'Mute'}">${l.muted ? I.spkx : I.spk}</button><button class="xm" data-act="rmlayer" data-arg="${l.id}" aria-label="Remove layer">${I.xmark}</button></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${chips}</div><div style="display:flex;gap:12px">${ms(`layer.vol.${l.id}`, 'VOL')}${ms(`layer.pan.${l.id}`, 'PAN')}</div></div>`;
    }).join('');
    return hdr('Layers', hpBadge(needsHeadphones(A.state, 'mixer'))) + `<div class="caption">Up to 4 layers, each with its own volume, pan and mute. Saved with presets.</div>` +
      `<div style="display:flex;flex-direction:column;gap:8px">${cards || '<div class="caption">No layers yet.</div>'}</div>` +
      (L.length < 4 ? `<button class="addl" data-act="addlayer">${I.plus}Add layer</button>` : '') + '<div class="spacer"></div>' + playBtn('mixer');
  },
  presets() {
    const row = (p, opts = {}) => {
      const key = p.libraryID ? 'library:' + p.libraryID : p.id;
      return `<div class="prow" style="gap:6px;padding:9px 9px 9px 12px" data-act="loadp" data-arg="${esc(key)}"><div style="flex:1;min-width:0"><div class="nm">${esc(p.name)}</div><div class="sm">${esc(presetSummary(p))}</div></div><button class="star ${isFav(key) ? 'on' : ''}" data-act="fav" data-arg="${esc(key)}">${isFav(key) ? I.starf : I.star}</button>${opts.user ? `<button class="star" data-act="delp" data-arg="${esc(p.id)}"><span style="width:15px;height:15px;display:block">${I.trash}</span></button>` : ''}<button class="pl" data-act="playp" data-arg="${esc(key)}">${I.play}</button></div>`;
    };
    const favs = A.favorites.map(findPreset).filter(Boolean);
    const rec = A.recents.slice(0, 5).map((r) => `<div class="prow" style="background:rgba(22,22,22,.7);padding:9px 9px 9px 12px" data-act="loadr" data-arg="${r.id}"><span style="width:15px;height:15px;display:block;color:var(--muted);flex:none">${I.clock}</span><div style="flex:1;min-width:0"><div class="nm">${esc(r.name)}</div><div class="sm">${F.ago(r.date)} · ${esc(presetSummary(r))}</div></div><button class="pl" data-act="playr" data-arg="${r.id}">${I.play}</button></div>`).join('');
    return hdr('Presets') + `<button class="press" data-act="savep" style="height:48px;border-radius:14px;background:var(--accent);color:#000;display:flex;align-items:center;justify-content:center;gap:8px;font-size:17px;font-weight:600;flex:none;width:100%"><span style="width:17px;height:17px;display:block">${I.plus}</span>Save current settings</button>` +
      `<div class="caption">A preset saves everything: frequencies, mode, layers, pan, noise or nature, levels, session length and fade. Tap ☆ to keep one in Favorites.</div>` +
      (favs.length ? `<div class="sec">FAVORITES</div>${favs.map((p) => row(p, { user: !p.builtIn })).join('')}` : '') +
      (A.recents.length ? `<div style="display:flex;justify-content:space-between;align-items:flex-end"><div class="sec">RECENT</div><button style="font-size:12px;font-weight:600;color:var(--accent)" data-act="clearrecent">Clear</button></div>${rec}` : '') +
      (A.presets.length ? `<div class="sec">YOUR PRESETS</div>${A.presets.map((p) => row(p, { user: true })).join('')}` : '') +
      `<div class="sec">STARTERS</div>${STARTERS.map((p) => row(p)).join('')}<div style="height:8px;flex:none"></div>`;
  },
  tools() {
    const T = Tools, sweeping = !!T.sweep;
    const res = ['both', 'left', 'right'].filter((e) => T.results[e]).map((e) => {
      const r = T.results[e];
      const lo = r.low == null ? '—' : (r.lowOpen ? '≤ ' : '') + F.khz(r.low), hi = r.high == null ? '—' : (r.highOpen ? '≥ ' : '') + F.khz(r.high);
      return `<div style="display:flex;justify-content:space-between;font-size:15px"><b style="font-weight:600;${e === T.ear ? 'color:var(--accent)' : ''}">${e[0].toUpperCase() + e.slice(1)}</b><span>${lo} – ${hi}</span></div>`;
    }).join('');
    const spk = (k, icon, label) => `<button class="spk ${T.speaker === k ? 'on' : ''}" data-act="speaker" data-arg="${k}">${icon}${label}</button>`;
    return hdr('Tools') + `<div class="sec" style="padding-top:0">HEARING RANGE</div>` +
      `<div class="caption">A slow sweep plays. Tap the button the moment the tone disappears. Use headphones and start with a low volume. Just for curiosity; not a medical hearing test.</div>` +
      pill('tools.ear', [['both', 'Both'], ['left', 'Left'], ['right', 'Right']], T.ear, sweeping ? 'dis' : '') +
      `<div style="text-align:center"><div style="font-family:var(--rounded);font-size:48px;font-weight:200;line-height:1.15" id="toolfreq">${sweeping ? F.khz(T.frequency) : '—'}</div><div class="caption">${sweeping ? (T.sweep === 'high' ? 'Rising… tap when you can’t hear it' : 'Falling… tap when you can’t hear it') : 'High end: 1 kHz → 20 kHz · low end: 250 Hz → 20 Hz'}</div></div>` +
      `<canvas data-hbar="34" style="height:34px;width:100%"></canvas>` +
      (sweeping ? `<div style="display:flex;gap:10px"><button class="press" data-act="canthear" style="flex:1;height:52px;border-radius:14px;background:var(--accent);color:#000;display:flex;align-items:center;justify-content:center;gap:7px;font-size:17px;font-weight:700"><span style="width:19px;height:19px;display:block">${I.ear}</span>I can't hear it</button><button class="press" data-act="cancelsweep" style="width:84px;height:52px;border-radius:14px;border:1px solid rgba(148,148,148,.5);font-size:15px;font-weight:600">Cancel</button></div>`
        : `<div style="display:flex;gap:10px"><button class="sbtn" data-act="sweep" data-arg="high">${I.arrowur}Test high end</button><button class="sbtn" data-act="sweep" data-arg="low">${I.arrowdr}Test low end</button></div>`) +
      (res ? `<div class="card" style="display:flex;flex-direction:column;gap:6px">${res}<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:var(--muted)">Approximate; depends on your headphones and volume.</span><button style="font-size:12px;font-weight:600;color:var(--accent)" data-act="clearhear">Clear</button></div></div>` : '') +
      `<div style="height:1px;background:var(--panelHi);flex:none"></div><div class="sec" style="padding-top:0">SPEAKER CHECK</div>` +
      `<div style="display:flex;gap:8px">${spk('left', I.lsq, 'Left')}${spk('both', I.spk2, 'Both')}${spk('right', I.rsq, 'Right')}${spk('alternate', I.lr, 'Alternate')}</div>` +
      `<div class="caption">Plays a gentle beep on one side at a time. Check each side comes from where it should. Test signals stop when you leave this page and are never saved.</div>`;
  },
  timer() {
    const st = A.state;
    const q = [[0, 'Off'], [15, '15m'], [30, '30m'], [45, '45m'], [60, '1h'], [120, '2h'], [240, '4h'], [480, '8h'], [720, '12h']];
    return hdr('Timer & Settings') +
      `<div style="text-align:center"><div style="font-family:var(--rounded);font-size:52px;font-weight:200;line-height:1.2" id="timerbig">${timerBigText()}</div><div class="caption" style="margin-top:2px" id="timercap">${timerCaption()}</div></div>` +
      `<div class="qgrid">${q.map(([m, l]) => `<div class="${st.sessionMinutes === m ? 'on' : ''}" data-act="quick" data-arg="${m}">${l}</div>`).join('')}</div>` +
      lslider('timer.min', 'SESSION LENGTH (UP TO 12 H)') +
      labeledPill('FADE', 'fade', [[10, '10 s'], [30, '30 s'], [60, '1 min'], [180, '3 min'], [300, '5 min']].map(([v, l]) => [String(v), l]), String(st.fadeSeconds)) +
      `<div style="height:1px;background:var(--panelHi);margin:2px 0;flex:none"></div>` + lslider('volume', 'VOLUME') + bed('bed', st.noise) + bedLevel() +
      `<div style="display:flex;flex-direction:column;gap:8px"><div class="trow">Keep screen on while playing<div class="toggle ${A.keepAwake ? 'on' : ''}" data-act="awake"></div></div>${INTRO_ENABLED ? '<div class="trow">Welcome intro<button class="a4" data-act="replayintro">Replay intro</button></div>' : ''}<div class="trow">Piano tuning (A4)${pill('a4', [['440', '440 Hz'], ['432', '432 Hz']], String(A.a4))}</div></div>` +
      `<div class="caption" style="font-size:11px;line-height:1.35">Web version: browsers pause sound when the screen locks or you switch apps, so keep Biotone open (turn on “Keep screen on” for long sessions). Play over other apps and resume-after-calls are only in the iPhone app.</div>` +
      '<div class="spacer"></div>' + `<div style="font-size:11px;color:var(--muted);line-height:1.3">Biotone is for relaxation and focused listening. It isn't a medical device and doesn't diagnose or treat anything. Keep the volume comfortable; the waveform turns orange, then red, as sound gets loud and high-pitched or close to the limit.</div>` + `<div style="font-size:10px;color:var(--muted);opacity:.55;flex:none">Build ${APP_BUILD}</div>`;
  },
  library() {
    return `<div class="libtop">${hdr('Library', `<button data-act="libinfo" style="width:30px;height:24px;color:var(--accent);display:flex;justify-content:center" aria-label="About the library and its sources"><span style="width:20px;height:20px;display:block">${I.info}</span></button>`)}
      <div style="display:flex;align-items:center;gap:8px" class="libsearch"><label class="lsearch ${UI.libQuery ? 'q' : ''}"><span style="width:16px;height:16px;color:var(--muted);flex:none;display:block">${I.search}</span><input id="libq" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Search use, Hz or tradition" aria-label="Search the library" value="${esc(UI.libQuery)}"><button class="clr" data-act="libclear" aria-label="Clear search">${I.xcircle}</button></label><button class="done" data-act="libdone">Done</button></div>
      <div class="lchips" id="lchips"></div><div class="lcount" id="lcount"></div>
      <div class="disc">${I.caseI}<span>Traditional and folk uses, not medical treatment. If you have symptoms, see a doctor.</span></div></div>
      <div class="liblist" id="liblist"></div>`;
  },
};
function findPreset(key) {
  if (key.startsWith('library:')) { const e = LIBRARY.find((x) => 'library:' + x.id === key); return e ? libraryPreset(e) : null; }
  return STARTERS.find((p) => p.id === key) || A.presets.find((p) => p.id === key) || null;
}
function renderLibList() {
  const box = document.getElementById('liblist'); if (!box) return;
  const q = UI.libQuery, base = UI.libCat ? LIBRARY.filter((e) => e.cat === UI.libCat) : LIBRARY, found = libFilter(q, base);
  const chips = document.getElementById('lchips');
  if (chips) {
    const chip = (key, label, n) => `<button class="lchip ${UI.libCat === key ? 'on' : ''}" data-act="libcat" data-arg="${key || ''}" aria-pressed="${UI.libCat === key}" aria-label="${esc(label)}, ${n} frequencies">${esc(label)}<b>${n}</b></button>`;
    const h = chip(null, 'All', LIBRARY.length) + LIB_CATS.map((c) => chip(c, catLabel(c), catCount(c))).join('');
    if (chips.dataset.sig !== h) { const sl = chips.scrollLeft; chips.innerHTML = h; chips.dataset.sig = h; chips.scrollLeft = sl; }
  }
  const cnt = document.getElementById('lcount');
  if (cnt) { let t = found.length === LIBRARY.length ? `${LIBRARY.length} frequencies` : `${found.length} of ${LIBRARY.length}`; if (UI.libCat) t += ` · ${catLabel(UI.libCat)}`; if (q.trim()) t += ` · “${q.trim()}”`; cnt.textContent = t; }
  const playingId = isPlayingSource('schumann') ? A.state.schumann.libraryID : null;
  const row = (e) => {
    const fav = isFav('library:' + e.id), on = e.id === playingId;
    const lit = UI.libFlash === e.id;
    return `<div class="lrow ${on && !lit ? 'playing' : ''} ${lit ? 'lit' : ''}" data-lib="${e.id}"><span class="lbal" aria-hidden="true"></span><button class="lm" data-act="lib" data-arg="${e.id}" aria-label="${esc(e.use)}, ${F.short(e.hz)} hertz ${isBeat(e) ? 'beat' : 'tone'}${on ? ', playing' : ''}"><div class="l1">${on && !lit ? `<span class="lw">${I.bars}</span>` : ''}<span class="nm">${esc(e.use)}</span><span class="ld">·</span><span class="lhz">${F.short(e.hz)} Hz</span></div><div class="sm">${esc(tradLabel(e))} · ${isBeat(e) ? 'beat' : 'tone'}${e.caution ? ' · weak source' : ''}</div></button><button class="star ${fav ? 'on' : ''}" data-act="libstar" data-arg="${e.id}" aria-label="${fav ? 'Unstar' : 'Star'}">${fav ? I.starf : I.star}</button></div>`;
  };
  let html = '';
  if (!q.trim() && !UI.libCat) {
    const favs = A.favorites.filter((k) => k.startsWith('library:')).map((k) => LIBRARY.find((e) => 'library:' + e.id === k)).filter(Boolean);
    if (favs.length) html += `<div class="lsec" style="color:var(--accent)">★ STARRED</div>` + favs.map(row).join('');
  }
  for (const s of libSections(found)) html += `<div class="lsec">${s.letter}</div>` + s.entries.map(row).join('');
  if (!found.length) html += `<div style="text-align:center;padding:24px 0"><div style="font-size:15px;font-weight:600">No match</div><div class="caption" style="margin-top:4px">${UI.libCat ? 'Nothing in this category matches. Tap All to search everything.' : 'Try a use (sleep, focus, stomach), a number (7.83) or a tradition (Solfeggio).'}</div></div>`;
  html += `<div class="libfoot"><span>${LIBRARY.length} entries from brainwave research, the Schumann resonance, Solfeggio, 432 Hz tuning, Hans Cousto's Cosmic Octave and the Rife frequency list (CAFL). Uses are traditional or anecdotal; most have little or no scientific support, and “weak source” marks the shakiest. Press and hold an entry for its note and sources.</span><span style="color:var(--orange)">Traditional and folk uses, not medical treatment. If you have symptoms, see a doctor.</span><span>Swipe on the header or tap a dot to change page.</span></div><div class="kbpad" style="flex:none;height:${UI.kbPad}px"></div>`;
  const top = box.scrollTop; box.innerHTML = html; box.scrollTop = top;
}
const UI = { binTarget: { linked: 'base', free: 'left' }, libQuery: '', kbPad: 0, libCat: null, libFlash: null, ambOpen: false };

function timerBigText() {
  if (A.isPlaying && A.timerEnd) return F.dur((A.timerEnd - Date.now()) / 1000);
  return A.state.sessionMinutes > 0 ? F.dur(A.state.sessionMinutes * 60) : 'Off';
}
function timerCaption() {
  const st = A.state;
  if (A.isPlaying && A.timerEnd) return `Fades out over ${F.fade(st.fadeSeconds)}, stops at ${F.clock(A.timerEnd)}`;
  if (st.sessionMinutes > 0) return `Starts when you press play · fades out over ${F.fade(st.fadeSeconds)}`;
  return 'No sleep timer: plays until you stop it';
}
function updateTimerReadout() {
  const a = document.getElementById('timerbig'), b = document.getElementById('timercap');
  if (a) a.textContent = timerBigText(); if (b) b.textContent = timerCaption();
}
function updateToolsReadout() { const el = document.getElementById('toolfreq'); if (el && Tools.sweep) el.textContent = F.khz(Tools.frequency); }

// ===================================================================== shell rendering
const $ = (s, r = document) => r.querySelector(s);
let moodScrollTop = 0;
let moodScrollLock = null;
function renderPage(key) {
  const el = document.getElementById('page-' + key); if (!el) return;
  if (key === 'library' && el.querySelector('#libq')) { renderLibList(); return; }
  const top = el.scrollTop;
  const moodEl = el.querySelector('.moodwin');
  if (moodEl) moodScrollTop = moodEl.scrollTop;
  const oldOrb = el.querySelector('canvas[data-orb]'); // page 1 visual: carry the live canvas across re-renders
  el.innerHTML = PAGE_RENDER[key]();
  if (oldOrb) { const fresh = el.querySelector('canvas[data-orb]'); if (fresh) fresh.replaceWith(oldOrb); }
  el.scrollTop = top;
  const moodNext = el.querySelector('.moodwin');
  if (moodNext) {
    const keep = moodScrollLock != null ? moodScrollLock : moodScrollTop;
    moodNext.scrollTop = keep;
    moodScrollTop = keep;
    requestAnimationFrame(() => { if (moodNext.isConnected) moodNext.scrollTop = keep; moodScrollLock = null; });
  }
  if (key === 'library') renderLibList();
}
function renderAll() { for (const p of PAGES) renderPage(p.key); renderMini(); renderDots(); }
function activeAmbients() {
  if (A.tool || !(A.isPlaying || A.toolStarted)) return [];
  const src = A.activeSource, out = [];
  if (src === 'mixer') {
    for (const l of A.state.mixer.layers) {
      if (l.kind === 'ambience' && !l.muted && l.volume > 0.001) out.push({ id: 'mix:' + l.id, name: NOISE_LABEL[l.texture] || 'Nature' });
    }
  } else if (src === 'mood') {
    const m = moodOf(A.state.moods.selected), lv = moodLevels(A.state, m.key);
    if (lv.ambience && lv.ambience !== 'off' && lv.ambienceLevel > 0.001) out.push({ id: 'mood', name: NOISE_LABEL[lv.ambience] || 'Ambience' });
  } else if (A.state.noise && A.state.noise !== 'off' && A.state.noiseLevel > 0.001) {
    out.push({ id: 'bed', name: NOISE_LABEL[A.state.noise] || 'Noise' });
  }
  return out;
}
function stopAmbient(id) {
  const ids = id === 'all' ? activeAmbients().map((a) => a.id) : [id];
  for (const one of ids) {
    if (one === 'bed') A.state.noise = 'off';
    else if (one === 'mood') {
      const k = A.state.moods.selected;
      A.state.moods.levels[k] = Object.assign(moodLevels(A.state, k), { ambience: 'off' });
    } else if (one.indexOf('mix:') === 0) {
      const l = A.state.mixer.layers.find((x) => x.id === one.slice(4));
      if (l) l.volume = 0;
    }
  }
  if (!activeAmbients().length) UI.ambOpen = false;
  edited(null, true);
  renderAll();
}
function renderMini() {
  const m = $('#mini'); if (!m) return;
  const playing = A.isPlaying || A.toolStarted;
  const ambs = activeAmbients();
  if (!ambs.length) UI.ambOpen = false;
  const open = UI.ambOpen && ambs.length > 0;
  const t1 = A.tool ? A.tool.title : (A.activePresetName || titleFor(A.state, A.activeSource));
  const t2 = A.tool ? 'Tools · test signal' : detailFor(A.state, A.activeSource);
  const chip = ambs.length ? `<button class="ambchip" data-act="ambtoggle" aria-expanded="${open ? 'true' : 'false'}" aria-label="Background sounds, ${esc(ambs.map((a) => a.name).join(', '))}">${I.spk}<span>${esc(ambs.length === 1 ? ambs[0].name : ambs.length + ' sounds')}</span></button>` : '';
  const panel = open ? `<div class="ambpanel" role="region" aria-label="Background sounds">${ambs.map((a) => `<div class="ambrow"><span>${esc(a.name)}</span><button type="button" data-act="ambstop" data-arg="${esc(a.id)}" aria-label="Stop ${esc(a.name)}">Stop</button></div>`).join('')}${ambs.length > 1 ? '<button type="button" class="amball" data-act="amball" aria-label="Stop all background sounds">Stop all</button>' : ''}</div>` : '';
  m.classList.toggle('open', open);
  m.innerHTML = `${panel}<div class="row"><button class="pb ${playing ? 'stop' : ''}" data-act="toggle" aria-label="${playing ? 'Stop' : 'Play'}">${playing ? I.stop : I.play}<span>${playing ? 'Stop' : 'Play'}</span></button><div class="tt" data-act="gosource"><div class="t1">${esc(t1)}</div><div class="t2">${esc(t2)}</div></div>
    ${chip}<div class="chip ${A.isPlaying && A.timerEnd ? 'on' : ''}" data-act="gotimer">${I.moon}<span id="minitimer">${miniTimerText()}</span></div>${!A.tool && needsHeadphones(A.state, A.activeSource) ? `<div class="hp" title="Headphones recommended">${I.head}</div>` : ''}</div>`;
}
const miniTimerText = () => (A.isPlaying && A.timerEnd ? F.dur((A.timerEnd - Date.now()) / 1000) : A.state.sessionMinutes > 0 ? F.minutes(A.state.sessionMinutes) : 'Off');
function updateMiniTimer() { const el = $('#minitimer'); if (el) el.textContent = miniTimerText(); }
function renderDots() {
  const d = $('#dots'); if (!d) return;
  d.innerHTML = PAGES.map((p) => `<div data-act="dot" data-arg="${p.key}" aria-label="${esc(p.title)}"><i class="${p.key === A.page ? 'on' : ''}"></i></div>`).join('');
}
let flashT = 0;
function flash(title) {
  const f = $('#flash'); if (!f) return;
  f.innerHTML = `<span>${esc(title)}</span>`; f.classList.add('on');
  clearTimeout(flashT); flashT = setTimeout(() => f.classList.remove('on'), 1200);
}
function pageIndex(key) { return PAGES.findIndex((p) => p.key === key); }
function goTo(key, smooth = true) {
  const pager = $('#pager'), i = pageIndex(key);
  if (i < 0) return;
  pager.scrollTo({ top: i * pager.clientHeight, behavior: smooth ? 'smooth' : 'auto' });
  setPage(key);
}
function setPage(key) {
  if (key === A.page) return;
  const prev = A.page; A.page = key;
  onPageChange(prev, key);
  renderDots();
  const p = PAGES[pageIndex(key)];
  flash(key === 'schumann' && !scDefault(A.state.schumann) ? 'Resonance' : p.title);
  if (key === 'presets') renderPage('presets'); // refresh "x min ago"
}

// ===================================================================== sheets
function openSheet(html, onMount) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  document.body.appendChild(scrim);
  requestAnimationFrame(() => scrim.classList.add('on'));
  const close = () => { scrim.classList.remove('on'); setTimeout(() => scrim.remove(), 200); };
  scrim.addEventListener('click', (e) => { if (e.target === scrim) close(); });
  if (onMount) onMount(scrim.querySelector('.sheet'), close);
  return close;
}
const NOTE = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const noteName = (m) => NOTE[m % 12] + (Math.floor(m / 12) - 1);
const midiHzA = (m) => A.a4 * Math.pow(2, (m - 69) / 12);
function openKeypad(id) {
  const c = ctrl(id); if (!c) return;
  const [lo, hi] = c.range;
  let text = F.hz(c.get()), fresh = true;
  const blk = (m) => [1, 3, 6, 8, 10].includes(m % 12);
  const html = `<h3>${esc((c.title || 'Frequency').toUpperCase())}</h3><div class="big"><span class="n" id="kpv">${text}</span><span class="u">Hz</span></div>
    <div style="text-align:center;font-size:13px;color:var(--muted)">${F.hz(lo)} – ${F.hz(hi)} Hz · up to 2 decimals</div>
    ${c.piano ? `<div class="notebar"><span class="nn" id="kpnote"></span><button class="a4" id="kpa4">A4 = ${A.a4} Hz</button></div><div class="pianowrap" id="kppw"><div class="piano" id="kppiano"></div></div>` : ''}
    <div class="kgrid">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => `<button class="kk" data-k="${k}">${k}</button>`).join('')}</div>
    <div class="krow"><button class="kbtn c" id="kpc">Cancel</button><button class="kbtn ok" id="kpok">Set</button></div>`;
  openSheet(html, (sh, close) => {
    const vEl = sh.querySelector('#kpv'), ok = sh.querySelector('#kpok');
    const val = () => parseFloat(text);
    const valid = () => !isNaN(val()) && val() >= lo && val() <= hi;
    const refresh = () => {
      vEl.textContent = text || '0'; vEl.classList.toggle('bad', !valid()); ok.classList.toggle('dis', !valid());
      if (c.piano) {
        const v = val();
        const note = sh.querySelector('#kpnote');
        if (v > 0) { const m = 69 + 12 * Math.log2(v / A.a4), n = Math.round(m), cents = Math.round((m - n) * 100); note.textContent = `≈ ${noteName(n)}${cents ? ` ${cents > 0 ? '+' : ''}${cents} ¢` : ''}`; } else note.textContent = '';
        for (const k of sh.querySelectorAll('[data-m]')) k.classList.toggle('on', v > 0 && Math.abs(midiHzA(+k.dataset.m) - v) < 0.01);
      }
    };
    if (c.piano) {
      const kw = 34; let whites = 0, keys = '';
      for (let m = 21; m <= 108; m++) {
        const hz = midiHzA(m), out = hz < lo || hz > hi ? 'out' : '';
        if (!blk(m)) { keys += `<div class="wk ${out}" data-m="${m}" style="left:${whites * kw}px">${m % 12 === 0 ? noteName(m) : ''}</div>`; whites++; }
        else keys += `<div class="bk ${out}" data-m="${m}" style="left:${whites * kw - 10}px"></div>`;
      }
      const pn = sh.querySelector('#kppiano'); pn.style.width = whites * kw + 'px'; pn.innerHTML = keys;
      pn.addEventListener('click', (e) => { const k = e.target.closest('[data-m]'); if (!k) return; text = F.hz(midiHzA(+k.dataset.m)); fresh = true; refresh(); });
      sh.querySelector('#kpa4').addEventListener('click', (e) => { A.a4 = A.a4 === 440 ? 432 : 440; save(); e.target.textContent = `A4 = ${A.a4} Hz`; for (const k of sh.querySelectorAll('[data-m]')) { const hz = midiHzA(+k.dataset.m); k.classList.toggle('out', hz < lo || hz > hi); } refresh(); });
      // Scroll to the nearest key.
      const v = val(); const m = v > 0 ? Math.round(69 + 12 * Math.log2(v / A.a4)) : 60;
      let wi = 0; for (let x = 21; x < Math.min(108, Math.max(21, m)); x++) if (!blk(x)) wi++;
      requestAnimationFrame(() => { const pw = sh.querySelector('#kppw'); pw.scrollLeft = wi * kw - pw.clientWidth / 2 + kw / 2; });
    }
    sh.querySelector('.kgrid').addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]'); if (!k) return;
      const key = k.dataset.k;
      if (key === '⌫') { text = fresh ? '' : text.slice(0, -1); fresh = false; refresh(); return; }
      if (fresh) { text = ''; fresh = false; }
      if (key === '.' && text.includes('.')) return;
      if (text.includes('.') && text.split('.')[1].length >= 2) return;
      if (text.replace('.', '').length >= 7) return;
      text = text === '0' && key !== '.' ? key : text + key;
      if (text === '.') text = '0.';
      refresh();
    });
    sh.querySelector('#kpc').addEventListener('click', close);
    ok.addEventListener('click', () => { if (!valid()) return; setCtrl(id, val(), { exact: true }); close(); renderPage(A.page); renderMini(); });
    refresh();
  });
}
function openLibDetail(e) {
  const fav = isFav('library:' + e.id);
  const srcs = e.sources.split(';').map((k) => k.trim()).map((k) => LIBRARY_SOURCES.find((s) => s.key === k)).filter(Boolean);
  openSheet(`<h3>${esc(tradLabel(e).toUpperCase())}</h3><div class="big"><span class="n">${F.short(e.hz)}</span><span class="u">Hz</span></div>
    <div style="text-align:center;font-size:17px;font-weight:600">${esc(e.use)}</div>
    <div class="txt">${esc(e.note)}</div>${e.caution ? `<div class="txt" style="color:var(--orange)">⚠︎ ${esc(e.caution)}</div>` : ''}
    <div class="txt" style="font-size:12px;color:var(--muted)">Plays as ${isBeat(e) ? 'a beat (≤ 40 Hz) on the carrier, with the Schumann page’s binaural / monaural / isochronic switch' : 'a pure audible tone in both ears'}.</div>
    ${srcs.map((s) => `<div class="src"><b>${esc(s.key)}</b><br>${esc(s.text)}${s.url ? `<br><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>` : ''}</div>`).join('')}
    <div class="disc">${I.caseI}<span>Traditional and folk uses, not medical treatment. If you have symptoms, see a doctor.</span></div>
    <div class="krow"><button class="kbtn c" id="ldfav">${fav ? 'Unstar' : 'Star'}</button><button class="kbtn ok" id="ldplay">Play</button></div>`, (sh, close) => {
    sh.querySelector('#ldfav').onclick = () => { toggleFav('library:' + e.id); renderLibList(); renderPage('presets'); close(); };
    sh.querySelector('#ldplay').onclick = () => { close(); playLibrary(e); };
  });
}
function openLibInfo() {
  openSheet(`<h3>ABOUT THE LIBRARY</h3><div class="disc" style="font-size:14px">${I.caseI}<span style="color:var(--accent);font-weight:600">Traditional and folk uses, not medical treatment. If you have symptoms, see a doctor.</span></div>
    <div class="txt">Biotone isn't a medical device. The uses listed here are how traditions, charts and frequency lists describe each frequency. They are not treatments, and most have little or no scientific support. Don't use Biotone instead of medical care, and keep the volume comfortable.</div>
    <div class="txt">How entries play: rates of 40 Hz or less play as a beat (binaural, monaural or isochronic) on the carrier, using the Schumann page's engine switch. Higher frequencies play as a pure tone in both ears. The Rife list (CAFL) was compiled for electrical frequency devices, usually several values per item; Biotone plays one listed value.</div>
    <div class="sec">SOURCES</div>${LIBRARY_SOURCES.map((s) => `<div class="src"><b>${esc(s.key)}</b><br>${esc(s.text)}${s.url ? `<br><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>` : ''}</div>`).join('')}
    <button class="kbtn ok" id="lidone" style="flex:none">Done</button>`, (sh, close) => { sh.querySelector('#lidone').onclick = close; });
}
function openMenu(title, items, pick) {
  openSheet(`<h3>${esc(title)}</h3><div class="menu">${items.map(([v, l, icon]) => `<button data-v="${esc(v)}">${icon || ''}${esc(l)}</button>`).join('')}</div><button class="kbtn c" id="mc" style="flex:none">Cancel</button>`, (sh, close) => {
    sh.querySelector('.menu').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; close(); pick(b.dataset.v); });
    sh.querySelector('#mc').onclick = close;
  });
}
function openSavePreset() {
  const def = A.activePresetName || titleFor(A.state, A.activeSource);
  openSheet(`<h3>SAVE PRESET</h3><input class="textin" id="pn" maxlength="60" value="${esc(def)}" aria-label="Preset name"><div class="caption">Saves every page's settings, the Layers mix, levels, session length and fade. Plays as: ${esc(titleFor(A.state, A.activeSource))}.</div><div class="krow"><button class="kbtn c" id="pc">Cancel</button><button class="kbtn ok" id="ps">Save</button></div>`, (sh, close) => {
    const inp = sh.querySelector('#pn');
    const doSave = () => { const n = inp.value.trim(); if (!n) return; savePreset(n); inp.blur(); close(); renderPage('presets'); banner('Preset saved'); };
    sh.querySelector('#ps').onclick = doSave; sh.querySelector('#pc').onclick = () => { inp.blur(); close(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSave(); });
    setTimeout(() => { inp.focus(); inp.select(); }, 250);
  });
}
let bannerT = 0;
function banner(msg, ms = 1800) {
  const b = $('#banner'); if (!b) return;
  b.textContent = msg; b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), ms);
}
function showTip(force) {
  if (!force && load(LS.tip, false)) return;
  const el = document.createElement('div'); el.className = 'tip';
  const ud = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M7 7.5L12 3l5 4.5M7 16.5L12 21l5-4.5"/></svg>';
  const lr = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M7.5 7L3 12l4.5 5M16.5 7L21 12l-4.5 5"/></svg>';
  const row = (ic, t) => `<div class="row"><div class="ic">${ic}</div><div>${t}</div></div>`;
  el.innerHTML = `<div class="box"><div style="text-align:center;font-family:var(--rounded);font-size:26px;font-weight:300">Welcome to Biotone</div>
    ${row(ud, 'Swipe up or down to change pages. The dots on the right jump straight to one.')}
    ${row(lr, 'Drag a ruler sideways to tune. Slow drags make finer steps; tap a number to type it.')}
    ${row(I.head, 'Binaural beats need stereo headphones (Moods, Binaural, Schumann). Isochronic and monaural work on speakers.')}
    ${row(I.spk, 'Start with a low volume. The waveform turns orange, then red, when it gets loud. If you hear nothing on iPhone, check the silent switch and volume.')}
    <button class="kbtn ok" id="tipok" style="flex:none">Got it</button></div>`;
  document.body.appendChild(el);
  el.querySelector('#tipok').onclick = () => { try { localStorage.setItem(LS.tip, 'true'); } catch (e) {} el.remove(); };
}

// ===================================================================== actions
function refreshAfterEdit(page) { renderPage(page || A.page); renderMini(); }
const ACT = {
  vizmix: () => openVizMix(),
  play: (src) => playOrStop(src),
  toggle: () => toggle(),
  gosource: () => goTo(A.tool ? 'tools' : SOURCE_PAGE[A.activeSource]),
  gotimer: () => goTo('timer'),
  dot: (k) => goTo(k),
  keypad: (id) => openKeypad(id),
  step(id) { const i = STEPS.indexOf(stepOf[id] || 1); stepOf[id] = STEPS[(i + 1) % STEPS.length]; renderPage(A.page); },
  mood(k) {
    const m = A.state.moods;
    if (m.selected === k && isPlayingSource('mood')) { stop(); return; }
    m.selected = k; A.activePresetName = null; play('mood');
  },
  ambtoggle() { if (!activeAmbients().length) { UI.ambOpen = false; renderMini(); return; } UI.ambOpen = !UI.ambOpen; renderMini(); },
  ambstop(id) { stopAmbient(id); },
  amball() { stopAmbient('all'); },
  ear(k) { if (!A.state.binaural.linked) { UI.binTarget.free = k; renderPage('binaural'); } else { openKeypad(k === 'left' ? 'bin.left' : 'bin.right'); } },
  swap() { const b = A.state.binaural; [b.left, b.right] = [b.right, b.left]; edited('binaural'); refreshAfterEdit('binaural'); },
  autopan() { const b = A.state.binaural; b.autoPan = !b.autoPan; edited('binaural'); refreshAfterEdit('binaural'); },
  shimmer() { const sc = A.state.schumann; sc.shimmer = !sc.shimmer; edited(null, true); refreshAfterEdit('schumann'); },
  reset783: () => resetResonance(),
  mute(id) { const l = A.state.mixer.layers.find((x) => x.id === id); if (l) { l.muted = !l.muted; edited('mixer'); refreshAfterEdit('mixer'); } },
  rmlayer(id) { A.state.mixer.layers = A.state.mixer.layers.filter((x) => x.id !== id); edited('mixer'); refreshAfterEdit('mixer'); },
  addlayer() {
    openMenu('ADD LAYER', [['tone', 'Tone', I.wave], ['binaural', 'Binaural', I.head], ['isochronic', 'Isochronic', I.metro], ['ambience', 'Noise / nature', I.rain]], (k) => {
      if (A.state.mixer.layers.length >= 4) return;
      A.state.mixer.layers.push(makeLayer(k)); edited('mixer'); refreshAfterEdit('mixer');
    });
  },
  texture(id) {
    const l = A.state.mixer.layers.find((x) => x.id === id); if (!l) return;
    openMenu('NOISE / NATURE', ['pink', 'brown', 'white', 'rain', 'ocean', 'wind', 'stream'].map((k) => [k, NOISE_LABEL[k] + (k === l.texture ? '  ✓' : '')]), (k) => { l.texture = k; edited('mixer'); refreshAfterEdit('mixer'); });
  },
  savep: () => openSavePreset(),
  loadp(key) { const p = findPreset(key); if (!p) return; applyPreset(p); renderAll(); goTo(SOURCE_PAGE[p.source]); },
  playp(key) { const p = findPreset(key); if (!p) return; applyPreset(p); play(p.source); },
  fav(key) { toggleFav(key); renderPage('presets'); renderLibList(); },
  delp(id) {
    const p = A.presets.find((x) => x.id === id); if (!p) return;
    if (!window.confirm(`Delete “${p.name}”?`)) return;
    A.presets = A.presets.filter((x) => x.id !== id); A.favorites = A.favorites.filter((k) => k !== id); save(); renderPage('presets');
  },
  loadr(id) { const r = A.recents.find((x) => x.id === id); if (!r) return; applyPreset(r, { keepVolume: true }); renderAll(); goTo(SOURCE_PAGE[r.source]); },
  playr(id) { const r = A.recents.find((x) => x.id === id); if (!r) return; applyPreset(r, { keepVolume: true }); play(r.source); },
  clearrecent() { A.recents = []; save(); renderPage('presets'); },
  sweep: (k) => Tools.startSweep(k),
  canthear: () => Tools.cantHear(),
  cancelsweep: () => Tools.cancel(),
  clearhear: () => Tools.clear(),
  speaker: (k) => Tools.toggleSpeaker(k),
  quick(m) { A.state.sessionMinutes = +m; if (A.isPlaying) startTimer(); save(); renderPage('timer'); renderPage('schumann'); renderMini(); },
  awake() { A.keepAwake = !A.keepAwake; save(); updateWakeLock(); renderPage('timer'); },
  lib(id) {
    const e = LIBRARY.find((x) => x.id === id); if (!e || UI.libFlash) return;
    const i = $('#libq'); if (i) i.blur();
    Snd.unlock(); Haptic.tick();
    UI.libFlash = id; renderLibList();
    setTimeout(() => { playLibrary(e); setTimeout(() => { UI.libFlash = null; renderLibList(); }, 450); }, 280);
  },
  libcat(c) { UI.libCat = c && UI.libCat !== c ? c : null; renderLibList(); const b = $('#liblist'); if (b) b.scrollTop = 0; },
  libstar(id) { toggleFav('library:' + id); renderLibList(); renderPage('presets'); },
  libinfo: () => openLibInfo(),
  replayintro: () => Intro.replay(),
  libclear() { UI.libQuery = ''; const i = $('#libq'); if (i) { i.value = ''; i.focus(); } $('.lsearch').classList.remove('q'); renderLibList(); },
  libdone() { const i = $('#libq'); if (i) i.blur(); },
};
const PILL = {
  'viz.amb'(v) { VP.set('amb', v); return 'none'; },
  'viz.preset'(v) { applyVizPreset(v); return 'none'; },
  'tone.wave'(v) { A.state.tone.waveform = v; edited('tone'); },
  'bin.mode'(v) { A.state.binaural.linked = v === 'linked'; edited(null, true); },
  'bin.target'(v) { UI.binTarget[A.state.binaural.linked ? 'linked' : 'free'] = v; },
  'sch.engine'(v) { A.state.schumann.engine = v; edited('schumann'); },
  'pulse.mode'(v) { A.state.pulse.mode = v; edited('pulse'); },
  'mood.amb'(v) { const st = A.state, k = st.moods.selected; st.moods.levels[k] = Object.assign(moodLevels(st, k), { ambience: v }); edited('mood'); },
  bed(v) { A.state.noise = v; edited(null, true); return 'all'; },
  session(v) { A.state.sessionMinutes = +v; if (A.isPlaying) startTimer(); save(); return 'all'; },
  fade(v) { A.state.fadeSeconds = +v; save(); },
  'tools.ear'(v) { Tools.ear = v; },
  a4(v) { A.a4 = +v; save(); },
};

// ===================================================================== gestures
let suppressClick = false;
document.addEventListener('click', (e) => {
  if (suppressClick) { suppressClick = false; e.preventDefault(); e.stopPropagation(); return; }
  if (moodPtr && moodPtr.moved && e.target.closest && e.target.closest('.moodwin')) {
    moodPtr = null; e.preventDefault(); e.stopPropagation(); return;
  }
  if (UI.ambOpen && !(e.target.closest && e.target.closest('#mini'))) { UI.ambOpen = false; renderMini(); }
  const pillEl = e.target.closest('[data-pill] > [data-v]');
  if (pillEl) {
    const id = pillEl.parentElement.dataset.pill, v = pillEl.dataset.v;
    if (PILL[id]) { const r = PILL[id](v); if (r === 'all') renderAll(); else if (r !== 'none') refreshAfterEdit(); }
    return;
  }
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a.dataset.arg, a); }
});
// Sliders, rulers, nudges, long-press: pointer events (touch-action:none keeps the pager still).
let drag = null, nudgeT = 0, pressT = 0;
document.addEventListener('pointerdown', (e) => {
  // iOS can suspend the context (calls, Siri, background); any tap tries to resume it.
  if (Snd.ctx && Snd.ctx.state !== 'running' && (A.isPlaying || A.toolStarted)) Snd.ctx.resume().catch(() => {});
  const sl = e.target.closest('[data-slider]');
  if (sl) { e.preventDefault(); drag = { type: 'slider', el: sl, id: sl.dataset.slider }; sl.setPointerCapture(e.pointerId); sliderMove(e); return; }
  const ru = e.target.closest('[data-ruler]');
  if (ru) {
    e.preventDefault(); drag = { type: 'ruler', el: ru, id: ru.dataset.ruler, x: e.clientX, t: e.timeStamp };
    ru.setPointerCapture(e.pointerId); return;
  }
  const nu = e.target.closest('[data-nudge]');
  if (nu) {
    e.preventDefault();
    const id = nu.dataset.nudge, dir = +nu.dataset.dir;
    const t0 = performance.now();
    // Page-4 carrier spans 60-400 Hz: holding +/- accelerates (1 -> 2 -> 5 Hz steps) so a sweep takes seconds.
    const accel = () => { if (id !== 'sch.carrier') return 1; const h = performance.now() - t0; return h < 900 ? 1 : h < 1800 ? 2 : 5; };
    const once = () => { const c = ctrl(id); if (!c) return; const s = (stepOf[id] || c.step || 1) * accel(); setCtrl(id, cl(Math.round((c.get() + dir * s) / s) * s, c.range[0], c.range[1])); };
    once(); drag = { type: 'nudge', id };
    clearTimeout(nudgeT); nudgeT = setTimeout(function rep() { once(); nudgeT = setTimeout(rep, 70); }, 420);
    return;
  }
  const row = e.target.closest('[data-lib]');
  if (row) {
    const id = row.dataset.lib, x0 = e.clientX, y0 = e.clientY;
    clearTimeout(pressT);
    pressT = setTimeout(() => { suppressClick = true; const en = LIBRARY.find((x) => x.id === id); if (en) openLibDetail(en); if (navigator.vibrate) navigator.vibrate(10); }, 520);
    drag = { type: 'press', x0, y0 };
  }
}, { passive: false });
function sliderMove(e) {
  const c = ctrl(drag.id); if (!c) return;
  const r = drag.el.getBoundingClientRect();
  const t = cl((e.clientX - r.left - 13.5) / Math.max(1, r.width - 27), 0, 1);
  setCtrl(drag.id, c.range[0] + t * (c.range[1] - c.range[0]));
}
document.addEventListener('pointermove', (e) => {
  if (!drag) return;
  if (drag.type === 'slider') sliderMove(e);
  else if (drag.type === 'ruler') {
    const dx = e.clientX - drag.x, dt = Math.max(1 / 240, (e.timeStamp - drag.t) / 1000);
    if (dx === 0) return;
    drag.x = e.clientX; drag.t = e.timeStamp;
    const speed = Math.abs(dx) / dt, c = ctrl(drag.id);
    const step = speed < 80 ? 0.01 : speed < 300 ? 0.1 : speed < 900 ? 1 : (c.get() > 2000 ? 25 : 5);
    setCtrl(drag.id, c.get() - dx * step);
  } else if (drag.type === 'press') {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 10) { clearTimeout(pressT); drag = null; }
  }
});
function endDrag() {
  clearTimeout(nudgeT); clearTimeout(pressT);
  if (!drag) return;
  const d = drag; drag = null;
  if (d.type !== 'press') { renderPage(A.page); renderMini(); }
}
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);
document.addEventListener('contextmenu', (e) => {
  const row = e.target.closest('[data-lib]');
  if (row) { e.preventDefault(); const en = LIBRARY.find((x) => x.id === row.dataset.lib); if (en && !suppressClick) openLibDetail(en); }
});
// Library search field.
document.addEventListener('input', (e) => {
  if (e.target.id !== 'libq') return;
  UI.libQuery = e.target.value; e.target.closest('.lsearch').classList.toggle('q', !!UI.libQuery);
  renderLibList(); const l = $('#liblist'); if (l) l.scrollTop = 0;
});
document.addEventListener('keydown', (e) => { if (e.target.id === 'libq' && e.key === 'Enter') e.target.blur(); });
document.addEventListener('focusin', (e) => { if (e.target.id === 'libq') $('.libsearch').classList.add('lib-focus'); });
document.addEventListener('focusout', (e) => {
  if (e.target.id === 'libq') { const s = $('.libsearch'); if (s) s.classList.remove('lib-focus'); }
  setTimeout(() => window.scrollTo(0, 0), 50); // iOS can leave the layout viewport shifted
});
// Keyboard: the list adds room for the part of the keyboard that covers it.
function onViewport() {
  const vv = window.visualViewport; if (!vv) return;
  const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  const mini = $('#mini') ? $('#mini').offsetHeight : 0;
  UI.kbPad = Math.max(0, kb - mini);
  const p = document.querySelector('.kbpad'); if (p) p.style.height = UI.kbPad + 'px';
}
if (window.visualViewport) { visualViewport.addEventListener('resize', onViewport); visualViewport.addEventListener('scroll', onViewport); }

// ===================================================================== pager
function onScroll() {
  const pager = $('#pager'), h = pager.clientHeight || 1;
  const i = cl(Math.round(pager.scrollTop / h), 0, PAGES.length - 1);
  setPage(PAGES[i].key);
}
let scrollRaf = 0;
function initPager() {
  const pager = $('#pager');
  pager.innerHTML = PAGES.map((p) => `<section class="pg" aria-label="${esc(p.title)}"><div class="page" id="page-${p.key}"></div></section>`).join('');
  pager.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; onScroll(); }); }, { passive: true });
  window.addEventListener('resize', () => { const i = pageIndex(A.page); pager.scrollTop = i * pager.clientHeight; onViewport(); });
}

// ===================================================================== animation
const ringVis = {
  breath: 0.4, energy: 0.22, tint: freqTint(200, SCHUMANN, 0), beatPhase: 0, shimmer: 0.42,
  rmsFast: 0, rmsSlow: 0.02, bands: new Float32Array(VIS_BANDS), bandInst: new Float32Array(VIS_BANDS),
};
const moodVis = {
  breath: 0.4, energy: 0.22, tint: freqTint(120, 2, 0), beatPhase: 0, shimmer: 0.42,
  rmsFast: 0, rmsSlow: 0.02, bands: new Float32Array(VIS_BANDS), bandInst: new Float32Array(VIS_BANDS),
};
const RING_STATE_MOODS = newRingState();
const approach = (o, k, target, dt, att, rel) => { const tau = target > o[k] ? att : rel; o[k] += (target - o[k]) * (1 - Math.exp(-dt / tau)); };
const lv = { v: 0 };
let lastT = 0;
function effFreq(src) {
  const s = snapshot();
  if (!A.tool && src === 'tone') { const w = A.state.tone.waveform; return s.f1 * (w === 'square' || w === 'sawtooth' ? 3 : w === 'triangle' ? 1.5 : 1); }
  return s.f1;
}
function pageFreq(key) {
  const st = A.state;
  return { tone: st.tone.frequency, binaural: st.binaural.left, pulse: st.pulse.carrier }[key] || 200;
}
// Opening ring: about 88% of the viewport width on a phone, never wider than the column.
function layoutRing(stage) {
  const flex = stage && stage.parentElement;
  if (!flex) return;
  const availW = flex.clientWidth;
  if (availW < 8) return;
  const vw = window.innerWidth || availW;
  const size = Math.floor(Math.min(availW, vw * 0.9));
  if (stage._sz !== size) {
    stage._sz = size;
    stage.style.width = size + 'px';
    stage.style.height = size + 'px';
  }
  if (flex._sz !== size) {
    flex._sz = size;
    flex.style.height = size + 'px';
    flex.style.minHeight = size + 'px';
    flex.style.flex = 'none';
  }
}
// RMS plus spectrum from the master-output analyser. Smoothed here so color and
// size ease, while the beat-rate shimmer stays in the draw.
function readMasterLevel(vis) {
  const an = Snd.anBreath, time = Snd.breathBuf;
  if (!an || !time) return 0;
  an.getFloatTimeDomainData(time);
  if (Snd.freqBuf && Snd.bandLo) {
    an.getByteFrequencyData(Snd.freqBuf);
    fillSpectrum(Snd.freqBuf, Snd.bandLo, Snd.bandHi, vis.bandInst);
  }
  let s = 0;
  const n = time.length;
  for (let i = 0; i < n; i += 2) { const v = time[i]; s += v * v; }
  return Math.sqrt(s / (n >> 1));
}
function updateRingAudio(dt) {
  const sc = A.state.schumann;
  const beat = sc.tone != null ? (sc.shimmer ? SCHUMANN : 0) : sc.beat;
  const carrier = sc.tone != null ? sc.tone : sc.carrier;
  updateVisAudio(ringVis, carrier, beat, dt);
  // Page 4 controls -> rosette shape targets, eased ~0.6 s so nothing snaps.
  const ENG_OFF = { binaural: [1 / 3, 2 / 3], monaural: [0.5, 0], isochronic: [0.1, 0.2] }; // layer phase (turns)
  const eng = sc.tone != null ? (sc.shimmer ? 'binaural' : 'monaural') : (ENG_OFF[sc.engine] ? sc.engine : 'binaural');
  const nz = A.state.noise, lvl = nz !== 'off' ? (A.state.noiseLevel || 0) : 0;
  const HALO = { off: 0, brown: 0.35, pink: 0.65, white: 1 };              // noise colour -> glow halo width
  const FLOW = { rain: 1.8, ocean: 0.55, wind: 1.35, stream: 1.15 };        // nature -> wave travel speed
  const T = { off1: ENG_OFF[eng][0], off2: ENG_OFF[eng][1], depth: A.state.toneLevel != null ? A.state.toneLevel : 0.8,
    halo: (HALO[nz] != null ? HALO[nz] : 0.5) * (0.4 + 0.6 * lvl), flow: FLOW[nz] || 1, nat: FLOW[nz] ? lvl : 0 };
  const pv = ringVis.pv || (ringVis.pv = Object.assign({}, T));
  for (const k in T) approach(pv, k, T[k], dt, 0.6, 0.6);
  ringVis.edgePh = (ringVis.edgePh + dt * (0.25 + 1.1 * ringVis.edgeU) * (pv.flow - 1)) % TAU; // extra flow from nature
  // Page-4 carrier follower, second-order (two chained ~0.45 s eases) so an abrupt carrier jump starts and
  // ends its morph softly, with no kink; shape, opening and spin all read p4U.
  const eu4 = cl(Math.log(cl(carrier || 200, 20, 20000) / 60) / Math.log(400 / 60), 0, 1); // 60 -> 0, 400 Hz (cap) -> 1
  if (ringVis.p4Ua == null) { ringVis.p4Ua = eu4; ringVis.p4U = eu4; }
  approach(ringVis, 'p4Ua', eu4, dt, 0.45, 0.45); approach(ringVis, 'p4U', ringVis.p4Ua, dt, 0.45, 0.45);
  // Trace phases, integrated (phase += speed * dt). Each is used with factor 1 in the draw, so wrapping at
  // TAU is invisible (v9 multiplied a wrapped edgePh by 0.4-1.7, which snapped the loops at every wrap).
  const P4R = [0.5, 1, -0.4, -1.3, -0.6, -1.7], sp = (0.25 + 1.1 * ringVis.p4U) * (0.6 + 0.4 * pv.flow);
  const ph4 = ringVis.p4Ph || (ringVis.p4Ph = [0, 0, 0, 0, 0, 0]);
  const mvp = 0.4 + 0.6 * (ringVis.spinE != null ? ringVis.spinE : 1);
  // v12: bounded at 20*PI, not TAU: the trace also uses 0.3 * phase (ring angle), and 0.3 * 20*PI = 6*PI is a
  // whole number of turns, so the wrap is invisible for every term (wrapping at TAU snapped the loops).
  for (let i = 0; i < 6; i++) ph4[i] = (ph4[i] + dt * sp * mvp * P4R[i]) % (20 * Math.PI);
  // Slow non-repeating drift: integrated random walk per layer, smoothed (no fixed period, never loops).
  const dr = ringVis.p4Drift || (ringVis.p4Drift = { v: [0, 0, 0], x: [0, 0, 0] });
  for (let i = 0; i < 3; i++) {
    dr.v[i] += (Math.random() - 0.5) * 0.06 * Math.sqrt(dt) - dr.v[i] * dt * 0.35 - dr.x[i] * dt * 0.02;
    dr.x[i] = cl(dr.x[i] + dr.v[i] * dt, -0.22, 0.22);
  }
  // Main-frequency follower (beat / main Hz set on page 4; 0.5 -> 0, 45 Hz -> 1, log; pure tone -> 0),
  // second-order eased like p4U.
  const bu4 = beat > 0.05 ? cl(Math.log(cl(beat, 0.5, 45) / 0.5) / Math.log(90), 0, 1) : 0;
  if (ringVis.p4Ba == null) { ringVis.p4Ba = bu4; ringVis.p4B = bu4; }
  approach(ringVis, 'p4Ba', bu4, dt, 0.45, 0.45); approach(ringVis, 'p4B', ringVis.p4Ba, dt, 0.45, 0.45);
  // Page-4 layer spin, each integrated from its own speed (no shared beat-only rotation any more):
  //  layer 0 = CARRIER layer, forward, 0.04 rad/s at 60 Hz -> ~0.94 rad/s at 400 Hz;
  //  layer 1 = MAIN-frequency (beat) layer, counter-rotating, ~0.05 rad/s at 1 Hz -> ~1.2 rad/s at 45 Hz;
  //  layer 2 = gentle mix of both, forward, ~0.05 -> ~0.28 rad/s, so it never masks the other two.
  const u0 = ringVis.p4U, u1 = ringVis.p4B, u2 = 0.5 * (u0 + u1);
  if (ringVis.spinE == null) ringVis.spinE = VP.get('spin');
  approach(ringVis, 'spinE', VP.get('spin'), dt, 0.6, 0.6);           // shared Movement (0..2), eased
  const mv = ringVis.spinE;
  // v12.1: the main frequency (beat) no longer changes any layer size; it drives SPIN instead. Beat-led
  // layer: log-log map, ~0.05 rad/s at 1 Hz -> ~1.2 rad/s at 45 Hz (x24), second-order eased (no snap).
  // The mixed layer's spin scales with both rates (gentle, ~0.05 -> ~0.28 rad/s). Directions unchanged.
  const bs4 = beat > 0.05 ? cl(Math.log(cl(beat, 1, 45)) / Math.log(45), 0, 1) : 0;
  if (ringVis.p4Sa == null) { ringVis.p4Sa = bs4; ringVis.p4S = bs4; }
  approach(ringVis, 'p4Sa', bs4, dt, 0.45, 0.45); approach(ringVis, 'p4S', ringVis.p4Sa, dt, 0.45, 0.45);
  const wC = 0.04 + 0.9 * Math.pow(u0, 1.2), wB = 0.05 * Math.pow(24, ringVis.p4S);
  const W = [wC * mv, -wB * mv, (0.04 + 0.1 * wC + 0.12 * wB) * mv];
  const vi = ringVis.vzIn || (ringVis.vzIn = {});                       // reused object: no per-frame garbage
  vi.cu = u0; vi.bu = u1; vi.buSize = 0.5; // v12.1: beat sets spin only, never size, on page 4 vi.tone = pv.depth; vi.nat = A.state.noise; vi.natLevel = A.state.noise !== 'off' ? (A.state.noiseLevel || 0) : 0; vi.music = vi.natLevel;
  const q = ringVis.p4Rots || (ringVis.p4Rots = [0, Math.PI / 5, 0]);
  for (let i = 0; i < 3; i++) q[i] = (q[i] + dt * W[i]) % TAU;
  ringVis.p4W = W;
}
// Speed of the pulse rings that expand from the centre (radius units per second; a ring travels 0.88).
// Beat present: power map, Still 1 Hz ~25 s, Sleep 2 Hz ~20 s, Meditate 7.83 Hz ~6.5 s, Active 20 Hz ~3 s, Spark 40 Hz ~2.2 s.
// Pure tone: log map 20–2000 Hz onto the same 0.035–0.40 range (432 Hz ~3.2 s).
const PULSE_MIN = 0.035, PULSE_MAX = 0.40;
function pulseSpeedFor(carrier, beat) {
  if (beat > 0.05) return cl(0.044 * Math.pow(beat / 2, 0.824), PULSE_MIN, PULSE_MAX);
  const u = cl(Math.log(cl(carrier || 200, 20, 2000) / 20) / Math.log(100), 0, 1);
  return PULSE_MIN + (PULSE_MAX - PULSE_MIN) * u;
}
// Centre pulse period (s) = time a pulse ring takes to cross (0.88 / pulseSpeedFor), clamped 2–26 s.
// Beat present: 20 * (2 / beat)^0.824 (Still ~25 s, Sleep 20 s, 7.83 Hz ~6.5 s, Active ~3 s, Spark ~2.2 s);
// pure tone: the same log map of 20–2000 Hz as the pulse rings (432 Hz ~3.2 s).
function pulsePeriodFor(carrier, beat) {
  return cl(0.88 / pulseSpeedFor(carrier, beat), 2, 26);
}
// Shared by the Resonance ring and the moods page; each passes its own vis state, carrier and beat.
function updateVisAudio(ringVis, carrier, beat, dt) {
  const live = Snd.ready && (A.isPlaying || A.toolStarted || A.stats.env > 0.01);
  const rms = live ? readMasterLevel(ringVis) : 0;
  // Fast envelope catches swells (rain, waves). Slow enough that a 7.83 Hz beat does not pump the disc.
  approach(ringVis, 'rmsFast', rms, dt, 0.2, 0.4);
  approach(ringVis, 'rmsSlow', Math.max(rms, 0.001), dt, 1.5, 1.5);
  const shaped = Math.pow(cl(ringVis.rmsSlow / 0.16, 0, 1), 0.7);
  const gust = cl((ringVis.rmsFast - ringVis.rmsSlow) / (ringVis.rmsSlow + 0.025), 0, 1.2);
  const energyTarget = 0.22 + (live ? 0.78 * Math.max(shaped, gust) : 0);
  approach(ringVis, 'energy', energyTarget, dt, 0.26, 0.75);
  approach(ringVis, 'breath', live ? (0.4 + 0.6 * shaped) : 0.42, dt, 0.55, 1);
  const bands = ringVis.bands, inst = ringVis.bandInst;
  if (live && Snd.freqBuf) {
    for (let i = 0; i < VIS_BANDS; i++) {
      const target = inst[i], cur = bands[i];
      const tau = target > cur ? 0.09 : 0.42;
      bands[i] = cur + (target - cur) * (1 - Math.exp(-dt / tau));
    }
  } else {
    const decay = Math.exp(-dt / 0.7);
    for (let i = 0; i < VIS_BANDS; i++) bands[i] *= decay;
  }
  ringVis.pulseSpeed = pulseSpeedFor(carrier, beat);
  ringVis.pulsePeriod = pulsePeriodFor(carrier, beat);
  ringVis.pulsePh = ((ringVis.pulsePh || 0) + dt / ringVis.pulsePeriod) % 1;
  // Petal motion (page 4): each layer spins at its own rate per pulse period, so all of them speed up
  // with the frequency (angles accumulate, never snap): outer slow, middle counter-rotating, inner fastest.
  const pr = ringVis.petalRots || (ringVis.petalRots = [0, Math.PI / 5, 0]);
  const per = ringVis.pulsePeriod;
  pr[0] = (pr[0] + dt * 0.5 / per) % TAU; pr[1] = (pr[1] - dt * 0.8 / per) % TAU; pr[2] = (pr[2] + dt * 1.4 / per) % TAU;
  ringVis.petalRot = pr[0];
  // Petal edge sine (page 4) follows the carrier: log map 60 Hz -> 0 (few long, full undulations)
  // .. 1200 Hz -> 1 (many short ones, still a pure sine), eased ~0.6 s; its phase travels along the edge.
  const eu = cl(Math.log(cl(carrier || 200, 20, 20000) / 60) / Math.log(20), 0, 1);
  if (ringVis.edgeU == null) ringVis.edgeU = eu; else approach(ringVis, 'edgeU', eu, dt, 0.6, 0.6);
  ringVis.edgePh = ((ringVis.edgePh || 0) + dt * (0.25 + 1.1 * ringVis.edgeU)) % TAU;
  // Shape morph: 0 = slow/round, 1 = fast/slender, eased over ~0.6 s.
  const slim = cl(1 - Math.log(per / 2) / Math.log(13), 0, 1);
  if (ringVis.petalSlim == null) ringVis.petalSlim = slim; else approach(ringVis, 'petalSlim', slim, dt, 0.6, 0.6);
  const rate = beat > 0.05 ? Math.min(beat, 14) : 0;
  ringVis.beatPhase = (ringVis.beatPhase + (rate > 0 ? rate : 1 / 5.5) * dt) % 1;
  approach(ringVis, 'tint', freqTint(carrier, beat, shaped), dt, 0.9, 1.25);
  ringVis.shimmer = live ? (0.4 + 0.6 * Math.max(shaped, 0.2)) : 0.45;
}
function frame(t) {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60; lastT = t; // v12: clamp 50 ms (a stall never turns into a big jump)
  const live = Snd.ready && (A.isPlaying || A.toolStarted || A.stats.env > 0);
  approach(lv, 'v', live ? A.stats.peak : 0, dt, 0.08, 0.6);
  A.level = lv.v;
  const pageEl = document.getElementById('page-' + A.page); if (!pageEl) return;
  // Waveform scope (yellow → orange → red with level and pitch).
  for (const cv of pageEl.querySelectorAll('[data-scope]')) {
    const w = cv.clientWidth, h = +cv.dataset.scope; if (!w) continue;
    const showR = A.page === 'binaural';
    let L, R, heat;
    if (live && Snd.anL) {
      Snd.anL.getFloatTimeDomainData(Snd.bufL); Snd.anR.getFloatTimeDomainData(Snd.bufR);
      const f1 = Math.max(1, snapshot().f1), win = Math.round(cl(Snd.sampleRate * 3 / f1, 256, 2048));
      let start = 0; const lim = Snd.bufL.length - win;
      for (let i = 1; i < lim; i++) if (Snd.bufL[i - 1] < 0 && Snd.bufL[i] >= 0) { start = i; break; }
      L = Snd.bufL.subarray(start, start + win); R = showR ? Snd.bufR.subarray(start, start + win) : null;
      heat = heatValue(A.level, effFreq(A.activeSource));
    } else {
      // Idle: a dim preview of this page's own wave.
      const f = pageFreq(A.page), b = A.state.binaural, ph = t / 1000;
      const amp = 0.12 + 0.02 * Math.sin(ph * 1.3);
      const sm = samples((x) => {
        if (A.page === 'binaural') return [amp * Math.sin(2 * Math.PI * b.left * x + ph), amp * Math.sin(2 * Math.PI * b.right * x + ph)];
        const v = amp * Math.sin(2 * Math.PI * f * x + ph); return [v, v];
      }, f);
      L = sm.L; R = showR ? sm.R : null; heat = 0;
    }
    drawScope(cv, w, h, L, R, A.level, heat);
  }
  for (const ru of pageEl.querySelectorAll('[data-ruler]')) {
    const c = ctrl(ru.dataset.ruler); const cv = ru.querySelector('canvas'); const w = ru.clientWidth;
    if (c && w) drawRuler(cv, w, c.get(), c.range[0], c.range[1]);
  }
  // Ambient bed: level/type follow the shared mix; its analyser feeds both visualizers.
  Amb.tick(dt, A.isPlaying && !A.tool, (A.timerGain != null ? A.timerGain : 1) * (A.soft || 1));
  // Visual pages: draw page 1 and page 4 whenever any part of them is on screen (also mid-swipe), so a
  // page never freezes while it slides in or out. Reads (rects) first, then writes, to avoid layout thrash.
  const vh = window.innerHeight || 844;
  const pM = document.getElementById('page-moods'), pS = document.getElementById('page-schumann');
  const onM = pM && (A.page === 'moods' || (() => { const r = pM.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; })());
  const onS = pS && (A.page === 'schumann' || (() => { const r = pS.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; })());
  const ocv = onM ? pM.querySelector('[data-orb]') : null;
  if (ocv) {
    const box = ocv.parentElement;
    layoutRing(box);
    const m = moodOf(A.state.moods.selected), lvm = moodLevels(A.state, m.key);
    if (box.clientWidth && box.clientHeight) {
      // Same visualizer as the Resonance page, fed by the selected mood.
      updateVisAudio(moodVis, m.pure ? m.hz : m.carrier, m.pure ? 0 : m.beat, dt);
      const car = m.pure ? m.hz : m.carrier, bt = m.pure ? 0 : m.beat;
      if (moodVis.spinE == null) moodVis.spinE = VP.get('spin');
      approach(moodVis, 'spinE', VP.get('spin'), dt, 0.6, 0.6);
      const vi = moodVis.vzIn || (moodVis.vzIn = {});
      vi.cu = cl(Math.log(Math.max(1, car) / 100) / Math.log(2.6), 0, 1);
      vi.bu = bt > 0.05 ? cl(Math.log(cl(bt, 0.5, 45) / 0.5) / Math.log(90), 0, 1) : 0;
      vi.tone = cl(((lvm.tone != null ? lvm.tone : m.tone) - 0.2) / 0.3, 0, 1); vi.music = cl(lvm.music != null ? lvm.music : m.music, 0, 1);
      vi.nat = lvm.ambience || 'off'; vi.natLevel = lvm.ambience && lvm.ambience !== 'off' ? (lvm.ambienceLevel || 0) : 0;
      useRingState(RING_STATE_MOODS);
      drawLivingRing(ocv, box.clientWidth, box.clientHeight, moodVis, dt); // ring mode, always
      useRingState(RING_STATE_MAIN);
    }
  }
  const rcv = onS ? pS.querySelector('[data-ring]') : null;
  if (rcv) {
    const stage = rcv.parentElement;
    layoutRing(stage);
    updateRingAudio(dt, t);
    const w = stage.clientWidth, h = stage.clientHeight;
    if (w && h) {
      drawOpeningField(rcv, w, h, ringVis, dt); // page 4 is always the petal flower; it follows the frequency
    }
  }
  const hb = pageEl.querySelector('[data-hbar]');
  if (hb) drawHearingBar(hb);
}
function drawHearingBar(cv) {
  const w = cv.clientWidth, h = 34; if (!w) return;
  const g = setupCanvas(cv, w, h), ax = (f) => Math.log(cl(f, 20, 20000) / 20) / Math.log(1000);
  const rr = (x, y, ww, hh, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, ww, hh, r); else g.rect(x, y, ww, hh); g.fill(); };
  g.fillStyle = '#262626'; rr(0, 8, w, 8, 4);
  const r = Tools.results[Tools.ear];
  if (r && (r.low != null || r.high != null)) { const a = ax(r.low ?? 20) * w, b = ax(r.high ?? 20000) * w; g.fillStyle = 'rgba(255,199,31,.75)'; rr(a, 8, Math.max(4, b - a), 8, 4); }
  g.font = '500 9px -apple-system, system-ui, sans-serif'; g.fillStyle = '#949494'; g.textBaseline = 'top';
  [[20, '20'], [100, '100'], [1000, '1k'], [10000, '10k'], [20000, '20k']].forEach(([hz, l]) => { const x = ax(hz) * w; g.strokeStyle = 'rgba(148,148,148,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 18); g.lineTo(x, 22); g.stroke(); g.textAlign = hz <= 20 ? 'left' : hz >= 20000 ? 'right' : 'center'; g.fillText(l, x, 23); });
  if (Tools.sweep) { const x = ax(Tools.frequency) * w; g.fillStyle = '#FFC71F'; g.beginPath(); g.arc(x, 12, 6, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(x, 12, 2.5, 0, 7); g.fill(); }
}


// ===================================================================== vertical drag tuning (big number)
// Press the number and drag: above the press point raises it, below lowers it. The farther from
// the press point, the bigger and faster the steps (0.01 Hz near it). Tap without moving = keypad.
const Haptic = {
  last: 0, label: null,
  tick() {
    const now = performance.now(); if (now - this.last < 45) return; this.last = now;
    if (navigator.vibrate) { try { navigator.vibrate(4); } catch (e) {} return; }
    // iOS Safari 18+: toggling a hidden <input switch> gives a light system haptic.
    if (!this.label) {
      const l = document.createElement('label'); l.setAttribute('aria-hidden', 'true');
      l.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0';
      l.innerHTML = '<input type="checkbox" switch tabindex="-1">'; document.body.appendChild(l); this.label = l;
    }
    try { this.label.click(); } catch (e) {}
  },
};
let vd = null;
function vdTier(d, hi) {
  if (d < 8) return null;
  const k = (a, b, x0, x1) => a + (b - a) * cl((d - x0) / (x1 - x0), 0, 1);
  if (d < 45) return { step: 0.01, rate: k(3, 18, 8, 45) };
  if (d < 95) return { step: 0.1, rate: k(4, 16, 45, 95) };
  if (d < 150) return { step: 1, rate: k(4, 16, 95, 150) };
  return hi > 100 ? { step: 10, rate: k(6, 20, 150, 260) } : { step: 1, rate: k(16, 30, 150, 260) };
}
function vdLoop() {
  if (!vd) return;
  const now = performance.now(), dt = Math.min(0.05, (now - vd.lastT) / 1000); vd.lastT = now;
  const c = ctrl(vd.id); const off = vd.y0 - vd.y, sign = Math.sign(off);
  const tier = c && vdTier(Math.abs(off), c.range[1]);
  const hint = document.getElementById('vhint');
  if (tier) {
    vd.acc += tier.rate * dt;
    let changed = false;
    while (vd.acc >= 1) {
      vd.acc -= 1;
      const v = c.get(), nv = cl(Math.round((v + sign * tier.step) / tier.step) * tier.step, c.range[0], c.range[1]);
      if (Math.abs(nv - v) < 1e-9) break;
      setCtrl(vd.id, nv); changed = true;
    }
    if (changed) Haptic.tick();
    if (hint) hint.textContent = `${sign > 0 ? '▲' : '▼'} ${F.step(tier.step)} Hz steps · farther = faster`;
  } else { vd.acc = 0; if (hint) hint.textContent = 'drag up to raise · down to lower'; }
  vd.raf = requestAnimationFrame(vdLoop);
}
function vdStart(e, el) {
  vd = { id: el.dataset.vdrag, el, x0: e.clientX, y0: e.clientY, y: e.clientY, t0: e.timeStamp, moved: false, acc: 0, lastT: performance.now() };
  try { el.setPointerCapture(e.pointerId); } catch (err) {}
  el.classList.add('active');
  vd.raf = requestAnimationFrame(vdLoop);
}
function vdEnd(e, cancelled) {
  const d = vd; vd = null; cancelAnimationFrame(d.raf);
  d.el.classList.remove('active');
  const tap = !cancelled && !d.moved && e.timeStamp - d.t0 < 450;
  const hint = document.getElementById('vhint'); if (hint) hint.textContent = 'drag the number ↕ to tune · tap to type';
  if (tap) openKeypad(d.id); else { renderPage(A.page); renderMini(); }
}
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('[data-vdrag]');
  if (!el) return;
  e.preventDefault(); e.stopImmediatePropagation(); vdStart(e, el);
}, { capture: true, passive: false });
document.addEventListener('pointermove', (e) => {
  if (!vd) return;
  vd.y = e.clientY;
  if (Math.abs(e.clientY - vd.y0) > 6 || Math.abs(e.clientX - vd.x0) > 6) vd.moved = true;
  e.preventDefault(); e.stopImmediatePropagation();
}, { capture: true, passive: false });
document.addEventListener('pointerup', (e) => { if (vd) { e.stopImmediatePropagation(); vdEnd(e, false); } }, { capture: true });
document.addEventListener('pointercancel', (e) => { if (vd) { e.stopImmediatePropagation(); vdEnd(e, true); } }, { capture: true });
// iOS: a touch that starts on the number (or a slider/ruler) must never scroll the pager.
const NOSCROLL = '[data-vdrag],[data-slider],[data-ruler],[data-nudge]';
let moodPtr = null;
document.addEventListener('pointerdown', (e) => {
  const sc = e.target.closest && e.target.closest('.moodwin');
  if (!sc) { moodPtr = null; return; }
  moodScrollLock = sc.scrollTop;
  moodScrollTop = sc.scrollTop;
  moodPtr = { x: e.clientX, y: e.clientY, moved: false };
}, true);
document.addEventListener('scroll', (e) => {
  const t = e.target;
  if (t && t.classList && t.classList.contains('moodwin')) moodScrollTop = t.scrollTop;
}, true);
document.addEventListener('pointermove', (e) => {
  if (!moodPtr || moodPtr.moved) return;
  if (Math.abs(e.clientY - moodPtr.y) > 8 || Math.abs(e.clientX - moodPtr.x) > 8) moodPtr.moved = true;
}, true);
document.addEventListener('pointerup', () => { if (moodPtr && moodPtr.moved) moodScrollLock = null; }, true);
document.addEventListener('pointercancel', () => { if (moodPtr && moodPtr.moved) moodScrollLock = null; }, true);
document.addEventListener('touchstart', (e) => { if (e.target.closest && e.target.closest('[data-vdrag]')) e.preventDefault(); }, { passive: false });
document.addEventListener('touchmove', (e) => {
  if (e.target.closest && e.target.closest('.moodwin')) { e.stopPropagation(); return; }
}, { capture: true, passive: true });
document.addEventListener('touchmove', (e) => { if (vd || drag || (e.target.closest && e.target.closest(NOSCROLL))) e.preventDefault(); }, { passive: false });
document.addEventListener('wheel', (e) => {
  if (e.target.closest && e.target.closest('.moodwin')) e.stopPropagation();
}, { capture: true, passive: true });

// ===================================================================== voice intro (first open)
const INTRO = {"duration": 18.88, "captions": [{"start": 0.35, "end": 2.14, "text": "Hi, welcome to Biotone."}, {"start": 2.59, "end": 4.08, "text": "This is your space for sound."}, {"start": 4.63, "end": 11.82, "text": "Pick how you want to feel, like calmer, more focused, sleepier, or just in a better mood, tap a button, and listen."}, {"start": 12.32, "end": 14.98, "text": "Headphones make the binaural tones work best."}, {"start": 15.43, "end": 17.32, "text": "Swipe up and down to explore."}, {"start": 17.82, "end": 18.48, "text": "Enjoy."}]};
const Intro = {
  el: null, audio: null, raf: 0, mode: null, idx: -1, t0: 0, timers: [],
  shouldAuto: () => INTRO_ENABLED && !load(LS.intro, false),
  markPlayed() { try { localStorage.setItem(LS.intro, 'true'); } catch (e) {} },
  // The intro is a layer over the live Schumann page.
  prepareStage() {
    const pager = $('#pager'), i = pageIndex('schumann');
    pager.scrollTop = i * pager.clientHeight; setPage('schumann');
    document.body.classList.add('intro-live');
  },
  build(html) {
    if (this.el) this.el.remove();
    const el = document.createElement('div'); el.className = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Welcome');
    el.innerHTML = html; document.body.appendChild(el); this.el = el;
    requestAnimationFrame(() => el.classList.add('on'));
    el.querySelector('[data-skip]').addEventListener('click', (e) => { e.stopPropagation(); this.finish(true); });
    return el;
  },
  showCard() {
    this.prepareStage();
    requestAnimationFrame(() => this.prepareStage()); // after first layout
    const el = this.build(`<button class="iskip" data-skip>Skip</button>
      <div class="icard"><img src="icons/icon-192.png" alt="" width="84" height="84"><div class="ititle">Welcome to Biotone</div>
      <div class="isub">A short spoken welcome, about 20 seconds. Sound on; headphones are best.</div>
      <button class="ibegin" id="ibegin">${I.play}Tap to begin</button></div>`);
    el.querySelector('#ibegin').addEventListener('click', (e) => { e.stopPropagation(); this.begin(); });
  },
  replay() { this.prepareStage(); this.begin(); },
  // Runs inside the user's tap: unlocks audio, starts the page live (ducked) and the voice.
  begin() {
    this.markPlayed();
    this.prepareStage();
    this.build(`<button class="iskip" data-skip>Skip</button><div class="icaps"><div class="icap" id="icap" aria-live="polite"></div><div class="iprog"><i id="iprog"></i></div></div>`);
    A.duck = 0.25;
    Snd.unlock();
    if (!isPlayingSource('schumann')) play('schumann'); else pushAudio();
    this.startVoice();
  },
  startVoice() {
    const a = document.createElement('audio');
    a.setAttribute('playsinline', ''); a.preload = 'auto';
    a.src = a.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? 'audio/intro.m4a' : 'audio/intro.mp3';
    this.audio = a; this.mode = 'file';
    a.addEventListener('ended', () => this.finish());
    a.addEventListener('error', () => { if (this.mode === 'file') this.speak(); });
    const p = a.play();
    if (p && p.catch) p.catch(() => { if (this.mode === 'file') this.speak(); });
    this.loop();
  },
  bestVoice() {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const en = vs.filter((v) => /^en[-_]/i.test(v.lang));
    const pref = [/premium/i, /enhanced/i, /natural/i, /neural/i, /samantha/i, /ava/i, /allison/i, /serena/i, /google us english/i, /google uk english female/i, /karen/i, /moira/i];
    for (const r of pref) { const v = en.find((x) => r.test(x.name)); if (v) return v; }
    return en.find((v) => v.localService) || en[0] || null;
  },
  // Fallback: the browser's own voice, one caption at a time.
  speak() {
    if (this.audio) { try { this.audio.pause(); } catch (e) {} }
    this.mode = 'speech';
    if (!('speechSynthesis' in window)) { this.mode = 'text'; this.t0 = performance.now(); return; }
    speechSynthesis.cancel();
    const voice = this.bestVoice();
    INTRO.captions.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c.text);
      if (voice) u.voice = voice; u.lang = voice ? voice.lang : 'en-US'; u.rate = 0.95; u.pitch = 1;
      u.onstart = () => { this.idx = i; this.showCap(i); this.setProg((i + 0.5) / INTRO.captions.length); };
      if (i === INTRO.captions.length - 1) { u.onend = () => this.finish(); u.onerror = () => this.finish(); }
      speechSynthesis.speak(u);
    });
  },
  showCap(i) { const c = document.getElementById('icap'); if (c && c.dataset.i !== String(i)) { c.dataset.i = i; c.classList.remove('in'); void c.offsetWidth; c.textContent = INTRO.captions[i].text; c.classList.add('in'); } },
  setProg(x) { const p = document.getElementById('iprog'); if (p) p.style.width = (cl(x, 0, 1) * 100).toFixed(1) + '%'; },
  loop() {
    cancelAnimationFrame(this.raf);
    const step = () => {
      if (!this.el) return;
      let t = null;
      if (this.mode === 'file' && this.audio) t = this.audio.currentTime;
      if (this.mode === 'text') t = (performance.now() - this.t0) / 1000;
      if (t != null) {
        let i = -1; INTRO.captions.forEach((c, k) => { if (t >= c.start - 0.15) i = k; });
        if (i >= 0) this.showCap(i);
        this.setProg(t / INTRO.duration);
        if (this.mode === 'text' && t > INTRO.duration) { this.finish(); return; }
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  },
  finish(skipped) {
    if (!this.el) return;
    this.markPlayed();
    cancelAnimationFrame(this.raf);
    if (this.audio) { try { this.audio.pause(); } catch (e) {} this.audio = null; }
    if (this.mode === 'speech' && window.speechSynthesis) speechSynthesis.cancel();
    this.mode = null;
    A.duck = 1; pushAudio();
    const el = this.el; this.el = null;
    el.classList.remove('on'); setTimeout(() => el.remove(), 350);
    document.body.classList.remove('intro-live');
    if (A.page !== 'schumann') goTo('schumann');
    renderAll();
    setTimeout(() => showTip(), 400);
  },
};

// ===================================================================== start
// On open: Schumann 7.83 Hz, binaural on the saved carrier, softly, on the Schumann page.
// Browsers may keep audio suspended until a gesture; then the first touch/click/key/swipe starts it.
function autoStart() {
  const sc = A.state.schumann;
  sc.beat = SCHUMANN; sc.tone = null; sc.label = null; sc.libraryID = null; sc.engine = 'binaural';
  A.activePresetName = null;
  const toSch = () => { const pager = $('#pager'); pager.scrollTop = pageIndex('schumann') * pager.clientHeight; setPage('schumann'); };
  toSch(); requestAnimationFrame(toSch);
  play('schumann', { soft: true });
  const evs = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown', 'wheel'];
  let hint = null;
  const done = () => { evs.forEach((t) => document.removeEventListener(t, kick, true)); if (hint) { hint.classList.remove('on'); setTimeout(() => hint && hint.remove(), 300); } };
  const kick = () => {
    Snd.unlock().then(() => pushAudio());
    if (Snd.silentEl && Snd.silentEl.paused) Snd.silentEl.play().catch(() => {});
    if (Snd.ctx && Snd.ctx.state === 'running') done();
    else if (Snd.ctx) Snd.ctx.resume().then(() => { if (Snd.ctx.state === 'running') done(); }).catch(() => {});
  };
  evs.forEach((t) => document.addEventListener(t, kick, { capture: true, passive: true }));
  setTimeout(() => {
    if (Snd.ctx && Snd.ctx.state === 'running') { done(); return; }
    if (!A.isPlaying) return;
    hint = document.createElement('div'); hint.className = 'starthint'; hint.setAttribute('role', 'status');
    hint.innerHTML = `${I.head}<span>Tap anywhere to start sound</span>`;
    document.body.appendChild(hint); requestAnimationFrame(() => hint && hint.classList.add('on'));
    if (Snd.ctx && Snd.ctx.state === 'running') done();
  }, 400);
}
function init() {
  initPager();
  renderAll();
  A.page = 'moods'; renderDots();
  setInterval(timerTick, 250);
  requestAnimationFrame(frame);
  setTimeout(revealSelectedMood, 300);
  document.addEventListener('visibilitychange', () => {
    updateWakeLock();
    if (!document.hidden && Snd.ctx && Snd.ctx.state !== 'running' && (A.isPlaying || A.toolStarted)) Snd.ctx.resume().catch(() => banner('Tap ▶ to resume audio', 3000));
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // One relaunch gets the newest build: check on launch and whenever the app comes back to the
    // foreground; when a new worker takes over, reload (deferred while sound is playing).
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) swReloadPending = true; });
  }
  updateMediaSession();
  if (Intro.shouldAuto()) Intro.showCard(); else autoStart();
  onViewport();
}
window.__biotone = window.__freqium = { Intro, A, Snd, snapshot, libFilter, libSections, goTo, play, stop, ctrl, setCtrl, Tools, STARTERS, save, ringVis, ringParticleCount };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
