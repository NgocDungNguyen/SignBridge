/* SignBridge room: roster + messages over SBNet, Deaf-side camera/posture flow, hearing-side speech/TTS.
   Wrapped in an IIFE because core.js declares many top-level names. */
(function(){
'use strict';
var T=SBI.t, $=function(id){return document.getElementById(id);}, sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
var qs=new URLSearchParams(location.search);
var CODE=SBNet.normCode(qs.get('c'));
if(CODE.length!==6){location.replace('../');return;}
var CODEF=SBNet.fmtCode(CODE), isNew=qs.get('new')==='1';
var COLORS=['#1a73e8','#188038','#b06000','#a142f4','#d93025','#007b83','#c2185b','#5f6368'];
var me={id:SBNet.rnd(8),name:'',role:''}, roster={}, joined=false, joinedAt=0, net=null, netSt={mqtt:'connecting',bc:false};
var curTab='sign', ccOn=true, voiceOn=true, spd=1, slang=SBI.get(), tlang=SBI.get();
var PZ=SBPosture.POSTURES, ORDER=SBPosture.ORDER;

/* ---------- helpers ---------- */
function toast(t){var e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);requestAnimationFrame(function(){e.classList.add('on');});setTimeout(function(){e.classList.remove('on');},1900);setTimeout(function(){e.remove();},2300);}
function copyText(s){
  function fb(){var a=document.createElement('textarea');a.value=s;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();try{document.execCommand('copy');}catch(e){}a.remove();}
  try{navigator.clipboard.writeText(s).catch(fb);}catch(e){fb();}
}
function hash(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}
function colorOf(id){return COLORS[hash(id)%COLORS.length];}
function ini(n){n=(n||'?').trim();return (Array.from(n)[0]||'?').toUpperCase();}
function persona(id){
  if(id===me.id)return{id:id,n:me.name,ini:ini(me.name),c:colorOf(id),role:me.role};
  var r=roster[id];return r?{id:id,n:r.name,ini:ini(r.name),c:colorOf(id),role:r.role}:{id:id,n:'?',ini:'?',c:'#5f6368',role:''};
}
function roleLabel(r){return r==='deaf'?T('deafBadge'):T('hearBadge');}
function inviteUrl(){return location.origin+location.pathname+'?c='+CODE;}
function langBtnHtml(){return SBI.get()==='vi'?'<b>VI</b> · EN':'VI · <b>EN</b>';}

/* ---------- text-to-speech (correct English / Vietnamese voice) ---------- */
var voices=[], ttsBlock=0, warned={}, lastTTS=0, lastSigned=null;
function loadVoices(){try{voices=speechSynthesis.getVoices()||[];}catch(e){voices=[];}}
loadVoices();try{speechSynthesis.addEventListener('voiceschanged',loadVoices);}catch(e){}
function pickVoice(lang){
  var pre=lang==='vi'?'vi':'en',want=lang==='vi'?'vi-vn':'en-us';
  var c=voices.filter(function(v){return String(v.lang||'').toLowerCase().replace('_','-').indexOf(pre)===0;});
  if(!c.length)return null;
  function sc(v){var l=String(v.lang).toLowerCase().replace('_','-'),n=v.name||'';return (l===want?4:0)+(/natural|neural|online|premium|enhanced/i.test(n)?3:0)+(/google/i.test(n)?2:0)+(v.localService?1:0)-(/compact|novelty|whisper/i.test(n)?3:0);}
  c.sort(function(a,b){return sc(b)-sc(a);});return c[0];
}
var IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function unlockTTS(){if(!IOS)return;try{var u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);}catch(e){}}
function speak(text,lang){
  if(!('speechSynthesis' in window)||!text)return;
  try{
    if(!voices.length)loadVoices();
    var u=new SpeechSynthesisUtterance(text),v=pickVoice(lang);
    u.lang=lang==='vi'?'vi-VN':'en-US';
    if(v){u.voice=v;u.lang=v.lang;}else if(voices.length&&!warned[lang]){warned[lang]=1;toast(T('noVoice'+(lang==='vi'?'Vi':'En')));}
    u.rate=1;u.onstart=function(){ttsBlock=Date.now()+60000;lastTTS=Date.now();};
    u.onend=function(){ttsBlock=Date.now()+900;};
    u.onerror=function(e){ttsBlock=Date.now()+900;if(e&&e.error&&e.error!=='canceled'&&e.error!=='interrupted')toast(T('voiceTap'));};
    if(speechSynthesis.paused)speechSynthesis.resume();
    if(speechSynthesis.speaking&&Date.now()-lastTTS>12000)speechSynthesis.cancel();   /* un-stick a hung queue */
    lastTTS=lastTTS||Date.now();
    speechSynthesis.speak(u);
  }catch(e){}
}
window.__sbVoice=function(l){var v=pickVoice(l);return v?{name:v.name,lang:v.lang}:null;};

