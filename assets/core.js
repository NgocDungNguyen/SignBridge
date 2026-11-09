/* SignBridge core: avatar engine (2-arm IK + 5-finger hands), placeholder sign library, VI/EN dictionary, sample phrases. */
const CONFIG={size:[640,640],handScale:.9,depthScale:.0008,body:{shoulderL:[205,222],shoulderR:[435,222],upperArm:180,foreArm:160}};
const LOOK_AV={skin:'#e6b58f',skinLight:'#f0c7a6',skinLine:'#6f4128',shirt:'#3f6ea8',shirtDark:'#2f5588',shirtLine:'#1c3557',hair:'#2a211d'};
const LOOK_CAM={skin:'#d9a982',skinLight:'#e8bf9b',skinLine:'#6b4630',shirt:'#6b7a8f',shirtDark:'#56657a',shirtLine:'#37465a',hair:'#1f1815'};
const PALM=[[-19,8],[-30,-2],[-41,-16],[-44,-37],[-38,-56],[-27,-70],[-9,-77],[9,-74],[25,-65],[32,-46],[31,-22],[26,-4],[19,8]];
const CREASES=[[[-34,-44],[-8,-38],[-12,-4]],[[28,-30],[0,-40],[-26,-36]]];
const FINGERS=[
 {thumb:true,base:[-28,-12],angle:-30,len:[34,27,22],width:[23,19,16],maxBend:[25,55,55],spread:-20},
 {base:[-24,-67],angle:-5,len:[38,24,19],width:[15,13,11],maxBend:[80,95,65],spread:-12},
 {base:[-8,-73],angle:-1,len:[42,27,20],width:[16,14,12],maxBend:[80,95,65],spread:-3},
 {base:[8,-70],angle:4,len:[38,25,19],width:[15,13,11],maxBend:[80,95,65],spread:7},
 {base:[23,-61],angle:10,len:[30,19,16],width:[13,11,9],maxBend:[80,95,65],spread:16}];
/* H(x,y,depth,rotation,curl[thumb..pinky],spread,elbowOut). Placeholder shapes: swap for validated VSL data later. */
const H=(x,y,z=0,rot=0,curl=[0,0,0,0,0],spread=.3,elbow=.35)=>({x,y,z,rot,curl,spread,elbow});
const OPEN=[0,0,0,0,0],FIST=[1,1,1,1,1],RELAX=[.3,.3,.35,.4,.45];
const RL=H(262,440,90,165,RELAX,.15,.15),RR=H(378,440,90,-165,RELAX,.15,.15);
const REST={L:RL,R:RR};
const CAM_REST={L:H(262,575,90,165,RELAX,.15,.15),R:H(378,575,90,-165,RELAX,.15,.15)};
const [W,HT]=CONFIG.size,R=Math.PI/180;
let ctx=null,CL=LOOK_AV;

function smooth(pts){ctx.moveTo(pts[0][0],pts[0][1]);for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;ctx.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1]);}}
function digitPoints(h){return FINGERS.map((f,i)=>{const pts=[[f.base[0],f.base[1]]];let x=f.base[0],y=f.base[1],cum=0;
  for(let j=0;j<3;j++){cum+=h.curl[i]*f.maxBend[j];const ang=(f.angle+h.spread*f.spread+(f.thumb?cum:0))*R;let L=f.len[j];if(!f.thumb)L*=Math.cos(cum*R);x+=Math.sin(ang)*L;y-=Math.cos(ang)*L;pts.push([x,y]);}
  return pts;});}
function strokeDigit(pts,f,extra,color){ctx.strokeStyle=color;ctx.lineCap=ctx.lineJoin='round';for(let j=0;j<3;j++){ctx.lineWidth=f.width[j]+extra;ctx.beginPath();ctx.moveTo(pts[j][0],pts[j][1]);ctx.lineTo(pts[j+1][0],pts[j+1][1]);ctx.stroke();}}
function handBox(h,side,scale,D){
  const a=h.rot*R,ca=Math.cos(a),sa=Math.sin(a);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const p of PALM.concat(...D)){const x=side*scale*p[0],y=scale*p[1],X=h.x+x*ca-y*sa,Y=h.y+x*sa+y*ca;x0=Math.min(x0,X);y0=Math.min(y0,Y);x1=Math.max(x1,X);y1=Math.max(y1,Y);}
  return{x0:x0-14,y0:y0-14,x1:x1+14,y1:y1+14,c:side>0?'98%':'97%'};}
