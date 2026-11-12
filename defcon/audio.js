/* Soundtrack for /defcon/: an endless drone with occasional morse, numbers-station
   and drum/horn events. Events fall on average every 80 seconds (standard deviation
   10 seconds) at moments worked out from the clock, so everyone listening hears the
   same thing at the same time. Nothing plays until
   the visitor presses the sound button. */
(function () {
  'use strict';
  var EVERY = 80, SD = 10, LANGS = ['de', 'en', 'ru'], PHASES = [[0, 5], [6, 4], [12, 3], [20, 2], [28, 1]];
  var MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function level(min) { var l = 5; PHASES.forEach(function (p) { if (min >= p[0]) l = p[1]; }); return l; }

  function noiseBuffer(ctx, seconds, brown) {
    var n = Math.floor(ctx.sampleRate * seconds), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), last = 0, r = rng(977);
    for (var i = 0; i < n; i++) { var w = r() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function impulse(ctx, seconds) {
    var n = Math.floor(ctx.sampleRate * seconds), b = ctx.createBuffer(2, n, ctx.sampleRate), r = rng(4242);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }

  /* ---- output bus: events go out dry and through a long reverb, as if heard from far away ---- */
  function bus(ctx) {
    var out = ctx.createGain(); out.gain.value = 0.9;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    var ev = ctx.createGain(), verb = ctx.createConvolver(), wet = ctx.createGain();
    verb.buffer = impulse(ctx, 3.2); wet.gain.value = 0.42;
    ev.connect(out); ev.connect(verb); verb.connect(wet); wet.connect(out);
    out.connect(comp); comp.connect(ctx.destination);
    return { out: out, ev: ev, white: noiseBuffer(ctx, 2, false), brown: noiseBuffer(ctx, 4, true) };
  }

  /* ---- the drone ---- */
  function drone(ctx, B, t) {
    var g = ctx.createGain(); g.gain.value = 0;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 150; lp.Q.value = 1.4;
    [[55, 'sawtooth', 0.10], [55.27, 'sine', 0.50], [82.41, 'sine', 0.20], [110.4, 'triangle', 0.05], [27.5, 'sine', 0.32], [164.2, 'sine', 0.025]].forEach(function (v) {
      var o = ctx.createOscillator(), og = ctx.createGain(); o.type = v[1]; o.frequency.value = v[0]; og.gain.value = v[2]; o.connect(og); og.connect(lp); o.start(t);
    });
    var to = ctx.createOscillator(), tens = ctx.createGain(); to.type = 'sawtooth'; to.frequency.value = 58.27; tens.gain.value = 0; to.connect(tens); tens.connect(lp); to.start(t);
    var ns = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); ns.buffer = B.brown; ns.loop = true; nf.type = 'bandpass'; nf.frequency.value = 240; nf.Q.value = 0.5; ng.gain.value = 0.10; ns.connect(nf); nf.connect(ng); ng.connect(g); ns.start(t);
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.047; lg.gain.value = 45; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t);
    var lfo2 = ctx.createOscillator(), lg2 = ctx.createGain(), sw = ctx.createGain(); lfo2.frequency.value = 0.083; lg2.gain.value = 0.12; sw.gain.value = 0.88; lfo2.connect(lg2); lg2.connect(sw.gain); lfo2.start(t);
    lp.connect(sw); sw.connect(g); g.connect(B.out);
    return { gain: g, lp: lp, tens: tens };
  }
  function tension(D, lv, t) { var k = (5 - lv) / 4; D.lp.frequency.setTargetAtTime(150 + k * 250, t, 4); D.tens.gain.setTargetAtTime(k * k * 0.085, t, 4); }

  /* ---- morse ---- */
  function morseText(r, lv, match) {
    var L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', pick = function (n) { var s = ''; for (var i = 0; i < n; i++) s += L[(r() * 26) | 0]; return s; }, x = r();
    return x < 0.25 ? 'DEFCON ' + lv : x < 0.45 ? 'CQ CQ DE ' + pick(3) + ((r() * 10) | 0) : x < 0.65 ? pick(5) + ' ' + pick(5) : x < 0.82 ? 'EAM ' + pick(3) + ((r() * 900 + 100) | 0) : 'NR ' + match;
  }
  function morse(ctx, B, t, seed, text) {
    var r = rng(seed), f = 540 + ((r() * 7) | 0) * 45, u = 0.056 + r() * 0.02, x = t;
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
    var ns = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); ns.buffer = B.white; ns.loop = true; nf.type = 'bandpass'; nf.frequency.value = f * 1.5; nf.Q.value = 0.8; ng.gain.value = 0;
    ng.gain.setValueAtTime(0, t - 0.3); ng.gain.linearRampToValueAtTime(0.02, t); ng.gain.setValueAtTime(0.02, x); ng.gain.linearRampToValueAtTime(0, x + 0.4);
    ns.connect(nf); nf.connect(ng); ng.connect(B.ev); ns.start(Math.max(0, t - 0.3)); ns.stop(x + 0.5);
    return x - t;
  }

  /* ---- numbers station ---- */
  function shortwave(ctx, B, t, end) {
    var inp = ctx.createGain(), bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), ws = ctx.createWaveShaper(), am = ctx.createGain(), v = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.7; hp.type = 'highpass'; hp.frequency.value = 380;
    var c = new Float32Array(257); for (var i = 0; i < 257; i++) { var xx = i / 128 - 1; c[i] = Math.tanh(3 * xx); } ws.curve = c;
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 6.3; lg.gain.value = 0.22; am.gain.value = 0.78; lfo.connect(lg); lg.connect(am.gain); lfo.start(t); lfo.stop(end + 0.5);
    v.gain.value = 0.34; inp.connect(bp); bp.connect(hp); hp.connect(ws); ws.connect(am); am.connect(v); v.connect(B.ev);
    var ns = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); ns.buffer = B.white; ns.loop = true; nf.type = 'bandpass'; nf.frequency.value = 2600; nf.Q.value = 0.4; ng.gain.value = 0;
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.03, t + 0.3); ng.gain.setValueAtTime(0.03, end); ng.gain.linearRampToValueAtTime(0, end + 0.5);
    ns.connect(nf); nf.connect(ng); ng.connect(B.ev); ns.start(t); ns.stop(end + 0.6);
    return inp;
  }
  function numbers(ctx, B, t, seed, voices, lang) {
    var r = rng(seed), scale = [392, 440, 494, 523.3, 587.3, 659.3], tune = [], i, x = t + 0.4;
    for (i = 0; i < 5; i++) tune.push(scale[(r() * scale.length) | 0]);
    var digits = []; for (i = 0; i < 10; i++) digits.push((r() * 10) | 0);
    var pick = LANGS[(r() * LANGS.length) | 0], voice = voices && voices[lang || pick], RATE = 0.94, talk = 0.55;
    digits.forEach(function (d) { talk += voice && voice[d] ? voice[d].duration / RATE + 0.13 : 0.4; });
    var inp = shortwave(ctx, B, t, t + 0.4 + 2 * (5 * 0.26 + 0.35) + 0.3 + talk + 0.3);
    for (var rep = 0; rep < 2; rep++) {
      tune.forEach(function (f) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, x); g.gain.linearRampToValueAtTime(0.5, x + 0.015); g.gain.exponentialRampToValueAtTime(0.02, x + 0.24); o.connect(g); g.connect(inp); o.start(x); o.stop(x + 0.26); x += 0.26; });
      x += 0.35;
    }
    x += 0.3;
    digits.forEach(function (d, k) {
      if (voice && voice[d]) { var sb = ctx.createBufferSource(); sb.buffer = voice[d]; sb.playbackRate.value = RATE; sb.connect(inp); sb.start(x); x += voice[d].duration / RATE + 0.13; }
      else { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 300 + d * 60; g.gain.setValueAtTime(0.4, x); g.gain.setValueAtTime(0, x + 0.2); o.connect(g); g.connect(inp); o.start(x); o.stop(x + 0.22); x += 0.4; }
      if (k === 4) x += 0.55;
    });
    return x - t;
  }

  /* ---- drums and horns ---- */
  function snare(ctx, B, dest, t, acc) {
    var s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = B.white; hp.type = 'highpass'; hp.frequency.value = 1100;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.55 * acc, t + 0.002); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07 + 0.07 * acc);
    s.connect(hp); hp.connect(g); g.connect(dest); s.start(t, (t * 7.3) % 1.5); s.stop(t + 0.2);
    var o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.05);
    og.gain.setValueAtTime(0.25 * acc, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08); o.connect(og); og.connect(dest); o.start(t); o.stop(t + 0.1);
  }
  function kick(ctx, dest, t) {
    var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.34); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.4);
  }
  function drums(ctx, B, t, seed, bars) {
    var r = rng(seed), beat = 60 / (100 + ((r() * 4) | 0) * 6), s = beat / 4, out = ctx.createGain(), lp = ctx.createBiquadFilter();
    out.gain.value = 0.42; lp.type = 'lowpass'; lp.frequency.value = 4200; out.connect(lp); lp.connect(B.ev);
    var pats = ['X.xxX.xxX.xxXxxx', 'X..xX..xXxxxX.x.', 'X.xxX.xxXrrrX...'], n = bars || 2;
    for (var b = 0; b < n; b++) {
      var p = pats[(r() * pats.length) | 0], t0 = t + b * 4 * beat;
      kick(ctx, out, t0); kick(ctx, out, t0 + 2 * beat);
      for (var i = 0; i < 16; i++) { var c = p[i], x = t0 + i * s; if (c === 'X') snare(ctx, B, out, x, 1); else if (c === 'x') snare(ctx, B, out, x, 0.55); else if (c === 'r') { snare(ctx, B, out, x, 0.4 + i * 0.03); snare(ctx, B, out, x + s / 2, 0.45 + i * 0.03); } }
    }
    snare(ctx, B, out, t + n * 4 * beat, 1); kick(ctx, out, t + n * 4 * beat);
    return { dur: n * 4 * beat + 0.4, beat: beat };
  }
  function horns(ctx, B, t, seed, beat) {
    var r = rng(seed), base = [98, 110, 87.3][(r() * 3) | 0], H = [base * 2, base * 3, base * 4, base * 5, base * 6];
    var phrases = [[[0, 1], [0, 0.5], [1, 0.5], [2, 2.5]], [[2, 1], [1, 1], [0, 2.5]], [[0, 0.75], [0, 0.25], [1, 1], [2, 1], [1, 2.5]], [[1, 0.5], [1, 0.5], [2, 1], [3, 1], [2, 2.5]]];
    var ph = phrases[(r() * phrases.length) | 0], out = ctx.createGain(), x = t; out.gain.value = 0.17; out.connect(B.ev);
    beat = beat || 0.56;
    ph.forEach(function (nt) {
      var f = H[nt[0]], d = nt[1] * beat, lp = ctx.createBiquadFilter(), g = ctx.createGain(); lp.type = 'lowpass'; lp.Q.value = 0.9;
      lp.frequency.setValueAtTime(350, x); lp.frequency.linearRampToValueAtTime(1500, x + 0.09); lp.frequency.linearRampToValueAtTime(950, x + Math.max(0.2, d));
      g.gain.setValueAtTime(0.0001, x); g.gain.linearRampToValueAtTime(1, x + 0.06); g.gain.setValueAtTime(1, x + Math.max(0.08, d - 0.08)); g.gain.linearRampToValueAtTime(0.0001, x + d + 0.12);
      [[1, -7], [1, 6], [0.5, 0], [2, 3]].forEach(function (v, k) { var o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = f * v[0]; o.detune.value = v[1]; og.gain.value = k < 2 ? 0.5 : k === 2 ? 0.35 : 0.08; o.connect(og); og.connect(lp); o.start(x); o.stop(x + d + 0.15); });
      lp.connect(g); g.connect(out); x += d;
    });
    return x - t;
  }
  function march(ctx, B, t, seed) {
    var r = rng(seed), x = r();
    if (x < 0.3) return drums(ctx, B, t, seed + 1, 2).dur;
    if (x < 0.5) return horns(ctx, B, t, seed + 2, 0.56);
    var d = drums(ctx, B, t, seed + 1, 3); horns(ctx, B, t + 4 * d.beat, seed + 2, d.beat); return d.dur;
  }

  function loadVoice(ctx) {
    var out = {}, jobs = [];
    LANGS.forEach(function (l) { out[l] = []; for (var i = 0; i < 10; i++) (function (i) { jobs.push(fetch('voice/' + l + '/' + i + '.mp3').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (a) { return new Promise(function (ok, no) { ctx.decodeAudioData(a, ok, no); }); }).then(function (b) { out[l][i] = b; }).catch(function () { out[l][i] = null; })); })(i); });
    return Promise.all(jobs).then(function () { return out; });
  }
  /* Event k happens at k * 80 s plus a jitter drawn from a normal distribution with standard
     deviation 10 / sqrt(2). The gap between neighbours then has mean 80 s and standard
     deviation 10 s, and any event can be worked out on its own, the same for everyone. */
  function eventAt(k) {
    var r = rng(Math.imul(k ^ 0x9E3779B9, 2246822519) >>> 0), u = Math.max(r(), 1e-9), v = r();
    var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v), j = Math.max(-25, Math.min(25, z * SD / Math.SQRT2)), x = r();
    return { k: k, time: (k * EVERY + EVERY / 2 + j) * 1000, kind: x < 0.40 ? 'morse' : x < 0.70 ? 'numbers' : 'march', seed: (r() * 4294967296) >>> 0 };
  }
  window.DEFCON_AUDIO = { bus: bus, drone: drone, tension: tension, morse: morse, morseText: morseText, numbers: numbers, march: march, drums: drums, horns: horns, loadVoice: loadVoice, eventAt: eventAt, rng: rng, EVERY: EVERY };

  /* ---- live playback ---- */
  var btn = document.getElementById('snd'); if (!btn) return;
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, B = null, D = null, voice = null, on = false, lastK = -1, timer = null;
  function tick() {
    if (!on) return;
    var now = Date.now(), lv = level((now % 3600000) / 60000); tension(D, lv, ctx.currentTime);
    var k0 = Math.floor(now / (EVERY * 1000));
    for (var k = k0 - 1; k <= k0 + 1; k++) {
      if (k <= lastK) continue;
      var e = eventAt(k), wait = (e.time - now) / 1000;
      if (wait <= 0) { lastK = k; continue; }            /* already past: never play late */
      if (wait > 1.5) break;                             /* not yet */
      lastK = k; var t = ctx.currentTime + wait;
      if (e.kind === 'morse') morse(ctx, B, t, e.seed, morseText(rng(e.seed ^ 0x55), lv, Math.floor(now / 3600000) % 100000));
      else if (e.kind === 'numbers') numbers(ctx, B, t, e.seed, voice);
      else march(ctx, B, t, e.seed);
    }
  }
  btn.addEventListener('click', function () {
    if (!AC) { btn.disabled = true; return; }
    if (!ctx) { ctx = new AC(); B = bus(ctx); D = drone(ctx, B, ctx.currentTime); loadVoice(ctx).then(function (v) { voice = v; }); }
    on = !on; btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) { ctx.resume(); D.gain.gain.cancelScheduledValues(ctx.currentTime); D.gain.gain.setTargetAtTime(0.55, ctx.currentTime, 1.2); B.ev.gain.setTargetAtTime(1, ctx.currentTime, 0.2); if (!timer) timer = setInterval(tick, 500); tick(); }
    else { D.gain.gain.cancelScheduledValues(ctx.currentTime); D.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2); B.ev.gain.setTargetAtTime(0, ctx.currentTime, 0.2); setTimeout(function () { if (!on && ctx) ctx.suspend(); }, 1200); }
  });
})();
