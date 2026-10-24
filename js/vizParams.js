// Shared visual-mix parameters for page 1 (Moods) and page 4 (Resonance). One store, persisted in
// localStorage, read live by both renderers every frame; a change on either page shows on both.
const VIZ_DEFAULTS = { layers: 1, spin: 1, circles: 4, cspeed: 1, amb: 'off', ambLevel: 0.4, style: 'rings' };
const VIZ_STYLES = [['rings', 'Rings'], ['cymatics', 'Cymatics'], ['water', 'Water']];
const VIZ_RANGES = { layers: [0, 4], spin: [0, 2], circles: [0, 12], cspeed: [0.25, 3], ambLevel: [0, 1] };
const AMB_TYPES = [['off', 'Off'], ['pink', 'Pink'], ['brown', 'Brown'], ['white', 'White'], ['waterfall', 'Waterfall'],
  ['rain', 'Rain'], ['ocean', 'Ocean'], ['wind', 'Wind'], ['drone', 'Drone'], ['pads', 'Pads']];
const VP = {
  KEY: 'freqium.viz',
  v: Object.assign({}, VIZ_DEFAULTS),
  subs: [],
  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      if (raw && typeof raw === 'object') for (const k in VIZ_DEFAULTS) if (raw[k] !== undefined) this.v[k] = raw[k];
    } catch (e) {}
    this.clean();
  },
  clean() {
    for (const k in VIZ_RANGES) { const [a, b] = VIZ_RANGES[k]; let x = +this.v[k]; if (!isFinite(x)) x = VIZ_DEFAULTS[k]; this.v[k] = Math.min(b, Math.max(a, x)); }
    this.v.layers = Math.round(this.v.layers); this.v.circles = Math.round(this.v.circles);
    if (!AMB_TYPES.some(([k]) => k === this.v.amb)) this.v.amb = 'off';
    if (this.v.style === 'liquid' || this.v.style === 'ripple') this.v.style = 'water';
    if (!VIZ_STYLES.some(([k]) => k === this.v.style)) this.v.style = 'rings';
  },
  get(k) { return this.v[k]; },
  set(k, val) {
    if (!(k in VIZ_DEFAULTS)) return;
    const old = this.v[k]; this.v[k] = val; this.clean();
    if (this.v[k] === old) return;
    try { localStorage.setItem(this.KEY, JSON.stringify(this.v)); } catch (e) {}
    for (const f of this.subs) { try { f(k, this.v[k]); } catch (e) {} }
  },
  on(f) { this.subs.push(f); },
};
VP.load();
// Another tab or window of the app changed the mix: pick it up live.
window.addEventListener('storage', (e) => {
  if (e.key !== VP.KEY) return;
  const before = Object.assign({}, VP.v); VP.load();
  for (const k in VP.v) if (VP.v[k] !== before[k]) for (const f of VP.subs) { try { f(k, VP.v[k]); } catch (err) {} }
});
