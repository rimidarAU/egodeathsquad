/* DEFCON-style match simulation, synchronised to the clock.
   One match per UTC hour. Everything is derived from (seed, elapsed), so every
   visitor sees the same match at the same moment and no server is needed. */
(function () {
  'use strict';
  var SVG = 'http://www.w3.org/2000/svg';
  var map = document.querySelector('.map'); if (!map) return;
  var layer = document.getElementById('sim'); if (!layer) return;
  var land = Array.prototype.slice.call(map.querySelectorAll('.land path'));
  function fit() { var portrait = window.matchMedia('(orientation: portrait) and (max-width: 820px)').matches; map.setAttribute('preserveAspectRatio', portrait ? 'xMidYMid meet' : 'xMidYMid slice'); }
  fit(); window.addEventListener('resize', fit); window.addEventListener('orientationchange', fit);
  var MATCH_MS = 3600000, MIN = 60;
  var PHASES = [[0, 5], [6, 4], [12, 3], [20, 2], [28, 1]];      /* minute, level */
  var END_MIN = 56;

  function X(lon) { return (lon + 180) * 4; }
  function Y(lat) { return (84 - lat) * 4; }
  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* Territories follow the game's six-way split, plus Australia carved out of Asia; not any political map. Populations are the game's abstraction: ~100M each. */
  var T = [
    { id: 'NA', name: 'North America', col: '#C8FF2E', land: [[-125, 28, -70, 55]], sea: [[-70, 25, -30, 45], [-160, 20, -125, 45]],
      cities: [['New York', -74.0, 40.7, 18], ['Los Angeles', -118.2, 34.0, 12], ['Chicago', -87.6, 41.9, 9], ['Houston', -95.4, 29.8, 7], ['Dallas', -96.8, 32.8, 7], ['Toronto', -79.4, 43.7, 6], ['Miami', -80.2, 25.8, 6], ['Atlanta', -84.4, 33.7, 6], ['Washington', -77.0, 38.9, 5], ['San Francisco', -122.4, 37.8, 5], ['Boston', -71.1, 42.4, 5], ['Phoenix', -112.1, 33.4, 5], ['Seattle', -122.3, 47.6, 4], ['Montreal', -73.6, 45.5, 4], ['Denver', -105.0, 39.7, 3]] },
    { id: 'LA', name: 'Latin America', col: '#FFD36B', land: [[-82, -35, -40, 20]], sea: [[-40, -30, -20, 0], [-100, -20, -80, 10]],
      cities: [['São Paulo', -46.6, -23.5, 22], ['Mexico City', -99.1, 19.4, 21], ['Buenos Aires', -58.4, -34.6, 15], ['Rio de Janeiro', -43.2, -22.9, 13], ['Lima', -77.0, -12.0, 10], ['Bogotá', -74.1, 4.7, 10], ['Santiago', -70.6, -33.4, 7], ['Caracas', -66.9, 10.5, 3]] },
    { id: 'EU', name: 'Europe', col: '#19E3FF', land: [[-10, 36, 30, 60]], sea: [[-30, 40, -8, 58], [5, 54, 20, 62]],
      cities: [['Istanbul', 29.0, 41.0, 15], ['London', -0.1, 51.5, 14], ['Paris', 2.4, 48.9, 12], ['Madrid', -3.7, 40.4, 7], ['Berlin', 13.4, 52.5, 6], ['Rome', 12.5, 41.9, 6], ['Milan', 9.2, 45.5, 5], ['Barcelona', 2.2, 41.4, 5], ['Athens', 23.7, 38.0, 4], ['Warsaw', 21.0, 52.2, 4], ['Amsterdam', 4.9, 52.4, 4], ['Vienna', 16.4, 48.2, 3], ['Stockholm', 18.1, 59.3, 3], ['Lisbon', -9.1, 38.7, 3], ['Munich', 11.6, 48.1, 3], ['Hamburg', 10.0, 53.6, 3], ['Manchester', -2.2, 53.5, 3]] },
    { id: 'RU', name: 'Russia', col: '#FF2D95', land: [[35, 48, 120, 64]], sea: [[145, 42, 175, 58], [25, 69, 60, 76]],
      cities: [['Moscow', 37.6, 55.8, 20], ['St Petersburg', 30.3, 59.9, 8], ['Kyiv', 30.5, 50.5, 7], ['Tashkent', 69.2, 41.3, 6], ['Novosibirsk', 82.9, 55.0, 5], ['Baku', 49.9, 40.4, 5], ['Yekaterinburg', 60.6, 56.8, 4], ['Almaty', 76.9, 43.2, 4], ['Minsk', 27.6, 53.9, 4], ['Kazan', 49.1, 55.8, 3], ['Nizhny Novgorod', 44.0, 56.3, 3], ['Samara', 50.2, 53.2, 3], ['Omsk', 73.4, 55.0, 3], ['Rostov', 39.7, 47.2, 3], ['Vladivostok', 131.9, 43.1, 3], ['Kharkiv', 36.2, 50.0, 3], ['Krasnoyarsk', 92.9, 56.0, 3], ['Chelyabinsk', 61.4, 55.2, 3], ['Perm', 56.2, 58.0, 3], ['Volgograd', 44.5, 48.7, 3]] },
    { id: 'AF', name: 'Africa', col: '#FF8A3D', land: [[-12, -28, 40, 30]], sea: [[-30, -20, -5, 10], [42, -30, 70, -5]],
      cities: [['Cairo', 31.2, 30.0, 21], ['Lagos', 3.4, 6.5, 15], ['Kinshasa', 15.3, -4.3, 15], ['Johannesburg', 28.0, -26.2, 10], ['Luanda', 13.2, -8.8, 8], ['Nairobi', 36.8, -1.3, 6], ['Khartoum', 32.5, 15.6, 6], ['Dar es Salaam', 39.3, -6.8, 6], ['Casablanca', -7.6, 33.6, 5], ['Addis Ababa', 38.7, 9.0, 5], ['Algiers', 3.1, 36.7, 4]] },
    { id: 'AS', name: 'Asia', col: '#EDEDE6', land: [[70, 10, 125, 45]], sea: [[132, 5, 170, 35], [60, -10, 95, 10]],
      cities: [['Tokyo', 139.7, 35.7, 14], ['Delhi', 77.2, 28.6, 12], ['Shanghai', 121.5, 31.2, 11], ['Beijing', 116.4, 39.9, 9], ['Mumbai', 72.9, 19.1, 9], ['Seoul', 127.0, 37.6, 6], ['Jakarta', 106.8, -6.2, 6], ['Manila', 121.0, 14.6, 5], ['Bangkok', 100.5, 13.8, 5], ['Karachi', 67.0, 24.9, 5], ['Dhaka', 90.4, 23.8, 5], ['Kolkata', 88.4, 22.6, 4], ['Tehran', 51.4, 35.7, 4], ['Hong Kong', 114.2, 22.3, 3]] },
    { id: 'AU', name: 'Australia', col: '#9D7BFF', land: [[115, -37, 152, -14]], sea: [[154, -42, 172, -12], [95, -40, 112, -14]],
      cities: [['Sydney', 151.2, -33.9, 28], ['Melbourne', 145.0, -37.8, 26], ['Brisbane', 153.0, -27.5, 14], ['Perth', 115.9, -31.95, 12], ['Adelaide', 138.6, -34.9, 8], ['Auckland', 174.8, -36.85, 8], ['Darwin', 130.8, -12.5, 4]] }
  ];

  function onLand(x, y) { var pt = map.createSVGPoint(); pt.x = x; pt.y = y; for (var i = 0; i < land.length; i++) if (land[i].isPointInFill(pt)) return true; return false; }
  function sample(r, boxes, wantLand, fallback) {
    for (var k = 0; k < 80; k++) {
      var b = boxes[(r() * boxes.length) | 0];
      var lon = b[0] + r() * (b[2] - b[0]), lat = b[1] + r() * (b[3] - b[1]);
      var x = X(lon), y = Y(lat);
      if (onLand(x, y) === wantLand) return [x, y];
    }
    return fallback;
  }

  /* ---------- build a match from a seed ---------- */
  function build(seed) {
    var r = rng(seed), M = { seed: seed, units: [], cities: [], launches: [], terr: [] };
    T.forEach(function (t, ti) {
      var tt = { id: t.id, name: t.name, col: t.col, kills: 0, lost: 0, cities: [], silos: [], subs: [] };
      t.cities.forEach(function (c) { var city = { t: ti, name: c[0], x: X(c[1]), y: Y(c[2]), pop: c[3], pop0: c[3], hits: 0 }; tt.cities.push(city); M.cities.push(city); });
      var nS = 4, nSub = 2, nR = 2;
      for (var i = 0; i < nS; i++) { var c0 = tt.cities[(r() * tt.cities.length) | 0]; var p = sample(r, t.land, true, [c0.x + (r() - .5) * 30, c0.y + (r() - .5) * 20]); var u = { t: ti, kind: 'silo', x: p[0], y: p[1], nukes: 10, born: r() * 5 }; tt.silos.push(u); M.units.push(u); }
      for (i = 0; i < nR; i++) { var c1 = tt.cities[(r() * tt.cities.length) | 0]; var p2 = sample(r, t.land, true, [c1.x + 10, c1.y - 10]); M.units.push({ t: ti, kind: 'radar', x: p2[0], y: p2[1], born: 1 + r() * 4 }); }
      for (i = 0; i < nSub; i++) { var p3 = sample(r, t.sea, false, [X(t.sea[0][0] + 2), Y(t.sea[0][1] + 2)]); var s = { t: ti, kind: 'sub', x: p3[0], y: p3[1], nukes: 5, born: 6 + r() * 5 }; tt.subs.push(s); M.units.push(s); }
      M.terr.push(tt);
    });
    /* 1980s Cold War alignment. NATO: North America, Europe, Australia. Warsaw Pact: Russia, Asia.
       Russia and Asia are always allies, so neither ever targets the other.
       The other two align themselves each match, weighted by the period's leanings;
       non-aligned territories hold fire unless struck, then answer the striker's bloc. */
    var W = { LA: [0.05, 0.95, 0], AF: [0, 0.25, 0.75] };  /* NATO, PACT, NON */
    M.terr.forEach(function (tt) {
      if (tt.id === 'NA' || tt.id === 'EU' || tt.id === 'AU') tt.bloc = 'NATO';
      else if (tt.id === 'RU' || tt.id === 'AS') tt.bloc = 'PACT';
      else { var w = W[tt.id], x = r(); tt.bloc = x < w[0] ? 'NATO' : x < w[0] + w[1] ? 'PACT' : 'NON'; }
    });
    var opp = { NATO: 'PACT', PACT: 'NATO' };
    M.terr.forEach(function (tt, ti) {
      tt.enemies = []; M.terr.forEach(function (o, j) { if (j !== ti && tt.bloc !== 'NON' && o.bloc === opp[tt.bloc]) tt.enemies.push(j); });
    });
    /* who goes first: NATO 40%, Warsaw Pact 35%, the non-aligned 25% (if any exist that hour;
       otherwise the 25% falls back to the blocs in 40:35 proportion) */
    var nons = []; M.terr.forEach(function (t, j) { if (t.bloc === 'NON') nons.push(j); });
    var x = r();
    M.initiator = x < 0.40 ? 'NATO' : x < 0.75 ? 'PACT' : nons.length ? 'NON' : (r() < 0.40 / 0.75 ? 'NATO' : 'PACT');
    var opp2 = { NATO: 'PACT', PACT: 'NATO' };
    var t_first = 28 + r() * 4, t_resp = t_first + 1.5 + r() * 1.5;
    var id = 0;
    function schedule(u, startMin, targetsIdx, count) {
      for (var k = 0; k < count; k++) {
        var en = M.terr[targetsIdx[(r() * targetsIdx.length) | 0]];
        var cs = en.cities, tot = 0; cs.forEach(function (c) { tot += c.pop0; });
        var pick = r() * tot, city = cs[0]; for (var j = 0; j < cs.length; j++) { pick -= cs[j].pop0; if (pick <= 0) { city = cs[j]; break; } }
        var t0 = Math.min(52, startMin + k * (0.6 + r() * 1.8) + r() * 5);
        var dxr = city.x - u.x, dx = Math.abs(dxr) > 720 ? dxr - Math.sign(dxr) * 1440 : dxr;
        var tx = u.x + dx, d = Math.hypot(dx, city.y - u.y);
        var fl = (0.9 + d / 400) * (u.kind === 'sub' ? 0.7 : 1);
        M.launches.push({ id: id++, from: u, to: city, tx: tx, wrap: tx < 0 || tx > 1440, t0: t0, fl: fl, abm: null });
      }
    }
    var members = function (b) { var o = []; M.terr.forEach(function (t, j) { if (t.bloc === b) o.push(j); }); return o; };
    if (M.initiator === 'NON') {
      /* the non-aligned pact strikes a bloc of its choosing; both blocs then launch on warning,
         and the struck bloc divides its fire between the other bloc and the non-aligned */
      M.nonTarget = r() < 0.5 ? 'NATO' : 'PACT';
      var tgN = members(M.nonTarget);
      M.terr.forEach(function (tt) { if (tt.bloc !== 'NON') return; tt.t0 = t_first; tt.strikesFirst = true; tt.silos.concat(tt.subs).forEach(function (u) { schedule(u, t_first, tgN, u.nukes); }); });
      M.terr.forEach(function (tt) {
        if (tt.bloc === 'NON') return;
        tt.t0 = t_resp + (tt.bloc === M.nonTarget ? 0 : 0.8);
        var en = members(opp2[tt.bloc]), split = tt.bloc === M.nonTarget;
        tt.silos.concat(tt.subs).forEach(function (u) {
          var toNon = split ? Math.round(u.nukes * 0.5) : 0;
          if (toNon) schedule(u, tt.t0, nons, toNon);
          if (en.length) schedule(u, tt.t0, en, u.nukes - toNon); else if (!toNon) schedule(u, tt.t0, nons, u.nukes);
        });
      });
    } else {
      M.terr.forEach(function (tt) { tt.t0 = tt.bloc === M.initiator ? t_first : tt.bloc === 'NON' ? null : t_resp; });
      /* pre-emption: a bloc may strike a non-aligned territory it suspects of leaning the other way */
      M.terr.forEach(function (tt, ti) {
        if (tt.bloc !== 'NON') return;
        var by = r() < 0.5 ? 'NATO' : 'PACT';
        if (r() < 0.45) { tt.preemptedBy = by; M.terr.forEach(function (o) { if (o.bloc === by) o.sideTargets = (o.sideTargets || []).concat([ti]); }); }
      });
      M.terr.forEach(function (tt) {
        if (tt.bloc === 'NON' || !tt.enemies.length) return;
        tt.silos.concat(tt.subs).forEach(function (u) {
          var side = tt.sideTargets && r() < 0.5 ? Math.max(1, Math.round(u.nukes * 0.15)) : 0;
          if (side) schedule(u, tt.t0 + 2 + r() * 4, tt.sideTargets, side);
          schedule(u, tt.t0, tt.enemies, u.nukes - side);
        });
      });
      /* the non-aligned keep a pact among themselves: if any one of them is struck by a bloc,
         all of them answer that bloc with everything, two minutes after the first impact */
      var firstHit = null, hitBy = null;
      M.launches.forEach(function (L) { if (M.terr[L.to.t].bloc === 'NON') { var e = L.t0 + L.fl; if (firstHit === null || e < firstHit) { firstHit = e; hitBy = M.terr[L.from.t].bloc; } } });
      if (firstHit !== null) {
        var tg = members(hitBy);
        M.nonStrikeBy = hitBy; M.nonStrikeAt = firstHit + 2;
        M.terr.forEach(function (tt) { if (tt.bloc !== 'NON') return; tt.retaliates = hitBy; tt.t0 = firstHit + 2; tt.silos.concat(tt.subs).forEach(function (u) { schedule(u, tt.t0, tg, u.nukes); }); });
      }
    }
    /* ABM: a defending silo near the target may intercept, less often as the barrage thickens */
    M.launches.sort(function (a, b) { return a.t0 - b.t0; });
    M.launches.forEach(function (L, i) {
      var def = M.terr[L.to.t].silos, best = null;
      def.forEach(function (s) { var d = Math.hypot(s.x - L.to.x, s.y - L.to.y); if (d < 140 && (!best || d < best.d)) best = { s: s, d: d }; });
      if (best && r() < Math.max(0.08, 0.38 - i / M.launches.length * 0.3)) L.abm = 0.7 + r() * 0.25;  /* fraction of flight at which it dies */
    });
    /* resolve kills in time order */
    var ev = M.launches.filter(function (L) { return !L.abm; }).map(function (L) { return { t: L.t0 + L.fl, L: L }; }).sort(function (a, b) { return a.t - b.t; });
    var pop = {}; M.cities.forEach(function (c, i) { c.i = i; pop[i] = c.pop0; });
    ev.forEach(function (e) { var c = e.L.to, k = Math.round(Math.min(pop[c.i], Math.max(0.5, pop[c.i] * 0.55)) * 10) / 10; pop[c.i] -= k; e.L.kills = k; });
    return M;
  }

  /* ---------- DOM ---------- */
  function el(n, a) { var e = document.createElementNS(SVG, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  var state = null;
  function mount(M) {
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    M.gUnits = el('g', { 'class': 'units' }); M.gArcs = el('g', { 'class': 'arcs' }); M.gHits = el('g', { 'class': 'hits' }); M.gCities = el('g', { 'class': 'scities' });
    layer.appendChild(M.gHits); layer.appendChild(M.gArcs); layer.appendChild(M.gUnits); layer.appendChild(M.gCities);
    M.cities.forEach(function (c) { c.el = el('g', { 'class': 'sc' }); c.el.appendChild(el('circle', { cx: c.x, cy: c.y, r: 1.6 + Math.sqrt(c.pop0) * 0.55 })); M.gCities.appendChild(c.el); });
    M.units.forEach(function (u) {
      var col = M.terr[u.t].col; u.el = el('g', { 'class': 'u ' + u.kind, style: 'color:' + col, opacity: 0 });
      if (u.kind === 'silo') { u.el.appendChild(el('rect', { x: u.x - 4, y: u.y - 4, width: 8, height: 8 })); u.el.appendChild(el('circle', { cx: u.x, cy: u.y, r: 58, 'class': 'rng' })); }
      else if (u.kind === 'radar') { u.el.appendChild(el('circle', { cx: u.x, cy: u.y, r: 3 })); u.el.appendChild(el('circle', { cx: u.x, cy: u.y, r: 80, 'class': 'rng' })); var sw = el('path', { d: 'M' + u.x + ',' + u.y + ' L' + (u.x + 80) + ',' + u.y + ' A80,80 0 0 1 ' + (u.x + 69.3) + ',' + (u.y + 40) + ' Z', 'class': 'sweep', style: 'transform-origin:' + u.x + 'px ' + u.y + 'px;animation-delay:' + (-u.born * 2) + 's' }); u.el.appendChild(sw); }
      else { u.el.appendChild(el('path', { d: 'M' + (u.x - 5) + ',' + u.y + ' l5,-4 l5,4 l-5,4 z' })); }
      M.gUnits.appendChild(u.el);
    });
    M.launches.forEach(function (L) { L.el = null; L.hit = null; });
    state = M; window.DEFCON_MATCH = M;
  }

  var hud = { hist: document.getElementById('hist'), lvl: document.getElementById('lvl'), clock: document.getElementById('clock'), match: document.getElementById('match'), next: document.getElementById('next'), board: document.getElementById('board'), log: document.getElementById('log'), over: document.getElementById('over') };
  function fmt(m) { var s = Math.max(0, Math.floor(m * 60)); return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2); }
  function level(min) { var l = 5; PHASES.forEach(function (p) { if (min >= p[0]) l = p[1]; }); return l; }

  function render(now) {
    var idx = Math.floor(now / MATCH_MS), seed = (idx * 2654435761) >>> 0;
    if (!state || state.seed !== seed) { mount(build(seed)); renderHistory(idx); }
    var M = state, min = (now - idx * MATCH_MS) / 60000, lv = level(min);
    /* units appear during placement */
    M.units.forEach(function (u) { u.el.setAttribute('opacity', min >= u.born ? 1 : 0); });
    /* reset counters, replay to now */
    M.terr.forEach(function (t) { t.kills = 0; t.lost = 0; });
    M.cities.forEach(function (c) { c.pop = c.pop0; c.hits = 0; });
    var logs = [];
    /* alignment declarations at the start of the match */
    ['LA', 'AF'].forEach(function (id, i) {
      var t = M.terr.filter(function (x) { return x.id === id; })[0], at = 0.25 + i * 0.25;
      if (min >= at) logs.push({ t: at, s: t.name.toUpperCase() + ': ' + (t.bloc === 'NATO' ? 'JOINS NATO' : t.bloc === 'PACT' ? 'JOINS THE WARSAW PACT' : 'DECLARES NON-ALIGNED'), c: 'a' });
    });
    var firstL = null; M.launches.forEach(function (L) { if (firstL === null || L.t0 < firstL.t0) firstL = L; });
    if (firstL && min >= firstL.t0) { var who = M.initiator === 'NATO' ? 'NATO' : M.initiator === 'PACT' ? 'WARSAW PACT' : 'THE NON-ALIGNED'; logs.push({ t: firstL.t0, s: who + ' STRIKE' + (M.initiator === 'NON' ? '' : 'S') + ' FIRST', c: 'f' }); }
    if (M.nonStrikeAt && min >= M.nonStrikeAt) logs.push({ t: M.nonStrikeAt, s: 'NON-ALIGNED ANSWER ' + (M.nonStrikeBy === 'NATO' ? 'NATO' : 'THE PACT'), c: 'f' });
    M.launches.forEach(function (L) {
      var end = L.t0 + L.fl, dead = L.abm ? L.t0 + L.fl * L.abm : end, live = min >= L.t0 && min < dead + 0.35;
      if (min >= L.t0 && logs.length < 400) logs.push({ t: L.t0, s: M.terr[L.from.t].id + ' → ' + L.to.name.toUpperCase(), c: 'l' });
      if (live) {
        if (!L.el) {
          var mx = (L.from.x + L.tx) / 2, my = Math.min(L.from.y, L.to.y) - Math.abs(L.tx - L.from.x) * 0.18 - 10;
          var d = 'M' + L.from.x + ',' + L.from.y + ' Q' + mx + ',' + my + ' ' + L.tx + ',' + L.to.y, st = 'stroke:' + M.terr[L.from.t].col;
          L.el = el('path', { 'class': 'arc', d: d, style: st }); M.gArcs.appendChild(L.el); L.len = L.el.getTotalLength(); L.el.setAttribute('stroke-dasharray', L.len);
          if (L.wrap) { L.el2 = el('path', { 'class': 'arc', d: d, style: st, transform: 'translate(' + (L.tx > 1440 ? -1440 : 1440) + ',0)', 'stroke-dasharray': L.len }); M.gArcs.appendChild(L.el2); }
        }
        var p = Math.min(1, (min - L.t0) / L.fl); if (L.abm) p = Math.min(p, L.abm);
        var op = min < dead ? 0.9 : 0.9 * (1 - (min - dead) / 0.35);
        L.el.setAttribute('stroke-dashoffset', L.len * (1 - p)); L.el.setAttribute('opacity', op);
        if (L.el2) { L.el2.setAttribute('stroke-dashoffset', L.len * (1 - p)); L.el2.setAttribute('opacity', op); }
      } else if (L.el) { L.el.remove(); L.el = null; if (L.el2) { L.el2.remove(); L.el2 = null; } }
      if (L.abm) { if (min >= dead && min < dead + 0.25) { if (!L.hit) { L.hit = el('circle', { 'class': 'abm', cx: ((L.from.x + (L.tx - L.from.x) * L.abm) % 1440 + 1440) % 1440, cy: Math.min(L.from.y, L.to.y) + 4, r: 3 }); M.gHits.appendChild(L.hit); } } else if (L.hit) { L.hit.remove(); L.hit = null; } return; }
      if (min >= end) {
        var c = L.to, k = L.kills; c.pop = Math.max(0, c.pop - k); c.hits++; M.terr[L.from.t].kills += k; M.terr[c.t].lost += k;
        if (logs.length < 400) logs.push({ t: end, s: c.name.toUpperCase() + ': ' + k.toFixed(1) + 'M DEAD', c: 'd' });
        var age = min - end;
        if (age < 0.5) { if (!L.hit) { L.hit = el('circle', { 'class': 'boom', cx: c.x, cy: c.y, r: 2 }); M.gHits.appendChild(L.hit); } L.hit.setAttribute('r', 2 + age * 40); L.hit.setAttribute('opacity', 1 - age * 2); }
        else if (L.hit) { L.hit.remove(); L.hit = null; }
      }
    });
    M.cities.forEach(function (c) { c.el.setAttribute('class', 'sc' + (c.hits ? (c.pop <= 0.5 ? ' dead' : ' hit') : '')); });
    /* HUD */
    hud.lvl.textContent = lv; hud.lvl.className = 'lv' + lv;
    hud.clock.textContent = fmt(min);
    hud.match.textContent = '#' + (idx % 100000);
    hud.next.textContent = fmt(MIN - min);
    var rows = M.terr.map(function (t) { return { t: t, sc: 2 * t.kills - t.lost }; }).sort(function (a, b) { return b.sc - a.sc; });
    var narrow = window.innerWidth < 360;
    hud.board.innerHTML = rows.map(function (r) { var tag = narrow ? (r.t.bloc === 'NON' ? 'N-A' + (r.t.strikesFirst || r.t.retaliates ? '*' : '') : r.t.bloc === 'NATO' ? 'NATO' : 'WP') : r.t.bloc === 'NON' ? (r.t.strikesFirst ? 'non-aligned, struck first' : r.t.retaliates ? 'non-aligned, struck' : 'non-aligned') : r.t.bloc === 'NATO' ? 'NATO' : 'Warsaw Pact'; return '<div><i style="background:' + r.t.col + '"></i><span>' + r.t.name + ' <em>' + tag + '</em></span><b>' + (r.sc >= 0 ? '+' : '') + r.sc.toFixed(0) + '</b><small>' + r.t.kills.toFixed(0) + 'M killed · ' + r.t.lost.toFixed(0) + 'M lost</small></div>'; }).join('');
    logs.sort(function (a, b) { return b.t - a.t; });
    hud.log.innerHTML = logs.slice(0, 10).map(function (e) { return '<div class="' + e.c + '">' + fmt(e.t) + '  ' + e.s + '</div>'; }).join('') || '<div>DEFCON ' + lv + ' \u00b7 ' + (lv > 3 ? 'placement' : lv > 1 ? 'manoeuvre' : 'awaiting launch') + '</div>';
    var dead = 0; M.terr.forEach(function (t) { dead += t.lost; });
    hud.over.hidden = !(min >= END_MIN);
    if (min >= END_MIN) hud.over.querySelector('b').textContent = dead.toFixed(0) + 'M dead · next match in ' + fmt(MIN - min);
    document.getElementById('toll').textContent = dead.toFixed(1) + 'M';
  }

  /* previous matches: rebuilt from their seeds, so the history is the same for everyone too */
  var histIdx = -1;
  function summarize(idx) {
    var M = build((idx * 2654435761) >>> 0), dead = 0;
    M.launches.forEach(function (L) { if (L.abm) return; M.terr[L.from.t].kills += L.kills; M.terr[L.to.t].lost += L.kills; dead += L.kills; });
    var rows = M.terr.map(function (t) { return { t: t, sc: 2 * t.kills - t.lost }; }).sort(function (a, b) { return b.sc - a.sc; });
    var tag = function (t) { return t.bloc === 'NATO' ? 'NATO' : t.bloc === 'PACT' ? 'Pact' : 'Non-al.'; };
    return { id: idx % 100000, first: M.initiator === 'NATO' ? 'NATO' : M.initiator === 'PACT' ? 'Pact' : 'Non-aligned', dead: dead, top: rows.slice(0, 3).map(function (r) { return r.t.name.replace('North America', 'N. America').replace('Latin America', 'L. America') + ' ' + (r.sc >= 0 ? '+' : '') + r.sc.toFixed(0); }) };
  }
  function renderHistory(idx) {
    if (idx === histIdx || !hud.hist) return; histIdx = idx;
    var out = '';
    for (var i = 1; i <= 5; i++) { var h = summarize(idx - i); out += '<div><span>#' + h.id + ' \u00b7 ' + h.first + ' struck first \u00b7 ' + h.dead.toFixed(0) + 'M dead</span><span>' + h.top.join(' \u00b7 ') + '</span></div>'; }
    hud.hist.innerHTML = out;
  }
  var help = document.getElementById('help'), about = document.getElementById('about');
  if (help && about) {
    help.addEventListener('click', function () { var open = about.hidden; about.hidden = !open; help.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !about.hidden) { about.hidden = true; help.setAttribute('aria-expanded', 'false'); } });
  }
  var last = 0;
  function frame(ts) { if (ts - last > 120) { last = ts; try { render(Date.now()); } catch (e) { /* keep the loop alive */ } } requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
})();
