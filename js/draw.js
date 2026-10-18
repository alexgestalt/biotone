// Icons (SF Symbol look-alikes) and canvas drawing, ported from the SwiftUI views
// (WaveformScope, FrequencyRuler, MoodOrb, GlowRing) via the preview renderer.
'use strict';
const I = {
 books:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><rect x="15" y="5" width="4" height="15" rx="1" transform="rotate(-12 17 12)"/></svg>',
 info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5" stroke-linecap="round"/></svg>',
 caseI:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M12 10v7M8.5 13.5h7"/></svg>',
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
 xcircle:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#161616" stroke-width="2.2" stroke-linecap="round"/></svg>',
 back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
 bars:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2"/></svg>',
 save:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 piano:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M13 4v16M18 4v16" /></svg>',

 play:'<svg viewBox="0 0 24 24"><path d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5z" fill="currentColor"/></svg>',
 stop:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/></svg>',
 moon:'<svg viewBox="0 0 24 24"><path d="M13.5 3.2A9 9 0 1 0 21 15.5 7.2 7.2 0 0 1 13.5 3.2z" fill="currentColor"/><text x="15" y="9" font-size="7.5" font-weight="800" fill="currentColor" font-family="Inter">z</text><text x="19" y="5.5" font-size="5.5" font-weight="800" fill="currentColor" font-family="Inter">z</text></svg>',
 head:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3.5 16v-3.5a8.5 8.5 0 0 1 17 0V16"/><rect x="2.5" y="13.5" width="5" height="8" rx="2" fill="currentColor" stroke="none"/><rect x="16.5" y="13.5" width="5" height="8" rx="2" fill="currentColor" stroke="none"/></svg>',
 down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7 7 7-7"/></svg>',
 up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15l7-7 7 7"/></svg>',
 minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14M12 5v14"/></svg>',
 swap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/></svg>',
 trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14M10 10v7M14 10v7"/></svg>',
 wave:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="10" width="2" height="4" rx="1"/><rect x="6" y="6" width="2" height="12" rx="1"/><rect x="10" y="3" width="2" height="18" rx="1"/><rect x="14" y="7" width="2" height="10" rx="1" opacity=".55"/><rect x="18" y="9.5" width="2" height="5" rx="1" opacity=".35"/></svg>',
 leaf:'<svg viewBox="0 0 24 24"><path d="M20 3C9 3 4 8 4 15c0 2 .6 3.6 1.4 4.8C7 13 11 10 15 8c-3.5 2.6-6.6 6-8.5 12.3C8 21.4 9.8 22 12 22c6 0 8-6 8-19z" fill="currentColor"/></svg>',
 scope:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/></svg>',
 bolt:'<svg viewBox="0 0 24 24"><path d="M13.5 1.5L4 13.5h6.5L9 22.5l10.5-13H13z" fill="currentColor"/></svg>',
 wind:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7"/></svg>',
 star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>',
 starf:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 3.5v4h4"/><path d="M12 7.5V12l3 2"/></svg>',
 xmark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 spk:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9h4l5-4.5v15L7 15H3z"/><path d="M15 8.5a5 5 0 0 1 0 7M17.8 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 spkx:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9h4l5-4.5v15L7 15H3z"/><path d="M15.5 9l6 6M21.5 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 rain:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14.5h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1A3.6 3.6 0 0 0 7 14.5z"/><path d="M8 17l-1.2 3M12 17l-1.2 3M16 17l-1.2 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 ocean:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 8c2.5-2 5-2 7.5 0s5 2 7.5 0 4-1.6 5-1M2 13c2.5-2 5-2 7.5 0s5 2 7.5 0 4-1.6 5-1M2 18c2.5-2 5-2 7.5 0s5 2 7.5 0 4-1.6 5-1"/></svg>',
 drop:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5C9 7 5.5 10.6 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10.6 15 7 12 2.5z"/></svg>',
 metro:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 2.5h5l4.5 18.5H5z" opacity=".9"/><path d="M12 16L17.5 5.5" stroke="#000" stroke-width="1.8" stroke-linecap="round"/><rect x="7" y="16" width="10" height="2" fill="#000" opacity=".5"/></svg>',
 ud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9l5-5 5 5M7 15l5 5 5-5"/></svg>',
 arrowur:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M9 6h9v9"/></svg>',
 arrowdr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 9v9H9"/></svg>',
 lsq:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/><path d="M9.5 7v10h5.5" fill="none" stroke="var(--bgk,#000)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 rsq:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/><path d="M9 17V7h3.5a2.8 2.8 0 0 1 0 5.6H9M12.5 12.6L15.5 17" fill="none" stroke="var(--bgk,#000)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 spk2:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="9" height="16" rx="2"/><rect x="13" y="4" width="9" height="16" rx="2"/><circle cx="6.5" cy="14" r="2.3" fill="#000" opacity=".55"/><circle cx="17.5" cy="14" r="2.3" fill="#000" opacity=".55"/><circle cx="6.5" cy="8" r="1.1" fill="#000" opacity=".55"/><circle cx="17.5" cy="8" r="1.1" fill="#000" opacity=".55"/></svg>',
 lr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h17M16 4l4 4-4 4M21 16H4M8 12l-4 4 4 4"/></svg>',
 ear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 9a6 6 0 0 1 12 0c0 3.5-3 4.5-3.5 7.5S13 21 11 21s-3-1.5-3-1.5"/><path d="M10.5 10a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-1.5 3.5"/></svg>',
 spark:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2l1.8 5.7L17.5 9.5l-5.7 1.8L10 17l-1.8-5.7L2.5 9.5l5.7-1.8z"/><path d="M18.5 13l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/><path d="M17 2l.6 1.9 1.9.6-1.9.6L17 7l-.6-1.9-1.9-.6 1.9-.6z"/></svg>',
};
const moodIcon = {sleep:I.moon, rest:I.leaf, focus:I.scope, active:I.bolt, calm:I.wind, meditate:I.spark,
 dream:I.moon, create:I.spark, study:I.scope, flow:I.wind, spark:I.bolt, still:I.leaf,
 ease:I.wind, glow:I.spark, release:I.leaf, unite:I.spark};

// ---------- Swift ports ----------
const RGB = {y:[1,.78,.12], o:[1,.5,.08], r:[1,.2,.16]};
const mix=(a,b,t)=>{t=Math.max(0,Math.min(1,t));return a.map((v,i)=>v+(b[i]-v)*t)};
const css=(c,a=1)=>`rgba(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)},${a})`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function earWeight(hz){const sm=x=>{const t=clamp(x,0,1);return t*t*(3-2*t)};
 if(hz<=2000)return .25; if(hz<=4000)return .25+.35*sm((hz-2000)/2000); if(hz<=8000)return .6+.4*sm((hz-4000)/4000); return 1;}
function heatValue(level,f){const d=level*earWeight(f);return Math.max(clamp((d-.18)/.32,0,1),clamp((level-.6)/.42,0,1));}
function heatColor(h){return h<=.5?mix(RGB.y,RGB.o,h/.5):mix(RGB.o,RGB.r,(h-.5)/.5);}
const fmt=v=>v.toFixed(2);
function limit(x){const a=Math.abs(x),th=.8;if(a<=th)return x;const k=1-th;const y=th+k*Math.tanh((a-th)/k);return x<0?-y:y;}

function setupCanvas(cv,w,h){const d=Math.min(3,window.devicePixelRatio||2);const W=Math.max(1,Math.round(w*d)),H=Math.max(1,Math.round(h*d));
 if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;cv.style.width=w+'px';cv.style.height=h+'px';}
 const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);c.shadowBlur=0;c.shadowColor='transparent';c.globalAlpha=1;c.setLineDash([]);c._d=d;return c;}