function drawBox(b){
  if(b.y0>600)return;
  ctx.save();ctx.strokeStyle='#81c995';ctx.lineWidth=3;ctx.lineCap='round';const L=20;
  [[b.x0,b.y0,1,1],[b.x1,b.y0,-1,1],[b.x0,b.y1,1,-1],[b.x1,b.y1,-1,-1]].forEach(([x,y,sx,sy])=>{ctx.beginPath();ctx.moveTo(x,y+sy*L);ctx.lineTo(x,y);ctx.lineTo(x+sx*L,y);ctx.stroke();});
  ctx.font='600 22px Roboto,system-ui,sans-serif';const t='Hand '+b.c,w=ctx.measureText(t).width+18;
  ctx.fillStyle='#1e8e3e';ctx.beginPath();ctx.roundRect(b.x0,b.y0-34,w,30,8);ctx.fill();ctx.fillStyle='#fff';ctx.fillText(t,b.x0+9,b.y0-12);ctx.restore();}
function drawHand(h,side,scale,boxes){
  const D=digitPoints(h);if(boxes)boxes.push(handBox(h,side,scale,D));
  ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.rot*R);ctx.scale(side*scale,scale);
  const under=[],over=[];D.forEach((p,i)=>(h.curl[i]<.5?under:over).push(i));
  under.forEach(i=>strokeDigit(D[i],FINGERS[i],3,CL.skinLine));
  const g=ctx.createLinearGradient(-40,-77,30,8);g.addColorStop(0,CL.skinLight);g.addColorStop(1,CL.skin);
  ctx.fillStyle=g;ctx.strokeStyle=CL.skinLine;ctx.lineWidth=3;ctx.beginPath();smooth(PALM);ctx.fill();ctx.stroke();
  ctx.save();ctx.globalAlpha=.28;ctx.lineWidth=1.6;ctx.lineCap='round';
  CREASES.forEach(c=>{ctx.beginPath();ctx.moveTo(c[0][0],c[0][1]);ctx.quadraticCurveTo(c[1][0],c[1][1],c[2][0],c[2][1]);ctx.stroke();});ctx.restore();
  under.forEach(i=>strokeDigit(D[i],FINGERS[i],0,CL.skin));
  over.forEach(i=>{strokeDigit(D[i],FINGERS[i],3,CL.skinLine);strokeDigit(D[i],FINGERS[i],0,CL.skin);});
  ctx.save();ctx.globalAlpha=.3;ctx.strokeStyle=CL.skinLine;ctx.lineWidth=1.3;ctx.lineCap='round';
  D.forEach((pts,i)=>{if(h.curl[i]>.5)return;for(const j of [1,2]){const dx=pts[j+1][0]-pts[j-1][0],dy=pts[j+1][1]-pts[j-1][1],m=Math.hypot(dx,dy)||1,nx=-dy/m,ny=dx/m,hw=FINGERS[i].width[j]*.28;
    ctx.beginPath();ctx.moveTo(pts[j][0]-nx*hw,pts[j][1]-ny*hw);ctx.lineTo(pts[j][0]+nx*hw,pts[j][1]+ny*hw);ctx.stroke();}});
  ctx.restore();
  if(boxes){ /* hand-tracking landmarks, drawn in the hand's own space */
    const k=1/scale;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(138,180,248,.95)';ctx.lineWidth=2.6*k;
    D.forEach(pts=>{ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(pts[0][0],pts[0][1]);pts.forEach((p,j)=>{if(j)ctx.lineTo(p[0],p[1]);});ctx.stroke();});
    ctx.fillStyle='#fff';ctx.strokeStyle='#1a73e8';ctx.lineWidth=2*k;
    [[0,6]].concat(...D).forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],4*k,0,7);ctx.fill();ctx.stroke();});
    ctx.restore();}
  ctx.restore();}
function solveArm(S,T,a,b,side,out){
  const v=[T[0]-S[0],T[1]-S[1],T[2]-S[2]],d0=Math.hypot(...v)||1,d=Math.min(a+b-.5,Math.max(Math.abs(a-b)+.5,d0)),u=v.map(k=>k/d0);
  const wr=[S[0]+u[0]*d,S[1]+u[1]*d,S[2]+u[2]*d],ca=(a*a+d*d-b*b)/(2*a*d),sa=Math.sqrt(Math.max(0,1-ca*ca));
  const pole=[side*out,1,-.15],dot=pole[0]*u[0]+pole[1]*u[1]+pole[2]*u[2];
  let n=pole.map((k,i)=>k-u[i]*dot);const nl=Math.hypot(...n);n=nl>1e-3?n.map(k=>k/nl):[side,0,0];
  return{elbow:[0,1,2].map(i=>S[i]+u[i]*a*ca+n[i]*a*sa),wrist:wr};}