/* ---------- network ---------- */
function sendHi(re){net&&net.send({t:'hi',id:me.id,name:me.name,role:me.role,cam:camOn,re:!!re});}
function sendPing(){net&&joined&&net.send({t:'ping',id:me.id,name:me.name,role:me.role,cam:camOn});}
function upsert(m,fromHi){
  if(!m.id||m.id===me.id)return;
  var isNewP=!roster[m.id];
  roster[m.id]={id:m.id,name:String(m.name||'?').slice(0,24),role:m.role==='deaf'?'deaf':'hear',seen:Date.now(),joined:isNewP?Date.now():roster[m.id].joined,cam:m.cam!==undefined?!!m.cam:(isNewP?false:roster[m.id].cam)};
  if(joined){if(isNewP){if(Date.now()-joinedAt>3500)toast(T('joined',{n:roster[m.id].name}));renderStage();if(me.id<m.id)getPeer(m.id);}else showRemote(m.id);}
  else renderPre();
}
function onMsg(m){
  if(!m||!m.t)return;
  if(m.id===me.id)return;
  if(m.t==='probe'){if(joined)setTimeout(function(){sendHi(true);},60+Math.random()*400);return;}
  if(m.t==='hi'){upsert(m);if(!m.re&&joined)setTimeout(function(){sendHi(true);},60+Math.random()*400);return;}
  if(m.t==='ping'){upsert(m);return;}
  if(m.t==='bye'){var r=roster[m.id];if(r){delete roster[m.id];closePeer(m.id);if(joined){toast(T('left',{n:r.name}));renderStage();}else renderPre();}return;}
  if(m.t==='say'){upsert(m);if(joined)onSay(m);return;}
  if(m.t==='cam'){upsert(m);return;}
  if(m.t==='rtc'){if(joined&&m.to===me.id&&roster[m.id])onRtc(m);return;}
}
function setNet(s){
  netSt=s;var el=$('netSt'),k=s.mqtt==='connected'?'ok':s.mqtt==='failed'?(s.bc?'loc':'bad'):'';
  el.className='pill-btn net '+k;el.querySelector('span').textContent=s.mqtt==='connected'?T('st_on'):s.mqtt==='failed'?(s.bc?T('st_local'):T('st_off')):T('st_conn');
  renderPre();
}
var probeT=0;
function startNet(){
  net=SBNet.join(CODE,{onMsg:onMsg,onStatus:setNet,onOpen:function(){
    net.send({t:'probe',id:me.id});
    clearTimeout(probeT);probeT=setTimeout(function(){probed=true;renderPre();},1800);
    if(joined)sendHi(false);
  }});
}
var probed=false;

/* ---------- pre-join ---------- */
function renderPre(){
  if(joined)return;
  var el=$('pnet'),n=Object.keys(roster).length,k='',txt;
  if(netSt.mqtt==='connected'){
    if(!probed){txt=T('checking');}
    else if(n){k='ok';txt=T('roomFound',{n:n});}
    else{k='ok';txt=isNew?T('roomNew'):T('roomEmpty');}
  }else if(netSt.mqtt==='failed'){k=netSt.bc?'':'bad';txt=netSt.bc?T('st_local'):T('st_off');}
  else txt=T('st_conn');
  el.className='pnet '+k;el.querySelector('span').textContent=txt;
}
function checkJoin(){
  var role=document.querySelector('input[name=role]:checked');
  $('pjoin').disabled=!(role&&$('pname').value.trim());
  $('rYes').classList.toggle('help',!role);
}
function renderGuide(el,mark){
  var L=SBI.get();el.innerHTML='';
  ORDER.forEach(function(k){
    var p=PZ[k],d=document.createElement('div');d.className='gc';d.dataset.k=k;
    d.innerHTML='<b></b><em></em><span></span>';
    d.children[0].textContent=p.emoji;d.children[1].textContent=label(p.gloss);d.children[2].textContent=PRESETS[p.preset][L];
    el.appendChild(d);
  });
}


