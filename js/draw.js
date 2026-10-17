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
let EMIT = { n: 16, r: null, amp: null, band: null, alive: null, acc: 0 };
// Each ring canvas keeps its own particle/pulse field so two pages never share or double-step state.
const RING_STATE_MAIN = { p: RINGP, e: EMIT };
function newRingState() {
  return { p: { n: 0, x: null, y: null, ang: null, rad: null, seed: null, sz: null, band: null, bright: null, time: 0 },
    e: { n: 16, r: null, amp: null, band: null, alive: null, acc: 0 } };
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
  const ph = time / 5.5 - Math.floor(time / 5.5);
  const lub = Math.exp(-((ph - 0.08) * (ph - 0.08)) / 0.0018);
  const dub = 0.7 * Math.exp(-((ph - 0.22) * (ph - 0.22)) / 0.0022);
  const slow = 0.5 + 0.5 * Math.sin(time * (TAU / 5.6));
  const h = lub + dub; return 0.45 * slow + 0.55 * (h < 1 ? h : 1);
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
function stepRingField(dt, energy, bands, pulseSpeed) {
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
  // Travel time is fixed (~7 s). Loudness only changes how often a ring is born.
  EMIT.acc += dt * (0.34 + 0.55 * (energy || 0));
  if (EMIT.acc >= 1) {
    EMIT.acc -= 1;
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
function tracePetals(g, R, lobes, rot, inner) {
  g.beginPath();
  for (let k = 0; k <= EDGE_N; k++) {
    const th = (k / EDGE_N) * TAU;
    const c = Math.cos(lobes * (th + rot));
    const lobe = c > 0 ? Math.pow(c, 0.72) : 0;
    const rr = R * (inner + (1 - inner) * lobe);
    const x = rr * Math.cos(th), y = rr * Math.sin(th);
    if (k) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
}
function paintPetals(g, R, tint, lobes, rot, inner, shift, e, energy, shimmer) {
  tracePetals(g, R, lobes, rot, inner);
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
    const fade = life * (0.35 + 0.65 * life);
    g.strokeStyle = PAL[palIndex(tint + EMIT.band[i] * 0.035)];
    g.globalAlpha = (0.12 + 0.5 * EMIT.amp[i]) * fade * k;
    g.lineWidth = 1.4 + 7 * fade;
    strokeDisc(g, R * u);
  }
}
// f: smoothed { breath, energy, tint, beatPhase, shimmer, bands }
function drawLivingRing(cv, w, h, f, dt) {
  const g = setupCanvas(cv, w, h);
  ensureRingParticles();
  const bands = f.bands;
  stepRingField(dt, f.energy || 0, bands, f.pulseSpeed);
  const tint = f.tint || 0;
  const energy = f.energy || 0;
  const col = PAL[palIndex(tint)];
  const hot = PAL_HOT[palIndex(tint)];
  const t = RINGP.time;
  const n1 = noise2(t * 0.05, 1.3) - 0.5;
  const n2 = noise2(2.4, t * 0.037) - 0.5;
  const breath = heartWave(t) * (0.55 + 0.45 * (f.breath || 0.4));
  const R = fieldRadius(w, h, breath, n1);
  const glow = 0.72 + 0.28 * breath + 0.18 * energy;
  const beatPh = (f.beatPhase || 0) * TAU;
  g.translate(w / 2, h / 2);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = col;
  g.globalAlpha = 0.09 * glow;
  g.beginPath(); g.arc(0, 0, R * 0.98, 0, TAU); g.fill();
  g.globalAlpha = 0.07 * glow;
  g.beginPath(); g.arc(0, 0, R * 0.5, 0, TAU); g.fill();
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
    g.strokeStyle = PAL[palIndex(tint + u * 0.28)];
    g.globalAlpha = (0.14 + 0.62 * e) * (0.7 + 0.3 * energy);
    g.lineWidth = 1.15 + 3.4 * e;
    strokeDisc(g, rad);
  }
  drawCorePulses(g, R, tint, 1);
  // Two close spatial tones. Their product breathes at the binaural rate.
  const shimmer = f.shimmer || 0.4;
  const p1 = t * 0.17;
  const p2 = p1 + beatPh;
  const amp = 0.012 + 0.02 * shimmer;
  g.beginPath();
  for (let k = 0; k < EDGE_N; k++) {
    const th = k / EDGE_N * TAU;
    const wave = Math.sin(7 * th + p1) * Math.sin(7 * th + p2);
    const rr = R * (0.9 + amp * wave + 0.008 * n2 * Math.sin(3 * th + t * 0.2));
    const x = rr * Math.cos(th), y = rr * Math.sin(th);
    if (k) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
  g.strokeStyle = col;
  g.globalAlpha = 0.22 + 0.38 * shimmer;
  g.lineWidth = 5.5;
  g.stroke();
  g.globalAlpha = 0.55 + 0.35 * shimmer;
  g.lineWidth = 1.35;
  g.stroke();
  const n = RINGP.n;
  const motes = 1 + 0.22 * energy;
  for (let b = 0; b < VIS_BANDS; b++) {
    g.fillStyle = PAL[palIndex(tint + b * 0.04)];
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
  strokeLivingEdge(g, R, col, glow, breath, n1, n2, t);
  g.fillStyle = hot;
  g.globalAlpha = 0.45 + 0.5 * energy;
  g.beginPath(); g.arc(0, 0, 2.2 + 2.4 * energy + 1.2 * breath, 0, TAU); g.fill();
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
  stepRingField(dt, f.energy || 0, bands, f.pulseSpeed);
  const tint = f.tint || 0;
  const energy = f.energy || 0;
  const col = PAL[palIndex(tint)];
  const hot = PAL_HOT[palIndex(tint)];
  const t = RINGP.time;
  const n1 = noise2(t * 0.05, 1.3) - 0.5;
  const n2 = noise2(2.4, t * 0.037) - 0.5;
  const breath = heartWave(t) * (0.55 + 0.45 * (f.breath || 0.4));
  const R = fieldRadius(w, h, breath, n1);
  const glow = 0.72 + 0.28 * breath + 0.18 * energy;
  const beatPh = (f.beatPhase || 0) * TAU;
  const shimmer = f.shimmer || 0.4;
  g.translate(w / 2, h / 2);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = col;
  g.globalAlpha = 0.09 * glow;
  g.beginPath(); g.arc(0, 0, R * 0.98, 0, TAU); g.fill();
  g.globalCompositeOperation = 'lighter';
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = col;
  drawCorePulses(g, R, tint, 0.6);
  const e0 = bands ? bands[0] : 0.2, e1 = bands ? bands[3] : 0.16, e2 = bands ? bands[6] : 0.12;
  paintPetals(g, R, tint, 5, t * 0.05, 0.16, 0, e0, energy, shimmer);
  paintPetals(g, R, tint, 5, t * 0.05 + beatPh * 0.06, 0.2, 0.12, e1, energy, shimmer * 0.7);
  paintPetals(g, R * 0.62, tint, 3, -t * 0.035, 0.12, 0.22, e2, energy, shimmer);
  const n = RINGP.n;
  const motes = 1 + 0.22 * energy;
  for (let b = 0; b < VIS_BANDS; b++) {
    g.fillStyle = PAL[palIndex(tint + b * 0.04)];
    for (let i = b; i < n; i += VIS_BANDS) {
      const br = RINGP.bright[i];
      const ang = RINGP.ang[i] + t * 0.04;
      const lobe = 0.38 + 0.62 * Math.abs(Math.cos(3 * (ang + t * 0.03)));
      const rad = RINGP.rad[i] * lobe;
      const sz = RINGP.sz[i] * (0.9 + br) * motes;
      const x = Math.cos(ang) * rad * R, y = Math.sin(ang) * rad * R;
      g.globalAlpha = 0.05 + 0.18 * br;
      g.beginPath(); g.arc(x, y, sz * 2.2, 0, TAU); g.fill();
      g.globalAlpha = 0.22 + 0.7 * br;
      g.beginPath(); g.arc(x, y, sz * 0.45, 0, TAU); g.fill();
    }
  }
  strokeLivingEdge(g, R, col, glow, breath, n1, n2, t);
  g.fillStyle = hot;
  g.globalAlpha = 0.45 + 0.5 * energy;
  g.beginPath(); g.arc(0, 0, 2.2 + 2.4 * energy + 1.2 * breath, 0, TAU); g.fill();
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}