function sleeve(S,E,Wr){for(const pass of [0,1]){const ex=pass?0:4,col=pass?CL.shirt:CL.shirtLine;ctx.strokeStyle=col;ctx.fillStyle=col;
  ctx.lineCap='round';ctx.lineWidth=42+ex;ctx.beginPath();ctx.moveTo(S[0],S[1]);ctx.lineTo(E[0],E[1]);ctx.stroke();
  ctx.beginPath();ctx.arc(E[0],E[1],(36+ex)/2,0,7);ctx.fill();
  ctx.lineCap='butt';ctx.lineWidth=36+ex;ctx.beginPath();ctx.moveTo(E[0],E[1]);ctx.lineTo(Wr[0],Wr[1]);ctx.stroke();
  ctx.beginPath();ctx.arc(Wr[0],Wr[1],(30+ex)/2,0,7);ctx.fill();}}
function cuff(Wr,rot){const a=rot*R,dx=-Math.sin(a),dy=Math.cos(a);
  for(const pass of [0,1]){ctx.strokeStyle=pass?CL.shirt:CL.shirtLine;ctx.lineCap='butt';ctx.lineWidth=34+(pass?0:4);ctx.beginPath();ctx.moveTo(Wr[0]+dx*22,Wr[1]+dy*22);ctx.lineTo(Wr[0],Wr[1]);ctx.stroke();}
  ctx.strokeStyle=CL.shirtLine;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(Wr[0]-dy*17,Wr[1]+dx*17);ctx.lineTo(Wr[0]+dy*17,Wr[1]-dx*17);ctx.stroke();}
function drawBody(){
  ctx.fillStyle=CL.shirtDark;ctx.strokeStyle=CL.shirtLine;ctx.lineWidth=3;ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(150,HT);ctx.lineTo(160,292);ctx.quadraticCurveTo(165,208,246,196);ctx.lineTo(394,196);ctx.quadraticCurveTo(475,208,480,292);ctx.lineTo(490,HT);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=CL.skin;ctx.strokeStyle=CL.skinLine;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(296,140,48,70,14);ctx.fill();ctx.stroke();
  ctx.fillStyle=CL.shirtDark;ctx.beginPath();ctx.moveTo(290,196);ctx.lineTo(320,226);ctx.lineTo(350,196);ctx.closePath();ctx.fill();
  ctx.fillStyle=CL.hair;ctx.beginPath();ctx.ellipse(320,92,60,72,0,0,7);ctx.fill();
  ctx.fillStyle=CL.skin;ctx.strokeStyle=CL.skinLine;ctx.lineWidth=2.5;
  [[262,100],[378,100]].forEach(e=>{ctx.beginPath();ctx.ellipse(e[0],e[1],8,13,0,0,7);ctx.fill();ctx.stroke();});
  ctx.beginPath();ctx.ellipse(320,102,54,64,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=CL.hair;ctx.beginPath();ctx.ellipse(320,86,58,56,0,Math.PI*1.02,Math.PI*1.98);ctx.fill();
  ctx.fillStyle=CL.skinLine;[[300,100],[340,100]].forEach(e=>{ctx.beginPath();ctx.ellipse(e[0],e[1],4,5,0,0,7);ctx.fill();});
  ctx.strokeStyle=CL.hair;ctx.lineWidth=3;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(291,86);ctx.quadraticCurveTo(300,80,309,85);ctx.moveTo(331,85);ctx.quadraticCurveTo(340,80,349,86);ctx.stroke();
  ctx.strokeStyle=CL.skinLine;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(320,104);ctx.quadraticCurveTo(315,118,322,120);ctx.stroke();
  ctx.beginPath();ctx.moveTo(303,132);ctx.quadraticCurveTo(320,142,337,132);ctx.stroke();}

const CTXS=new WeakMap();
function paintRig(c,pose,look,lm,z){z=z||1;
  if(!c||!c.offsetParent)return;
  let x=CTXS.get(c);if(!x){x=c.getContext('2d');CTXS.set(c,x);}
  ctx=x;CL=look;
  if(c.width!==W){c.width=W;c.height=HT;}
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,HT);ctx.setTransform(z,0,0,z,(W-W*z)/2,z<1?72:0);drawBody();
  const B=CONFIG.body,boxes=lm?[]:null;
  [['L',-1,B.shoulderL],['R',1,B.shoulderR]].forEach(([k,side,sh])=>{
    const h=pose[k],arm=solveArm([sh[0],sh[1],0],[h.x,h.y,h.z],B.upperArm,B.foreArm,side,h.elbow),s=CONFIG.handScale*(1+h.z*CONFIG.depthScale);
    sleeve(sh,arm.elbow,arm.wrist);drawHand({...h,x:arm.wrist[0],y:arm.wrist[1]},side,s,boxes);cuff(arm.wrist,h.rot);});
  if(boxes)boxes.forEach(drawBox);}