/* ---------- video sharing: WebRTC peer-to-peer mesh, signalled over the same room channel ---------- */
var ICE={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},{urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turns:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}]};
var peers={};
function rtcSend(to,k,d){net&&net.send({t:'rtc',id:me.id,to:to,k:k,d:d});}
function getPeer(id){
  var P=peers[id];if(P)return P;
  if(typeof RTCPeerConnection==='undefined')return null;
  var pc=new RTCPeerConnection(ICE);
  P={pc:pc,polite:me.id>id,making:false,ignore:false,stream:null,sender:null,iceQ:[],chain:Promise.resolve()};peers[id]=P;
  pc.onicecandidate=function(e){if(e.candidate)rtcSend(id,'ice',e.candidate.toJSON());};
  pc.ontrack=function(e){
    P.stream=(e.streams&&e.streams[0])||new MediaStream([e.track]);
    e.track.onmute=e.track.onunmute=function(){showRemote(id);};showRemote(id);
  };
  pc.onnegotiationneeded=async function(){
    try{P.making=true;await pc.setLocalDescription();rtcSend(id,'desc',pc.localDescription.toJSON());}
    catch(e){console.warn('[rtc] negotiate',e);}finally{P.making=false;}
  };
  pc.oniceconnectionstatechange=function(){if(pc.iceConnectionState==='failed'){try{pc.restartIce();}catch(e){}}};
  if(stream&&camOn)attachTo(P);else if(me.id<id)pc.addTransceiver('video',{direction:'recvonly'});
  return P;
}
function attachTo(P){
  var t=stream&&stream.getVideoTracks()[0];if(!t)return;
  if(P.sender)P.sender.replaceTrack(t).catch(function(){});else P.sender=P.pc.addTrack(t,stream);
}
function attachAll(){Object.keys(peers).forEach(function(id){attachTo(peers[id]);});}
function detachAll(){Object.keys(peers).forEach(function(id){var P=peers[id];if(P.sender)P.sender.replaceTrack(null).catch(function(){});});}
function closePeer(id){var P=peers[id];if(!P)return;try{P.pc.close();}catch(e){}delete peers[id];var t=tiles[id];if(t){var v=t.querySelector('video');if(v){v.srcObject=null;}t.classList.remove('hasvid');}}
function onRtc(m){
  var P=getPeer(m.id);if(!P)return;
  P.chain=P.chain.then(async function(){
    var pc=P.pc;
    try{
      if(m.k==='desc'){
        var d=m.d,collision=d.type==='offer'&&(P.making||pc.signalingState!=='stable');
        P.ignore=!P.polite&&collision;if(P.ignore)return;
        await pc.setRemoteDescription(d);
        while(P.iceQ.length){try{await pc.addIceCandidate(P.iceQ.shift());}catch(e){}}
        if(d.type==='offer'){await pc.setLocalDescription();rtcSend(m.id,'desc',pc.localDescription.toJSON());}
      }else if(m.k==='ice'){
        if(!pc.remoteDescription){P.iceQ.push(m.d);return;}
        try{await pc.addIceCandidate(m.d);}catch(e){if(!P.ignore)console.warn('[rtc] ice',e);}
      }
    }catch(e){console.warn('[rtc]',e);}
  });
}
function sendCam(){net&&joined&&net.send({t:'cam',id:me.id,name:me.name,role:me.role,cam:camOn});}
function videoEl(t){
  var v=t.querySelector('video');
  if(!v){v=document.createElement('video');v.playsInline=true;v.muted=true;v.autoplay=true;t.insertBefore(v,t.firstChild);}
  return v;
}
function showRemote(id){
  var t=tiles[id],P=peers[id],r=roster[id];if(!t)return;
  var on=!!(r&&r.cam&&P&&P.stream&&P.stream.getVideoTracks().length);
  var v=videoEl(t);
  if(on){if(v.srcObject!==P.stream)v.srcObject=P.stream;var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});}
  t.classList.toggle('hasvid',on);
}
function showLocal(){
  var t=tiles[me.id];if(!t)return;var v=videoEl(t);v.classList.add('mirror');
  if(camOn&&stream){if(v.srcObject!==stream)v.srcObject=stream;var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});}else v.srcObject=null;
  t.classList.toggle('hasvid',!!(camOn&&stream));
}

/* ---------- stage ---------- */
var tiles={};
function order(){var ids=Object.keys(roster).sort(function(a,b){return roster[a].joined-roster[b].joined;});return [me.id].concat(ids);}
function renderStage(){
  var st=$('stage'),ids=order(),seen={};
  ids.forEach(function(id){
    seen[id]=1;var p=persona(id),t=tiles[id];
    if(!t){t=document.createElement('div');t.className='tile';t.id='t-'+id;t.style.setProperty('--c',p.c);
      t.innerHTML='<div class="av"><span></span></div><div class="spk"><b></b><b></b><b></b></div><div class="nm"></div>';tiles[id]=t;}
    t.querySelector('.av span').textContent=p.ini;
    var nm=t.querySelector('.nm');nm.innerHTML=p.role==='deaf'?ic('hand'):'';nm.appendChild(document.createTextNode(p.n+(id===me.id?' ('+T('you')+')':'')));
    st.insertBefore(t,$('cc'));
  });
  Object.keys(tiles).forEach(function(id){if(!seen[id]){tiles[id].remove();delete tiles[id];}});
  ids.forEach(function(id){if(id===me.id)showLocal();else showRemote(id);});
  var n=ids.length,c=n<=1?1:n<=4?2:n<=9?3:4;
  st.style.setProperty('--cols',c);st.style.setProperty('--rows',Math.ceil(n/c));st.style.setProperty('--cols2',n<=2?1:2);
  $('bdn').textContent=n;
  var h=st.querySelector('.hint');
  if(n===1){if(!h){h=document.createElement('div');h.className='hint';st.insertBefore(h,$('cc'));}h.textContent=T('roomHelp',{code:CODEF});}
  else if(h)h.remove();
}
function speakingTile(id,ms){var t=tiles[id];if(!t)return;t.classList.add('speaking');clearTimeout(t._s);t._s=setTimeout(function(){t.classList.remove('speaking');},ms);}

