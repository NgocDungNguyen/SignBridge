/* SignBridge room transport.
   - BroadcastChannel: instant sync between tabs of the same browser (handy for solo testing).
   - MQTT over WebSocket (public brokers, no account/server to deploy): sync between phones/computers.
   Only short JSON messages are sent (names, sentences, sign results). Video never leaves the device. */
(function(root){
  var BROKERS=['wss://broker.hivemq.com:8884/mqtt','wss://broker.emqx.io:8084/mqtt','wss://test.mosquitto.org:8081/mqtt'];
  var ALPHA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function rnd(n){var s='',a=new Uint32Array(n);(root.crypto||{getRandomValues:function(x){for(var i=0;i<x.length;i++)x[i]=Math.random()*4294967296;}}).getRandomValues(a);for(var i=0;i<n;i++)s+=ALPHA[a[i]%ALPHA.length];return s;}
  function newCode(){return rnd(3)+'-'+rnd(3);}
  function normCode(c){return String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);}
  function fmtCode(c){c=normCode(c);return c.length>3?c.slice(0,3)+'-'+c.slice(3):c;}
  function params(){try{return new URLSearchParams(location.search);}catch(e){return{get:function(){return null;}};}}

  function join(code,o){
    var P=params(),topic='signbridge/v1/'+normCode(code),seen={},seenN=0,self={},closed=false,queue=[],client=null,bc=null,tries=0;
    var brokers=P.get('broker')?[P.get('broker')]:BROKERS;
    var st={mqtt:'connecting',broker:'',bc:false};
    function status(){if(o.onStatus)o.onStatus({mqtt:st.mqtt,broker:st.broker,bc:st.bc});}
    function deliver(raw){
      var m;try{m=typeof raw==='string'?JSON.parse(raw):raw;}catch(e){return;}
      if(!m||!m.mid||m.rid!==topic||seen[m.mid])return;
      seen[m.mid]=1;if(++seenN>800){seen={};seenN=0;}
      o.onMsg(m);
    }
    if(!P.get('nobc')){try{bc=new BroadcastChannel(topic);bc.onmessage=function(e){deliver(e.data);};st.bc=true;}catch(e){}}
    function flush(){while(queue.length&&client&&client.connected)client.publish(topic,queue.shift(),{qos:0});}
    function connect(i){
      if(closed)return;
      if(typeof root.mqtt==='undefined'){st.mqtt='failed';status();return;}
      var url=brokers[i%brokers.length];st.mqtt='connecting';st.broker=url;status();
      var c;
      try{c=root.mqtt.connect(url,{clientId:'sb_'+rnd(10),clean:true,connectTimeout:7000,reconnectPeriod:0,keepalive:30,protocolVersion:4});}
      catch(e){return next(i);}
      var ok=false,t=setTimeout(function(){if(!ok){try{c.end(true);}catch(e){}next(i);}},9000);
      c.on('connect',function(){
        ok=true;clearTimeout(t);
        c.subscribe(topic,{qos:0},function(err){
          if(err){try{c.end(true);}catch(e){}return next(i);}
          client=c;st.mqtt='connected';status();flush();
          if(o.onOpen)o.onOpen();
        });
      });
      c.on('message',function(tp,payload){deliver(payload.toString());});
      c.on('error',function(){});
      c.on('close',function(){
        clearTimeout(t);
        if(closed)return;
        var was=client===c;client=null;
        if(was){st.mqtt='connecting';status();setTimeout(function(){connect(i);},1500);}   /* dropped after being connected: retry same broker */
        else if(!ok){next(i);}
      });
    }
    function next(i){if(closed)return;tries++;setTimeout(function(){connect(i+1);},tries>=brokers.length?4000:300);if(tries>=brokers.length){st.mqtt='failed';status();}}
    connect(0);status();
    self.send=function(m){
      if(closed)return;m.mid=m.mid||rnd(12);m.rid=topic;seen[m.mid]=1;
      var s=JSON.stringify(m);
      if(bc){try{bc.postMessage(m);}catch(e){}}
      if(client&&client.connected)client.publish(topic,s,{qos:0});else{queue.push(s);if(queue.length>30)queue.shift();}
    };
    self.close=function(){closed=true;try{if(bc)bc.close();}catch(e){}try{if(client)client.end(true);}catch(e){}};
    self.state=function(){return st;};
    return self;
  }
  root.SBNet={join:join,newCode:newCode,normCode:normCode,fmtCode:fmtCode,rnd:rnd};
})(typeof window!=='undefined'?window:globalThis);