const lerp=(a,b,t)=>a+(b-a)*t;
const mixHand=(A,B,t)=>({x:lerp(A.x,B.x,t),y:lerp(A.y,B.y,t),z:lerp(A.z,B.z,t),rot:lerp(A.rot,B.rot,t),spread:lerp(A.spread,B.spread,t),elbow:lerp(A.elbow,B.elbow,t),curl:A.curl.map((v,i)=>lerp(v,B.curl[i],t))});
const clone=o=>JSON.parse(JSON.stringify(o));
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
class Rig{
  constructor(p){this.cur=clone(p);this.from=clone(p);this.to=clone(p);this.t0=0;this.dur=1;this.lm=false;}
  go(p,ms){this.from=clone(this.cur);this.to=p;this.t0=performance.now();this.dur=Math.max(1,ms);}
  tick(now){const e=ease(Math.max(0,Math.min(1,(now-this.t0)/this.dur)));this.cur={L:mixHand(this.from.L,this.to.L,e),R:mixHand(this.from.R,this.to.R,e)};}}
const avRig=new Rig(REST),camRig=new Rig(CAM_REST);
function frame(now){
  avRig.tick(now);camRig.tick(now);
  paintRig(document.getElementById('cv'),avRig.cur,LOOK_AV,false);
  paintRig(document.getElementById('cv2'),camRig.cur,LOOK_CAM,camRig.lm,.86);
  paintRig(document.getElementById('cv3'),camRig.cur,LOOK_CAM,false,.86);
  requestAnimationFrame(frame);}