/* ---------- captions + chat ---------- */
var ccRows=[],ccTimer=0;
function addCC(p,text,signed){
  var r=document.createElement('div');r.className='cr'+(signed?' sgn':'');r.style.setProperty('--c',p.c);
  r.innerHTML='<u></u><div class="w"><b><span></span>'+(signed?ic('hand'):'')+'</b><p></p></div>';
  r.querySelector('u').textContent=p.ini;r.querySelector('b span').textContent=p.n;r.querySelector('p').textContent=text;
  $('cc').appendChild(r);ccRows.push(r);while(ccRows.length>2)ccRows.shift().remove();
  clearTimeout(ccTimer);ccTimer=setTimeout(function(){ccRows.forEach(function(x){x.remove();});ccRows=[];},signed?9000:7000);
}
function addLog(p,text,signed){
  var l=$('log');if(l.querySelector('.empty'))l.innerHTML='';
  var d=document.createElement('div');d.className='ln';d.style.setProperty('--c',p.c);
  var u=document.createElement('u');u.textContent=p.ini;
  var w=document.createElement('div'),h=document.createElement('div');h.className='h';
  var b=document.createElement('b');b.textContent=p.n;h.appendChild(b);
  if(signed){var s=document.createElement('span');s.className='sg';s.innerHTML=ic('hand');h.appendChild(s);}
  var tm=document.createElement('time');tm.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});h.appendChild(tm);
  var pp=document.createElement('p');pp.textContent=text;w.appendChild(h);w.appendChild(pp);d.appendChild(u);d.appendChild(w);l.appendChild(d);
  if(curTab==='log')$('views').scrollTop=1e9;
}

/* ---------- incoming message ---------- */
function onSay(m){
  var p=persona(m.id),text=String(m.text||'').slice(0,400);if(!text)return;
  addLog(p,text,!!m.signed);if(ccOn)addCC(p,text,!!m.signed);speakingTile(m.id,Math.max(1800,text.length*65));
  if(me.role==='deaf'){queue.push({p:p,text:text});updQ();pump();}
  else if(m.signed){
    $('lastsg').hidden=false;$('lastwho').textContent=T('heardBy')+' · '+p.n;$('lasttxt').textContent=text;
    lastSigned={text:text,lang:m.lang==='en'?'en':'vi'};
    if(voiceOn)speak(lastSigned.text,lastSigned.lang);
  }
}
function sendSay(text,signed,lang){
  text=(text||'').trim().slice(0,400);if(!text)return;
  var m={t:'say',id:me.id,name:me.name,role:me.role,text:text,lang:lang,signed:!!signed};
  net.send(m);var p=persona(me.id);addLog(p,text,!!signed);if(ccOn)addCC(p,text,!!signed);speakingTile(me.id,Math.max(1800,text.length*65));
}

/* ---------- Deaf: avatar queue (same engine as the demo) ---------- */
var queue=[],busy=false,tok=0,lastMsg=null,autoSw=false;
function setSpeaker(p,text){
  var avw=$('avw');avw.style.setProperty('--c',p?p.c:'transparent');avw.classList.toggle('on',!!p);
  var pill=$('pill');pill.style.setProperty('--c',p?p.c:'#5f6368');
  pill.innerHTML=p?'<u></u><span></span>':'<u>·</u><span></span>';
  if(p){pill.querySelector('u').textContent=p.ini;pill.querySelector('span').textContent=p.n;}else pill.querySelector('span').textContent=T('waiting');
  $('sc').style.setProperty('--c',p?p.c:'#9aa0a6');$('scu').textContent=p?p.ini:'·';
  $('scn').textContent=p?p.n:T('live');$('sct').textContent=text||T('liveHint');pill.style.opacity=p?1:0;
}
function setChips(list){
  var c=$('chips');c.innerHTML='';
  if(!list.length){c.innerHTML='<span class="chip fs">'+T('onlyCaption')+'</span>';return;}
  list.forEach(function(g){var s=document.createElement('span');s.className='chip'+(g.indexOf('SPELL:')===0?' fs':'');s.textContent=label(g);c.appendChild(s);});
}
function updQ(){var q=$('q');q.hidden=!queue.length;q.textContent=T('qMore',{n:queue.length});}
async function signs(list,my){
  var chips=[].slice.call($('chips').children),box=$('chips');
  for(var i=0;i<list.length;i++){
    if(my!==tok)return;
    chips.forEach(function(c,k){c.classList.toggle('now',k===i);});
    var ch=chips[i];if(ch)box.scrollLeft=ch.offsetLeft-box.clientWidth/2+ch.offsetWidth/2;
    var sp=list[i].indexOf('SPELL:')===0,ks=keysFor(list[i]);
    for(var j=0;j<ks.length;j++){if(my!==tok)return;avRig.go(ks[j],(sp?250:400)/spd);await sleep((sp?300:520)/spd);}
    await sleep(110/spd);
  }
  chips.forEach(function(c){c.classList.remove('now');});
}
async function deliver(m,my){
  setSpeaker(m.p,m.text);
  if(curTab!=='watch'){
    if(sgState==='idle'||sgState==='collect'&&!seqG.length){autoSw=true;tab('watch');}
    else document.querySelector('#tabs [data-tab=watch]').classList.add('dot');
  }
  var gl=toGloss(m.text,'teacher');setChips(gl);await sleep(250);await signs(gl,my);
  if(my===tok)avRig.go(clone(REST),500/spd);
}
async function pump(){
  if(busy)return;busy=true;var my=tok;
  while(queue.length&&my===tok){var m=queue.shift();updQ();lastMsg=m;await deliver(m,my);await sleep(350);}
  if(my===tok){busy=false;if(autoSw){autoSw=false;await sleep(1400);if(!busy&&curTab==='watch'&&me.role==='deaf')tab('sign');}}
}
function previewSign(g){
  if(busy)return;tab('watch');busy=true;var my=tok;
  setSpeaker({n:T('tLib'),ini:'✦',c:'#a142f4'},label(g));setChips([g]);
  signs([g],my).then(function(){if(my===tok){avRig.go(clone(REST),500);busy=false;}});
}