// WaveformScope.draw
function drawScope(cv,w,h,L,R,level,heat){
 const g=setupCanvas(cv,w,h);const mid=h/2,amp=h/2-4;const base=heatColor(heat);
 g.strokeStyle='rgba(255,255,255,.06)';g.lineWidth=1;g.beginPath();g.moveTo(0,mid);g.lineTo(w,mid);g.stroke();
 const grad=g.createLinearGradient(0,mid-amp,0,mid+amp);
 [[0,RGB.r],[.10,RGB.o],[.24,base],[.76,base],[.90,RGB.o],[1,RGB.r]].forEach(([p,c])=>grad.addColorStop(p,css(c)));
 const path=s=>{const p=new Path2D();const W=Math.floor(w);for(let x=0;x<=W;x++){const idx=Math.min(s.length-1,Math.floor(x/W*(s.length-1)));const y=mid-s[idx]*amp;x?p.lineTo(x,y):p.moveTo(0,y);}return p;};
 const lp=path(L);
 g.save();g.shadowColor=css(base,.75);g.shadowBlur=8*g._d;g.strokeStyle=grad;g.lineWidth=3;g.globalAlpha=.6;g.stroke(lp);g.restore();
 g.save();g.strokeStyle=grad;g.lineWidth=2;g.lineJoin='round';g.stroke(lp);g.restore();
 if(R){g.save();g.globalAlpha=.55;g.strokeStyle=grad;g.lineWidth=1.5;g.setLineDash([5,3]);g.stroke(path(R));g.restore();}
 const bh=Math.min(1,level)*h;const bg=g.createLinearGradient(0,0,0,h);
 [[0,RGB.r],[1/3,RGB.o],[2/3,base],[1,base]].forEach(([p,c])=>bg.addColorStop(p,css(c)));
 g.fillStyle=bg;g.fillRect(0,h-bh,3,bh);
}
// synthesize the samples the engine would output (after the soft limiter), trigger on a rising zero crossing
function samples(fn,f1){const sr=48000;const win=Math.round(clamp(sr*3/f1,256,2048));const L=[],R=[];
 for(let i=0;i<win;i++){const t=i/sr;const [l,r]=fn(t);L.push(limit(l));R.push(limit(r));}return {L,R};}

// FrequencyRuler.drawTicks
function drawRuler(cv,w,value,lo,hi){
 const h=54;const g=setupCanvas(cv,w,h);const cx=w/2,unit=.1,px=9;const half=(cx/px)*unit;
 const first=Math.floor((value-half)/unit),last=Math.ceil((value+half)/unit);const baseY=h-4;
 g.textAlign='center';g.textBaseline='middle';g.font='500 10px Nunito';
 for(let k=first;k<=last;k++){const tv=k*unit;if(tv<lo-1e-4||tv>hi+1e-4)continue;
  const x=cx+((tv-value)/unit)*px;const major=k%10===0,midt=k%5===0;const th=major?22:(midt?14:8);
  g.strokeStyle=`rgba(255,255,255,${major?.7:.3})`;g.lineWidth=major?1.5:1;g.beginPath();g.moveTo(x,baseY);g.lineTo(x,baseY-th);g.stroke();
  if(major){g.fillStyle='#949494';g.fillText(String(Math.round(tv)),x,8);} }
 g.strokeStyle='#FFC71F';g.lineWidth=2.5;g.beginPath();g.moveTo(cx,baseY+2);g.lineTo(cx,16);g.stroke();
 g.fillStyle='#FFC71F';g.beginPath();g.moveTo(cx-5,14);g.lineTo(cx+5,14);g.lineTo(cx,20);g.closePath();g.fill();
}

// MoodOrb.draw
function drawOrb(cv,w,h,f){
 const g=setupCanvas(cv,w,h);const c={x:w/2,y:h/2};const maxR=Math.min(w,h)*.5;const R=Math.max(12,maxR-1);const base=heatColor(f.heat);const e=f.amp;
 const coreR=R*(.95+.25*e+.15*f.bloom);
 const rg=g.createRadialGradient(c.x,c.y,0,c.x,c.y,coreR);
 rg.addColorStop(0,css(base,.28+.35*e+.2*f.bloom));rg.addColorStop(.5,css(base,.07));rg.addColorStop(1,css(base,0));
 g.fillStyle=rg;g.beginPath();g.arc(c.x,c.y,coreR,0,Math.PI*2);g.fill();
 const rings=[];const n=120;
 for(let i=0;i<6;i++){const fi=i;const dir=i%2===0?1:-1;const rot=f.phase*(.07+.025*fi)*dir;
  const ringR=R*(.42+.115*fi)*(1+f.beatPulse+.05*f.bloom*(1-fi/6));const disp=(.035+.11*e+.07*f.low)*(.7+.12*fi);const fine=.25+1.8*f.high;
  const p=new Path2D();
  for(let k=0;k<=n;k++){const th=k/n*2*Math.PI;
   const wob=.45*Math.sin(2*th+f.phase*.5+fi*1.7)+.30*Math.sin(3*th-f.phase*.73+fi*.9)+.18*Math.sin(5*th+f.phase*1.1+fi*2.3)+.07*fine*Math.sin(9*th-f.phase*1.9+fi);
   const r=ringR*(1+disp*wob);const a=th+rot;const x=c.x+r*Math.cos(a),y=c.y+r*Math.sin(a);k?p.lineTo(x,y):p.moveTo(x,y);}
  p.closePath();rings.push(p);}
 const alpha=i=>Math.min(1,(.95-.12*i)*(.45+.45*e+.25*f.bloom));
 g.save();g.shadowBlur=(9+8*e)*g._d;rings.forEach((p,i)=>{g.shadowColor=css(base,.7*alpha(i));g.strokeStyle=css(base,.35*alpha(i));g.lineWidth=4;g.stroke(p);});g.restore();
 rings.forEach((p,i)=>{g.strokeStyle=css(base,alpha(i));g.lineWidth=1.1+.9*e*(1-i/6);g.stroke(p);});
 const hash=x=>{const v=Math.sin(x*12.9898)*43758.5453;return v-Math.floor(v)};
 for(let j=0;j<90;j++){const s1=hash(j*3+1),s2=hash(j*3+2),s3=hash(j*3+3);const t=s1+f.phase*(.05+.06*s2);const life=t-Math.floor(t);
  const dir=j%2===0?1:-1;const ang=s2*2*Math.PI+f.phase*(.08+.15*s3)*dir+.8*life;let rad=R*(.35+1.15*life)*(1+.04*Math.sin(f.phase*1.3+s3*6));if(rad>maxR-2)rad=maxR-2;
  const a=Math.sin(Math.PI*life)*(.15+.55*e+.4*f.high+.3*f.bloom);const sz=.8+2.2*s3*(.5+e);
  g.fillStyle=css(base,Math.min(1,a));g.beginPath();g.arc(c.x+rad*Math.cos(ang),c.y+rad*Math.sin(ang),sz/2,0,Math.PI*2);g.fill();}
 const dot=2.5+3.5*e;g.fillStyle=`rgba(255,255,255,${.55+.35*e})`;g.beginPath();g.arc(c.x,c.y,dot,0,Math.PI*2);g.fill();
}

// Opening-page sound field. One canvas, typed-array state, a prebuilt hue palette.
// Motion stays slow: noise drift, a ~5.5 s breath, rings that take several seconds
// to cross the disc. The binaural rate only shimmers the interference pattern.
const VIS_BANDS = 8;
const TAU = Math.PI * 2;
const PAL_N = 96;
const PAL = new Array(PAL_N);
const PAL_HOT = new Array(PAL_N);
const EDGE_N = 80;
let RINGP = { n: 0, x: null, y: null, ang: null, rad: null, seed: null, sz: null, band: null, bright: null, time: 0 };
let EMIT = { n: 16, r: null, amp: null, band: null, alive: null, acc: 0, ph: -1 };
// Each ring canvas keeps its own particle/pulse field so two pages never share or double-step state.
const RING_STATE_MAIN = { p: RINGP, e: EMIT };
function newRingState() {
  return { p: { n: 0, x: null, y: null, ang: null, rad: null, seed: null, sz: null, band: null, bright: null, time: 0 },
    e: { n: 16, r: null, amp: null, band: null, alive: null, acc: 0, ph: -1 } };
}
function useRingState(s) { RINGP = s.p; EMIT = s.e; }

