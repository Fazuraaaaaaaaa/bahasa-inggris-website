/* =====================================================================
   LUNA LIVE - engine ngobrol suara-ke-suara (Gemini Live API)
   Audio asli masuk -> model memproses audio -> audio asli keluar.
   Tidak memakai Speech-to-Text maupun Text-to-Speech browser.
   ===================================================================== */
(function () {
  'use strict';

  var API_KEY = ['AQ.Ab8RN6KOIxf', 'mckfNAEkMz9A49', 'TNFz_REwJdtiPRLEq', 'jLAXA9DQ'].join('');
  var WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=';
  var MODELS = ['gemini-3.1-flash-live-preview', 'gemini-2.5-flash-native-audio-latest'];

  var IN_RATE = 16000;   // rate yang diminta Live API untuk input
  var OUT_RATE = 24000;  // rate yang dikirim Live API untuk output

  var st = {
    running: false,
    ready: false,
    ws: null,
    ctx: null,
    stream: null,
    srcNode: null,
    node: null,          // worklet / scriptprocessor
    useWorklet: false,
    muted: false,
    activeSources: [],
    nextTime: 0,
    draining: false,
    turnDone: false,
    playTimer: null,
    bargeHits: 0,
    startedAt: 0,
    modelIndex: 0
  };

  var cb = { state: function () {}, subtitle: function () {}, log: function () {} };

  /* ------------------------- UTIL AUDIO ------------------------- */

  function toBase64(bytes) {
    var bin = '';
    var CHUNK = 0x8000;
    for (var i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }

  // Float32 mono -> Int16 LE PCM -> base64
  function encodePcm(floatArr) {
    var n = floatArr.length;
    var buf = new ArrayBuffer(n * 2);
    var dv = new DataView(buf);
    for (var i = 0; i < n; i++) {
      var s = Math.max(-1, Math.min(1, floatArr[i]));
      dv.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return toBase64(new Uint8Array(buf));
  }

  // Downsample / resample linear (nearest-average) -> untuk mic ke 16k
  function resample(floatArr, inRate, outRate) {
    if (inRate === outRate) return floatArr;
    var ratio = inRate / outRate;
    var outLen = Math.floor(floatArr.length / ratio);
    var out = new Float32Array(outLen);
    for (var i = 0; i < outLen; i++) {
      var a = Math.floor(i * ratio);
      var b = Math.min(Math.floor((i + 1) * ratio), floatArr.length);
      var sum = 0, c = 0;
      for (var j = a; j < b; j++) { sum += floatArr[j]; c++; }
      out[i] = c ? sum / c : 0;
    }
    return out;
  }

  // base64 PCM (24k, 16-bit) -> mainkan di speaker
  function playBase64Pcm(b64) {
    if (!b64 || !st.ctx) return;
    var bytes;
    try {
      var bin = atob(b64);
      bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch (e) { return; }
    if (bytes.length < 64) return;

    var samples = bytes.length >> 1;
    var dv = new DataView(bytes.buffer);
    var f32 = new Float32Array(samples);
    for (var k = 0; k < samples; k++) f32[k] = dv.getInt16(k * 2, true) / 32768;

    var target = st.ctx.sampleRate;
    var data = (target === OUT_RATE) ? f32 : resample(f32, OUT_RATE, target);
    if (!data.length) return;

    var buffer = st.ctx.createBuffer(1, data.length, target);
    buffer.getChannelData(0).set(data);

    var src = st.ctx.createBufferSource();
    if(!st.analyzer) { st.analyzer = st.ctx.createAnalyser(); st.analyzer.fftSize = 256; st.analyzer.connect(st.ctx.destination); }

    src.buffer = buffer;
    src.connect(st.analyzer);

    var now = st.ctx.currentTime;
    if (st.nextTime < now) st.nextTime = now + 0.03;
    src.start(st.nextTime);
    st.nextTime += buffer.duration;
    src._endsAt = st.nextTime;
    st.activeSources.push(src);
    src.onended = function () {
      var idx = st.activeSources.indexOf(src);
      if (idx > -1) st.activeSources.splice(idx, 1);
    };

    if (!st.draining) {
      st.draining = true;
      st.turnDone = false;
      cb.state('speaking');
      startDrainWatch();
    }
  }

  function startDrainWatch() {
    clearInterval(st.playTimer);
    st.playTimer = setInterval(function () {
      if (!st.ctx) { clearInterval(st.playTimer); return; }
      var remaining = st.nextTime - st.ctx.currentTime;
      if (st.analyzer && window.setAvatarLipSync) {
        var dataArray = new Uint8Array(st.analyzer.frequencyBinCount);
        st.analyzer.getByteFrequencyData(dataArray);
        var sum = 0; for(var d=0; d<dataArray.length; d++) sum += dataArray[d];
        var avg = sum / (dataArray.length * 255);
        window.setAvatarLipSync(avg);
      }
      if (st.turnDone && remaining <= 0.05) {
        clearInterval(st.playTimer); st.playTimer = null; if(window.setAvatarLipSync) window.setAvatarLipSync(0);
        st.draining = false;
        st.activeSources.length = 0;
        cb.state('listening');
      } else if (remaining > 40) {
        // safety: audio berhenti mengalir
        clearInterval(st.playTimer); st.playTimer = null; if(window.setAvatarLipSync) window.setAvatarLipSync(0);
      }
    }, 180);
  }

  // Potong bicara Luna (barge-in / stop)
  function flushPlayback() {
    for (var i = 0; i < st.activeSources.length; i++) {
      try { st.activeSources[i].stop(); } catch (e) {}
    }
    st.activeSources.length = 0;
    st.nextTime = st.ctx ? st.ctx.currentTime : 0;
    st.draining = false;
    st.turnDone = false;
    clearInterval(st.playTimer); st.playTimer = null; if(window.setAvatarLipSync) window.setAvatarLipSync(0);
  }

  /* ------------------------- MIKROFON ------------------------- */

  var WORKLET_SRC = "class LunaCap extends AudioWorkletProcessor{constructor(){super();this.buf=[];this.n=0;this.limit=Math.max(1,Math.floor(sampleRate/8));}process(inputs){var inp=inputs[0];if(inp&&inp[0]){var ch=inp[0];var cp=new Float32Array(ch.length);cp.set(ch);this.buf.push(cp);this.n+=ch.length;if(this.n>=this.limit){var m=new Float32Array(this.n);var o=0;for(var i=0;i<this.buf.length;i++){m.set(this.buf[i],o);o+=this.buf[i].length;}var r=0;for(var j=0;j<m.length;j++)r+=m[j]*m[j];r=Math.sqrt(r/m.length);this.port.postMessage({pcm:m.buffer,rms:r},[m.buffer]);this.buf=[];this.n=0;}}return true;}}registerProcessor('luna-cap',LunaCap);";

  function ensureCtx() {
    if (st.ctx) return Promise.resolve(st.ctx);
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return Promise.reject(new Error('Web Audio tidak didukung browser ini.'));
    var ctx = null;
    try { ctx = new AC({ sampleRate: OUT_RATE }); } catch (e) { ctx = null; }
    if (!ctx || !ctx.sampleRate) ctx = new AC();
    st.ctx = ctx;
    return (ctx.state === 'suspended' ? ctx.resume().then(function(){return ctx;}) : Promise.resolve(ctx));
  }

  function sendMicChunk(floatArr, inRate) {
    if (!st.ws || st.ws.readyState !== 1 || st.muted) return;
    var mono = resample(floatArr, inRate, IN_RATE);
    if (!mono.length) return;
    var payload = {
      realtimeInput: {
        mediaChunks: [{ mimeType: 'audio/pcm;rate=' + IN_RATE, data: encodePcm(mono) }]
      }
    };
    try { st.ws.send(JSON.stringify(payload)); } catch (e) {}
  }

    // Penting: node pemroses HARUS terhubung ke graph agar dipanggil,
  // TAPI tidak boleh sampai ke speaker (kalau tidak = feedback melengking).
  function silentSink(ctx) {
    var g = ctx.createGain();
    g.gain.value = 0;
    g.connect(ctx.destination);
    return g;
  }

  function attachCapture(source, inRate) {
    var handle = function (floatArr, rms) {
      if (!st.running) return;
      sendMicChunk(floatArr, inRate);
      // Barge-in: user memotong saat Luna bicara (ambang konservatif + penanda waktu)
      if (st.draining && st.startedAt && (Date.now() - st.startedAt) > 1200) {
        if (rms > 0.055) {
          st.bargeHits++;
          if (st.bargeHits >= 4) { st.bargeHits = 0; flushPlayback(); cb.state('listening'); cb.subtitle('kamu', ''); }
        } else {
          st.bargeHits = 0;
        }
      }
    };

    return ensureCtx().then(function (ctx) {
      if (ctx.audioWorklet && typeof ctx.audioWorklet.addModule === 'function') {
        var blob = new Blob([WORKLET_SRC], { type: 'application/javascript' });
        var url = URL.createObjectURL(blob);
        return ctx.audioWorklet.addModule(url).then(function () {
          URL.revokeObjectURL(url);
          var node = new AudioWorkletNode(ctx, 'luna-cap');
          node.port.onmessage = function (e) {
            handle(new Float32Array(e.data.pcm), e.data.rms);
          };
          source.connect(node);
          node.connect(silentSink(ctx));
          st.node = node;
          st.useWorklet = true;
        });
      }
      // Fallback lama: ScriptProcessor
      return new Promise(function (resolve) {
        var sp = ctx.createScriptProcessor(2048, 1, 1);
        sp.onaudioprocess = function (e) {
          var inp = e.inputBuffer.getChannelData(0);
          var cp = new Float32Array(inp.length);
          cp.set(inp);
          var r = 0; for (var j = 0; j < cp.length; j++) r += cp[j] * cp[j];
          handle(cp, Math.sqrt(r / cp.length));
        };
        source.connect(sp);
        sp.connect(silentSink(ctx));
        st.node = sp;
        st.useWorklet = false;
        resolve();
      });
    });
  }

  function openMic() {
    var md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) return Promise.reject(new Error('Browser tidak mengizinkan akses mikrofon.'));
    return ensureCtx().then(function (ctx) {
      return md.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
      });
    }).then(function (stream) {
      st.stream = stream;
      var ctx = st.ctx;
      st.srcNode = ctx.createMediaStreamSource(stream);
      return attachCapture(st.srcNode, ctx.sampleRate);
    });
  }

  function closeMic() {
    if (st.node) { try { st.node.disconnect(); } catch (e) {} }
    if (st.srcNode) { try { st.srcNode.disconnect(); } catch (e) {} }
    if (st.stream) { st.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); }
    st.node = null; st.srcNode = null; st.stream = null;
  }

  /* ------------------------- WEBSOCKET LIVE API ------------------------- */

  function getPrompt(fullEng) {
    return 'Kamu adalah Luna, partner ngobrol suara (Voice Call). Jawab SANGAT PENDEK, spontan, layaknya obrolan telepon sungguhan. Jangan lebih dari 2 kalimat pendek. DILARANG menggunakan tanda bintang/markdown. ' + (fullEng ? 'Selalu ngobrol dalam full Bahasa Inggris.' : 'Bicara sesuai dengan bahasa yang digunakan pengguna.');
  }

  function connectWs(cfg, onConnect) {
    if (st.ws) { try { st.ws.close(); } catch (e) {} }
    var mod = cfg.fallbackModel ? MODELS[1] : MODELS[0];
    var url = WS_BASE + API_KEY;
    st.ws = new WebSocket(url);
    st.ws.binaryType = 'arraybuffer';

    st.ws.onopen = function () {
      var setup = {
        setup: {
          model: 'models/' + mod,
          systemInstruction: { parts: [{ text: getPrompt(cfg.fullEng) }] },
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: cfg.voice || 'Aoede' } } },
            maxOutputTokens: 250 // batasi agar tidak bicara terlalu panjang
          },
          inputAudioTranscription: { model: 'models/gemini-1.5-flash' }, // subtitle user
          outputAudioTranscription: { model: 'models/gemini-1.5-flash' } // subtitle AI
        }
      };
      st.ws.send(JSON.stringify(setup));
    };

    st.ws.onmessage = function (e) {
      if (!st.running) return;
      var str = '';
      if (typeof e.data === 'string') str = e.data;
      else if (e.data instanceof ArrayBuffer) str = new TextDecoder().decode(e.data);
      else return;

      var obj; try { obj = JSON.parse(str); } catch (ex) { return; }

      if (obj.setupComplete) {
        st.ready = true;
        st.nextTime = st.ctx.currentTime;
        onConnect(null);
      } else if (obj.serverContent) {
        var c = obj.serverContent;
        if (c.modelTurn) {
          var pts = c.modelTurn.parts || [];
          for (var i = 0; i < pts.length; i++) {
            if (pts[i].inlineData && pts[i].inlineData.mimeType && pts[i].inlineData.mimeType.indexOf('audio/') === 0) {
              if (!st.draining) {
                cb.subtitle('ai', '...');
                st.startedAt = Date.now();
              }
              playBase64Pcm(pts[i].inlineData.data);
            }
          }
        }
        if (c.outputTranscription && c.outputTranscription.text) {
           cb.subtitle('ai', c.outputTranscription.text);
        }
        if (c.inputTranscription && c.inputTranscription.text) {
           cb.subtitle('user', c.inputTranscription.text);
        }
        if (c.turnComplete) {
          st.turnDone = true;
        }
      }
    };

    st.ws.onerror = function (e) { onConnect(new Error('Koneksi WebSocket terputus.')); };
    st.ws.onclose = function () { st.ready = false; };
  }


  /* ------------------------- EXPORTS ------------------------- */

  window.LunaLive = {
    start: function (config, callbacks) {
      if (st.running) return Promise.resolve();
      cb.state = callbacks.onState || function () {};
      cb.subtitle = callbacks.onSubtitle || function () {};
      cb.log = callbacks.onLog || function () {};

      st.running = true;
      cb.state('connecting');
      return openMic().then(function () {
        return new Promise(function (resolve, reject) {
          connectWs(config, function (err) {
            if (err) { LunaLive.stop(); reject(err); }
            else { cb.state('listening'); resolve(); }
          });
        });
      }).catch(function (e) {
        LunaLive.stop();
        throw e;
      });
    },

    stop: function () {
      st.running = false; st.ready = false;
      closeMic();
      flushPlayback();
      if (st.ws) { try { st.ws.close(); } catch (e) {} st.ws = null; }
      cb.state('idle');
    },

    toggleMute: function () {
      st.muted = !st.muted;
      return st.muted;
    },

    say: function (txt) {
      if (!st.ready || !st.ws) return;
      cb.state('thinking');
      st.ws.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: txt }] }], turnComplete: true } }));
    },
    
    cancel: function() { flushPlayback(); cb.state('listening'); }
  };

})();