/* ---------- Deaf: camera + hand tracking + postures ---------- */
var handsReady=false,vid,cvr,cctx,stream=null,camOn=false,camStarting=false,hands=null,inflight=false,lastDet=0,lastRes=null,raf=0;
var sgState='idle',seqG=[],presetI=0,cand=null,candSince=0,locked=false,lostSince=0,finT=0,HOLD=900;
function setStatus(t){$('st').textContent=t;}
function camUI(){
  $('camw').classList.toggle('off',!camOn);$('camgo').hidden=camOn||camStarting;
  var b=$('bcam');b.classList.toggle('off',!camOn);b.innerHTML=ic(camOn?'cam':'camoff');
}
function camMsg(t){$('camgot').textContent=t;camStarting=false;camUI();}
async function startCam(){
  if(camOn||camStarting)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){camMsg(window.isSecureContext===false?T('camHttps'):T('camNone'));return;}
  camStarting=true;camUI();setStatus(T('stLoad'));
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});}
  catch(e){camMsg(e&&e.name==='NotFoundError'?T('camNone'):T('camDenied'));setStatus('');return;}
  vid.srcObject=stream;try{await vid.play();}catch(e){}
  for(var i=0;i<50&&!vid.videoWidth;i++)await sleep(100);
  if(!vid.videoWidth){stopCam();camMsg(T('camNone'));return;}
  camOn=true;camStarting=false;camUI();showLocal();attachAll();sendCam();
  if(me.role!=='deaf')return;
  $('camw').style.setProperty('--ar',(vid.videoWidth/vid.videoHeight).toFixed(3));
  cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
  setStatus(T('stLoad'));
  try{if(!hands)hands=await import('./hands.js');await hands.loadModel();handsReady=true;setStatus(T('stShow'));window.__sbMode=hands.getMode();}
  catch(e){console.error('[hands]',e);hands=null;handsReady=false;setStatus(T('modelFail'));}
}
function stopCam(){
  var was=camOn;camOn=false;camStarting=false;cancelAnimationFrame(raf);
  detachAll();
  if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}
  try{vid.srcObject=null;}catch(e){}
  lastRes=null;cand=null;camUI();showBadge(null,0);showLocal();if(was)sendCam();
}
function loop(){
  raf=requestAnimationFrame(loop);
  if(!camOn||vid.readyState<2)return;
  var w=vid.videoWidth,h=vid.videoHeight;if(cvr.width!==w){cvr.width=w;cvr.height=h;}
  if($('v-sign').classList.contains('on')){
    cctx.save();cctx.translate(w,0);cctx.scale(-1,1);cctx.drawImage(vid,0,0,w,h);
    if(lastRes&&lastRes.landmarks&&hands){
      cctx.lineWidth=Math.max(2,w/220);cctx.strokeStyle='#8ab4f8';cctx.fillStyle='#fff';
      lastRes.landmarks.forEach(function(lm){
        cctx.beginPath();hands.CONNECTIONS.forEach(function(c){cctx.moveTo(lm[c[0]].x*w,lm[c[0]].y*h);cctx.lineTo(lm[c[1]].x*w,lm[c[1]].y*h);});cctx.stroke();
        lm.forEach(function(p){cctx.beginPath();cctx.arc(p.x*w,p.y*h,Math.max(2,w/190),0,6.3);cctx.fill();});
      });
    }
    cctx.restore();
  }
  var now=performance.now();
  if(hands&&handsReady&&!inflight&&now-lastDet>50&&vid.readyState>=2){
    inflight=true;lastDet=now;
    hands.detect(vid,now).then(function(r){inflight=false;if(!r)return;lastRes=r;onHands(r,performance.now());}).catch(function(e){inflight=false;console.warn('[detect]',e);});
  }
}
function pickPosture(r){
  if(!r||!r.landmarks||!r.landmarks.length)return null;
  var ar=vid.videoWidth/vid.videoHeight;
  for(var i=0;i<r.landmarks.length;i++){var p=SBPosture.classify(r.landmarks[i],ar);if(p)return p;}
  return null;
}
function showBadge(p,prog){
  var b=$('pbadge');b.classList.toggle('on',!!p);if(p){$('pem').textContent=PZ[p].emoji;b.style.setProperty('--p',Math.min(1,prog));}
  [].forEach.call($('gg').children,function(c){c.classList.toggle('now',c.dataset.k===p);});
}
function onHands(r,now){
  var p=pickPosture(r),has=!!(r&&r.landmarks&&r.landmarks.length);
  window.__sbPosture=p;
  if(curTab!=='sign'||(sgState!=='idle'&&sgState!=='collect')){cand=null;showBadge(null,0);return;}
  if(sgState==='idle')setStatus(has?T('stShow'):T('stShow'));
  if(!p){if(!lostSince)lostSince=now;if(now-lostSince>350){cand=null;locked=false;}showBadge(null,0);return;}
  lostSince=0;
  if(p!==cand){cand=p;candSince=now;locked=false;}
  var prog=locked?1:(now-candSince)/HOLD;
  showBadge(p,prog);
  if(!locked&&prog>=1){locked=true;commit(p);}
}
function addSeqChip(g){var c=document.createElement('span');c.className='chip';c.textContent=label(g);$('seq').appendChild(c);}
function commit(p){
  if(sgState!=='idle'&&sgState!=='collect')return;
  sgState='collect';seqG.push(PZ[p].gloss);presetI=PZ[p].preset;
  $('seq').hidden=false;addSeqChip(PZ[p].gloss);
  try{navigator.vibrate&&navigator.vibrate(30);}catch(e){}
  setStatus(T('stCollect'));clearTimeout(finT);finT=setTimeout(finalize,seqG.length>=3?150:1800);
}
async function finalize(){
  if(sgState!=='collect')return;
  sgState='think';setStatus(T('stThink'));
  var th=document.createElement('span');th.className='chip load';th.textContent='···';$('seq').appendChild(th);
  await sleep(900);if(sgState!=='think')return;
  th.remove();toReview();
}
function toReview(){
  sgState='review';setStatus(T('stReview'));$('sentT').textContent=PRESETS[presetI][slang];$('sent').hidden=false;
  setTimeout(function(){var e=$('sent');if(e&&e.scrollIntoView)e.scrollIntoView({block:'nearest',behavior:'smooth'});},60);
}
function resetSign(){
  clearTimeout(finT);sgState='idle';seqG=[];cand=null;locked=false;
  $('seq').innerHTML='';$('seq').hidden=true;$('sent').hidden=true;showBadge(null,0);setStatus(camOn?T('stShow'):'');
}
function submitSign(){
  if(sgState!=='review')return;
  var text=PRESETS[presetI][slang];resetSign();sendSay(text,true,slang);toast(T('sentOk'));
}
function useSample(i){
  resetSign();presetI=i;sgState='think';
  $('seq').hidden=false;PRESETS[i].s.forEach(addSeqChip);setStatus(T('stThink'));
  sleep(500).then(function(){if(sgState==='think')toReview();});
}