function hash2(ix, iy) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) * 2.3283064365386963e-10;
}
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// Gold at 200 Hz, then amber, orange, rose, violet as frequency rises (log).
function paletteHue(t) {
  if (t <= 0) return 46;
  if (t >= 1) return -78;
  if (t < 0.22) return 46 + (32 - 46) * (t / 0.22);
  if (t < 0.46) return 32 + (14 - 32) * ((t - 0.22) / 0.24);
  if (t < 0.72) return 14 + (-8 - 14) * ((t - 0.46) / 0.26);
  return -8 + (-78 + 8) * ((t - 0.72) / 0.28);
}
function hslTo(h, s, l, out) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) { r = c; g = x; }
  else if (hp < 2) { r = x; g = c; }
  else if (hp < 3) { g = c; b = x; }
  else if (hp < 4) { g = x; b = c; }
  else if (hp < 5) { r = x; b = c; }
  else { r = c; b = x; }
  const m = l - c * 0.5;
  out[0] = r + m; out[1] = g + m; out[2] = b + m;
}
function rgbCss(rgb) {
  return 'rgb(' + (rgb[0] * 255 + 0.5 | 0) + ',' + (rgb[1] * 255 + 0.5 | 0) + ',' + (rgb[2] * 255 + 0.5 | 0) + ')';
}
(function buildPalette() {
  const rgb = [0, 0, 0];
  for (let i = 0; i < PAL_N; i++) {
    let h = paletteHue(i / (PAL_N - 1));
    h %= 360; if (h < 0) h += 360;
    hslTo(h, 0.98, 0.58, rgb); PAL[i] = rgbCss(rgb);
    hslTo(h, 0.48, 0.88, rgb); PAL_HOT[i] = rgbCss(rgb);
  }
})();
function palIndex(t) {
  if (t <= 0) return 0;
  if (t >= 1) return PAL_N - 1;
  return (t * (PAL_N - 1) + 0.5) | 0;
}
// Log-frequency position. 200 Hz is gold; beat rate and loudness ease it toward rose.
function freqTint(hz, beat, amp) {
  const f = hz < 40 ? 40 : (hz > 8000 ? 8000 : hz);
  const t = (Math.log(f) - Math.log(200)) / (Math.log(2800) - Math.log(200));
  const beatPush = (beat > 0 ? (beat > 40 ? 40 : beat) : 0) / 140;
  const a = amp > 0 ? (amp < 1 ? amp : 1) : 0;
  let v = t + beatPush + a * 0.1;
  if (v < 0) v = 0; else if (v > 1) v = 1;
  return v;
}
function prepSpectrumEdges(sr, fftSize, loArr, hiArr) {
  const bins = fftSize >> 1;
  const ny = sr * 0.5;
  const log0 = Math.log(45), log1 = Math.log(Math.min(12000, ny * 0.92));
  for (let i = 0; i < VIS_BANDS; i++) {
    const aHz = Math.exp(log0 + (log1 - log0) * (i / VIS_BANDS));
    const bHz = Math.exp(log0 + (log1 - log0) * ((i + 1) / VIS_BANDS));
    let lo = Math.floor(aHz / ny * bins);
    let hi = Math.ceil(bHz / ny * bins);
    if (lo < 1) lo = 1;
    if (hi <= lo) hi = lo + 1;
    if (hi > bins) hi = bins;
    loArr[i] = lo; hiArr[i] = hi;
  }
}
function fillSpectrum(freq, loArr, hiArr, out) {
  for (let b = 0; b < VIS_BANDS; b++) {
    let peak = 0;
    const a = loArr[b], c = hiArr[b];
    for (let k = a; k < c; k++) { const v = freq[k]; if (v > peak) peak = v; }
    out[b] = peak * (1 / 255);
  }
}
// Lub-dub inside a 5.5 s cycle, plus a slower swell. Never a fast blink.
function heartWave(time) {
  // v12: smooth, seamless outer breath (no lub-dub spikes, no wrap step): a slow sine whose phase wanders
  // with smooth noise, plus a slower incommensurate swell, so it never repeats or twitches.
  return 0.5 + 0.32 * Math.sin(time * (TAU / 5.5) + 2.4 * (noise2(time * 0.021, 17.3) - 0.5)) + 0.13 * Math.sin(time * (TAU / 9.7) + 1.1);
}
// Centre pulse: the same lub-dub shape as heartWave, driven by a phase accumulator (0..1) whose rate
// follows the frequency (pulsePh, advanced per page in updateVisAudio), so rate changes never jump.
function centerWave(ph) {
  // v12: smooth pulse peaking at phase 0.08 (where a ring is born). A raised cosine to the power 1.6 is
  // periodic and C1-continuous, so it never steps at the wrap and never twitches, even at fast beats.
  const s = 0.5 + 0.5 * Math.cos(TAU * (ph - 0.08));
  return 0.12 + 0.88 * Math.pow(s, 1.6);
}
// Page 1 seamless variants (same lub-dub look). The shared versions measure the lub from the raw 0..1
// phase, so at each wrap it steps by ~0.03; these use the wrapped distance to the peak, so the curve is
// continuous across cycles. The outer breath's slow swell also gets a noise-driven phase drift, so the
// 5.5 s / 5.6 s pair never lines up into a repeating ~5 min cycle. Page 4 keeps the shared ones.
function seamLubDub(ph) {
  ph -= Math.floor(ph);
  let d1 = ph - 0.08; d1 -= Math.round(d1);
  let d2 = ph - 0.22; d2 -= Math.round(d2);
  return Math.exp(-(d1 * d1) / 0.0018) + 0.7 * Math.exp(-(d2 * d2) / 0.0022);
}
function heartWaveP1(time) { return heartWave(time); }   // v12: same smooth seamless breath as page 4
function centerWaveP1(ph) { return centerWave(ph); }      // v12: smooth pulse (no lub-dub spike)
// Disc fill, inner glow and core dot all pulse from the centre at the frequency-driven rate.
function paintCenterPulse(g, R, col, cb, energy, petal) {
  const cg = 0.72 + 0.28 * cb + 0.18 * energy;
  g.fillStyle = col;
  g.globalAlpha = 0.09 * cg;
  g.beginPath(); g.arc(0, 0, R * 0.98, 0, TAU); g.fill();
  g.globalAlpha = (petal ? 0.04 : 0.05) + 0.07 * cb;
  g.beginPath(); g.arc(0, 0, R * (0.42 + 0.1 * cb), 0, TAU); g.fill();
}
function paintCore(g, hot, cb, energy) {
  g.fillStyle = hot;
  g.globalAlpha = 0.12 + 0.22 * cb;
  g.beginPath(); g.arc(0, 0, 5 + 9 * cb + 3 * energy, 0, TAU); g.fill();
  g.globalAlpha = 0.45 + 0.5 * energy;
  g.beginPath(); g.arc(0, 0, 2.2 + 2.4 * energy + 2.4 * cb, 0, TAU); g.fill();
}
function ringBudget() { return window.innerWidth < 700 ? 112 : 160; }
function ensureRingParticles() {
  const n = ringBudget();
  if (RINGP.n !== n || !RINGP.x) {
    RINGP.n = n;
    RINGP.x = new Float32Array(n); RINGP.y = new Float32Array(n);
    RINGP.ang = new Float32Array(n); RINGP.rad = new Float32Array(n);
    RINGP.seed = new Float32Array(n); RINGP.sz = new Float32Array(n);
    RINGP.band = new Uint8Array(n); RINGP.bright = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const b = i % VIS_BANDS;
      RINGP.band[i] = b;
      RINGP.ang[i] = hash2(i, 1) * TAU;
      RINGP.rad[i] = 0.16 + b * 0.075 + hash2(i, 2) * 0.04;
      RINGP.seed[i] = hash2(i, 3);
      RINGP.sz[i] = 0.85 + hash2(i, 4) * 1.7;
      RINGP.bright[i] = 0.22;
      RINGP.x[i] = Math.cos(RINGP.ang[i]) * RINGP.rad[i];
      RINGP.y[i] = Math.sin(RINGP.ang[i]) * RINGP.rad[i];
    }
  }
  if (!EMIT.r) {
    EMIT.r = new Float32Array(EMIT.n);
    EMIT.amp = new Float32Array(EMIT.n);
    EMIT.band = new Uint8Array(EMIT.n);
    EMIT.alive = new Uint8Array(EMIT.n);
    for (let i = 0; i < 4; i++) {
      EMIT.alive[i] = 1;
      EMIT.r[i] = 0.24 + i * 0.16;
      EMIT.amp[i] = 0.5;
      EMIT.band[i] = (i * 2) % VIS_BANDS;
    }
  }
}
function stepRingField(dt, energy, bands, pulseSpeed, pulsePh) {
  if (!(dt > 0) || !RINGP.x) return;
  const t = RINGP.time, n = RINGP.n;
  const kRad = 1 - Math.exp(-dt / 0.7);
  const kBr = 1 - Math.exp(-dt / 0.28);
  for (let i = 0; i < n; i++) {
    const b = RINGP.band[i];
    const e = bands ? bands[b] : 0;
    const target = 0.16 + b * 0.072 + e * 0.14;
    const rad = RINGP.rad[i] + (target - RINGP.rad[i]) * kRad;
    const dir = (i & 1) ? 1 : -1;
    const ang = RINGP.ang[i] + dt * dir * (0.03 + 0.025 * RINGP.seed[i]);
    const j = (noise2(RINGP.seed[i] * 2.2 + t * 0.045, b * 0.37) - 0.5) * 0.045;
    RINGP.rad[i] = rad; RINGP.ang[i] = ang;
    RINGP.x[i] = Math.cos(ang) * (rad + j);
    RINGP.y[i] = Math.sin(ang) * (rad + j);
    const bright = 0.16 + 0.84 * e;
    RINGP.bright[i] += (bright - RINGP.bright[i]) * kBr;
  }
  // A new ring is born at each centre-pulse peak (lub at phase 0.08), so the spawn interval equals the
  // frequency-driven pulse period. The phase only changes rate on a mood switch, so there is never a burst.
  let spawn = false;
  if (pulsePh >= 0) {
    const PEAK = 0.08, prev = EMIT.ph;
    if (prev >= 0) spawn = prev <= pulsePh ? (prev < PEAK && pulsePh >= PEAK) : (prev < PEAK || pulsePh >= PEAK);
    EMIT.ph = pulsePh;
  } else {
    EMIT.acc += dt * (0.34 + 0.55 * (energy || 0));
    if (EMIT.acc >= 1) { EMIT.acc -= 1; spawn = true; }
  }
  if (spawn) {
    let slot = -1, far = 0;
    for (let i = 0; i < EMIT.n; i++) {
      if (!EMIT.alive[i]) { slot = i; break; }
      if (EMIT.r[i] > EMIT.r[far]) far = i;
    }
    if (slot < 0) slot = far;
    let bi = 0, bv = 0;
    if (bands) { for (let i = 0; i < VIS_BANDS; i++) if (bands[i] > bv) { bv = bands[i]; bi = i; } }
    EMIT.alive[slot] = 1;
    EMIT.r[slot] = 0.14 + bi * 0.012;
    EMIT.band[slot] = bi;
    EMIT.amp[slot] = 0.4 + 0.6 * (energy > bv ? energy : bv);
  }
  // Pulse travel speed follows the frequency (set per page in updateVisAudio); eased over ~0.4 s,
  // and every ring already in flight changes speed with it.
  const target = pulseSpeed > 0 ? pulseSpeed : 0.12;
  if (!(EMIT.spd > 0)) EMIT.spd = target;
  EMIT.spd += (target - EMIT.spd) * (1 - Math.exp(-dt / 0.4));
  const step = dt * EMIT.spd;
  for (let i = 0; i < EMIT.n; i++) {
    if (!EMIT.alive[i]) continue;
    EMIT.r[i] += step;
    if (EMIT.r[i] > 1.02) EMIT.alive[i] = 0;
  }
  RINGP.time = t + dt;
}
function ringParticleCount() { return RINGP.n; }
function strokeDisc(g, r) {
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
}
function fieldRadius(w, h, breath, n1) {
  const maxR = Math.min(w, h) * 0.5;
  let R = (maxR - 8) * (1 + 0.022 * breath + 0.016 * n1);
  if (R > maxR - 8) R = maxR - 8;
  return R;
}
function tracePetals(g, R, lobes, rot, inner, expo = 0.72) {
  g.beginPath();
  for (let k = 0; k <= EDGE_N; k++) {
    const th = (k / EDGE_N) * TAU;
    const c = Math.cos(lobes * (th + rot));
    const lobe = c > 0 ? Math.pow(c, expo) : 0;
    const rr = R * (inner + (1 - inner) * lobe);
    const x = rr * Math.cos(th), y = rr * Math.sin(th);
    if (k) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
}
// Petal outline blending two lobe counts (mix 0..1), so the petal count can morph without a seam.
// Petal outline blending two lobe counts (mix 0..1), so the petal count can morph without a seam.
// The edge follows a pure sine (ew: { u, ph, k }): u 0..1 from the carrier compresses it, from a few long,
// full undulations (low carrier) to many short ones (high carrier), always smooth. The cycle count is a
// blend of two whole numbers so it changes continuously without a seam; ph makes the wave travel.
function tracePetalsBlend(g, R, la, lb, mix, rot, inner, expo, ew) {
  const u = ew ? ew.u : 0, k = ew ? ew.k : 1, ph = ew ? ew.ph : 0;
  const cyc = la * (1.4 + 6.6 * u) * k, c0 = Math.floor(cyc), cf = cyc - c0, c1 = c0 + 1;
  const amp = ew ? 0.1 - 0.03 * u : 0;
  const N = 160 + Math.round(200 * u);
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * TAU;
    const ca = Math.cos(la * (th + rot)), cb = Math.cos(lb * (th + rot));
    const a = ca > 0 ? Math.pow(ca, expo) : 0, b = cb > 0 ? Math.pow(cb, expo) : 0;
    const lobe = a + (b - a) * mix;
    let rr = R * (inner + (1 - inner) * lobe);
    if (amp) {
      const x0 = c0 * (th + rot) + ph, x1 = c1 * (th + rot) + ph;
      rr *= 1 + amp * (Math.sin(x0) * (1 - cf) + Math.sin(x1) * cf) * Math.sqrt(lobe);
    }
    const x = rr * Math.cos(th), y = rr * Math.sin(th);
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
}
// Sine rosette: r(theta) = mid + A * sin(c * (theta + rot) + ph). The cycle count c blends two whole
// numbers so it changes continuously without a seam; it stays a smooth sine curve.
function traceSineRose(g, mid, A, cyc, rot, ph) {
  const c0 = Math.floor(cyc), cf = cyc - c0, c1 = c0 + 1, N = 240;
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * TAU;
    const w = Math.sin(c0 * (th + rot) + ph) * (1 - cf) + Math.sin(c1 * (th + rot) + ph) * cf;
    const rr = mid + A * w;
    const x = rr * Math.cos(th), y = rr * Math.sin(th);
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
}
// Harmonograph trace: a damped two-pendulum figure, x + iy = D(t) * (a e^{i(t+px)} + b e^{i(r t + py)}),
// with r a clean negative integer (slightly detuned so the loops precess like a real harmonograph).
// That gives smooth looping rosettes with (1 - r)-fold symmetry and no cusps (b|r| > a); damping makes
// the line coil in from the outer extent S toward the centre. rot spins the figure.
function traceHarmonograph(g, S, r, b, px, py, damp, rot) {
  const N = 600, T = TAU * 7, a = 1 - b;
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const tau = (i / N) * T, D = S * Math.exp(-damp * tau);
    const u1 = tau + px + rot, u2 = r * tau + py + rot;
    const x = D * (a * Math.cos(u1) + b * Math.cos(u2)), y = D * (a * Math.sin(u1) + b * Math.sin(u2));
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
}
// Free-form harmonograph (v9): two loosely coupled pendulums per axis with non-integer, slowly drifting
// ratios (organic, not a strict mandala). rin opens the figure into a waveform-shaped ring: every point's
// radius is remapped to rin + (1 - rin) * r, so at high carrier the middle is empty; at rin = 0 the trace
// coils in to the centre like a pendulum drawing.
function traceFreeHarmonograph(g, S, fy, b, px, py, damp, rot, rin, ring, lobes) {
  const N = 900, T = TAU * 6, a = 1 - b, c = Math.cos(rot), s = Math.sin(rot);
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const tau = (i / N) * T, D = Math.exp(-damp * tau);
    let x0 = D * (a * Math.sin(tau + px) + b * Math.sin(0.5 * fy * tau + py));
    let y0 = D * (a * Math.sin(fy * tau + py) + b * Math.sin(0.5 * tau + px + 1.1));
    if (rin > 0) {
      const r0 = Math.hypot(x0, y0) + 1e-6, r1 = rin + (1 - rin) * Math.min(r0, 1);
      x0 *= r1 / r0; y0 *= r1 / r0;
    }
    if (ring > 0) {
      // Waveform ring: each of the 6 turns is a closed sine-edged ring, nested slightly by the damping.
      const turn = tau / TAU;
      const rr = (rin + (1 - rin) * (0.62 + 0.38 * Math.exp(-0.9 * damp * tau - 0.07 * turn))) *
        (1 + (0.05 + 0.1 * b) * Math.sin(lobes * tau + py + 0.9 * turn) + 0.03 * Math.sin((lobes + 2) * tau - px));
      const xr = rr * Math.cos(tau + px * 0.3), yr = rr * Math.sin(tau + px * 0.3);
      x0 += (xr - x0) * ring; y0 += (yr - y0) * ring;
    }
    const x = S * (x0 * c - y0 * s), y = S * (x0 * s + y0 * c);
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
}
// Thin glowing line: soft halo underneath, a fine bright core on top. Drawn additively, so crossings brighten.
// v12.1: TRACE_DIM < 1 while a subtle ambient signature is showing (set per frame by the page renderer).
let TRACE_DIM = 1;
function strokeTrace(g, tint, shift, e, energy, shimmer, halo) {
  const col = PAL[palIndex(tint + shift)];
  g.strokeStyle = col;
  g.globalAlpha = (0.08 + 0.16 * shimmer) * (5 / halo) ** 0.5 * TRACE_DIM;
  g.lineWidth = halo;
  g.stroke();
  g.globalAlpha = (0.35 + 0.45 * e + 0.15 * energy) * TRACE_DIM;
  g.lineWidth = 1.1 + 1.2 * e;
  g.stroke();
}
function paintPetalPath(g, tint, shift, e, energy, shimmer, halo = 5) {
  g.fillStyle = PAL[palIndex(tint + shift)];
  g.globalAlpha = (0.1 + 0.22 * e) * (0.7 + 0.3 * energy);
  g.fill();
  g.strokeStyle = PAL[palIndex(tint + shift)];
  g.globalAlpha = 0.28 + 0.55 * e;
  g.lineWidth = 1.6 + 3.2 * e;
  g.stroke();
  g.globalAlpha = (0.12 + 0.28 * shimmer) * (5 / halo) ** 0.5;
  g.lineWidth = halo;
  g.stroke();
}
function paintPetals(g, R, tint, lobes, rot, inner, shift, e, energy, shimmer, expo) {
  tracePetals(g, R, lobes, rot, inner, expo);
  g.fillStyle = PAL[palIndex(tint + shift)];
  g.globalAlpha = (0.1 + 0.22 * e) * (0.7 + 0.3 * energy);
  g.fill();
  g.strokeStyle = PAL[palIndex(tint + shift)];
  g.globalAlpha = 0.28 + 0.55 * e;
  g.lineWidth = 1.6 + 3.2 * e;
  g.stroke();
  g.globalAlpha = 0.12 + 0.28 * shimmer;
  g.lineWidth = 5;
  g.stroke();
}
// Pulses born near the core, expanding outward at the frequency-driven speed (EMIT.spd).
// Loudness only changes how often one is born. k scales their strength (petal mode draws them softer).
function drawCorePulses(g, R, tint, k) {
  for (let i = 0; i < EMIT.n; i++) {
    if (!EMIT.alive[i]) continue;
    const u = EMIT.r[i];
    let life = 1 - (u - 0.14) / 0.9;
    if (life <= 0) continue;
    if (life > 1) life = 1;
    let born = (u - 0.13) / 0.14; born = born <= 0 ? 0 : born >= 1 ? 1 : born * born * (3 - 2 * born);
    const fade = life * (0.35 + 0.65 * life) * born;   // v12: fade in at birth (a new ring used to pop in)
    g.strokeStyle = PAL[palIndex(tint + EMIT.band[i] * 0.035)];
    g.globalAlpha = (0.12 + 0.5 * EMIT.amp[i]) * fade * k;
    g.lineWidth = 1.4 + 7 * fade;
    strokeDisc(g, R * u);
  }
}
// Page 1 (v10): two free-form harmonograph waveform layers, adapted from page 4 v9 but kept as page 1's
// own copy (page 4 code is not shared). Every mood parameter shapes them; geometry never reads the beat
// phase, and every input is eased so mood switches morph instead of snapping.
function p1MoodParams() {
  const out = { carrier: 200, beat: 8, pure: false, tone: 0.34, music: 0.55, amb: 0, ambKind: 0, recipe: 0 };
  try {
    const m = moodOf(A.state.moods.selected), lv = moodLevels(A.state, m.key);
    out.pure = !!m.pure;
    out.carrier = m.pure ? m.hz : m.carrier;
    out.beat = m.pure ? 0 : m.beat;
    out.tone = lv.tone != null ? lv.tone : m.tone;
    out.music = lv.music != null ? lv.music : m.music;
    out.amb = lv.ambience && lv.ambience !== 'off' ? (lv.ambienceLevel || 0) : 0;
    let h = 0; const kind = String(lv.ambience || 'off');
    for (let i = 0; i < kind.length; i++) h = (h * 31 + kind.charCodeAt(i)) % 997;
    out.ambKind = h / 997;
    const rk = String(m.recipe || m.key); let r = 0;
    for (let i = 0; i < rk.length; i++) r = (r * 37 + rk.charCodeAt(i)) % 991;
    out.recipe = r / 991;
  } catch (e) { /* keep defaults */ }
  return out;
}
function p1Ease(S, key, v, dt, tau) { S[key] = S[key] == null ? v : S[key] + (v - S[key]) * (1 - Math.exp(-dt / tau)); }
function traceP1Harmonograph(g, S, fy, b, px, py, damp, rot, rin, ring, lobes) {
  const N = 900, T = TAU * 6, a = 1 - b, c = Math.cos(rot), s = Math.sin(rot);
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const tau = (i / N) * T, D = Math.exp(-damp * tau);
    let x0 = D * (a * Math.sin(tau + px) + b * Math.sin(0.5 * fy * tau + py));
    let y0 = D * (a * Math.sin(fy * tau + py) + b * Math.sin(0.5 * tau + px + 1.1));
    if (rin > 0) {
      const r0 = Math.hypot(x0, y0) + 1e-6, r1 = rin + (1 - rin) * Math.min(r0, 1);
      x0 *= r1 / r0; y0 *= r1 / r0;
    }
    if (ring > 0) {
      const turn = tau / TAU;
      const rr = (rin + (1 - rin) * (0.62 + 0.38 * Math.exp(-0.9 * damp * tau - 0.07 * turn))) *
        (1 + (0.05 + 0.1 * b) * Math.sin(lobes * tau + py + 0.9 * turn));
      const xr = rr * Math.cos(tau + px * 0.3), yr = rr * Math.sin(tau + px * 0.3);
      x0 += (xr - x0) * ring; y0 += (yr - y0) * ring;
    }
    const x = S * (x0 * c - y0 * s), y = S * (x0 * s + y0 * c);
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
}
// Page 1 copy of drawCorePulses, gold only: band colour offsets limited to the gold end of the palette.
function drawCorePulsesP1(g, R, k) {
  for (let i = 0; i < EMIT.n; i++) {
    if (!EMIT.alive[i]) continue;
    const u = EMIT.r[i];
    let life = 1 - (u - 0.14) / 0.9;
    if (life <= 0) continue;
    if (life > 1) life = 1;
    let born = (u - 0.13) / 0.14; born = born <= 0 ? 0 : born >= 1 ? 1 : born * born * (3 - 2 * born);
    const fade = life * (0.35 + 0.65 * life) * born;   // v12: fade in at birth
    g.strokeStyle = PAL[palIndex(EMIT.band[i] * 0.012)];
    g.globalAlpha = (0.12 + 0.5 * EMIT.amp[i]) * fade * k;
    g.lineWidth = 1.4 + 7 * fade;
    strokeDisc(g, R * u);
  }
}
function strokeP1Trace(g, tint, shift, e, energy, bright, halo) {
  g.strokeStyle = PAL[palIndex(shift)]; // v10.3: page 1 is gold only, no frequency tint
  g.globalAlpha = (0.08 + 0.16 * bright) * (5 / halo) ** 0.5 * TRACE_DIM;
  g.lineWidth = halo;
  g.stroke();
  g.globalAlpha = (0.32 + 0.4 * e + 0.15 * energy + 0.12 * bright) * TRACE_DIM;
  g.lineWidth = 1.1 + 1.2 * e;
  g.stroke();
}
function drawP1Waves(g, R, f, tint, energy, cb, t, dt, bands) {
  const P = p1MoodParams();
  const S = f._p1w || (f._p1w = { rotA: 0.4, rotB: 2.2, phA: 0, phB: 1.7, conv: 0 });
  // carrier -> cu: log map, 100 Hz (Still) = 0 ... 260 Hz = 1; pure tones (396-639 Hz) sit at 1.
  const cuT = Math.max(0, Math.min(1, Math.log(Math.max(1, P.carrier) / 100) / Math.log(2.6)));
  p1Ease(S, 'cu', cuT, dt, 0.7);
  p1Ease(S, 'beat', P.beat, dt, 0.7);
  p1Ease(S, 'tone', P.tone, dt, 0.5);
  p1Ease(S, 'music', P.music, dt, 0.5);
  p1Ease(S, 'amb', P.amb, dt, 0.6);
  p1Ease(S, 'ambKind', P.ambKind, dt, 0.8);
  p1Ease(S, 'pure', P.pure ? 1 : 0, dt, 0.6);
  p1Ease(S, 'recipe', P.recipe, dt, 0.9);
  const cu = S.cu, bu = Math.min(1, Math.sqrt(Math.max(0, S.beat) / 40)); // beat 0..40 Hz -> 0..1
  const tl = Math.max(0, Math.min(1, (S.tone - 0.25) / 0.2));             // tone level ~0.25..0.45 -> 0..1
  const ml = Math.max(0, Math.min(1, (S.music - 0.4) / 0.3));             // music level ~0.4..0.7 -> 0..1
  // Speeds: base from the frequency-tied pulse period; each layer has its own ratio and direction.
  // v10.3: also speeds up with the carrier itself (x0.7 at Still .. x2.1 at Spark / pure tones).
  const per = f.pulsePeriod || 6.5, sp = (0.05 + 0.9 / per) * (0.7 + 1.4 * cu) * (f.spinE != null ? f.spinE : 1); // v12: shared Movement
  const wob = (k) => 0.35 * (noise2(t * 0.13, 4.1 + k * 7.3) - 0.5); // irregular, smooth speed wander
  // Everything below is integrated per frame (phase += speed * dt) and never wrapped: phA/phB also feed
  // scaled terms (px * 0.5, px * 0.3), where a wrap at TAU would snap the trace. Each rate carries its own
  // smooth noise wander, so the motion never settles into a repeating cycle.
  S.rotA += dt * sp * (0.6 + 0.5 * cu + wob(0));                  // spins forward
  S.rotB -= dt * sp * (0.95 + 0.9 * bu + wob(1));                 // counter-spins, faster with beat
  S.phA += dt * sp * (0.5 + 0.8 * cu) * (0.7 + 0.6 * ml) * (1 + wob(2));   // trace drift (music -> livelier)
  S.phB -= dt * sp * (0.8 + 1.1 * cu) * (0.7 + 0.6 * ml) * (1 + wob(3));
  S.conv += dt * sp * 0.55 * (1 + wob(4));                        // converge/cross
  S.liv0 = (S.liv0 || 0) + dt * (0.045 + 0.02 * (noise2(t * 0.011, 31.7) - 0.5));
  S.liv1 = (S.liv1 || 0) + dt * (0.017 + 0.01 * (noise2(t * 0.009, 43.1) - 0.5));
  const open = cu * cu * (3 - 2 * cu);
  const rin = 0.55 * Math.max(0, (open - 0.2) / 0.8);
  const rg = Math.max(0, Math.min(1, (cu - 0.3) / 0.6)), ring = 0.92 * rg * rg * (3 - 2 * rg);
  const swell = 1 + 0.07 * S.amb * Math.sin(t * (0.4 + 0.5 * S.ambKind));     // nature: slow radial swell
  // v10.3 reach: small near the centre at low carrier, growing to the outer edge at the top. The
  // converge/cross swing narrows as the layers open so the top moods sit at the edge; a peak estimate
  // is capped so the brightest line peaks land at ~0.9-0.95R and nothing clips.
  const b = 0.2 + 0.24 * tl;                                                      // tone level -> loop depth
  const S0r = R * (0.3 + 0.74 * cu) * swell * (f._vz ? f._vz.swell * f._vz.tide : 1);
  const swing = 0.1 * (1 - 0.6 * open);
  const S0 = Math.min(S0r, 1.0 * R / (1 + swing)); // measured: bright line peaks land at ~0.93-0.95R
  const lob = 4 + 4 * cu + 3 * bu;                                                // sine lobes on the opened rings
  const damp = (0.065 - 0.03 * tl) * (1 - 0.85 * open);                           // chaos coils at low carrier
  const jit = f._vz ? f._vz.jit : 0;
  const live = (k) => (0.14 * Math.sin(S.liv0 * (1 + 0.37 * k) + k * 2.1) + 0.07 * Math.sin(S.liv1 * (1 + 0.23 * k) + k)) * (1 - 0.6 * open) + jit * (noise2(t * 0.9 + k * 3.3, 6.6) - 0.5);
  const kr = (0.8 + 1.1 * cu) * (0.85 + 0.35 * bu);
  // Engine: binaural keeps the two layers out of phase (crossing); a pure tone draws them closer in step.
  const off = TAU * (0.5 * (1 - S.pure) + 0.12 * S.pure + 0.25 * S.recipe);
  const c = Math.sin(S.conv);                                                     // layers move toward/past each other
  const amp = 0.55 + 0.45 * (f.breath || 0.4);
  const cA = centerWaveP1(f.pulsePh || 0) * amp, cB = centerWaveP1((f.pulsePh || 0) - 0.08) * amp;
  const halo = 4 + 6 * S.amb, bright = 0.45 + 0.4 * tl;
  const eA = bands ? bands[1] : 0.18, eB = bands ? bands[5] : 0.14;
  g.lineJoin = 'round'; g.lineCap = 'round';
  traceP1Harmonograph(g, S0 * (1 + swing * c) * (0.95 + 0.05 * cA), 1.5 * kr + live(0), b, S.phA * 0.5, S.phA, damp, S.rotA, rin, ring, lob);
  strokeP1Trace(g, tint, 0.02, eA, energy, bright, halo);
  traceP1Harmonograph(g, S0 * (0.92 - swing * c) * (0.95 + 0.05 * cB), 1.27 * kr + live(1), b * 1.05, off - S.phB * 0.4, off - S.phB, damp * 1.15, S.rotB, rin * 0.85, ring, lob + 1);
  strokeP1Trace(g, tint, 0.06, eB, energy, bright * 0.9, halo);
}
// Page 1: when the particle budget changes (window crosses 700 px), keep the existing dots where they
// are and only add/drop the tail, instead of re-seeding every dot (which made them all jump).
function ensureRingParticlesP1() {
  const n = ringBudget();
  if (RINGP.x && RINGP.n !== n) {
    const old = RINGP, m = Math.min(old.n, n), keys = ['x', 'y', 'ang', 'rad', 'seed', 'sz', 'band', 'bright'];
    const prev = {}; for (const k of keys) prev[k] = old[k];
    RINGP.x = null; ensureRingParticles();           // fresh arrays of the new size, seeded as usual
    for (const k of keys) RINGP[k].set(prev[k].subarray(0, m));
    if (RINGP.sr) RINGP.sr = null;
    return;
  }
  ensureRingParticles();
}
// f: smoothed { breath, energy, tint, beatPhase, shimmer, bands }
function drawLivingRing(cv, w, h, f, dt) {
  const g = setupCanvas(cv, w, h);
  ensureRingParticlesP1();
  const bands = f.bands;
  stepRingField(dt, f.energy || 0, bands, f.pulseSpeed, f.pulsePh);
  const tint = f.tint || 0;
  const energy = f.energy || 0;
  // v10.3: page 1 is gold only; nothing follows the frequency tint (all colours use tint 0) and the
  // per-band colour offsets are kept inside the gold range of the palette (index <= ~0.1, hue >= ~40).
  const col = PAL[palIndex(0)];
  const hot = PAL_HOT[palIndex(0)];
  const t = RINGP.time;
  const n1 = noise2(t * 0.05, 1.3) - 0.5;
  const n2 = noise2(2.4, t * 0.037) - 0.5;
  // Outer ring keeps the slow fixed breath; the centre pulses at the frequency-driven rate.
  const breath = heartWaveP1(t) * (0.55 + 0.45 * (f.breath || 0.4));
  const cb = centerWaveP1(f.pulsePh || 0) * (0.55 + 0.45 * (f.breath || 0.4));
  const R = fieldRadius(w, h, breath, n1);
  const glow = 0.72 + 0.28 * breath + 0.18 * energy;
  const beatPh = (f.beatPhase || 0) * TAU;
  g.translate(w / 2, h / 2);
  g.globalCompositeOperation = 'source-over';
  paintCenterPulse(g, R, col, cb, energy, false);
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = col;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // Spectrum sitting in the disc: each ring is a band, bright when that band is loud.
  for (let i = 0; i < VIS_BANDS; i++) {
    const e = bands ? bands[i] : 0;
    const u = i / (VIS_BANDS - 1);
    const wob = 0.02 * (noise2(i * 1.7, t * 0.04) - 0.5);
    const rad = R * (0.3 + u * 0.52) * (1 + wob + 0.03 * e);
    g.strokeStyle = PAL[palIndex(u * 0.08)];
    g.globalAlpha = (0.14 + 0.62 * e) * (0.7 + 0.3 * energy);
    g.lineWidth = 1.15 + 3.4 * e;
    strokeDisc(g, rad);
  }
  drawCorePulsesP1(g, R, 1);
  // v12 shared mix layers (circles, ambient signatures, extra layers): see js/vizx.js.
  const VZ = f._vz || (f._vz = vzState());
  const vin = f.vzIn || { cu: 0.5, bu: 0.5, tone: 0.5, music: 0.5, nat: 'off', natLevel: 0 };
  const VC = f._vzc || (f._vzc = {});
  VC.dt = Math.min(0.05, Math.max(0, dt || 0)); VC.t = t; VC.cu = vin.cu; VC.bu = vin.bu; VC.pulseSpeed = f.pulseSpeed; VC.energy = energy;
  VC.tone = vin.tone; VC.music = vin.music; VC.nat = vin.nat; VC.natLevel = vin.natLevel; VC.buSize = null;
  vzPrepare(VZ, VC);
  vzDrawBack(g, R, VZ, VC);
  g.globalCompositeOperation = 'lighter';
  // v10: two free-form harmonograph waveform layers driven by every mood parameter (see drawP1Waves).
  const shimmer = f.shimmer || 0.4;
  TRACE_DIM = VZ.dimC;
  drawP1Waves(g, R, f, tint, energy, cb, t, Math.min(0.05, Math.max(0, dt || 0)), bands);
  TRACE_DIM = 1;
  vzDrawLayers(g, R, VZ, VC);
  const n = RINGP.n;
  const motes = 1 + 0.22 * energy;
  for (let b = 0; b < VIS_BANDS; b++) {
    g.fillStyle = PAL[palIndex(b * 0.012)];
    for (let i = b; i < n; i += VIS_BANDS) {
      const br = RINGP.bright[i];
      const sz = RINGP.sz[i] * (0.9 + br) * motes;
      const x = RINGP.x[i] * R, y = RINGP.y[i] * R;
      g.globalAlpha = 0.05 + 0.2 * br;
      g.beginPath(); g.arc(x, y, sz * 2.5, 0, TAU); g.fill();
      g.globalAlpha = 0.2 + 0.75 * br;
      g.beginPath(); g.arc(x, y, sz * 0.5, 0, TAU); g.fill();
    }
  }
  vzDrawFront(g, R, VZ, VC);
  g.globalCompositeOperation = 'lighter';
  strokeLivingEdge(g, R, col, glow, breath, n1, n2, t);
  paintCore(g, hot, cb, energy);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}
function strokeLivingEdge(g, R, col, glow, breath, n1, n2, t) {
  g.strokeStyle = col;
  g.beginPath();
  for (let k = 0; k < EDGE_N; k++) {
    const th = k / EDGE_N * TAU;
    const wob = 0.012 * Math.sin(2 * th + n1 * 4 + t * 0.31) + 0.007 * Math.sin(5 * th - t * 0.22 + n2 * 3);
    const rr = R * (1 + wob);
    const x = rr * Math.cos(th), y = rr * Math.sin(th);
    if (k) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
  g.globalAlpha = 0.2 * glow;
  g.lineWidth = 28;
  g.stroke();
  g.globalAlpha = 0.38 * glow;
  g.lineWidth = 12;
  g.stroke();
  g.globalAlpha = 0.72 + 0.28 * breath;
  g.lineWidth = 2.5;
  g.stroke();
}
// Opening page: same canvas and outer radius as the resonance ring, drawn as layered petals.
function drawOpeningField(cv, w, h, f, dt) {
  const g = setupCanvas(cv, w, h);
  ensureRingParticles();
  const bands = f.bands;
  stepRingField(dt, f.energy || 0, bands, f.pulseSpeed, f.pulsePh);
  // Colour: page 4 is gold only - every element uses the untinted base palette at all frequencies.
  const tint = 0;
  const energy = f.energy || 0;
  const col = PAL[palIndex(tint)];
  const hot = PAL_HOT[palIndex(tint)];
  const t = RINGP.time;
  const n1 = noise2(t * 0.05, 1.3) - 0.5;
  const n2 = noise2(2.4, t * 0.037) - 0.5;
  // Outer ring keeps the slow fixed breath; the centre pulses at the frequency-driven rate.
  const breath = heartWave(t) * (0.55 + 0.45 * (f.breath || 0.4));
  const cb = centerWave(f.pulsePh || 0) * (0.55 + 0.45 * (f.breath || 0.4));
  const R = fieldRadius(w, h, breath, n1);
  const glow = 0.72 + 0.28 * breath + 0.18 * energy;
  const beatPh = (f.beatPhase || 0) * TAU;
  const shimmer = f.shimmer || 0.4;
  g.translate(w / 2, h / 2);
  g.globalCompositeOperation = 'source-over';
  paintCenterPulse(g, R, col, cb, energy, true);
  g.globalCompositeOperation = 'lighter';
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = col;
  drawCorePulses(g, R, tint, 0.6);
  // v12 shared mix layers (circles, ambient signatures, extra layers): see js/vizx.js.
  const VZ = f._vz || (f._vz = vzState());
  const vin = f.vzIn || { cu: 0.5, bu: 0.5, tone: 0.8, music: 0, nat: 'off', natLevel: 0 };
  const VC = f._vzc || (f._vzc = {});
  VC.dt = Math.min(0.05, Math.max(0, dt || 0)); VC.t = t; VC.cu = vin.cu; VC.bu = vin.bu; VC.pulseSpeed = f.pulseSpeed; VC.energy = energy;
  VC.tone = vin.tone; VC.music = vin.music; VC.nat = vin.nat; VC.natLevel = vin.natLevel; VC.buSize = vin.buSize;
  vzPrepare(VZ, VC);
  vzDrawBack(g, R, VZ, VC);
  const e0 = bands ? bands[0] : 0.2, e1 = bands ? bands[3] : 0.16, e2 = bands ? bands[6] : 0.12;
  // Three petal layers, each morphing and spinning with the frequency (angles from f.petalRots, shape from
  // f.petalSlim: 0 slow/round .. 1 fast/slender). Each layer blooms on the centre pulse a little later than
  // the one inside it, so a pulse cascades outward through the flower.
  const pr = f.p4Rots || f.petalRots || [t * 0.05, t * 0.05 + Math.PI / 5, -t * 0.035];
  const s = f.petalSlim != null ? f.petalSlim : 0.5;
  const ph = f.pulsePh || 0, amp = 0.55 + 0.45 * (f.breath || 0.4);
  // Every layer carries the carrier sine edge with its own phase offset and travel direction (outer wave runs
  // with its spin, middle and inner against theirs), drawn additively so crossings brighten like a kaleidoscope.
  const eu = f.p4U != null ? f.p4U : (f.edgeU != null ? f.edgeU : 0.4);
  const P4 = f.p4Ph || [0, 0, 0, 0, 0, 0], DR = f.p4Drift ? f.p4Drift.x : [0, 0, 0];
  // Three deep sine rosettes, r = mid + A sin(k theta + phase). The carrier (edgeU, eased) grows them
  // from the centre outward: 60 Hz troughs ~10% / peaks ~58% of the field radius, 1200 Hz troughs ~25% /
  // peaks ~90%, and compresses the sine (more cycles). Each layer has its own cycle count, spin (v5
  // beat-driven), wave travel direction and phase, so they overlap like a kaleidoscope; crossings add up.
  // Control mappings (f.pv, eased in app.js): toneLevel -> depth (peak-to-trough) and brightness; engine ->
  // phase relationship between the layers; noise colour/level -> glow halo; nature -> wave flow and a slow
  // radial swell. Beat -> spin, pulse cascade and sine density; carrier -> reach and compression.
  const pv = f.pv || { off1: 1 / 3, off2: 2 / 3, depth: 0.8, halo: 0, flow: 1, nat: 0 };
  const swell = 1 - 0.03 * pv.nat * (1 - Math.sin(t * 0.6));   // nature swell, inward only (never clips)
  // v9: loose free-form harmonograph traces whose SHAPE follows the controls, plus a slow living morph.
  //  carrier -> reach, loop ratio, and opening into a waveform ring (inner radius rin grows with carrier);
  //  beat -> spin (per layer, counter-rotating) and loop density; tone level -> loop depth and damping.
  // Size: each layer grows with its own frequency, from small near the centre to the edge. Peak extent of a
  // trace is ~1.17 S (ring lobes), so S = R * (0.16 + 0.65 u) keeps it inside ~0.95 R at the top.
  //  layer 0 with the carrier, layer 1 with the main frequency (beat), layer 2 with the mix.
  // v12.1: only the carrier layer changes size; the beat-led and mixed layers keep a constant size (the beat
  // now drives their spin, see updateRingAudio).
  const U0 = eu, U1 = 0.5, U2 = 0.45;
  const sz = (u) => R * (0.16 + 0.65 * u) * swell * VZ.swell * VZ.tide;
  const open = eu * eu * (3 - 2 * eu);             // smooth 0..1
  const rin = 0.58 * Math.max(0, (open - 0.2) / 0.8);
  const rg = Math.max(0, Math.min(1, (eu - 0.35) / 0.6)), ring = 0.92 * rg * rg * (3 - 2 * rg);
  const lob = 5 + 4 * eu + 2 * s;   // lobes on the waveform rings (carrier + beat)
  const damp = (0.06 - 0.03 * pv.depth) * (1 - 0.85 * open);
  const b = 0.22 + 0.22 * pv.depth;                // tone level: depth of the second pendulum (loop size)
  const live = (k) => DR[k] + 0.08 * (noise2(t * 0.031 + k * 7.3, k * 3.1) - 0.5) + VZ.jit * (noise2(t * 0.9 + k * 3.3, 5.5) - 0.5);
  const kr = (0.8 + 1.1 * eu) * (0.85 + 0.35 * s);
  const cIn = centerWave(ph) * amp, cMid = centerWave(ph - 0.07) * amp, cOut = centerWave(ph - 0.14) * amp;
  const sh = shimmer * (0.75 + 0.35 * pv.depth), halo = 4 + 7 * pv.halo;
  g.lineJoin = 'round'; g.lineCap = 'round';
  // Outer: spins forward; middle: counter-rotates; inner: fastest. Each has its own ratio and drift.
  TRACE_DIM = VZ.dimC;
  traceFreeHarmonograph(g, sz(U0) * (0.97 + 0.03 * cOut), 1.5 * kr + live(0), b, P4[0], P4[1], damp, pr[0], rin, ring, lob);
  strokeTrace(g, tint, 0, e0, energy, sh, halo);
  traceFreeHarmonograph(g, sz(U1) * (0.97 + 0.03 * cMid), 1.27 * kr + live(1), b * 0.9, TAU * pv.off1 + P4[2], TAU * pv.off1 + P4[3], damp * 1.1, pr[1], rin * 0.85, ring, lob);
  strokeTrace(g, tint, 0.04, e1, energy, sh * 0.8, halo);
  traceFreeHarmonograph(g, sz(U2) * (0.96 + 0.04 * cIn), 2.1 * kr + live(2), b * 1.1, TAU * pv.off2 + P4[4], TAU * pv.off2 + P4[5], damp * 1.2, pr[2], rin * 0.7, ring, lob);
  strokeTrace(g, tint, 0.08, e2, energy, sh, halo);
  TRACE_DIM = 1;
  vzDrawLayers(g, R, VZ, VC);
  // Starry sonar layer: motes drift outward from the middle at the pulse-ring speed (frequency-tied),
  // flare as a pulse ring passes, fade near the edge, and are reborn near the centre. Drawn after the
  // traces so they are never drowned out.
  const n = RINGP.n;
  if (!RINGP.sr || RINGP.sr.length !== n) { RINGP.sr = new Float32Array(n); for (let i = 0; i < n; i++) RINGP.sr[i] = 0.08 + 0.9 * RINGP.seed[i]; }
  const spd = (EMIT.spd || 0.12);
  for (let b2 = 0; b2 < VIS_BANDS; b2++) {
    g.fillStyle = PAL[palIndex(tint + b2 * 0.04)];
    for (let i = b2; i < n; i += VIS_BANDS) {
      if (((i / VIS_BANDS) | 0) % 3) continue;   // page 4: sparse field, about a third of the dots
      let u = RINGP.sr[i] + dt * spd * (0.55 + 0.6 * RINGP.seed[i]);
      if (u > 0.98) { u = 0.06; RINGP.ang[i] = (RINGP.ang[i] + 2.399963) % TAU; }
      RINGP.sr[i] = u;
      let flare = 0;
      for (let k = 0; k < EMIT.n; k++) if (EMIT.alive[k]) { const dd = Math.abs(EMIT.r[k] - u); if (dd < 0.05) flare = Math.max(flare, 1 - dd / 0.05); }
      const fade = Math.max(0, Math.min(1, (u - 0.06) / 0.12)) * Math.min(1, (0.98 - u) / 0.15); // 0 at rebirth and at the edge
      const br = (0.35 + 0.4 * RINGP.bright[i] + 0.6 * flare) * fade;
      const ang = RINGP.ang[i] + t * 0.02 * (i & 1 ? 1 : -1);
      const x = Math.cos(ang) * u * R, y = Math.sin(ang) * u * R;
      const sz = RINGP.sz[i] * (0.8 + 0.5 * flare);
      g.globalAlpha = 0.08 + 0.22 * br;
      g.beginPath(); g.arc(x, y, sz * 2.4, 0, TAU); g.fill();
      g.globalAlpha = 0.3 + 0.7 * br;
      g.beginPath(); g.arc(x, y, sz * 0.55, 0, TAU); g.fill();
    }
  }
  vzDrawFront(g, R, VZ, VC);
  g.globalCompositeOperation = 'lighter';
  strokeLivingEdge(g, R, col, glow, breath, n1, n2, t);
  paintCore(g, hot, cb, energy);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}