const P=(l,r)=>({L:l||RL,R:r||RR}),O=OPEN,F=FIST;
const I_=[1,0,1,1,1],V_=[1,0,0,1,1],Y_=[0,1,1,1,0],C_=[.45,.5,.5,.5,.5],TH=[0,1,1,1,1],CLAW=[.5,.6,.6,.6,.6];
const SIGNS={
 HELLO:[P(0,H(545,215,20,0,O,.8,.7)),P(0,H(575,195,20,22,O,.8,.7)),P(0,H(545,215,20,-8,O,.8,.7)),P(0,H(575,195,20,22,O,.8,.7))],
 GOODBYE:[P(0,H(520,270,60,-10,O,.7,.5)),P(0,H(520,270,60,25,O,.7,.5)),P(0,H(520,270,60,-10,O,.7,.5)),P(0,H(520,270,60,25,O,.7,.5))],
 WELCOME:[P(H(250,360,120,60,O,.2,.3),H(390,360,120,-60,O,.2,.3)),P(H(300,360,160,70,O,0,.2),H(340,360,160,-70,O,0,.2))],
 THANK_YOU:[P(0,H(385,160,100,-20,O,0,.3)),P(0,H(420,300,150,-55,O,0,.2))],
 PLEASE:[P(0,H(350,330,140,-85,O,0,.2)),P(0,H(320,355,140,-85,O,0,.2)),P(0,H(285,330,140,-85,O,0,.2)),P(0,H(320,305,140,-85,O,0,.2))],
 SORRY:[P(0,H(350,330,140,-85,F,0,.2)),P(0,H(320,355,140,-85,F,0,.2)),P(0,H(285,330,140,-85,F,0,.2)),P(0,H(320,305,140,-85,F,0,.2))],
 YES:[P(0,H(425,330,130,0,F,0,.2)),P(0,H(425,330,130,35,F,0,.2)),P(0,H(425,330,130,0,F,0,.2)),P(0,H(425,330,130,35,F,0,.2))],
 NO:[P(0,H(430,310,130,0,[.5,0,0,1,1],.2,.2)),P(0,H(430,310,130,0,[.5,.8,.8,1,1],0,.2)),P(0,H(430,310,130,0,[.5,0,0,1,1],.2,.2))],
 YOU:[P(0,H(455,335,140,32,I_,0,.25)),P(0,H(470,330,170,32,I_,0,.25))],
 ME:[P(0,H(395,335,140,-75,I_,0,.25)),P(0,H(375,345,120,-75,I_,0,.25))],
 WE:[P(0,H(395,335,140,-75,I_,0,.25)),P(0,H(450,335,140,-75,I_,0,.25))],
 QUESTION:[P(H(225,385,140,-25,O,.5,.2),H(415,385,140,25,O,.5,.2)),P(H(225,370,140,-15,O,.8,.2),H(415,370,140,15,O,.8,.2)),P(H(225,385,140,-25,O,.5,.2),H(415,385,140,25,O,.5,.2))],
 WHAT:[P(H(225,360,140,-20,O,.9,.3),H(415,360,140,20,O,.9,.3)),P(H(200,360,140,-35,O,.9,.4),H(440,360,140,35,O,.9,.4))],
 WHY:[P(0,H(405,150,70,-20,[.2,0,0,0,0],.3,.3)),P(0,H(455,185,90,10,Y_,.5,.3))],
 HOW:[P(H(285,380,150,-20,F,0,.2),H(355,380,150,20,F,0,.2)),P(H(285,380,150,-60,[.4,.3,.3,.3,.3],.3,.2),H(355,380,150,60,[.4,.3,.3,.3,.3],.3,.2))],
 WHERE:[P(0,H(430,310,130,-10,I_,0,.3)),P(0,H(430,310,130,20,I_,0,.3)),P(0,H(430,310,130,-10,I_,0,.3)),P(0,H(430,310,130,20,I_,0,.3))],
 WHEN:[P(H(285,370,150,60,I_,0,.2),H(370,350,150,-20,I_,0,.2)),P(H(285,370,150,60,I_,0,.2),H(330,375,150,-60,I_,0,.2))],
 UNDERSTAND:[P(0,H(410,150,60,0,F,0,.4)),P(0,H(410,128,60,0,I_,0,.4))],
 DONT_UNDERSTAND:[P(0,H(410,150,60,0,F,0,.4)),P(0,H(410,128,60,0,I_,0,.4)),P(0,H(440,200,100,40,O,.5,.4)),P(0,H(440,200,100,-40,O,.5,.4))],
 REPEAT:[P(H(270,360,150,70,O,0,.2),H(410,350,130,-65,O,.1,.2)),P(H(270,360,150,70,O,0,.2),H(330,355,150,-20,O,.1,.2))],
 SLOW:[P(H(270,330,150,75,O,0,.2),H(370,320,150,-75,O,0,.2)),P(H(270,395,150,75,O,0,.2),H(370,385,150,-75,O,0,.2))],
 FAST:[P(H(270,395,150,10,[.5,0,0,1,1],0,.2),H(370,385,150,-10,[.5,0,0,1,1],0,.2)),P(H(270,330,150,10,[.5,.7,.7,1,1],0,.2),H(370,320,150,-10,[.5,.7,.7,1,1],0,.2))],
 HELP:[P(H(310,380,150,-80,O,0,.2),H(330,355,150,0,F,0,.2)),P(H(310,330,150,-80,O,0,.2),H(330,305,150,0,F,0,.2))],
 GOOD:[P(0,H(350,165,90,-30,O,0,.3)),P(0,H(410,280,140,-10,O,0,.2))],
 GREAT:[P(0,H(430,320,130,-10,TH,0,.2)),P(0,H(430,285,130,-10,TH,0,.2))],
 BAD:[P(0,H(350,165,90,-30,O,0,.3)),P(0,H(410,290,140,160,O,0,.2))],
 CLASS:[P(H(285,350,150,50,C_,0,.2),H(355,350,150,-50,C_,0,.2)),P(H(280,365,150,80,C_,0,.2),H(360,365,150,-80,C_,0,.2)),P(H(285,350,150,50,C_,0,.2),H(355,350,150,-50,C_,0,.2))],
 TEACHER:[P(H(270,175,90,0,O,0,.3),H(370,175,90,0,O,0,.3)),P(H(260,250,150,0,O,0,.3),H(380,250,150,0,O,0,.3))],
 STUDENT:[P(H(300,380,150,90,O,0,.2),H(340,360,150,0,F,0,.2)),P(H(300,330,150,90,O,0,.2),H(340,300,150,0,CLAW,0,.2))],
 HOMEWORK:[P(H(290,350,150,70,O,0,.2),H(345,325,150,-20,F,0,.2)),P(H(290,350,150,70,O,0,.2),H(345,350,150,-20,F,0,.2)),P(H(290,350,150,70,O,0,.2),H(345,325,150,-20,F,0,.2)),P(H(290,350,150,70,O,0,.2),H(345,350,150,-20,F,0,.2))],
 EXAM:[P(H(260,350,140,-20,I_,0,.2),H(380,350,140,20,I_,0,.2)),P(H(300,350,150,-60,I_,0,.2),H(340,350,150,60,I_,0,.2))],
 TODAY:[P(H(280,370,140,0,Y_,.3,.2),H(360,370,140,0,Y_,.3,.2)),P(H(280,415,140,0,Y_,.3,.2),H(360,415,140,0,Y_,.3,.2))],
 TOMORROW:[P(0,H(385,150,80,0,TH,0,.3)),P(0,H(450,160,110,0,TH,0,.3))],
 READ:[P(H(290,350,150,90,O,0,.2),H(350,300,150,0,V_,.8,.2)),P(H(290,350,150,90,O,0,.2),H(350,385,150,0,V_,.8,.2))],
 WRITE:[P(H(290,370,150,90,O,0,.2),H(335,350,150,-30,[.7,.7,0,0,0],0,.2)),P(H(290,370,150,90,O,0,.2),H(385,365,150,-30,[.7,.7,0,0,0],0,.2)),P(H(290,370,150,90,O,0,.2),H(340,380,150,-30,[.7,.7,0,0,0],0,.2))],
 LISTEN:[P(0,H(410,120,60,-10,[.5,.4,.4,.4,.4],.4,.4)),P(0,H(428,126,70,-10,[.5,.4,.4,.4,.4],.4,.4))],
 LOOK:[P(0,H(365,135,70,0,V_,.9,.3)),P(0,H(405,245,130,0,V_,.9,.3))],
 THINK:[P(0,H(385,130,60,0,I_,0,.35)),P(0,H(402,110,60,20,I_,0,.35)),P(0,H(385,130,60,0,I_,0,.35))],
 LEARN:[P(H(300,350,150,90,O,0,.2),H(350,335,150,0,O,0,.2)),P(H(300,350,150,90,O,0,.2),H(390,150,60,0,CLAW,0,.3))],
 LIKE:[P(0,H(350,310,120,-15,[.2,.2,0,.4,.4],.2,.2)),P(0,H(350,355,150,-15,[.6,.7,.6,.4,.4],.2,.2))],
 WANT:[P(H(250,350,150,-10,CLAW,.4,.2),H(390,350,150,10,CLAW,.4,.2)),P(H(285,375,150,-10,CLAW,.4,.2),H(355,375,150,10,CLAW,.4,.2))],
 NEED:[P(0,H(420,300,130,0,[1,.5,1,1,1],0,.2)),P(0,H(420,350,130,0,[1,.6,1,1,1],0,.2))],
 FINISH:[P(H(260,350,140,-10,O,.8,.3),H(380,350,140,10,O,.8,.3)),P(H(260,350,140,-170,O,.2,.3),H(380,350,140,170,O,.2,.3))],
 WAIT:[P(H(260,360,140,-30,[.3,.2,.2,.2,.2],.8,.3),H(380,360,140,30,[.3,.2,.2,.2,.2],.8,.3)),P(H(260,360,140,-30,[.3,.6,.4,.6,.4],.8,.3),H(380,360,140,30,[.3,.4,.6,.4,.6],.8,.3)),P(H(260,360,140,-30,[.3,.2,.2,.2,.2],.8,.3),H(380,360,140,30,[.3,.2,.2,.2,.2],.8,.3))],
 STOP:[P(H(300,360,150,-80,O,0,.2),H(350,290,150,10,O,0,.2)),P(H(300,360,150,-80,O,0,.2),H(350,350,150,10,O,0,.2))],
 START:[P(H(285,380,150,70,O,.1,.2),H(365,330,150,-15,I_,0,.2)),P(H(285,380,150,70,O,.1,.2),H(365,330,150,55,I_,0,.2))],
 GO:[P(0,H(420,360,130,0,I_,0,.3)),P(0,H(470,250,170,25,I_,0,.3))],
 COME:[P(0,H(470,250,170,-20,I_,0,.3)),P(0,H(410,350,120,-60,I_,0,.3))],
 SHARE:[P(H(290,350,150,70,O,0,.2),H(350,350,150,-70,O,0,.2)),P(H(220,300,170,60,O,0,.3),H(420,300,170,-60,O,0,.3))],
 MEETING:[P(H(260,350,140,-30,O,.2,.3),H(380,350,140,30,O,.2,.3)),P(H(300,350,150,-15,C_,0,.2),H(340,350,150,15,C_,0,.2))],
 MUTE:[P(0,H(335,150,70,0,O,0,.3)),P(0,H(335,160,90,0,F,0,.3))],
 QUIET:[P(0,H(330,150,70,0,I_,0,.3)),P(0,H(330,150,70,12,I_,0,.3)),P(0,H(330,150,70,0,I_,0,.3))],
 NAME:[P(H(270,350,140,-20,V_,0,.2),H(380,350,140,20,V_,0,.2)),P(H(290,350,150,-60,V_,0,.2),H(350,350,150,60,V_,0,.2))],
 HAPPY:[P(0,H(340,330,130,-80,O,0,.2)),P(0,H(340,285,130,-80,O,0,.2)),P(0,H(340,330,130,-80,O,0,.2)),P(0,H(340,285,130,-80,O,0,.2))],
 WORK:[P(H(280,405,160,-10,F,0,.2),H(360,370,160,10,F,0,.2)),P(H(280,405,160,-10,F,0,.2),H(360,395,160,10,F,0,.2)),P(H(280,405,160,-10,F,0,.2),H(360,370,160,10,F,0,.2)),P(H(280,405,160,-10,F,0,.2),H(360,395,160,10,F,0,.2))],
 FRIEND:[P(H(285,360,150,-70,[1,.5,1,1,1],0,.2),H(355,360,150,70,[1,.5,1,1,1],0,.2)),P(H(300,360,150,-110,[1,.5,1,1,1],0,.2),H(340,360,150,110,[1,.5,1,1,1],0,.2))]
};
const letterKeys=ch=>{const c=ch.charCodeAt(0)-96;const curl=[0,1,2,3,4].map(k=>(c>>k)&1?1:0);return P(0,H(430+(c%3)*8,325+(c%4)*5,130,-5+(c%5)*4,curl,.3,.25));};
const VIL={"HELLO": "xin chào", "GOODBYE": "tạm biệt", "WELCOME": "chào mừng", "THANK_YOU": "cảm ơn", "PLEASE": "làm ơn", "SORRY": "xin lỗi", "YES": "đúng / vâng", "NO": "không", "YOU": "bạn", "ME": "tôi", "WE": "chúng ta", "QUESTION": "câu hỏi", "WHAT": "cái gì", "WHY": "tại sao", "HOW": "thế nào", "WHERE": "ở đâu", "WHEN": "khi nào", "UNDERSTAND": "hiểu", "DONT_UNDERSTAND": "không hiểu", "REPEAT": "nhắc lại", "SLOW": "chậm", "FAST": "nhanh", "HELP": "giúp đỡ", "GOOD": "tốt", "GREAT": "tuyệt vời", "BAD": "tệ", "CLASS": "lớp học", "TEACHER": "giáo viên", "STUDENT": "học sinh", "HOMEWORK": "bài tập", "EXAM": "kiểm tra", "TODAY": "hôm nay", "TOMORROW": "ngày mai", "READ": "đọc", "WRITE": "viết", "LISTEN": "nghe", "LOOK": "nhìn", "THINK": "nghĩ", "LEARN": "học", "LIKE": "thích", "WANT": "muốn", "NEED": "cần", "FINISH": "xong", "WAIT": "đợi", "STOP": "dừng", "START": "bắt đầu", "GO": "đi", "COME": "đến", "SHARE": "chia sẻ", "MEETING": "cuộc họp", "MUTE": "tắt tiếng", "QUIET": "im lặng", "NAME": "tên", "HAPPY": "vui", "FRIEND": "bạn bè", "WORK": "làm việc"};var LANG='vi';const setCoreLang=l=>{LANG=l==='en'?'en':'vi';};
const ENX={DONT_UNDERSTAND:"don't understand",THANK_YOU:'thank you',YES:'yes / agree'};
const label=g=>g.startsWith('SPELL:')?(LANG==='vi'?'đánh vần · ':'spell · ')+g.slice(6).toLowerCase():(LANG==='vi'?(VIL[g]||g.replace(/_/g,' ').toLowerCase()):(ENX[g]||g.replace(/_/g,' ').toLowerCase()));
const keysFor=g=>g.startsWith('SPELL:')?[...g.slice(6).toLowerCase()].map(letterKeys):(SIGNS[g]||[]);