/* ---------- Hearing: speech recognition ---------- */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition,recog=null,micWanted=false;
function micUI(){
  var b=$('bmic');b.classList.toggle('off',!micWanted);b.innerHTML=ic(micWanted?'mic':'micoff');
  $('micbig').classList.toggle('live',micWanted);$('micbig').innerHTML=ic(micWanted?'mic':'mic');
  $('micst').textContent=micWanted?T('micStop'):T('micStart');if(!micWanted)$('interim').textContent='';
}
function startRecog(){
  if(!micWanted)return;
  recog=new SR();recog.lang=SBI.speechLang(tlang);recog.continuous=true;recog.interimResults=true;
  recog.onresult=function(e){
    var interim='';
    for(var i=e.resultIndex;i<e.results.length;i++){
      var r=e.results[i];
      if(r.isFinal){var tx=r[0].transcript.trim();if(tx&&Date.now()>ttsBlock)sendSay(tx,false,tlang);}
      else interim+=r[0].transcript;
    }
    $('interim').textContent=Date.now()>ttsBlock?interim:'';
  };
  recog.onerror=function(e){if(e.error==='not-allowed'||e.error==='service-not-allowed'){micWanted=false;micUI();toast(T('micDenied'));}};
  recog.onend=function(){if(micWanted)setTimeout(startRecog,300);};
  try{recog.start();}catch(e){}
}
function setMic(on){
  if(on&&!SR){toast(T('micUnsup'));return;}
  micWanted=on;micUI();
  if(on)startRecog();else if(recog){try{recog.onend=null;recog.stop();}catch(e){}recog=null;}
}

