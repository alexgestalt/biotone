// Moods-page water visualizer ('Resonance Spectrum'). One WebGL layer: dark water with highlights inside the gold ring.
const WATER_FS = "precision highp float;uniform vec2 uRes;uniform float uTime,uF,uL;\n#define UND .4\n#define RS .4\n#define RF 70.\n#define RW 60.\n#define RD .6\n#define GW 1.\n#define GD 14.\n#define GS 0.\n#define SPEC 50.\n#define SPECA 1.\n#define CAU 0.\n#define BASE mix(vec3(.4,.26,.07),vec3(.45,.2,.25),uF)\n\nfloat h(float n){return fract(sin(n)*43758.5453);}\nfloat h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+1.),f.x),f.y);}\nfloat fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}\nvec3 fire(float t){t=max(t,0.);return vec3(1.,.72,.25)*t+vec3(.2,.12,0.)*t*t;}\nconst float R=.86;\nvec3 eff0(vec2 p,float t){float r=length(p)/R;float cnt=3.+uF*20.;float rate=.3+uF*2.5;\nfloat ph=r*cnt-t*rate+.6*sin(t*rate*.5);float rip=pow(.5+.5*cos(ph*6.2832),12.);\nfloat band=.5+.5*cos(ph*6.2832+3.1416);vec3 spec=.5+.5*cos(6.2832*(r*1.5+vec3(0.,.15,.3))+t*.1);\nreturn vec3(1.,.78,.3)*rip*(.7+uL)+spec*band*.07*vec3(1.,.8,.5);}\nuniform float uRT,uRA;\nfloat bp(float x,float a,float b){return smoothstep(a-.05,a+.05,x)*(1.-smoothstep(b-.05,b+.05,x));}\nfloat Hh(vec2 p,float t){float r=length(p),a=atan(p.y,p.x),x=uF,rn=r/R;\n float w0=1.-smoothstep(.15,.25,x),w1=bp(x,.2,.45),w2=bp(x,.45,.66),w3=bp(x,.66,.86),w4=smoothstep(.81,.91,x);\n float h=0.;\n h+=w0*(1.6*(p.x*cos(t*.55)+p.y*sin(t*.42))/R+1.1*sin(rn*7.-t*.6));\n float nb=2.+clamp((x-.2)/.25,0.,1.)*9.;h+=w1*1.1*cos(rn*nb*3.1416)*cos(t*1.6)/sqrt(.25+rn);\n float m=floor(3.+clamp((x-.45)/.21,0.,1.)*6.);h+=w2*1.6*cos(m*a+t*.08)*sin(rn*(8.+m*1.5))*cos(t*1.3)*smoothstep(0.,.3,rn);\n float k3=28.+clamp((x-.66)/.2,0.,1.)*30.;vec2 q=p*k3;float sq=cos(q.x)+cos(q.y);\n float hx=cos(q.x)+cos(-.5*q.x+.866*q.y)+cos(-.5*q.x-.866*q.y);\n h+=w3*(7./k3)*mix(sq,hx,smoothstep(.72,.8,x))*cos(t*2.4);\n float kf=110.+x*90.;h+=w4*.2*(.28*sin(r*kf-t*5.)+.22*sin(dot(p,vec2(.8,.6))*kf*.8+t*4.)+.35*(n2(p*45.+t*2.5)-.5));\n h*=(.9+1.3*uL);\n float age=uRT;float dr=r-age*RS;h+=uRA*1.1*sin(dr*RF)*exp(-dr*dr*RW)*exp(-age*RD);return h;}\nvec3 water(vec2 p,float t){float r=length(p);float m=smoothstep(R*.97,R*.35,r);if(m<=0.)return vec3(0.);\n float e=.002;float h=Hh(p,t);vec2 g=vec2(Hh(p+vec2(e,0),t)-h,Hh(p+vec2(0,e),t)-h)/e;\n vec3 nrm=normalize(vec3(-g*.05,1.));float dif=max(dot(nrm,normalize(vec3(-.5,.6,.8))),0.);float spec=pow(max(dot(reflect(-normalize(vec3(.4,-.5,.9)),nrm),vec3(0,0,1)),0.),SPEC);\n vec2 q=p+g*.002*GW+vec2(0.,t*.01);float mat=fbm(q*4.+h*.3);\n float sp2=pow(max(dot(reflect(-normalize(vec3(-.3,.4,.9)),nrm),vec3(0,0,1)),0.),SPEC*.4);float rn=r/R;vec3 body=vec3(.038,.046,.058)*(.55+.45*smoothstep(0.,1.,rn))*(.85+.3*mat);float fr=pow(clamp(1.-nrm.z,0.,1.),.6);float graze=smoothstep(.3,1.,rn);vec3 sky=vec3(.30,.36,.44)*(.02+.55*fr+.05*graze);vec3 c=body+sky*.5+vec3(1.,.9,.68)*spec*SPECA*3.;\n vec2 gl=abs(fract(q*GD)-.5);float grid=smoothstep(.04,.0,min(gl.x,gl.y));c+=vec3(1.,.75,.3)*grid*GS*(.5+.5*dif);\n float cau=pow(clamp(1.-length(g)*.25,0.,1.),1.)*0.;cau=pow(abs(sin(q.x*30.+h*2.)*sin(q.y*30.-h*2.)),6.);c+=vec3(1.,.85,.4)*cau*CAU*(.6+grid*2.);\n return c*m;}\nvec3 eff(vec2 p,float t){vec2 p0=p;\n#ifdef BEND\n vec2 pp=p;float rr=length(p);float dr=rr-uRT*RS;p+=normalize(p+1e-5)*uRA*.05*sin(dr*RF)*exp(-dr*dr*RW*.3)*exp(-uRT*RD);\n#endif\n return water(p0,t)*1.6;}\nvec3 icon(vec2 p,float t,vec3 col){float r=length(p);float d=r-R;\n vec3 c=col*smoothstep(R,R-.02,r)+col*smoothstep(R+.01,R+.03,r)*.6; // effect, a bit dimmer outside\n c+=vec3(1.,.62,.12)*.35*exp(-max(-d,0.)*70.)*step(r,R); // inward glow\n float th=.055,sh=clamp(1.-abs(d)/th,0.,1.);float lit=.55+.45*dot(normalize(p+1e-5),normalize(vec2(-.6,.8)));\n vec3 gold=mix(vec3(.55,.32,.04),vec3(1.,.86,.38),pow(sh,.7)*lit)+vec3(1.,.97,.8)*pow(sh,8.)*.6;\n c=mix(c,gold,smoothstep(0.,.08,sh));c+=vec3(1.,.6,.1)*.18*exp(-abs(d)*14.); // bloom\n return c;}\nvoid main(){vec2 p=(gl_FragCoord.xy/uRes)*2.-1.;float t=uTime;gl_FragColor=vec4(icon(p,t,eff(p,t)),1.);}\n";
const WaterVis = { gl: null, cv: null, prog: null, u: null, t0: 0, F: 0.4, L: 0.15, rt0: -1e9, key: null, serial: -1, failed: false };
function waterInit(box) {
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) { WaterVis.failed = true; return false; }
  const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  try {
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}'));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, WATER_FS)); gl.linkProgram(p); gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(p, n);
    WaterVis.u = { res: U('uRes'), t: U('uTime'), f: U('uF'), l: U('uL'), rt: U('uRT'), ra: U('uRA') };
  } catch (e) { console.warn('water vis', e); WaterVis.failed = true; return false; }
  box.appendChild(cv); WaterVis.gl = gl; WaterVis.cv = cv; WaterVis.t0 = performance.now();
  return true;
}
function waterKick() { WaterVis.rt0 = performance.now(); }
// s: { x: 0..1 frequency position, level: 0..1, key: mood key, serial: chord change counter }
function drawWaterVis(ocv, w, h, s, dt) {
  const box = ocv.parentElement;
  if (!WaterVis.gl || WaterVis.cv.parentElement !== box) { if (WaterVis.failed || !waterInit(box)) return false; }
  ocv.style.visibility = 'hidden';
  if (s.key !== WaterVis.key) { if (WaterVis.key !== null) waterKick(); WaterVis.key = s.key; }
  if (s.serial !== WaterVis.serial) { if (WaterVis.serial >= 0) waterKick(); WaterVis.serial = s.serial; }
  const k = 1 - Math.exp(-dt / 0.6); WaterVis.F += (s.x - WaterVis.F) * k; WaterVis.L += (Math.max(0.12, s.level) - WaterVis.L) * k;
  const d = Math.min(1.5, window.devicePixelRatio || 1), W = Math.round(w * d), H = Math.round(h * d);
  const gl = WaterVis.gl, cv = WaterVis.cv, u = WaterVis.u;
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  gl.viewport(0, 0, W, H);
  const now = performance.now();
  gl.uniform2f(u.res, W, H); gl.uniform1f(u.t, (now - WaterVis.t0) / 1000);
  gl.uniform1f(u.f, WaterVis.F); gl.uniform1f(u.l, WaterVis.L);
  gl.uniform1f(u.rt, (now - WaterVis.rt0) / 1000); gl.uniform1f(u.ra, 1);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return true;
}