/* ===== 3. DICTIONARY: words (accents ignored) -> sign. Vietnamese + English ===== */
const LEXSRC={
 HELLO:'hello|hi|hey|xin chao|chao|chao cac em|chao ca lop|good morning',GOODBYE:'bye|goodbye|tam biet|hen gap lai|see you',WELCOME:'welcome|chao mung',
 THANK_YOU:'thank|thanks|thank you|cam on',PLEASE:'please|lam on|xin vui long|vui long|xin moi',SORRY:'sorry|xin loi',
 YES:'yes|ok|okay|dung|dung roi|vang|da|dong y|agree|correct|right',NO:'no|not|khong|dont|chua|sai',
 YOU:'you|your|ban|anh|chi|cac ban|ca lop','ME':'i|my|me|toi|minh|con','WE':'we|us|our|chung ta|chung toi|chung minh',
 QUESTION:'question|questions|ask|cau hoi|hoi|thac mac',WHAT:'what|gi|cai gi',WHY:'why|tai sao|vi sao',HOW:'how|lam sao|nhu the nao|the nao',
 WHERE:'where|o dau|dau',WHEN:'when|khi nao|bao gio',UNDERSTAND:'understand|understood|got it|hieu|hieu bai|hieu khong',
 DONT_UNDERSTAND:'dont understand|do not understand|khong hieu|chua hieu',REPEAT:'repeat|again|one more time|nhac lai|lap lai|noi lai',
 SLOW:'slow|slowly|slower|cham|cham hon|noi cham',FAST:'fast|quick|quickly|nhanh',HELP:'help|giup|giup do|ho tro',
 GOOD:'good|nice|tot',GREAT:'great|excellent|awesome|tuyet voi|xuat sac|gioi',BAD:'bad|wrong|te|kem',
 CLASS:'class|everyone|everybody|all|lesson|lop|lop hoc|bai hoc|bai|moi nguoi|ca nha',TEACHER:'teacher|professor|prof|sir|co oi|co giao|thay|thay oi|giao vien|giang vien',
 STUDENT:'student|students|pupil|hoc sinh|sinh vien|ban hoc',HOMEWORK:'homework|assignment|bai tap|nop bai',EXAM:'exam|test|quiz|kiem tra|thi|bai thi',
 TODAY:'today|now|hom nay|bay gio|ngay hom nay',TOMORROW:'tomorrow|ngay mai|mai',READ:'read|doc|doc bai',WRITE:'write|note|notes|viet|ghi chep|ghi chu',
 LISTEN:'listen|hear|nghe|chu y',LOOK:'look|see|watch|nhin|xem|quan sat',THINK:'think|nghi|suy nghi|consider',LEARN:'learn|study|hoc|tim hieu',
 LIKE:'like|love|thich|yeu',WANT:'want|muon',NEED:'need|must|can|phai|can thiet',FINISH:'finish|finished|done|xong|hoan thanh|het',
 WAIT:'wait|moment|one second|doi|cho doi|mot chut',STOP:'stop|dung lai|ngung',START:'start|begin|bat dau',GO:'go|di',COME:'come|join|tham gia|den',
 SHARE:'share|present|screen|chia se|man hinh|trinh bay',MEETING:'meeting|meet|call|cuoc hop|hop',MUTE:'mute|tat mic|tat tieng',
 QUIET:'quiet|silence|yen lang|im lang',NAME:'name|ten|ten gi',HAPPY:'happy|glad|vui|vui ve',FRIEND:'friend|friends|ban be',WORK:'work|job|lam viec|cong viec|viec'};
