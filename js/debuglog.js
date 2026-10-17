// Debug logger pinned top-left. Event-driven only (no per-frame work). Keeps ~50 lines, shows newest 6.
(function () {
  const MAX = 50, SHOW = 6, KEY = 'biotone.debuglog.open';
  const lines = [];
  let body = null, chip = null, open = localStorage.getItem(KEY) !== '0';
  const ts = () => new Date().toTimeString().slice(0, 8);
  function render() {
    if (!body) return;
    body.style.display = open ? 'block' : 'none';
    body.textContent = lines.slice(-SHOW).join('\n');
    body.scrollTop = body.scrollHeight; // newest lines stay visible when long ones wrap
  }
  function log(msg) { lines.push(ts() + ' ' + msg); if (lines.length > MAX) lines.shift(); render(); }
  window.BLog = { log, lines };
  window.addEventListener('error', (e) => log('ERR ' + (e.message || e) + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : '')));
  window.addEventListener('unhandledrejection', (e) => log('REJECT ' + ((e.reason && (e.reason.message || e.reason)) || '?')));
  function mount() {
    const wrap = document.createElement('div');
    wrap.id = 'blog';
    wrap.style.cssText = 'position:fixed;top:env(safe-area-inset-top,0px);left:env(safe-area-inset-left,0px);z-index:9999;width:40vw;max-width:320px;pointer-events:none;font:10px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    chip = document.createElement('button');
    chip.textContent = 'log';
    chip.setAttribute('aria-label', 'Toggle debug log');
    chip.style.cssText = 'pointer-events:auto;display:block;margin:2px 0 0 2px;padding:1px 6px;font:inherit;color:rgba(255,199,31,.7);background:rgba(0,0,0,.55);border:1px solid rgba(255,199,31,.3);border-radius:8px';
    chip.addEventListener('click', (e) => { e.stopPropagation(); open = !open; localStorage.setItem(KEY, open ? '1' : '0'); render(); });
    body = document.createElement('pre');
    body.style.cssText = 'pointer-events:none;margin:2px 0 0 2px;padding:4px 6px;max-height:calc(6 * 1.35em + 8px);overflow:hidden;white-space:pre-wrap;word-break:break-word;color:rgba(255,199,31,.62);background:rgba(10,8,4,.55);border-radius:6px';
    wrap.appendChild(chip); wrap.appendChild(body); document.body.appendChild(wrap); render();
  }
  function hook() {
    mount();
    fetch('sw.js', { cache: 'no-store' }).then((r) => r.text()).then((t) => { const m = t.match(/VERSION = '([^']+)'/); log('start ' + (m ? m[1].replace('freqium-web-', '') : '?') + (navigator.standalone || matchMedia('(display-mode: standalone)').matches ? ' pwa' : '')); }).catch(() => log('start (cache version unavailable)'));
    const g = window;
    const wrapFn = (name, fn) => { const orig = g[name]; if (typeof orig !== 'function') return; g[name] = function () { try { fn.apply(null, arguments); } catch (e) {} return orig.apply(this, arguments); }; };
    // Visualizer mode per page, logged on page change and on any switch (checked once a second, not per frame).
    const modeOf = (p) => p === 'moods' ? 'ring' : p === 'schumann' ? (scDefault(A.state.schumann) ? 'petal' : 'ring') : null;
    let lastMode = {};
    const checkModes = (force) => { for (const p of ['moods', 'schumann']) { const m = modeOf(p); if (force || lastMode[p] !== m) { if (lastMode[p] && lastMode[p] !== m) log('vis ' + p + ' ' + lastMode[p] + '→' + m); lastMode[p] = m; } } };
    wrapFn('setPage', (k) => { if (k === A.page) return; setTimeout(() => { const m = modeOf(k); log('page ' + k + (m ? ' (vis ' + m + ')' : '')); }, 0); });
    checkModes(true); log('page ' + A.page + (modeOf(A.page) ? ' (vis ' + modeOf(A.page) + ')' : ''));
    setInterval(() => { if (!document.hidden) checkModes(false); }, 1000);
    wrapFn('play', (src) => { const sw = A.isPlaying && A.activeSource !== src; log((sw ? 'switch → ' : 'play ') + src); });
    wrapFn('stop', () => log('stop ' + (A.activeSource || '')));
    // Faders: throttled, logs the final value 400 ms after the last change.
    const fT = {};
    wrapFn('setCtrl', (id, v) => { clearTimeout(fT[id]); fT[id] = setTimeout(() => { const c = ctrl(id); log('fader ' + id + ' = ' + (c ? (+c.get()).toFixed(2) : v)); }, 400); });
    try {
      const om = ACT.mood; ACT.mood = function (k) { const m = moodOf(k); log('mood ' + m.label + ' ' + (m.pure ? m.hz + 'Hz' : m.carrier + '/' + m.beat + 'Hz')); return om.apply(this, arguments); };
      for (const k of ['mute', 'ambstop', 'amball', 'ambtoggle', 'shimmer']) { const o = ACT[k]; if (typeof o === 'function') ACT[k] = function (a) { log('act ' + k + (a ? ' ' + a : '')); return o.apply(this, arguments); }; }
    } catch (e) {}
    // Audio context state
    let ctxSeen = null;
    setInterval(() => { const c = Snd.ctx; if (c && c !== ctxSeen) { ctxSeen = c; log('audio ' + c.state); c.addEventListener('statechange', () => log('audio ' + c.state)); } }, 1000);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => log('sw controller changed'));
      navigator.serviceWorker.getRegistration().then((r) => { if (!r) return; r.addEventListener('updatefound', () => { log('sw update found'); const w = r.installing; if (w) w.addEventListener('statechange', () => log('sw ' + w.state)); }); }).catch(() => {});
    }
  }
  if (document.readyState === 'complete') hook(); else window.addEventListener('load', hook);
})();