/* ---------- tabs, panels, rendering ---------- */
function tabsFor(){return me.role==='deaf'?[['watch','tWatch'],['sign','tSign'],['lib','tLib'],['log','tLog']]:[['talk','tTalk'],['log','tLog']];}
function renderTabs(){
  var box=$('tabs');box.innerHTML='';
  tabsFor().forEach(function(x){var b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.dataset.tab=x[0];b.textContent=T(x[1]);b.setAttribute('aria-selected',String(x[0]===curTab));box.appendChild(b);});
}
function tab(n){
  curTab=n;[].forEach.call(document.querySelectorAll('#tabs button'),function(b){b.setAttribute('aria-selected',String(b.dataset.tab===n));});
  ['watch','sign','lib','talk','log'].forEach(function(k){$('v-'+k).classList.toggle('on',k===n);});
  var w=document.querySelector('#tabs [data-tab=watch]');if(w&&n==='watch')w.classList.remove('dot');
  $('views').scrollTop=0;
}
function panel(open){$('app').classList.toggle('nopanel',!open);[].forEach.call(document.querySelectorAll('.jsb'),function(b){b.classList.toggle('on',open);});}
function renderSamples(){
  var box=$('samples');box.innerHTML='';
  PRESETS.forEach(function(p,i){var b=document.createElement('button');b.type='button';b.textContent=p[slang];b.onclick=function(){useSample(i);};box.appendChild(b);});
}
function renderQP(){
  var box=$('qp');box.innerHTML='';
  var L={vi:['Chào cả lớp, hôm nay chúng ta học bài mới.','Em có hiểu bài không?','Cô sẽ nói chậm hơn.'],en:['Welcome everyone, please turn on your camera.','Do you have any questions?','Great work, thank you!']}[tlang];
  L.forEach(function(t){var b=document.createElement('button');b.type='button';b.textContent=t;b.onclick=function(){sendSay(t,false,tlang);};box.appendChild(b);});
}
function renderLib(q){
  var box=$('lib');box.innerHTML='';q=(q||'').toLowerCase().trim();
  Object.keys(SIGNS).filter(function(g){return !q||label(g).indexOf(q)>-1;}).forEach(function(g){var b=document.createElement('button');b.type='button';b.textContent=label(g);b.onclick=function(){previewSign(g);};box.appendChild(b);});
  if(!box.children.length)box.innerHTML='<div class="empty" style="grid-column:1/-1">'+T('libNone')+'</div>';
}
function setLangPair(el,v){[].forEach.call(el.children,function(x){x.setAttribute('aria-pressed',String(x.dataset.l===v));});}
function refreshLang(){
  SBI.apply();$('plang').innerHTML=langBtnHtml();$('lang2').innerHTML=langBtnHtml();
  renderGuide($('pgg'));renderPre();
  if(!joined)return;
  renderTabs();renderGuide($('gg'));renderSamples();renderQP();renderLib($('fq').value);renderStage();setNet(netSt);micUI();
  if(me.role==='deaf'){if(!lastMsg&&!busy)setSpeaker(null);if(!camOn&&!camStarting)setStatus('');}
}

/* ---------- join / leave ---------- */
function setupRole(){
  var d=me.role==='deaf';
  $('bmic').hidden=d;$('bvoice').hidden=d;$('bcam').hidden=false;
  curTab=d?'sign':'talk';renderTabs();tab(curTab);
  renderGuide($('gg'));renderSamples();renderQP();renderLib('');setSpeaker(null);micUI();camUI();
  $('bvoice').classList.toggle('on',voiceOn);$('voiceTgl').setAttribute('aria-pressed',String(voiceOn));
}
function doJoin(){
  var name=$('pname').value.trim(),role=document.querySelector('input[name=role]:checked');
  if(!name){$('fname').classList.add('err');$('pname').focus();return;}
  if(!role)return;
  me.name=name.slice(0,24);me.role=role.value;
  try{localStorage.setItem('sb_name',me.name);}catch(e){}
  unlockTTS();joined=true;joinedAt=Date.now();
  $('pre').hidden=true;$('app').hidden=false;paint();
  setupRole();renderStage();SBI.apply();
  Object.keys(roster).forEach(function(id){if(me.id<id)getPeer(id);});
  if(netSt.mqtt==='connected'||net)sendHi(false);
  setInterval(sendPing,12000);
  setInterval(function(){var t=Date.now(),ch=false;Object.keys(roster).forEach(function(id){if(t-roster[id].seen>36000){toast(T('left',{n:roster[id].name}));delete roster[id];closePeer(id);ch=true;}});if(ch)renderStage();},5000);
  if(me.role==='deaf'){setStatus(T('camAsk'));startCam();}
  if(window.innerWidth<=900)panel(true);
}
function leave(){
  stopCam();Object.keys(peers).forEach(closePeer);
  try{net&&net.send({t:'bye',id:me.id});}catch(e){}
  setMic(false);try{speechSynthesis.cancel();}catch(e){}
  setTimeout(function(){try{net&&net.close();}catch(e){}location.href='../';},300);
}

