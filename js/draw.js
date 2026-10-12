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
const moodIcon = {sleep:I.moon, rest:I.leaf, focus:I.scope, active:I.bolt, calm:I.wind, meditate:I.spark};

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
 const g=setupCanvas(cv,w,h);const c={x:w/2,y:h/2};const R=Math.min(w,h)*.36;const base=heatColor(f.heat);const e=f.amp;
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
  const dir=j%2===0?1:-1;const ang=s2*2*Math.PI+f.phase*(.08+.15*s3)*dir+.8*life;const rad=R*(.35+1.15*life)*(1+.04*Math.sin(f.phase*1.3+s3*6));
  const a=Math.sin(Math.PI*life)*(.15+.55*e+.4*f.high+.3*f.bloom);const sz=.8+2.2*s3*(.5+e);
  g.fillStyle=css(base,Math.min(1,a));g.beginPath();g.arc(c.x+rad*Math.cos(ang),c.y+rad*Math.sin(ang),sz/2,0,Math.PI*2);g.fill();}
 const dot=2.5+3.5*e;g.fillStyle=`rgba(255,255,255,${.55+.35*e})`;g.beginPath();g.arc(c.x,c.y,dot,0,Math.PI*2);g.fill();
}

// GlowRing (one frame)
function drawGlowRing(cv,size,breath,angleDeg){
 const g=setupCanvas(cv,size,size);const s=1+.02*breath;const c=size/2;const r=(size-24)/2;
 g.translate(c,c);g.scale(s,s);
 g.strokeStyle='rgba(255,199,31,.10)';g.lineWidth=20;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();
 let cg='#FFC71F';
 if(g.createConicGradient){cg=g.createConicGradient((angleDeg-90)*Math.PI/180,0,0);
 cg.addColorStop(0,'#FFC71F');cg.addColorStop(1/3,'rgba(255,128,20,.7)');cg.addColorStop(2/3,'rgba(255,199,31,.4)');cg.addColorStop(1,'#FFC71F');}
 g.shadowColor=`rgba(255,199,31,${.35+.45*breath})`;g.shadowBlur=(8+16*breath)*g._d;
 g.strokeStyle=cg;g.lineWidth=3;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();
}

