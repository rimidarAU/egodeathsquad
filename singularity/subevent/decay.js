(function () {
  var root = document.documentElement;
  var N = 7;
  var seen = 0; /* ratchet: what has been seen cannot be unseen */

  /* ---- per-visit seed: no two readers get the same page ---- */
  var seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---- text corruption ---- */
  var GLYPH = { o:'ꙮ', O:'Ꙩ', a:'α', e:'ε', i:'ι', t:'†', s:'ſ', n:'и', h:'ħ', y:'γ', u:'υ', r:'ɾ', l:'ł', d:'∂', c:'ͼ', k:'ϰ', m:'ɱ', g:'ƍ', w:'ω', p:'ρ', f:'ϝ', b:'ƅ', v:'ѵ' };
  var VOID = ['▯','▯','▯','⛧','∴','⊙','𓂀','ꙮ'];
  var nodes = [];
  function collect() {
    var sel = document.querySelectorAll('[data-corrupt]');
    for (var i = 0; i < sel.length; i++) {
      var depth = parseFloat(sel[i].getAttribute('data-corrupt')) || 1;
      var walker = document.createTreeWalker(sel[i], NodeFilter.SHOW_TEXT, null);
      var n;
      while ((n = walker.nextNode())) {
        if (!n.nodeValue.trim()) continue;
        var tag = n.parentNode.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SUB') continue;
        nodes.push({ n: n, src: n.nodeValue, depth: depth, salt: (seed + nodes.length * 7919) >>> 0 });
      }
    }
  }
  function corrupt(rec, p) {
    /* intensity rises with how far the reader has gone and how deep this text sits */
    var k = Math.max(0, p - 0.22) * rec.depth;
    if (k <= 0) { if (rec.n.nodeValue !== rec.src) rec.n.nodeValue = rec.src; return; }
    var r = rng(rec.salt), out = '', s = rec.src, i, ch, x;
    var swap = Math.min(0.42, k * k * 0.9), voidp = Math.min(0.14, Math.max(0, k - 0.55) * 0.5), dup = Math.min(0.08, Math.max(0, k - 0.7) * 0.4);
    for (i = 0; i < s.length; i++) {
      ch = s[i]; x = r();
      if (/\s/.test(ch)) { out += ch; if (dup && r() < dup) out += (r() < .5 ? 'ꙮ ' : '⛧ '); continue; }
      if (x < voidp) out += VOID[(r() * VOID.length) | 0];
      else if (x < voidp + swap && GLYPH[ch]) out += GLYPH[ch];
      else if (x < voidp + swap + swap * 0.3 && GLYPH[ch.toLowerCase()]) out += GLYPH[ch.toLowerCase()].toUpperCase();
      else out += ch;
    }
    if (rec.n.nodeValue !== out) rec.n.nodeValue = out;
  }
  var pending = false;
  function recorrupt() {
    if (pending) return; pending = true;
    requestAnimationFrame(function () { pending = false; for (var i = 0; i < nodes.length; i++) corrupt(nodes[i], seen); });
  }

  /* ---- drone ---- */
  var audio = null;
  function buildAudio() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    var ctx = new AC();
    var master = ctx.createGain(); master.gain.value = 0;
    var filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 220; filt.Q.value = 2;
    var trem = ctx.createGain(); trem.gain.value = 1;
    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.12;
    var lfoG = ctx.createGain(); lfoG.gain.value = 0.15;
    lfo.connect(lfoG); lfoG.connect(trem.gain);
    var oscs = [];
    function osc(type, f, g) { var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; var gn = ctx.createGain(); gn.gain.value = g; o.connect(gn); gn.connect(filt); o.start(); oscs.push({ o: o, g: gn, f: f }); }
    osc('sine', 55, 0.6); osc('sawtooth', 55.4, 0.08); osc('sine', 82.4, 0.25); osc('triangle', 110.6, 0.0); osc('sawtooth', 164.8, 0.0);
    /* breath of noise */
    var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    var noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    var nG = ctx.createGain(); nG.gain.value = 0; noise.connect(nG); nG.connect(filt); noise.start();
    filt.connect(trem); trem.connect(master); master.connect(ctx.destination); lfo.start();
    return { ctx: ctx, master: master, filt: filt, lfo: lfo, lfoG: lfoG, oscs: oscs, nG: nG };
  }
  function tuneAudio(p) {
    if (!audio) return;
    var t = audio.ctx.currentTime, ramp = 0.6;
    var det = p * p * 900;                                /* cents of drift at the end */
    audio.oscs[1].o.detune.setTargetAtTime(det * 0.4, t, ramp);
    audio.oscs[2].o.detune.setTargetAtTime(-det * 0.25, t, ramp);
    audio.oscs[3].g.gain.setTargetAtTime(Math.max(0, p - 0.35) * 0.35, t, ramp);
    audio.oscs[3].o.detune.setTargetAtTime(det, t, ramp);
    audio.oscs[4].g.gain.setTargetAtTime(Math.max(0, p - 0.7) * 0.25, t, ramp);
    audio.oscs[4].o.detune.setTargetAtTime(-det * 1.3, t, ramp);
    audio.filt.frequency.setTargetAtTime(220 + p * p * 2600, t, ramp);
    audio.filt.Q.setTargetAtTime(2 + p * 10, t, ramp);
    audio.lfo.frequency.setTargetAtTime(0.12 + p * p * 7, t, ramp);
    audio.lfoG.gain.setTargetAtTime(0.15 + p * 0.6, t, ramp);
    audio.nG.gain.setTargetAtTime(Math.max(0, p - 0.5) * 0.5, t, ramp);
  }
  var btn = document.getElementById('snd');
  var on = false;
  function setLabel() { if (!btn) return; btn.textContent = on ? '☉ sound on' : '☉ sound'; btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  if (btn) btn.addEventListener('click', function () {
    if (!audio) { audio = buildAudio(); if (!audio) { btn.textContent = 'no sound here'; return; } }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    on = !on;
    audio.master.gain.setTargetAtTime(on ? 0.09 : 0, audio.ctx.currentTime, on ? 2.5 : 0.8);
    tuneAudio(seen); setLabel();
  });

  /* ---- main ---- */
  function update() {
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, window.scrollY / max));
    if (p > seen) { seen = p; recorrupt(); tuneAudio(seen); }
    root.style.setProperty('--decay', seen.toFixed(4));
    for (var i = 1; i <= N; i++) root.classList.toggle('d' + i, seen >= i / (N + 1));
  }
  collect();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
