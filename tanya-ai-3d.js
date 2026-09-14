/* =====================================================================
   LUNA - Avatar Anime (Canvas2D vektor, gaya sprite VTuber)
   - Mulut digerakkan VISIME asli dari analisis frekuensi suara AI
   - Kedipan mata, napas, kepala miring, melirik mengikuti kursor
   - Tidak butuh WebGL / model eksternal -> mustahil blank
   API publik: window.setAvatarState('idle'|'connecting'|'listening'|'thinking'|'speaking')
   ===================================================================== */
(function () {
  'use strict';

  var DW = 560, DH = 720;      // ukuran ruang desain
  var canvas, ctx, view = { s: 1, ox: 0, oy: 0, w: 0, h: 0 };
  var state = 'idle';
  var isVisible = true;
  var mouse = { x: 0, y: 0 };

  // ---- animator state ----
  var blink = { open: 1, t: 0, next: 2.2, dur: 0.13 };
  var mouthS = { open: 0.05, wide: 0.5, round: 0.0, jaw: 0.05 };
  var browS = 0;
  var headS = { yaw: 0, pitch: 0, roll: 0 };
  var bounce = 0;

  window.setAvatarState = function (s) { state = s || 'idle'; };

  /* ------------------------- UTIL ------------------------- */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function fit() {
    if (!canvas) return;
    var wrap = canvas.parentElement;
    var cw = wrap.clientWidth || 300, ch = wrap.clientHeight || 300;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    var s = Math.min(canvas.width / DW, canvas.height / DH) * 1.05;
    view.s = s;
    view.ox = (canvas.width - DW * s) / 2;
    view.oy = (canvas.height - DH * s) / 2 + 6 * s;
  }

  /* ------------------------- AUDIO -> VISIME ------------------------- */
  var td = null, fd = null;
  function analyze(dt) {
    var live = window.LunaLive && window.LunaLive.isSpeaking && window.LunaLive.isSpeaking();
    var an = live && window.LunaLive.getAnalyser ? window.LunaLive.getAnalyser() : null;

    var rms = 0, bright = 0.5;
    if (an) {
      var n = an.fftSize || 512;
      if (!td || td.length !== n) { td = new Uint8Array(n); fd = new Uint8Array(an.frequencyBinCount); }
      an.getByteTimeDomainData(td);
      var sum = 0;
      for (var i = 0; i < n; i++) { var v = (td[i] - 128) / 128; sum += v * v; }
      rms = Math.sqrt(sum / n);

      an.getByteFrequencyData(fd);
      // bin width = sampleRate / fftSize ; pakai asumsi rate ~24k -> ~46Hz/bin
      var lo = 0, hi = 0, c;
      for (c = 1; c <= 10; c++) lo += fd[c] || 0;      //  ~46 - 470 Hz (vokal rendah / bulat)
      for (c = 40; c <= 110; c++) hi += fd[c] || 0;     // ~1.9k - 5.2k Hz (desis / lebar)
      bright = clamp((hi / 70) / ((lo / 10) + (hi / 70) + 0.001), 0, 1);
    }

    // target buka mulut dari energi suara (gain dikalibrasi utk RMS bicara normal)
    var gain = 5.2;
    var target = clamp(rms * gain, 0, 1);
    if (target < 0.06) target = 0.04;                  // katup noise -> rapat saat jeda

    // attack cepat, release sedikit lebih lambat -> bibir terasa natural
    var k = target > mouthS.open ? 0.55 : 0.28;
    mouthS.open = lerp(mouthS.open, target, k * (dt / 0.016));
    mouthS.open = clamp(mouthS.open, 0.03, 1);

    // 'ee/ih' = lebar & tipis ; 'oh/uu' = bulat & sempit
    mouthS.round = lerp(mouthS.round, bright > 0.42 ? 0 : 1, clamp(dt * 9, 0, 1));
    if (target > 0.12) mouthS.wide = lerp(mouthS.wide, bright, clamp(dt * 7, 0, 1));

    // rahang (jaw drop) mengikuti energii rata-rata
    mouthS.jaw = lerp(mouthS.jaw, target * 0.8, clamp(dt * 6, 0, 1));

    // alis naik saat antusias / naik saat mendengarkan
    var browT = state === 'listening' ? 0.75 : (state === 'speaking' ? 0.35 + target * 0.5 : 0.2);
    browS = lerp(browS, browT, clamp(dt * 5, 0, 1));
  }

  /* ------------------------- WARNA ------------------------- */
  var C = {
    skin: '#FFEEE1', skinShade: '#F7D4BE', line: '#4A3A34',
    hair: '#FF8A65', hairDark: '#E2603F', hairShine: '#FFD2BF',
    irisTop: '#4BE3F5', irisBot: '#0E5C77', pupil: '#08283A',
    white: '#FFFFFF', uni: '#FCFCFC', navy: '#2C3E63', red: '#E8564B',
    lip: '#7E2A26', mouth: '#5A1512', tongue: '#F58C8C', blush: '#FF8A8A'
  };

  function stroke(c, w) { c.lineWidth = w || 5; c.strokeStyle = C.line; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }

  /* ------------------------- KEPALA / WAJAH ------------------------- */
  function facePath(c) {
    c.beginPath();
    c.moveTo(0, -178);
    c.bezierCurveTo(-92, -182, -152, -132, -152, -38);
    c.bezierCurveTo(-152, 44, -126, 106, -78, 148);
    c.bezierCurveTo(-52, 172, -24, 184, 0, 184);
    c.bezierCurveTo(24, 184, 52, 172, 78, 148);
    c.bezierCurveTo(126, 106, 152, 44, 152, -38);
    c.bezierCurveTo(152, -132, 92, -182, 0, -178);
    c.closePath();
  }

  function drawHead(c, t) {
    // cuping telinga
    c.save();
    [[-1, -152], [1, 152]].forEach(function (s) {
      c.save();
      c.beginPath();
      c.ellipse(s[1], 34, 20, 30, 0, 0, Math.PI * 2);
      c.fillStyle = C.skin; c.fill();
      c.fillStyle = C.skinShade; c.beginPath(); c.ellipse(s[1] + (s[0] > 0 ? -5 : 5), 34, 9, 15, 0, 0, Math.PI * 2); c.fill();
      stroke(c, 4.5); c.restore();
    });
    c.restore();

    // wajah
    facePath(c);
    var g = c.createLinearGradient(0, -180, 0, 190);
    g.addColorStop(0, '#FFF6EE'); g.addColorStop(0.6, C.skin); g.addColorStop(1, C.skinShade);
    c.fillStyle = g; c.fill();
    stroke(c, 5);

    // bayangan poni di dahi
    c.save(); facePath(c); c.clip();
    c.fillStyle = 'rgba(200,140,120,0.20)';
    c.beginPath(); c.moveTo(-150, -60); c.quadraticCurveTo(0, 10, 150, -60); c.lineTo(150, -200); c.lineTo(-150, -200); c.closePath(); c.fill();
    c.restore();
  }

  /* ------------------------- MATA ANIME ------------------------- */
  function eyePath(c) {
    c.beginPath();
    c.moveTo(-30, 6);
    c.bezierCurveTo(-26, -24, 6, -36, 33, -3);
    c.bezierCurveTo(14, 27, -14, 27, -30, 6);
    c.closePath();
  }

  function drawEye(c, open, lookX, lookY) {
    if (open < 0.14) { // tertutup -> garis melengkung
      c.beginPath(); c.moveTo(-28, 2); c.quadraticCurveTo(2, 16, 32, 0);
      c.lineWidth = 6; c.strokeStyle = C.line; c.lineCap = 'round'; c.stroke();
      return;
    }
    c.save();
    c.scale(1, clamp(open, 0.15, 1.12));

    // putih mata
    eyePath(c);
    c.save(); c.clip();
    c.fillStyle = '#FFFFFF'; c.fillRect(-40, -46, 80, 80);

    // iris
    var iy = 0 + lookY;
    var ix = 2 + lookX;
    c.save(); c.translate(ix, iy);
    var gi = c.createLinearGradient(0, -28, 0, 28);
    gi.addColorStop(0, C.irisTop); gi.addColorStop(0.55, '#1898B8'); gi.addColorStop(1, C.irisBot);
    c.beginPath(); c.ellipse(0, 0, 21, 27, 0, 0, Math.PI * 2);
    c.fillStyle = gi; c.fill();
    // cincin luar iris
    c.lineWidth = 3; c.strokeStyle = 'rgba(6,40,58,0.55)'; c.stroke();
    // pupil
    c.beginPath(); c.ellipse(0, 1, 9, 13, 0, 0, Math.PI * 2); c.fillStyle = C.pupil; c.fill();
    // kilau bawah iris
    c.beginPath(); c.ellipse(0, 16, 13, 7, 0, 0, Math.PI * 2); c.fillStyle = 'rgba(150,240,255,0.55)'; c.fill();
    c.restore();

    // highlight
    c.fillStyle = 'rgba(255,255,255,0.96)';
    c.beginPath(); c.ellipse(-9 + lookX * 0.4, -15 + lookY * 0.4, 8, 9.5, -0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(14 + lookX * 0.4, 9 + lookY * 0.4, 4.2, 4.2, 0, 0, Math.PI * 2); c.fill();

    // bulu mata atas (dibuat tebal di tengah-luar)
    c.restore();

    c.beginPath();
    c.moveTo(-30, 5);
    c.bezierCurveTo(-26, -25, 6, -37, 33, -4);
    c.lineWidth = 8.5; c.strokeStyle = C.line; c.lineCap = 'round'; c.stroke();
    // jerk outer
    c.beginPath(); c.moveTo(30, -7); c.quadraticCurveTo(41, -13, 45, -20);
    c.lineWidth = 6.5; c.stroke();
    // bulu mata bawah
    c.beginPath(); c.moveTo(24, 15); c.quadraticCurveTo(8, 24, -12, 21);
    c.lineWidth = 3; c.strokeStyle = 'rgba(74,58,52,0.75)'; c.stroke();
  }

  function drawBrow(c, up) {
    c.save(); c.translate(0, -6 - up * 9);
    c.beginPath();
    c.moveTo(-27, -2); c.quadraticCurveTo(2, -16, 31, -6);
    c.lineWidth = 6; c.strokeStyle = C.hairDark; c.lineCap = 'round'; c.stroke();
    c.restore();
  }

  function drawFace(c, t, dt) {
    var open = blink.open;
    var lookX = clamp(mouse.x, -1, 1) * 6;
    var lookY = clamp(mouse.y, -1, 1) * -4 + (state === 'thinking' ? -5 : 0);

    [[-1, -60], [1, 60]].forEach(function (s) {
      c.save();
      c.translate(s[1], 16);
      if (s[0] < 0) c.scale(-1, 1);
      drawBrow(c, browS);
      drawEye(c, open * (state === 'listening' ? 1.07 : 1), lookX, lookY);
      c.restore();
    });

    // hidung
    c.beginPath(); c.moveTo(-3, 62); c.quadraticCurveTo(1, 68, 6, 63);
    c.lineWidth = 3.2; c.strokeStyle = 'rgba(150,95,75,0.7)'; c.lineCap = 'round'; c.stroke();

    // blush
    var ba = state === 'speaking' ? 0.5 : (state === 'listening' ? 0.55 : 0.34);
    [-97, 97].forEach(function (bx) {
      var rg = c.createRadialGradient(bx, 62, 2, bx, 62, 32);
      rg.addColorStop(0, 'rgba(255,120,130,' + ba + ')');
      rg.addColorStop(1, 'rgba(255,120,130,0)');
      c.save(); c.translate(bx, 62); c.scale(1, 0.55); c.beginPath(); c.arc(0, 0, 32, 0, Math.PI * 2);
      c.fillStyle = rg; c.fill(); c.restore();
      // garis pipi anime
      c.save(); c.globalAlpha = ba * 0.7; c.strokeStyle = '#FF9AA2'; c.lineWidth = 3; c.lineCap = 'round';
      for (var i = -1; i <= 1; i++) {
        c.beginPath(); c.moveTo(bx + i * 11 - 4, 55); c.lineTo(bx + i * 11 + 3, 70); c.stroke();
      }
      c.restore();
    });

    drawMouth(c, dt);
  }

  /* ------------------------- MULUT (LIP-SYNC VISIME) ------------------------- */
  function drawMouth(c, dt) {
    var o = mouthS.open;
    var w = mouthS.wide;
    var r = mouthS.round;
    var j = mouthS.jaw;

    c.save();
    c.translate(0, 94 + (j * 14));

    // transisi ke senyum kalau idle / listening
    if (state !== 'speaking' && o < 0.08) {
      var sw = state === 'listening' ? 18 : 12;
      c.beginPath(); c.moveTo(-sw, 0); c.quadraticCurveTo(0, 5, sw, 0);
      c.lineWidth = 4; c.strokeStyle = 'rgba(74,58,52,0.85)'; c.lineCap = 'round'; c.stroke();
      if (state === 'listening') { // bibir D senyum anime (terbuka tipis)
        c.beginPath(); c.moveTo(-sw, 0); c.quadraticCurveTo(0, 10, sw, 0); c.fillStyle = C.lip; c.fill();
      }
      c.restore(); return;
    }

    var mxw = lerp(lerp(18, 38, w), 14, r);     // mulut lebar untuk AA/IH, sempit untuk OU
    var mxh = lerp(26 * o, 42 * o, r * 0.4);      // tinggi bukaan mulut
    var uCrv = lerp(2, -6, w);                  // lengkung bibir atas (naik kalau lebar)

    // clip mulut
    c.beginPath();
    c.moveTo(-mxw, 0);
    c.quadraticCurveTo(0, uCrv, mxw, 0);
    c.bezierCurveTo(mxw, mxh, -mxw, mxh, -mxw, 0);
    c.closePath();

    c.fillStyle = C.mouth; c.fill();
    c.save(); c.clip();

    // lidah
    var ty = lerp(mxh * 0.65, mxh * 0.4, w) + (1 - o) * 5;
    c.beginPath(); c.ellipse(0, ty, mxw * 0.7, mxh * 0.5, 0, 0, Math.PI * 2);
    c.fillStyle = C.tongue; c.fill();

    // gigi atas
    var gx = mxw * 0.8, gh = lerp(6, 4, o);
    c.beginPath(); c.moveTo(-gx, uCrv); c.quadraticCurveTo(0, uCrv + gh + 1, gx, uCrv); c.lineTo(gx, uCrv - 5); c.lineTo(-gx, uCrv - 5); c.closePath();
    c.fillStyle = C.white; c.fill();
    c.restore();

    stroke(c, 4.5);
    c.restore();
  }

  /* ------------------------- RAMBUT, BADAN & KOMPOSISI ------------------------- */
  function hairBackPath(c) {
    c.beginPath();
    c.moveTo(-160, 170);
    c.bezierCurveTo(-220, 20, -210, -200, 0, -200);
    c.bezierCurveTo(210, -200, 220, 20, 160, 170);
    c.bezierCurveTo(180, 70, 120, -80, 0, -80);
    c.bezierCurveTo(-120, -80, -180, 70, -160, 170);
    c.closePath();
  }

  function hairFrontPath(c) {
    // poni utama (ahoge & helai depan)
    c.beginPath();
    c.moveTo(-170, 18);
    c.quadraticCurveTo(-140, -120, 0, -180);
    c.quadraticCurveTo(140, -120, 170, 18);
    c.quadraticCurveTo(140, -20, 110, -20);
    c.quadraticCurveTo(90, 40, 60, -30);
    c.quadraticCurveTo(50, -40, 30, -10);
    c.quadraticCurveTo(-10, 80, -30, 0);
    c.quadraticCurveTo(-50, -30, -80, 30);
    c.quadraticCurveTo(-120, -20, -140, -10);
    c.quadraticCurveTo(-155, 10, -170, 18);
    c.closePath();
  }

  function drawHairBack(c) {
    var g = c.createLinearGradient(0, -200, 0, 170);
    g.addColorStop(0, C.hair); g.addColorStop(1, C.hairDark);
    c.beginPath(); hairBackPath(c); c.fillStyle = g; c.fill(); stroke(c, 5.5);
  }

  function drawHairFront(c) {
    // twin-tail sisi
    [-1, 1].forEach(function (s) {
      c.save(); c.translate(142 * s, 10);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(30 * s, 130, 20 * s, 260); c.quadraticCurveTo(-30 * s, 140, -20 * s, -10);
      var gt = c.createLinearGradient(0, 0, 0, 260); gt.addColorStop(0, C.hair); gt.addColorStop(1, C.hairDark);
      c.fillStyle = gt; c.fill(); stroke(c, 5.5);
      c.restore();
    });

    var g = c.createLinearGradient(0, -180, 0, 60);
    g.addColorStop(0, C.hair); g.addColorStop(1, C.hairDark);
    c.beginPath(); hairFrontPath(c); c.fillStyle = g; c.fill(); stroke(c, 5.5);

    // shine halo
    c.save(); hairFrontPath(c); c.clip();
    c.beginPath(); c.moveTo(-160, -115); c.quadraticCurveTo(0, -155, 160, -115);
    c.lineWidth = 14; c.strokeStyle = C.hairShine; c.stroke();
    c.restore();

    // ahoge (rambut berdiri)
    c.beginPath(); c.moveTo(0, -178); c.quadraticCurveTo(-60, -260, -30, -280); c.quadraticCurveTo(-10, -230, 0, -178);
    c.fillStyle = C.hair; c.fill(); stroke(c, 5.5);
  }

  function drawBody(c, t) {
    c.save();
    c.translate(0, 165);
    
    // Leher
    c.beginPath(); c.moveTo(-24, 15); c.lineTo(24, 15); c.lineTo(28, 48); c.lineTo(-28, 48); c.closePath();
    c.fillStyle = C.skinShade; c.fill(); stroke(c, 5);

    // Baju sailor collar
    c.beginPath(); c.moveTo(-85, 95); c.quadraticCurveTo(0, 60, 85, 95); c.lineTo(135, 170); c.quadraticCurveTo(0, 200, -135, 170); c.closePath();
    c.fillStyle = C.uni; c.fill(); stroke(c, 5.5);

    // Kerah biru dongker
    c.beginPath(); c.moveTo(-85, 95); c.lineTo(-40, 195); c.quadraticCurveTo(0, 215, 40, 195); c.lineTo(85, 95); c.quadraticCurveTo(0, 140, -85, 95); c.closePath();
    c.fillStyle = C.navy; c.fill(); stroke(c, 5);

    // Garis kerah (stripes)
    c.beginPath(); c.moveTo(-74, 110); c.lineTo(-37, 185); c.moveTo(74, 110); c.lineTo(37, 185);
    c.lineWidth = 3; c.strokeStyle = C.white; c.stroke();

    // Pita merah
    var br = 18;
    c.beginPath(); c.ellipse(0, 185, br, br, 0, 0, Math.PI * 2); c.fillStyle = C.red; c.fill(); stroke(c, 5);
    [[-1, -70], [1, 70]].forEach(function (s) {
      c.beginPath(); c.moveTo(s[0] * br * 0.7, 185); c.lineTo(s[1], 155); c.quadraticCurveTo(s[1] + s[0] * 10, 225, s[0] * 15, 205); c.closePath();
      c.fillStyle = C.red; c.fill(); stroke(c, 5);
    });

    c.restore();
  }

  /* ------------------------- RENDER LOOP ------------------------- */
  var last = 0;
  function render(now) {
    requestAnimationFrame(render);
    if (!isVisible || !ctx) return;
    var dt = (now - last) / 1000;
    if (dt > 0.05) dt = 0.016;
    last = now;
    var t = now / 1000;

    analyze(dt);

    // blink engine
    blink.t += dt;
    if (blink.t >= blink.next) {
      blink.open = 0; blink.t = 0;
      blink.next = 2.0 + Math.random() * 3.0; // kedip setiap 2-5s
    } else {
      blink.open = lerp(blink.open, 1, Math.min(dt * (blink.t < blink.dur ? 4 : 12), 1));
    }

    // Gerak napas & kursor
    bounce = lerp(bounce, Math.sin(t * 2) * 5, dt * 5);
    var targetYaw = clamp(mouse.x, -1, 1) * 0.15;
    var targetPitch = clamp(mouse.y, -1, 1) * -0.1;
    headS.yaw = lerp(headS.yaw, targetYaw, dt * 6);
    headS.pitch = lerp(headS.pitch, targetPitch, dt * 6);
    headS.roll = lerp(headS.roll, (state === 'listening' ? 0.06 : (state === 'thinking' ? -0.05 : 0)), dt * 4);

    if (canvas.width !== canvas.parentElement.clientWidth * Math.min(window.devicePixelRatio||1,2)) fit();

    var c = ctx;
    c.clearRect(0, 0, canvas.width, canvas.height);

    c.save();
    c.translate(view.ox + (DW * view.s) / 2, view.oy + (DH * view.s) / 2);
    c.scale(view.s, view.s);

    // render
    c.save(); c.translate(0, bounce + 10); drawHairBack(c); c.restore();
    drawBody(c, t);
    
    // kepala + wajah
    c.save();
    c.translate(0, bounce - 40);
    c.rotate(headS.roll);
    c.scale(1 + Math.abs(headS.yaw) * 0.02, 1);
    
    // offset 3D palsu
    c.translate(headS.yaw * 40, headS.pitch * 30);
    drawHead(c, t);
    drawFace(c, t, dt);
    
    // poni (offset layer 3D)
    c.translate(headS.yaw * 12, headS.pitch * 8);
    drawHairFront(c);
    c.restore();

    c.restore();
  }

  /* ------------------------- INIT ------------------------- */
  function init() {
    canvas = document.getElementById('avatarCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    var wrap = canvas.parentElement;
    wrap.addEventListener('mousemove', function (e) {
      var r = wrap.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    });
    wrap.addEventListener('mouseleave', function () { mouse.x = 0; mouse.y = 0; });
    
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (ents) { isVisible = ents[0].isIntersecting; }).observe(wrap);
    }
    window.addEventListener('resize', fit);
    
    fit();
    last = performance.now();
    requestAnimationFrame(render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
