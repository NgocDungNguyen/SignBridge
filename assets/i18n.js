/* SignBridge UI strings (Vietnamese / English). Use t('key',{vars}); static markup uses data-t / data-t-ph / data-t-aria. */
(function(root){
  var D={
  vi:{
    home:'Trang chủ',copy:'Sao chép',copied:'Đã sao chép',share:'Chia sẻ',roomCode:'Mã phòng',app:'SignBridge',
    langName:'Tiếng Việt',
    preTitle:'Tham gia cuộc họp',preName:'Tên của bạn',preNamePh:'Ví dụ: Minh',needName:'Hãy nhập tên của bạn',
    q:'Bạn có cần chức năng hỗ trợ khuyết tật không?',
    qCue:'Cần hỗ trợ ký hiệu? Chọn “Có”.',
    yesT:'Có, tôi cần hỗ trợ',yesS:'Tôi là người Điếc hoặc khiếm thính. Điện thoại này dùng camera để nhận diện ký hiệu của tôi và hiện nhân vật ký hiệu cho tôi xem.',
    noT:'Không, tôi nghe được',noS:'Tôi nói hoặc gõ chữ. Tin nhắn ký hiệu của bạn bè sẽ hiện thành chữ và được đọc thành tiếng.',
    join:'Tham gia',checking:'Đang kiểm tra phòng…',roomFound:'Đang có {n} người trong phòng',
    roomEmpty:'Chưa thấy ai trong phòng. Hãy kiểm tra lại mã, hoặc tham gia và chờ người khác vào.',
    roomNew:'Phòng mới. Gửi mã cho bạn bè để họ vào.',
    guideTitle:'Hướng dẫn cử chỉ (bản demo)',
    guideSub:'Camera nhận 8 cử chỉ tay. Giữ mỗi cử chỉ khoảng 1 giây. Mỗi cử chỉ được gắn với một câu mẫu; chưa phải ký hiệu chuẩn.',
    guideHold:'Giữ cử chỉ khoảng 1 giây',
    privacy:'Camera chỉ xử lý trên máy của bạn. Video không được gửi đi; mọi người chỉ nhận câu chữ bạn bấm Gửi.',
    st_conn:'Đang kết nối…',st_on:'Đã kết nối',st_local:'Chỉ trong trình duyệt này',st_off:'Chưa kết nối máy chủ',
    people:'{n} người',inRoom:'Trong phòng',you:'Bạn',deafBadge:'ký hiệu',hearBadge:'nghe',
    joined:'{n} đã vào phòng',left:'{n} đã rời phòng',
    tWatch:'Xem',tSign:'Ký hiệu',tLib:'Thư viện',tLog:'Tin nhắn',tTalk:'Nói',
    waiting:'Đang chờ',live:'Trực tiếp',liveHint:'Lời nói trong phòng sẽ hiện ở đây.',qMore:'+{n} câu tiếp',onlyCaption:'chỉ có phụ đề',
    spd:'Tốc độ ký hiệu',
    camLabel:'Camera của bạn',camOff:'Camera đang tắt',camOn:'Bật camera',camAsk:'Bật camera để ký hiệu',
    stLoad:'Đang tải mô hình nhận diện…',stShow:'Đưa tay vào khung hình',stSeen:'Đang thấy: {p}',stCollect:'Làm cử chỉ tiếp theo, hoặc chờ để xem câu',stThink:'Đang hiểu câu…',stReview:'Kiểm tra tin nhắn',
    camDenied:'Không mở được camera. Hãy cho phép camera trong trình duyệt rồi bấm lại.',camNone:'Thiết bị này không có camera.',camHttps:'Camera cần kết nối an toàn (https).',
    modelFail:'Không tải được mô hình nhận diện. Hãy thử mạng khác.',
    yourMsg:'Tin nhắn của bạn',redo:'Làm lại',send:'Gửi',sentOk:'Đã gửi tới mọi người',noMsg:'Chưa có tin nhắn',
    libSearch:'Tìm ký hiệu',libNone:'Không tìm thấy ký hiệu',sampleTitle:'Không có camera? Dùng câu mẫu',gesturesNow:'Cử chỉ nhận diện',
    micStart:'Bấm để nói',micStop:'Đang nghe… bấm để dừng',micUnsup:'Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc gõ chữ.',micDenied:'Không dùng được micro. Hãy cho phép micro rồi thử lại.',
    typePh:'Nhập điều bạn muốn nói',quick:'Câu nhanh',readAloud:'Đọc to tin nhắn ký hiệu',
    voiceOn:'Đã bật giọng đọc',voiceOff:'Đã tắt giọng đọc',capOn:'Đã bật phụ đề',capOff:'Đã tắt phụ đề',
    leave:'Rời phòng',invite:'Mời',linkCopied:'Đã sao chép liên kết phòng',roomHelp:'Gửi mã {code} hoặc liên kết cho bạn bè.',
    noVoiceVi:'Thiết bị này chưa có giọng đọc tiếng Việt. Sẽ dùng giọng mặc định.',noVoiceEn:'Thiết bị này chưa có giọng đọc tiếng Anh.',
    mic:'Micro',cam:'Camera',cc:'Phụ đề',sb:'SignBridge',close:'Đóng',
    heardBy:'Tin nhắn ký hiệu',spoken:'nói',
    homeTitle:'Họp trực tuyến, ai cũng hiểu nhau',
    homeSub:'Lời nói thành ký hiệu cho học sinh Điếc. Ký hiệu thành chữ và giọng nói cho cả lớp. Chạy ngay trên trình duyệt.',
    newMeet:'Cuộc họp mới',joinCode:'Nhập mã phòng',joinBtn:'Tham gia',seeDemo:'Xem demo (4 người mô phỏng)',
    badCode:'Mã gồm 6 chữ cái hoặc số',
    f1t:'Nghe → xem ký hiệu',f1s:'Lời nói trở thành chữ, rồi nhân vật 3D ký hiệu, kèm tên người nói.',
    f2t:'Ký hiệu → chữ và giọng nói',f2s:'Camera nhận cử chỉ tay, ghép thành câu để cả phòng đọc hoặc nghe.',
    f3t:'Video ở lại trên máy bạn',f3s:'Nhận diện bàn tay chạy trong trình duyệt. Chỉ câu chữ được gửi đi.',
    foot:'Bản nguyên mẫu dự thi EdiTech – CreativAI 2026–2027. Giọng nói và ký hiệu chỉ để minh họa, chưa phải ký hiệu chuẩn của người Điếc Việt Nam.'
  },
  en:{
    home:'Home',copy:'Copy',copied:'Copied',share:'Share',roomCode:'Room code',app:'SignBridge',
    langName:'English',
    preTitle:'Join meeting',preName:'Your name',preNamePh:'e.g. Minh',needName:'Please enter your name',
    q:'Do you need an accessibility (disability) function?',
    qCue:'Need sign-language support? Choose “Yes”.',
    yesT:'Yes, I need support',yesS:'I am Deaf or hard of hearing. This phone uses its camera to recognise my hand signs and shows a signing avatar for me to watch.',
    noT:'No, I can hear',noS:'I speak or type. My friends’ signed messages appear as text and are read aloud.',
    join:'Join',checking:'Checking the room…',roomFound:'In the room now: {n}',
    roomEmpty:'Nobody is in this room yet. Check the code, or join and wait for others.',
    roomNew:'New room. Send the code to your friends so they can join.',
    guideTitle:'Gesture guide (demo)',
    guideSub:'The camera recognises 8 hand gestures. Hold each one for about 1 second. Each gesture is wired to a sample sentence; they are not real sign language.',
    guideHold:'Hold a gesture for about 1 second',
    privacy:'The camera is processed on your device only. Video is never sent; others only receive the sentence you press Send on.',
    st_conn:'Connecting…',st_on:'Connected',st_local:'This browser only',st_off:'Server not reachable',
    people:'{n} people',inRoom:'In the room',you:'You',deafBadge:'signs',hearBadge:'hears',
    joined:'{n} joined',left:'{n} left',
    tWatch:'Watch',tSign:'Sign',tLib:'Library',tLog:'Chat',tTalk:'Talk',
    waiting:'Waiting',live:'Live',liveHint:'Speech from the room shows here.',qMore:'+{n} more',onlyCaption:'captions only',
    spd:'Signing speed',
    camLabel:'Your camera',camOff:'Camera is off',camOn:'Turn camera on',camAsk:'Turn the camera on to sign',
    stLoad:'Loading hand-tracking model…',stShow:'Show your hand to the camera',stSeen:'Seeing: {p}',stCollect:'Make the next gesture, or wait to see the sentence',stThink:'Understanding the sentence…',stReview:'Check your message',
    camDenied:'Could not open the camera. Allow camera access in your browser and try again.',camNone:'No camera found on this device.',camHttps:'The camera needs a secure (https) connection.',
    modelFail:'Could not load the hand-tracking model. Try another network.',
    yourMsg:'Your message',redo:'Redo',send:'Send',sentOk:'Sent to everyone',noMsg:'No messages yet',
    libSearch:'Search signs',libNone:'No signs found',sampleTitle:'No camera? Use a sample sentence',gesturesNow:'Recognised gestures',
    micStart:'Tap to speak',micStop:'Listening… tap to stop',micUnsup:'This browser does not support speech recognition. Use Chrome, or type instead.',micDenied:'Microphone is not available. Allow microphone access and try again.',
    typePh:'Type what you want to say',quick:'Quick phrases',readAloud:'Read signed messages aloud',
    voiceOn:'Voice on',voiceOff:'Voice off',capOn:'Captions on',capOff:'Captions off',
    leave:'Leave',invite:'Invite',linkCopied:'Room link copied',roomHelp:'Send the code {code} or the link to your friends.',
    noVoiceVi:'No Vietnamese voice found on this device. Using the default voice.',noVoiceEn:'No English voice found on this device.',
    mic:'Microphone',cam:'Camera',cc:'Captions',sb:'SignBridge',close:'Close',
    heardBy:'Signed message',spoken:'says',
    homeTitle:'Meet online, understood by everyone',
    homeSub:'Speech becomes sign language for Deaf students. Signs become text and voice for the whole room. Runs right in your browser.',
    newMeet:'New meeting',joinCode:'Enter room code',joinBtn:'Join',seeDemo:'Watch the demo (4 simulated people)',
    badCode:'The code has 6 letters or digits',
    f1t:'Hear → watch signs',f1s:'Speech becomes text, then a 3D avatar signs it, with the speaker’s name.',
    f2t:'Signs → text and voice',f2s:'The camera reads hand gestures and builds a sentence everyone can read or hear.',
    f3t:'Video stays on your device',f3s:'Hand tracking runs in the browser. Only the sentence text is sent.',
    foot:'Prototype for EdiTech – CreativAI 2026–2027. Speech and signs are for illustration only, not real Vietnamese Sign Language.'
  }};
  var lang='vi';
  try{var s=localStorage.getItem('sb_lang');if(s==='en'||s==='vi')lang=s;else if((navigator.language||'').toLowerCase().indexOf('vi')!==0)lang='en';}catch(e){}
  try{var q=new URLSearchParams(location.search).get('lang');if(q==='en'||q==='vi')lang=q;}catch(e){}
  function t(k,v){var s=(D[lang]&&D[lang][k]);if(s==null)s=D.vi[k];if(s==null)return k;if(v)for(var x in v)s=s.split('{'+x+'}').join(v[x]);return s;}
  function apply(rootEl){
    (rootEl||document).querySelectorAll('[data-t]').forEach(function(e){e.textContent=t(e.getAttribute('data-t'));});
    (rootEl||document).querySelectorAll('[data-t-ph]').forEach(function(e){e.setAttribute('placeholder',t(e.getAttribute('data-t-ph')));});
    (rootEl||document).querySelectorAll('[data-t-aria]').forEach(function(e){e.setAttribute('aria-label',t(e.getAttribute('data-t-aria')));});
    document.documentElement.lang=lang;
    if(typeof setCoreLang==='function')setCoreLang(lang);
  }
  function set(l){lang=l==='en'?'en':'vi';try{localStorage.setItem('sb_lang',lang);}catch(e){}apply();if(root.onSBLang)root.onSBLang(lang);}
  root.SBI={t:t,apply:apply,set:set,get:function(){return lang;},speechLang:function(l){return(l||lang)==='vi'?'vi-VN':'en-US';}};
})(typeof window!=='undefined'?window:globalThis);