const MAP={};for(const[g,s]of Object.entries(LEXSRC))s.split('|').forEach(k=>{if(!MAP[k])MAP[k]=g;});
const STOP=new Set('turn,the,an,is,are,was,to,of,and,in,on,at,for,with,this,that,it,will,can,be,so,la,va,cua,nhe,nay,thi,o,cho,voi,duoc,co,oi,ha,nao,roi,se,cac,nhung,mot,ay,a,ma,nua,hon,lai,ra,vao'.split(','));
const norm=s=>s.toLowerCase().replace(/đ/g,'d').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
function toGloss(text,role){
  const w=norm(text).split(' ').filter(Boolean),out=[];let spelled=0;
  for(let i=0;i<w.length;){
    let hit=false;
    if(w[i]==='khong'&&i===w.length-1&&i>0){out.push('QUESTION');i++;continue;}
    if(w[i]==='em'){out.push(role==='student'?'ME':'YOU');i++;continue;}
    for(let n=3;n>=1&&!hit;n--){const k=w.slice(i,i+n).join(' ');if(MAP[k]){out.push(MAP[k]);i+=n;hit=true;}}
    if(!hit){const x=w[i++];if(x.length>=4&&!STOP.has(x)&&spelled<1&&/^[a-z]+$/.test(x)){out.push('SPELL:'+x.slice(0,6).toUpperCase());spelled++;}}
  }
  return out.filter((g,i)=>g!==out[i-1]).slice(0,10);
}

