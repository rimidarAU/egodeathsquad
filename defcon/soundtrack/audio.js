/* Soundtrack for /defcon/: one drone that follows the match clock (one match per UTC hour),
   so everyone listening hears the same thing at the same time. The hour repeats without a
   break: it ends on the same drone it begins with.
     0:00 - 20:00  the basic drone
    20:00 - 30:00  the drone grows
    30:00 - 45:00  the drone climbs to its maximum
    45:00 - 50:00  the drone held at maximum
    50:00 - 55:00  the drone sinks back to the basic drone
    55:00 - 60:00  the basic drone, with a few quiet, sad piano figures
   Excerpts of recorded radio broadcasts (soundtrack/intercut/) cut in from 5:00: rarely
   until 15:00, more and more often to 25:00 and 45:00, almost continuously from 45:00,
   and none is heard after 50:00.
   Each warhead that lands in the match is heard as a distant thud. Sound is on by default and starts at the visitor's
   first touch, click or key press; the sound button mutes it. */
(function () {
  'use strict';
  var HOUR = 3600000, CUTS = ['uk-1', 'uk-2', 'uk-3', 'su-1', 'su-2', 'su-3', 'us-1', 'us-2', 'us-3', 'ru-1', 'ru-2', 'ru-3'], CUT_SLOT = 30000, CUT_END = 50;
  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---- the score: every setting as a curve over the minutes of the match ---- */
  var SCORE = {
    master:  [[0, 0.22], [20, 0.22], [30, 0.45], [45, 1], [50, 1], [55, 0.22]],
    sub:     [[0, 0.30], [20, 0.30], [30, 0.36], [45, 0.5], [50, 0.5], [55, 0.30]],
    rootSaw: [[0, 0.06], [20, 0.06], [30, 0.12], [45, 0.3], [50, 0.3], [55, 0.06]],
    fifth:   [[0, 0], [20, 0], [30, 0.2], [45, 0.3], [50, 0.3], [55, 0]],
    octave:  [[0, 0], [22, 0], [30, 0.08], [45, 0.2], [50, 0.2], [55, 0]],
    second:  [[0, 0], [30, 0], [45, 0.24], [50, 0.24], [54, 0]],                  /* a semitone above the root */
    tritone: [[0, 0], [33, 0], [45, 0.22], [50, 0.22], [54, 0]],
    cluster: [[0, 0], [36, 0], [45, 0.09], [50, 0.09], [53, 0]],
    cutoff:  [[0, 120], [20, 120], [30, 380], [45, 2600], [50, 2600], [55, 120]],
    drive:   [[0, 1], [20, 1], [30, 1.3], [45, 5], [50, 5], [55, 1]],
    pulseHz: [[0, 0.06], [20, 0.06], [30, 0.4], [45, 3.5], [50, 3.5], [55, 0.06]],
    pulse:   [[0, 0.12], [20, 0.12], [30, 0.3], [45, 0.6], [50, 0.6], [55, 0.12]],
    wobble:  [[0, 2], [20, 2], [30, 6], [45, 60], [50, 60], [55, 2]],             /* cents of pitch drift */
    rumble:  [[0, 0.08], [20, 0.08], [30, 0.14], [45, 0.42], [50, 0.42], [55, 0.08]],
    hiss:    [[0, 0.02], [20, 0.02], [30, 0.05], [45, 0.2], [50, 0.2], [55, 0.02]],
    crackle: [[0, 0.05], [20, 0.05], [30, 0.12], [45, 0.36], [50, 0.36], [55, 0.05]],
    crackHz: [[0, 0.7], [20, 0.7], [30, 1], [45, 3], [50, 3], [55, 0.7]],
    riser:   [[0, 0], [32, 0], [45, 0.16], [50, 0.16], [53, 0]],
    intercut:  [[0, 0], [5, 0], [5.01, 0.1], [15, 0.1], [25, 0.45], [45, 1], [50, 1], [50.01, 0]],   /* chance of a broadcast excerpt per 30 s */
    intercut2: [[0, 0], [38, 0], [45, 0.8], [50, 0.8], [50.01, 0]],                                    /* a second, overlapping line of excerpts */
    cutGain:   [[0, 0.3], [15, 0.3], [25, 0.42], [45, 0.85]]
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

  /* ---- output: a mute gain and a compressor; `mix` feeds them directly and through a long
     reverb; `ev` (broadcast excerpts) reaches `mix` through a narrow, overdriven, fading radio ---- */
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
    var t = ctx.currentTime, E = { ctx: ctx, B: B, set: [], oscs: [], cut: null, cutSlot: [-1, -1], pnoT: 0, hits: {}, hitSeed: null };
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
      E.oscs.push(o); if (name) bind(g.gain, name);
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
    var M = window.DEFCON_MATCH, idx = Math.floor(now / HOUR); if (!M || !M.launches || M.idx !== idx) return;
    if (E.hitSeed !== M.seed) { E.hitSeed = M.seed; E.hits = {}; }
    var min = (now - idx * HOUR) / 60000;
    M.launches.forEach(function (L) {
      if (L.abm || E.hits[L.id]) return;
      var w = (L.t0 + L.fl - min) * 60; if (w <= 0 || w > 0.8) return;
      E.hits[L.id] = 1; thud(E, E.ctx.currentTime + w, Math.min(1, (L.kills || 0) / 12));
    });
  }

  /* ---- broadcast excerpts: two lines, each with at most one excerpt per 30 s slot, chosen
     by the clock and heard through the radio. A listener who arrives part-way through one
     hears it from that point. None is started that would still be playing at 50:00. ---- */
  function cutPlan(k, lane) {
    var r = rng(Math.imul(k ^ (lane ? 0x2F6B1A93 : 0x51ED270B), 2654435761) >>> 0);
    return { at0: k * CUT_SLOT + (lane ? 15000 : 0) + r() * 14000, p: r(), idx: (r() * CUTS.length) | 0 };
  }
  function intercuts(E, now) {
    if (!E.cut) return;
    var slot = Math.floor(now / CUT_SLOT);
    for (var lane = 0; lane < 2; lane++) for (var k = Math.max(slot - lane, E.cutSlot[lane] + 1); k <= slot + 1; k++) {
      var c = cutPlan(k, lane), wait = (c.at0 - now) / 1000;
      if (wait > 1.5) break;
      E.cutSlot[lane] = k;
      var min = (c.at0 % HOUR) / 60000; if (c.p >= at(lane ? 'intercut2' : 'intercut', min)) continue;
      var idx = c.idx; if (idx === cutPlan(k - 1, lane).idx) idx = (idx + 1) % CUTS.length;
      if (lane && (idx === cutPlan(k, 0).idx || idx === cutPlan(k + 1, 0).idx)) idx = (idx + 2) % CUTS.length;
      var b = E.cut[idx], off = wait < 0 ? -wait : 0;
      if (!b || min + b.duration / 60 > CUT_END || off > b.duration - 1.5) continue;
      var ctx = E.ctx, t = ctx.currentTime + Math.max(wait, 0), s = ctx.createBufferSource(), g = ctx.createGain(), v = at('cutGain', min);
      s.buffer = b; g.gain.setValueAtTime(off ? 0 : v, t); if (off) g.gain.linearRampToValueAtTime(v, t + 0.4);
      s.connect(g); g.connect(E.B.ev); s.start(t, off);
    }
  }
  function loadCuts(ctx) {
    return Promise.all(CUTS.map(function (n) { return fetch('soundtrack/intercut/' + n + '.mp3').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (a) { return new Promise(function (ok, no) { ctx.decodeAudioData(a, ok, no); }); }).catch(function () { return null; }); }));
  }

  /* ---- piano, 55:00 to the hour: a few short, quiet figures in A minor over the drone,
     about twenty seconds apart, the same every hour ---- */
  var PIANO_AT = 55 * 60000 + 10000, GAP = 20000, NOTE = 1300;
  var FIGS = [[76, 72, 69], [69, 72, 71], [45, 76, 74, 72, 69], [72, 71, 69], [41, 69, 65], [77, 76, 72], [45, 74, 72, 69], [64, 69, 72, 71], [41, 72, 69, 65], [76, 74, 72], [40, 71, 68, 64], [45, 72, 71, 69], [69, 64], [33, 57, 60, 64]];
  var PIANO = (function () {
    var out = [];
    FIGS.forEach(function (fig, i) {
      var last = i === FIGS.length - 1, k = 0;
      fig.forEach(function (m) { var low = m < 50; out.push([i * GAP + (last ? k * 90 : k * NOTE), m, last ? 0.2 : low ? 0.22 : 0.34]); if (!low || last) k++; });
    });
    return out;
  })();
  function pianoWave(ctx) { var h = [0, 1, 0.55, 0.32, 0.2, 0.12, 0.08, 0.05, 0.03]; return ctx.createPeriodicWave(new Float32Array(h.length), new Float32Array(h)); }
  function pianoNote(E, t, midi, vel) {
    var ctx = E.ctx, f = 440 * Math.pow(2, (midi - 69) / 12), tau = Math.min(3.2, 1.5 * Math.pow(261.6 / f, 0.45)), end = t + tau * 6;
    var lp = ctx.createBiquadFilter(), g = ctx.createGain(); lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(9000, f * 7), t); lp.frequency.setTargetAtTime(Math.min(4000, f * 2.2), t + 0.01, 0.5);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 0.3, t + 0.006); g.gain.setTargetAtTime(0, t + 0.006, tau);
    E.pwave = E.pwave || pianoWave(ctx);
    [-3, 3].forEach(function (c) { var o = ctx.createOscillator(); o.setPeriodicWave(E.pwave); o.frequency.value = f; o.detune.value = c; o.connect(lp); o.start(t); o.stop(end); });
    lp.connect(g); g.connect(E.B.mix);
  }
  function piano(E, now) {
    var h0 = Math.floor(now / HOUR) * HOUR + PIANO_AT, from = Math.max(now, E.pnoT), to = now + 1500;
    if (to > h0) PIANO.forEach(function (n) { var at0 = h0 + n[0]; if (at0 > from && at0 <= to) pianoNote(E, E.ctx.currentTime + (at0 - now) / 1000, n[1], n[2]); });
    E.pnoT = to;
  }

  /* one step of the clock: settings, landing warheads, broadcast excerpts, piano */
  function step(E, now, jump) { apply(E, now, jump); impacts(E, now); intercuts(E, now); piano(E, now); }
  window.DEFCON_AUDIO = { bus: bus, engine: engine, step: step, loadCuts: loadCuts, cutPlan: cutPlan, at: at, SCORE: SCORE, PIANO: PIANO };

  /* ---- live playback ---- */
  var btn = document.getElementById('snd'); if (!btn) return;
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, B = null, E = null, on = false, timer = null, fresh = true;
  function tick() { if (!on || ctx.state !== 'running') return; try { step(E, Date.now(), fresh); fresh = false; } catch (e) { /* keep the timer alive */ } }
  /* Sound is on by default. Browsers will not start audio until the visitor has touched,
     clicked or pressed a key, so it begins at the first such action anywhere on the page
     (or at once where the browser allows it). The button mutes; the choice is remembered. */
  function saved() { try { return localStorage.getItem('defcon-muted') === '1'; } catch (e) { return false; } }
  function save(m) { try { localStorage.setItem('defcon-muted', m ? '1' : '0'); } catch (e) {} }
  function ensure() { if (ctx) return; ctx = new AC(); B = bus(ctx); E = engine(ctx, B); loadCuts(ctx).then(function (c) { E.cut = c; }); }
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