/* ---------- wiring ---------- */
function init(){
  vid=$('vid');cvr=$('cvr');cctx=cvr.getContext('2d');
  paint();SBI.apply();
  $('pcode').textContent=CODEF;$('codeTxt').textContent=CODEF;$('ciCode').textContent=CODEF;
  try{var sn=localStorage.getItem('sb_name');if(sn)$('pname').value=sn;}catch(e){}
  $('plang').innerHTML=langBtnHtml();$('lang2').innerHTML=langBtnHtml();
  var flip=function(){SBI.set(SBI.get()==='vi'?'en':'vi');};
  $('plang').onclick=flip;$('lang2').onclick=flip;window.onSBLang=refreshLang;
  renderGuide($('pgg'));renderPre();
  $('pcopy').onclick=function(){copyText(inviteUrl());toast(T('linkCopied'));};
  $('pname').addEventListener('input',function(){$('fname').classList.remove('err');checkJoin();});
  $('pname').addEventListener('keydown',function(e){if(e.key==='Enter'&&!$('pjoin').disabled)doJoin();});
  [].forEach.call(document.querySelectorAll('input[name=role]'),function(r){r.addEventListener('change',function(){checkJoin();if(r.value==='deaf'&&r.checked)setTimeout(function(){try{$('guide').scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){}},120);});});
  $('pjoin').onclick=doJoin;checkJoin();

  $('codeBtn').onclick=function(){copyText(inviteUrl());toast(T('linkCopied'));};
  $('binv').onclick=function(){
    if(navigator.share&&/Mobi|Android/i.test(navigator.userAgent)){navigator.share({title:'SignBridge',text:T('roomHelp',{code:CODEF}),url:inviteUrl()}).catch(function(){});}
    else{copyText(inviteUrl());toast(T('linkCopied'));}
  };
  $('bppl').onclick=function(){toast(T('inRoom')+': '+order().map(function(id){return persona(id).n;}).join(', '));};
  $('bchat').onclick=function(){panel(true);tab('log');};
  $('bend').onclick=leave;
  $('bcc').onclick=function(){ccOn=!ccOn;$('bcc').classList.toggle('on',ccOn);if(!ccOn){ccRows.forEach(function(x){x.remove();});ccRows=[];}toast(ccOn?T('capOn'):T('capOff'));};
  $('bmic').onclick=function(){setMic(!micWanted);};
  $('micbig').onclick=function(){setMic(!micWanted);};
  function setVoice(v){voiceOn=v;$('bvoice').classList.toggle('on',v);$('bvoice').innerHTML=ic(v?'volume':'volumeoff');$('voiceTgl').setAttribute('aria-pressed',String(v));if(!v){try{speechSynthesis.cancel();}catch(e){}}else unlockTTS();toast(v?T('voiceOn'):T('voiceOff'));}
  $('vreplay').onclick=function(){if(lastSigned)speak(lastSigned.text,lastSigned.lang);};
  $('vtest').onclick=function(){speak(tlang==='vi'?'Xin chào, đây là giọng đọc của SignBridge.':'Hello, this is the SignBridge voice.',tlang);};
  $('bvoice').onclick=function(){setVoice(!voiceOn);};$('voiceTgl').onclick=function(){setVoice(!voiceOn);};
  $('bcam').onclick=function(){if(camOn||camStarting){stopCam();resetSign();setStatus('');}else startCam();};
  $('camon').onclick=startCam;
  $('xp').onclick=function(){panel(false);};
  [].forEach.call(document.querySelectorAll('.jsb'),function(b){b.onclick=function(){panel($('app').classList.contains('nopanel'));};});
  $('tabs').onclick=function(e){var b=e.target.closest('button');if(b){autoSw=false;tab(b.dataset.tab);if(b.dataset.tab!=='sign')resetSignIfIdle();}};
  function resetSignIfIdle(){if(sgState==='collect'){resetSign();}}
  $('spd').onclick=function(e){var b=e.target.closest('button');if(!b)return;spd=parseFloat(b.dataset.s);[].forEach.call($('spd').children,function(x){x.setAttribute('aria-pressed',String(x===b));});};
  $('slang').onclick=function(e){var b=e.target.closest('button');if(!b)return;slang=b.dataset.l;setLangPair($('slang'),slang);renderSamples();if(sgState==='review')$('sentT').textContent=PRESETS[presetI][slang];};
  $('tlang').onclick=function(e){var b=e.target.closest('button');if(!b)return;tlang=b.dataset.l;setLangPair($('tlang'),tlang);renderQP();if(micWanted){setMic(false);setMic(true);}};
  setLangPair($('slang'),slang);setLangPair($('tlang'),tlang);
  $('say').onsubmit=function(e){e.preventDefault();var v=$('txt').value;$('txt').value='';sendSay(v,false,tlang);};
  $('redo').onclick=resetSign;$('submit').onclick=submitSign;
  $('fq').oninput=function(e){renderLib(e.target.value);};
  var av=$('avw');av.tabIndex=0;av.setAttribute('role','button');
  var replay=function(){if(lastMsg&&!busy){queue.push(lastMsg);pump();}};
  av.onclick=function(e){if(!e.target.closest('.spd'))replay();};
  av.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();replay();}};
  var tick=function(){$('clk').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});};tick();setInterval(tick,30000);
  window.addEventListener('pagehide',function(){stopCam();try{net&&net.send({t:'bye',id:me.id});}catch(e){}});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&joined)sendPing();});
  requestAnimationFrame(frame);
  startNet();
  window.__sb={me:me,roster:roster,state:function(){return{sgState:sgState,seq:seqG.slice(),camOn:camOn,netSt:netSt,tab:curTab};}};
}
init();
})();