/* ===== 4. DEAF STUDENT'S SIGNED REPLIES (demo: recognition is simulated) ===== */
const PRESETS=[
 {s:['ME','UNDERSTAND','THANK_YOU'],vi:'Em hiểu rồi ạ, em cảm ơn cô.',en:'I understand, thank you.'},
 {s:['YOU','SLOW','QUESTION'],vi:'Cô có thể nói chậm hơn được không ạ?',en:'Could you speak more slowly?'},
 {s:['DONT_UNDERSTAND','REPEAT','PLEASE'],vi:'Em chưa hiểu, cô nhắc lại giúp em ạ.',en:"I don't understand, please repeat."},
 {s:['ME','QUESTION'],vi:'Em có một câu hỏi ạ.',en:'I have a question.'},
 {s:['ME','SHARE','QUESTION'],vi:'Cho em chia sẻ màn hình được không ạ?',en:'May I share my screen?'},
 {s:['ME','HOMEWORK','FINISH'],vi:'Em đã làm xong bài tập rồi ạ.',en:'I finished the homework.'},
 {s:['YES','ME','GOOD'],vi:'Vâng, em đồng ý ạ.',en:'Yes, I agree.'},
 {s:['HELLO','CLASS'],vi:'Em chào cả lớp ạ!',en:'Hello everyone!'}];
