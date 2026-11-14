/* Soundtrack for /defcon/: one drone that follows the match clock. It starts each hour
   almost empty, gathers voices, brightness, noise and unease as the DEFCON level falls,
   and reaches its climax in the last ten minutes: distortion, an endlessly rising tone,
   a racing pulse and overlapping radio traffic, held through the Game Over period. In the
   final seconds of the hour it runs down to silence and the next match begins again.
   Every setting is worked out from the clock, so everyone listening hears the same thing
   at the same time. Each warhead that lands in the match is heard as a distant thud.
   Sound is on by default and starts at the visitor's first touch, click or key press;
   the sound button mutes it. */
(function () {
  'use strict';
  var HOUR = 3600000, LANGS = ['de', 'en', 'ru'];
  var MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---- the score: every setting as a curve over the minutes of the match ---- */
  var SCORE = {
    master:  [[0, 0], [0.4, 0.2], [6, 0.24], [12, 0.3], [20, 0.38], [28, 0.48], [50, 0.72], [56, 1], [59.6, 1], [59.95, 0], [60, 0]],
    sub:     [[0, 0.30], [28, 0.36], [56, 0.5]],
    rootSaw: [[0, 0.06], [28, 0.12], [56, 0.3]],
    fifth:   [[0, 0], [5, 0], [12, 0.2], [56, 0.3]],
    octave:  [[0, 0], [11, 0], [20, 0.08], [56, 0.2]],
    second:  [[0, 0], [19, 0], [28, 0.07], [50, 0.14], [56, 0.24]],      /* a semitone above the root */
    tritone: [[0, 0], [27, 0], [34, 0.06], [50, 0.12], [56, 0.22]],
    cluster: [[0, 0], [30, 0], [50, 0.03], [56, 0.09]],
    cutoff:  [[0, 110], [6, 140], [12, 180], [20, 250], [28, 380], [50, 900], [56, 2600], [59.6, 3200], [60, 80]],
    drive:   [[0, 1], [28, 1.3], [50, 2.2], [56, 5]],
    pulseHz: [[0, 0.05], [12, 0.08], [20, 0.15], [28, 0.4], [50, 1.1], [56, 3.5], [59.6, 7]],
    pulse:   [[0, 0.1], [20, 0.2], [28, 0.3], [50, 0.4], [56, 0.6]],
    wobble:  [[0, 2], [28, 6], [50, 18], [56, 60], [59.6, 90]],          /* cents of pitch drift */
    fall:    [[0, 0], [59.6, 0], [60, -2400]],                           /* the run-down at the end */
    rumble:  [[0, 0.08], [28, 0.14], [50, 0.24], [56, 0.42]],
    hiss:    [[0, 0.02], [20, 0.035], [28, 0.05], [50, 0.09], [56, 0.2]],
    crackle: [[0, 0.05], [28, 0.12], [50, 0.2], [56, 0.36]],
    crackHz: [[0, 0.7], [28, 1], [50, 1.6], [56, 3]],
    riser:   [[0, 0], [40, 0], [50, 0.05], [56, 0.16], [59.6, 0.2]],
    traffic: [[0, 0], [47, 0], [50, 0.12], [56, 0.6], [59.4, 0.7], [59.7, 0]]   /* chance of a radio fragment per 4 s */
  };
  function at(name, min) {
    var c = SCORE[name], i;
    if (min <= c[0][0]) return c[0][1];
    for (i = 1; i < c.length; i++) if (min <= c[i][0]) return c[i - 1][1] + (c[i][1] - c[i - 1][1]) * (min - c[i - 1][0]) / (c[i][0] - c[i - 1][0]);
    return c[c.length - 1][1];
  }

  function noiseBuffer(ctx, seconds, brown) {
    var n = Math.floor(ctx.sampleRate * seconds), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), last = 0, r = rng(977);
    for (var i = 0; i < n; i++) { var w = r() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function crackleBuffer(ctx, seconds) {
    var n = Math.floor(ctx.sampleRate * seconds), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), r = rng(31337), i = 0;
    while (i < n) { i += Math.floor(ctx.sampleRate * (0.03 + r() * r() * 1.1)); var len = 20 + ((r() * 160) | 0), amp = 0.25 + r() * 0.75; for (var k = 0; k < len && i + k < n; k++) d[i + k] = (r() * 2 - 1) * amp * (1 - k / len); }
    return b;
  }
  function impulse(ctx, seconds) {
    var n = Math.floor(ctx.sampleRate * seconds), b = ctx.createBuffer(2, n, ctx.sampleRate), r = rng(4242);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }
  function shaper(ctx, k, n) { var ws = ctx.createWaveShaper(), c = new Float32Array(n); for (var i = 0; i < n; i++) c[i] = Math.tanh(k * (2 * i / (n - 1) - 1)); ws.curve = c; return ws; }

  /* ---- output: a mute gain and a compressor; `mix` (the drone) and `ev` (radio traffic,
     heard through a narrow, overdriven, fading radio) both feed a long reverb ---- */
  function bus(ctx) {
    var vol = ctx.createGain(); vol.gain.value = 0;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -9; comp.ratio.value = 4;
    var mix = ctx.createGain(), verb = ctx.createConvolver(), wet = ctx.createGain();
    verb.buffer = impulse(ctx, 3.2); wet.gain.value = 0.4;
    var ev = ctx.createGain(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), pre = ctx.createGain(), ws = shaper(ctx, 2.8, 513), post = ctx.createGain(), fade = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 330; hp.Q.value = 0.9; lp.type = 'lowpass'; lp.frequency.value = 3100; lp.Q.value = 1.1; pre.gain.value = 2.6; post.gain.value = 0.3; fade.gain.value = 0.72;
    [[0.19, 0.2], [0.53, 0.08], [7.1, 0.06]].forEach(function (f) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f[0]; g.gain.value = f[1]; o.connect(g); g.connect(fade.gain); o.start(0); });
    ev.connect(hp); hp.connect(lp); lp.connect(pre); pre.connect(ws); ws.connect(post); post.connect(fade); fade.connect(mix);
    mix.connect(vol); mix.connect(verb); verb.connect(wet); wet.connect(vol);
    vol.connect(comp); comp.connect(ctx.destination);
    return { vol: vol, mix: mix, ev: ev, white: noiseBuffer(ctx, 2, false), brown: noiseBuffer(ctx, 4, true), crackle: crackleBuffer(ctx, 11) };
  }

  /* ---- the drone ---- */
  function engine(ctx, B) {
    var t = ctx.currentTime, E = { ctx: ctx, B: B, set: [], oscs: [], voice: null, slot: -1, hits: {}, hitSeed: null };
    function gain(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
    function bind(param, name, scale) { E.set.push({ p: param, n: name, f: scale }); }
    var master = gain(0), trem = gain(1), lp = ctx.createBiquadFilter(), pre = gain(1), post = gain(1), ws = shaper(ctx, 1, 1025), sum = gain(1);
    lp.type = 'lowpass'; lp.frequency.value = 110; lp.Q.value = 1.4;
    sum.connect(pre); pre.connect(ws); ws.connect(post); post.connect(lp); lp.connect(trem); trem.connect(master); master.connect(B.mix);
    bind(master.gain, 'master'); bind(lp.frequency, 'cutoff'); bind(pre.gain, 'drive'); bind(post.gain, 'drive', function (d) { return 1 / Math.pow(d, 0.3); });
    /* slow pitch drift: two shared wobbles, pulling neighbouring voices in opposite directions */
    var wob = [0.17, 0.29].map(function (hz, i) { var o = ctx.createOscillator(), g = gain(0); o.frequency.value = hz; o.connect(g); o.start(t); bind(g.gain, 'wobble', function (c) { return i ? -c : c; }); return g; });
    function voice(freq, type, name, fixed) {
      var o = ctx.createOscillator(), g = gain(fixed || 0); o.type = type; o.frequency.value = freq; o.connect(g); g.connect(sum); wob[E.oscs.length % 2].connect(o.detune); o.start(t);
      E.oscs.push(o); bind(o.detune, 'fall'); if (name) bind(g.gain, name);
    }
    voice(27.5, 'sine', 'sub'); voice(55.27, 'sine', null, 0.5); voice(55, 'sawtooth', 'rootSaw');
    voice(82.41, 'sine', 'fifth'); voice(82.2, 'sawtooth', 'fifth', 0); E.set[E.set.length - 1].f = function (v) { return v * 0.3; };
    voice(110.4, 'triangle', 'octave'); voice(58.27, 'sawtooth', 'second'); voice(77.78, 'sawtooth', 'tritone');
    [233.1, 311.1, 466.2, 622.3].forEach(function (f) { voice(f, 'sawtooth', 'cluster'); });
    /* the pulse: a slow swell that quickens into a racing throb */
    var pl = ctx.createOscillator(), pg = gain(0); pl.frequency.value = 0.05; pl.connect(pg); pg.connect(trem.gain); pl.start(t);
    bind(pl.frequency, 'pulseHz'); bind(pg.gain, 'pulse', function (d) { return d / 2; }); bind(trem.gain, 'pulse', function (d) { return 1 - d / 2; });
    /* noise: low rumble, hiss and crackle, all thickening */
    function noise(buf, type, f, q, name, rate) {
      var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = gain(0); s.buffer = buf; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      s.connect(fl); fl.connect(g); g.connect(master); s.start(t); bind(g.gain, name); if (rate) bind(s.playbackRate, rate);
    }
    noise(B.brown, 'lowpass', 220, 0.5, 'rumble'); noise(B.white, 'bandpass', 2400, 0.5, 'hiss'); noise(B.crackle, 'bandpass', 2400, 0.6, 'crackle', 'crackHz');
    /* the riser: six tones an octave apart, each climbing for ever and fading out at the top */
    var rg = gain(0); rg.connect(master); bind(rg.gain, 'riser');
    E.riser = [0, 1, 2, 3, 4, 5].map(function () { var o = ctx.createOscillator(), g = gain(0); o.type = 'sawtooth'; o.connect(g); g.connect(rg); o.start(t); return { o: o, g: g, pos: -1 }; });
    return E;
  }

  /* bring every setting to its value for this moment of the clock */
  function apply(E, now, jump) {
    var ctx = E.ctx, t = ctx.currentTime, min = (now % HOUR) / 60000;
    E.set.forEach(function (s) {
      var v = at(s.n, min); if (s.f) v = s.f(v);
      if (jump) { s.p.cancelScheduledValues(t); s.p.setValueAtTime(v, t); } else s.p.setTargetAtTime(v, t, 0.8);
    });
    E.riser.forEach(function (r, i) {
      var pos = (now / 60000 + i / 6) % 1, f = 40 * Math.pow(2, pos * 6), a = Math.pow(Math.sin(Math.PI * pos), 2) * 0.5;
      if (jump || pos < r.pos) { r.o.frequency.cancelScheduledValues(t); r.o.frequency.setValueAtTime(f, t); } else r.o.frequency.setTargetAtTime(f, t, 0.3);
      r.g.gain.setTargetAtTime(a, t, 0.3); r.pos = pos;
    });
  }

  /* ---- warheads landing: a distant thud for each, heavier for the larger tolls ---- */
  function thud(E, t, weight) {
    var ctx = E.ctx, o = ctx.createOscillator(), g = ctx.createGain(), a = 0.2 + 0.35 * weight;
    o.frequency.setValueAtTime(74, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(a, t + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    o.connect(g); g.connect(E.B.mix); o.start(t); o.stop(t + 1.4);
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain(); s.buffer = E.B.brown; f.type = 'lowpass'; f.frequency.value = 320;
    ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(a * 0.9, t + 0.02); ng.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    s.connect(f); f.connect(ng); ng.connect(E.B.mix); s.start(t, (t * 1.7) % 2); s.stop(t + 1.9);
  }
  function impacts(E, now) {
    var M = window.DEFCON_MATCH, idx = Math.floor(now / HOUR); if (!M || !M.launches || M.seed !== ((idx * 2654435761) >>> 0)) return;
    if (E.hitSeed !== M.seed) { E.hitSeed = M.seed; E.hits = {}; }
    var min = (now - idx * HOUR) / 60000;
    M.launches.forEach(function (L) {
      if (L.abm || E.hits[L.id]) return;
      var w = (L.t0 + L.fl - min) * 60; if (w <= 0 || w > 0.8) return;
      E.hits[L.id] = 1; thud(E, E.ctx.currentTime + w, Math.min(1, (L.kills || 0) / 12));
    });
  }

  /* ---- radio traffic in the climax: morse and numbers-station voices, overlapping ---- */
  function morse(ctx, B, t, seed, text) {
    var r = rng(seed), f = 540 + ((r() * 7) | 0) * 45, u = 0.05 + r() * 0.025, x = t;
    var o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter(), v = ctx.createGain();
    o.frequency.value = f; g.gain.value = 0; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 5; v.gain.value = 0.15;
    o.connect(g); g.connect(bp); bp.connect(v); v.connect(B.ev);
    text.toUpperCase().split('').forEach(function (ch) {
      if (ch === ' ') { x += 4 * u; return; }
      var code = MORSE[ch]; if (!code) return;
      code.split('').forEach(function (s) { var d = s === '.' ? u : 3 * u; g.gain.setValueAtTime(0, x); g.gain.linearRampToValueAtTime(1, x + 0.005); g.gain.setValueAtTime(1, x + d - 0.005); g.gain.linearRampToValueAtTime(0, x + d); x += d + u; });
      x += 2 * u;
    });
    o.start(t); o.stop(x + 0.1);
    return x - t;
  }
  function speak(ctx, B, t, seed, voice) {
    var r = rng(seed), n = 3 + ((r() * 4) | 0), rate = 0.82 + r() * 0.36, x = t, any = false;
    var bp = ctx.createBiquadFilter(), v = ctx.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.7; v.gain.value = 0.36; bp.connect(v); v.connect(B.ev);
    for (var i = 0; i < n; i++) { var b = voice[(r() * 10) | 0]; if (!b) continue; var s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate; s.connect(bp); s.start(x); x += b.duration / rate + 0.1; any = true; }
    return any;
  }
  function traffic(E, now) {
    var slot = Math.floor(now / 4000), min;
    for (var k = Math.max(slot, E.slot + 1); k <= slot + 1; k++) {
      var r = rng(Math.imul(k ^ 0x9E3779B9, 2246822519) >>> 0), at0 = k * 4000 + r() * 3500, wait = (at0 - now) / 1000;
      if (wait <= 0) { E.slot = k; continue; }
      if (wait > 1.5) break;
      E.slot = k; min = (at0 % HOUR) / 60000;
      if (r() >= at('traffic', min)) continue;
      var t = E.ctx.currentTime + wait, seed = (r() * 4294967296) >>> 0, lang = LANGS[(r() * 3) | 0], L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', txt = '';
      if (r() < 0.65 && E.voice && E.voice[lang] && speak(E.ctx, E.B, t, seed, E.voice[lang])) continue;
      for (var i = 3 + ((r() * 4) | 0); i > 0; i--) txt += L[(r() * 36) | 0];
      morse(E.ctx, E.B, t, seed, txt);
    }
  }

  function loadVoice(ctx) {
    var out = {}, jobs = [];
    LANGS.forEach(function (l) { out[l] = []; for (var i = 0; i < 10; i++) (function (i) { jobs.push(fetch('soundtrack/voice/' + l + '/' + i + '.mp3').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (a) { return new Promise(function (ok, no) { ctx.decodeAudioData(a, ok, no); }); }).then(function (b) { out[l][i] = b; }).catch(function () { out[l][i] = null; })); })(i); });
    return Promise.all(jobs).then(function () { return out; });
  }
  /* one step of the clock: settings, landing warheads, radio traffic */
  function step(E, now, jump) { apply(E, now, jump); impacts(E, now); traffic(E, now); }
  window.DEFCON_AUDIO = { bus: bus, engine: engine, step: step, loadVoice: loadVoice, at: at, SCORE: SCORE };

  /* ---- live playback ---- */
  var btn = document.getElementById('snd'); if (!btn) return;
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, B = null, E = null, on = false, timer = null, fresh = true;
  function tick() { if (!on || ctx.state !== 'running') return; try { step(E, Date.now(), fresh); fresh = false; } catch (e) { /* keep the timer alive */ } }
  /* Sound is on by default. Browsers will not start audio until the visitor has touched,
     clicked or pressed a key, so it begins at the first such action anywhere on the page
     (or at once where the browser allows it). The button mutes; the choice is remembered. */
  function saved() { try { return localStorage.getItem('defcon-muted') === '1'; } catch (e) { return false; } }
  function save(m) { try { localStorage.setItem('defcon-muted', m ? '1' : '0'); } catch (e) {} }
  function ensure() { if (ctx) return; ctx = new AC(); B = bus(ctx); E = engine(ctx, B); loadVoice(ctx).then(function (v) { E.voice = v; }); }
  function play() {
    ensure(); var go = function () { if (!on || ctx.state !== 'running') return; B.vol.gain.cancelScheduledValues(ctx.currentTime); B.vol.gain.setTargetAtTime(0.9, ctx.currentTime, 0.6); if (!timer) timer = setInterval(tick, 500); tick(); };
    var pr = ctx.resume(); if (pr && pr.then) pr.then(go, function () {}); go();
  }
  function stop() { if (!ctx) return; B.vol.gain.cancelScheduledValues(ctx.currentTime); B.vol.gain.setTargetAtTime(0, ctx.currentTime, 0.2); setTimeout(function () { if (!on && ctx) { ctx.suspend(); fresh = true; } }, 1200); }
  if (!AC) { btn.disabled = true; return; }
  on = !saved(); btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.addEventListener('click', function () { on = !on; save(!on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); if (on) play(); else stop(); });
  function gesture(e) { if (!on || (ctx && ctx.state === 'running')) return; if (e.target && e.target.closest && e.target.closest('#snd')) return; play(); }
  ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'].forEach(function (n) { document.addEventListener(n, gesture, true); });
  if (on) { try { ensure(); if (ctx.state === 'running') play(); } catch (e) {} }
})();
