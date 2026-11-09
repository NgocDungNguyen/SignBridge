/* SignBridge posture classifier (demo).
   Input: the 21 hand landmarks from MediaPipe (normalised x,y,z) -> one of 8 demo postures, or null.
   The 8 postures are NOT real Vietnamese Sign Language: each one is wired to a sample sentence so the whole flow can be demoed. */
(function(root){
  var POSTURES={
    open :{emoji:'✋',gloss:'HELLO',preset:7},
    thumbs:{emoji:'👍',gloss:'GOOD',preset:6},
    ok   :{emoji:'👌',gloss:'UNDERSTAND',preset:0},
    point:{emoji:'☝️',gloss:'ME',preset:3},
    peace:{emoji:'✌️',gloss:'QUESTION',preset:1},
    fist :{emoji:'✊',gloss:'DONT_UNDERSTAND',preset:2},
    call :{emoji:'🤙',gloss:'HELP',preset:4},
    ily  :{emoji:'🤟',gloss:'THANK_YOU',preset:5}
  };
  var ORDER=['open','thumbs','ok','point','peace','fist','call','ily'];
  function classify(lm,ar){
    if(!lm||lm.length<21)return null;ar=ar||1;
    function V(i){return{x:lm[i].x*ar,y:lm[i].y,z:(lm[i].z||0)*ar};}
    function d(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}
    function cosBend(a,b,c){var u=[b.x-a.x,b.y-a.y,b.z-a.z],v=[c.x-b.x,c.y-b.y,c.z-b.z];
      return (u[0]*v[0]+u[1]*v[1]+u[2]*v[2])/((Math.hypot(u[0],u[1],u[2])*Math.hypot(v[0],v[1],v[2]))||1e-6);}
    var w=V(0),scale=d(w,V(9))||1e-6;
    var ext=[[5,6,8],[9,10,12],[13,14,16],[17,18,20]].map(function(f){
      var M=V(f[0]),P=V(f[1]),T=V(f[2]);return cosBend(M,P,T)>0.5&&d(w,T)>d(w,P);});
    var idx=ext[0],mid=ext[1],rng=ext[2],pnk=ext[3];
    var thumbOut=d(V(4),V(5))/scale>0.8;
    var pinch=d(V(4),V(8))/scale<0.32;
    var tm=V(2),tt=V(4),tv=[tt.x-tm.x,tt.y-tm.y],tl=Math.hypot(tv[0],tv[1])||1e-6;
    var thumbUp=thumbOut&&(-tv[1]/tl)>0.6;
    var n=ext.filter(Boolean).length;
    if(pinch&&mid&&rng&&pnk)return'ok';
    if(n===4)return'open';
    if(n===0)return thumbUp?'thumbs':'fist';
    if(idx&&!mid&&!rng&&!pnk)return thumbOut&&false?'':'point';
    if(idx&&mid&&!rng&&!pnk)return'peace';
    if(idx&&!mid&&!rng&&pnk&&thumbOut)return'ily';
    if(!idx&&!mid&&!rng&&pnk&&thumbOut)return'call';
    return null;
  }
  root.SBPosture={POSTURES:POSTURES,ORDER:ORDER,classify:classify};
  if(typeof module!=='undefined')module.exports=root.SBPosture;
})(typeof window!=='undefined'?window:globalThis);
