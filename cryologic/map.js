/* Isometric schematic of Cryo Archive. Room positions are approximated from two community
   map guides (Mezmorki v1.0; LordTT) and redrawn here as simple blocks: it shows where things
   are relative to each other, not exact shapes or scale. */
(function () {
  'use strict';
  var SVG = 'http://www.w3.org/2000/svg', host = document.getElementById('iso'); if (!host) return;
  var K = 5.2, OX = 640, OY = 44, LV = 20, TH = 7;
  function P(x, y, z) { return [(x - y) * 0.866 * K + OX, (x + y) * 0.5 * K - (z || 0) + OY]; }
  function el(n, a, t) { var e = document.createElementNS(SVG, n); for (var k in a) e.setAttribute(k, a[k]); if (t != null) e.textContent = t; return e; }

  /* [name, zone, x1, y1, x2, y2, level]  level: -1 lower, 0 main, 1 upper */
  var ROOMS = [
    ['', 'wing', 6, 20.5, 19, 53, 0], ['Calibration', 'wing', 20, 38, 48, 56.5, 0], ['', 'wing', 6, 85, 19, 116.5, 0], ['Optimization', 'wing', 20, 82, 48, 97.5, 0],
    ['Stockpile', 'wing', 125.5, 13, 140, 31.5, 0], ['', 'wing', 140.5, 9, 146.5, 30, 0], ['Staging', 'wing', 171.5, 38, 187.5, 62, 0], ['Foundation', 'wing', 170, 74, 187.5, 98.5, 0],
    ['Repository', 'wing', 125.5, 106.5, 140, 125, 0], ['', 'wing', 140.5, 110, 147, 129, 0],
    ['', 'link', 116, 20, 125.5, 25, 0], ['', 'link', 116, 113, 125.5, 118, 0], ['', 'link', 154, 50, 171.5, 55, 0], ['', 'link', 154.5, 83, 170, 88, 0], ['', 'link', 121.5, 99, 133, 106.5, 0],
    ['Steerage', 'steerage', 79, 12, 116, 34, 0], ['Revival', 'revival', 79, 105.5, 116, 127, 0],
    ['', 'cargo', 56, 19.5, 72, 27.5, -1], ['', 'cargo', 58.7, 30.5, 68, 38, 0], ['Cargo', 'cargo', 48.7, 42.2, 76, 55.5, 0],
    ['Index', 'index', 48.7, 83.8, 75.7, 96.5, 0], ['', 'index', 59, 101.5, 69.5, 108, 0], ['', 'index', 55.7, 110.3, 73, 119.5, -1],
    ['', 'control', 50, 58.5, 66.5, 65, -1], ['Cold Storage', 'cold', 49.7, 66.2, 81.7, 72.5, -1], ['', 'control', 50, 73.7, 66.5, 80, -1],
    ['North Maze', 'control', 77, 40.5, 85, 64, -1], ['South Maze', 'control', 77, 75, 85, 97, -1], ['', 'spine', 85.3, 34, 88.3, 105.5, 1],
    ['Tranq. Derelict', 'tranq', 99, 36.7, 110.8, 50.5, 0], ['Control North', 'control', 89, 51.2, 112, 65.5, 0], ['Panopticon', 'pan', 96, 65.7, 108.5, 73.3, 0],
    ['Control South', 'control', 89, 73.5, 112, 88, 0], ['Tranq. Dormant', 'tranq', 99, 88.2, 110.8, 102, 0],
    ['', 'bio', 119, 33, 147, 42, 0], ['Bio. Chiller', 'bio', 112.7, 48, 125, 58, 0], ['Biostock', 'bio', 125.7, 48, 154, 60.5, 0],
    ['East Maze', 'control', 113, 60.8, 130, 78.2, -1], ['Pres. Chiller', 'pres', 112.7, 80.5, 125, 90.5, 0], ['Preservation', 'pres', 125.7, 78.5, 154.5, 91, 0],
    ['Secret Lab', 'lab', 152.8, 66.2, 174.5, 72.6, 0]
  ];
  var ZONE = { wing: '#2A3440', link: '#1B232B', steerage: '#3A4A63', revival: '#3A4A63', cargo: '#4A4636', index: '#4A4636', control: '#34424C', cold: '#7A4A22', spine: '#1E6F78', tranq: '#4B3A5E', pan: '#1F6E78', bio: '#33503E', pres: '#33503E', lab: '#5A2630' };

  var LAYERS = [
    { id: 'vault', name: 'Vaults', glyph: 'V', col: '#3D7BFF', on: true },
    { id: 'battery', name: 'Batteries', glyph: 'B', col: '#C8FF2E', on: true },
    { id: 'container', name: 'Coolant containers', glyph: 'C', col: '#9FE8FF', on: true },
    { id: 'source', name: 'Coolant sources', glyph: 'F', col: '#19E3FF', on: true },
    { id: 'key', name: 'Access keys', glyph: 'K', col: '#FFB347', on: true },
    { id: 'keysrc', name: 'Key sources', glyph: 'S', col: '#FF2D95', on: true },
    { id: 'warden', name: 'Wardens', glyph: 'W', col: '#FF3B3B', on: true },
    { id: 'compiler', name: 'Compilers', glyph: 'T', col: '#B98CFF', on: true },
    { id: 'spawn', name: 'Team spawns', glyph: '•', col: '#39E36B', on: false }
  ];
  var M = 'Mezmorki guide', L = 'LordTT guide', BOTH = 'both guides';
  /* [layer, x, y, level, title, text, source, label] */
  var POIS = [
    ['vault', 86.5, 86, 0, 'Vault 1', 'Needs 5 batteries. No key and no coolant.', BOTH, '1'],
    ['vault', 121.4, 49, 0, 'Vault 2', 'Needs 5 to 6 batteries and one filled cryo coolant.', BOTH, '2'],
    ['vault', 127.5, 89.5, 0, 'Vault 3', 'Needs 4 batteries and the Pump Credentials.', BOTH, '3'],
    ['vault', 86.5, 53, 0, 'Vault 4', 'Needs clearance 3, 8 batteries, one filled coolant and the Colonist Credentials.', BOTH, '4'],
    ['vault', 51.5, 69.4, -1, 'Vault 5', 'Needs 4 to 5 batteries, one filled coolant and the Tranquility Credentials.', BOTH, '5'],
    ['vault', 115, 43.5, 0, 'Lab elevator to Vaults 6 and 7 (north)', 'Clearance 4 to ride. Vault 6: 8 to 12 batteries (one guide says 9), one filled coolant, and the three Secret Lab symbols entered in order; bring anti-virus kits. Vault 7: clearance 3 to 5, a DNA Access Card, 10 batteries (3 for the data field, 7 for the door) and the Commander Credentials; one guide adds AI subroutines 1 to 6. The boss is inside.', BOTH, '6/7'],
    ['vault', 115, 97, 0, 'Lab elevator to Vaults 6 and 7 (south)', 'The second elevator to the labs. Same requirements as the north elevator.', BOTH, '6/7'],

    ['battery', 86.5, 86, 0, 'Vault 1 door', '5 batteries.', BOTH], ['battery', 121.4, 49, 0, 'Vault 2 door', '5 to 6 batteries.', BOTH], ['battery', 127.5, 89.5, 0, 'Vault 3 door', '4 batteries.', BOTH],
    ['battery', 86.5, 53, 0, 'Vault 4 door', '8 batteries.', BOTH], ['battery', 51.5, 69.4, -1, 'Vault 5 door', '4 to 5 batteries.', BOTH],
    ['battery', 115, 43.5, 0, 'Vaults 6 and 7', 'Vault 6: 8 to 12 batteries. Vault 7: 10 batteries, 3 of them to disable the data corruption field and 7 for the vault.', BOTH],
    ['battery', 100.5, 71.4, 0, 'Coolant fill, Panopticon pit', 'Filling a coolant container here costs 1 battery.', BOTH], ['battery', 182.9, 42.4, 0, 'Coolant fill, Staging', 'Filling a coolant container here costs 1 battery.', BOTH],
    ['battery', 102.2, 67.2, 0, 'DNA station, Panopticon', 'Inserting the colonist DNA sample needs 1 battery.', BOTH],

    ['container', 140, 84.5, 0, 'Empty coolant containers', 'Preservation is the best place to find empty containers; the map marks two here and both guides call it a prime source.', BOTH],
    ['container', 150, 55.5, 0, 'Empty coolant container', 'An empty container is marked near the east side of Biostock.', M],
    ['container', 74.5, 31.5, 0, 'Filled coolant (clearance 3)', 'A container that is already filled, behind a clearance 3 door on the Cargo side of Steerage. It saves a trip to a fill point.', M],

    ['source', 100.5, 71.4, 0, 'Fill point: Panopticon pit', 'The frozen pit under the Panopticon at the centre of Control. Insert an empty container to fill it. Costs 1 battery.', BOTH],
    ['source', 182.9, 42.4, 0, 'Fill point: Staging', 'A fill station in Staging, the far-east starting room beyond Biostock. Costs 1 battery.', BOTH],

    ['key', 127.5, 89.5, 0, 'Pump Credentials', 'Open Vault 3.', BOTH], ['key', 86.5, 53, 0, 'Colonist Credentials', 'Open Vault 4.', BOTH], ['key', 51.5, 69.4, -1, 'Tranquility Credentials', 'Open Vault 5.', BOTH],
    ['key', 163.5, 69.4, 0, 'Secret Lab symbols', 'The three symbols and their order (left, centre, right) shown on the Secret Lab screens. Enter them on the matching panels at the labs to open Vault 6.', BOTH],
    ['key', 115, 97, 0, 'Commander Credentials', 'Open Vault 7. Whoever carries the key must stand in front of the scanner where it was used to be verified.', M],

    ['keysrc', 34.1, 52.4, 0, 'Pump Credentials source', 'On the floor of a warden spawn room in a wing where no team spawned. Kill the warden or use the panel by the door to drop the barriers and leave. Clearance 2 scanners can detect the warden.', BOTH],
    ['keysrc', 65, 69.4, -1, 'Colonist DNA sample', 'Destroy the flying drones carrying frozen bodies in the cold area between Cargo and Index and take the DNA sample.', BOTH],
    ['keysrc', 102.2, 67.2, 0, 'DNA station, Panopticon', 'Clearance 3 to enter. Insert the colonist DNA sample (1 battery), survive the UESC wave, and collect the Colonist Credentials. The DNA sequencer for the Vault 7 chain is also used here.', BOTH],
    ['keysrc', 104.9, 41.5, 0, 'Tranquility Credentials (north)', 'A card on the floor of the frozen Tranquility room. Picking it up spawns a warden; beat it or use the door panel to get out.', BOTH],
    ['keysrc', 104.9, 97.5, 0, 'Tranquility Credentials (south)', 'The same card can appear in the southern Tranquility room, with its own warden.', BOTH],
    ['keysrc', 163.5, 69.4, 0, 'Secret Lab', 'Clearance 4 to enter the centre; bring anti-virus kits for the data corruption. Note the three symbols and their order for Vault 6.', BOTH],
    ['keysrc', 115, 43.5, 0, 'Commander Credentials chain', 'Find a DNA Access Card in one of the other vaults. Use the DNA sequencer in your spawn area to get a four-letter code, go to the point marked blue on your map, and switch on the four monitors in the code’s order to get the DNA vial. Take the lab elevator, clear the data field with anti-virus kits (3 batteries), and insert the vial in the central room.', BOTH],

    ['warden', 34.1, 50.2, 0, 'Pump warden: Calibration', 'A possible Pump Credentials warden room.', BOTH], ['warden', 32.1, 92.2, 0, 'Pump warden: Optimization', 'A possible Pump Credentials warden room.', BOTH],
    ['warden', 132.8, 25, 0, 'Pump warden: Stockpile', 'A possible Pump Credentials warden room.', BOTH], ['warden', 177.8, 50.5, 0, 'Pump warden: Staging', 'A possible Pump Credentials warden room.', BOTH],
    ['warden', 178.6, 87.3, 0, 'Pump warden: Foundation', 'A possible Pump Credentials warden room.', BOTH], ['warden', 132.9, 114.5, 0, 'Pump warden: Repository', 'A possible Pump Credentials warden room.', BOTH],
    ['warden', 104.9, 39, 0, 'Tranquility warden (north)', 'Spawns when the Tranquility Credentials are picked up in the northern room.', BOTH], ['warden', 104.9, 100, 0, 'Tranquility warden (south)', 'Spawns when the Tranquility Credentials are picked up in the southern room.', BOTH],

    ['compiler', 103.8, 71.4, 0, 'Compiler Trace', 'In the pit at the centre of Control, under the Panopticon. Needs clearance 5. One guide values it at about 40,000 credits. It is the only compiler either guide marks.', L],

    ['spawn', 10.5, 28.6, 0, 'Team spawn', 'North-west wing.', BOTH], ['spawn', 8.3, 113.7, 0, 'Team spawn', 'South-west wing.', BOTH], ['spawn', 143.6, 10.5, 0, 'Team spawn', 'North wing, by Stockpile.', BOTH],
    ['spawn', 182.3, 39.5, 0, 'Team spawn', 'North-east wing, Staging.', BOTH], ['spawn', 182.7, 97, 0, 'Team spawn', 'South-east wing, Foundation.', BOTH], ['spawn', 143.8, 112, 0, 'Team spawn', 'South wing, by Repository.', BOTH]
  ];

  var svg = el('svg', { viewBox: '120 90 1220 730', role: 'img', 'aria-label': 'Isometric schematic of Cryo Archive with points of interest. The same information is listed in the tables below.' });
  function shade(hex, f) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) * f, g = ((n >> 8) & 255) * f, b = (n & 255) * f; return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
  var order = ROOMS.map(function (r, i) { return i; }).sort(function (a, b) { var A = ROOMS[a], B = ROOMS[b]; return (A[6] - B[6]) || ((A[4] + A[5]) - (B[4] + B[5])); });
  var gRooms = el('g', {}), gLabels = el('g', { 'class': 'lab' }), gPoi = el('g', {});
  order.forEach(function (i) {
    var r = ROOMS[i], z = r[6] * LV, c = ZONE[r[1]], a = P(r[2], r[3], z), b = P(r[4], r[3], z), d = P(r[4], r[5], z), e = P(r[2], r[5], z);
    var pts = function (arr) { return arr.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
    gRooms.appendChild(el('polygon', { points: pts([b, d, [d[0], d[1] + TH], [b[0], b[1] + TH]]), fill: shade(c, 0.55) }));
    gRooms.appendChild(el('polygon', { points: pts([e, d, [d[0], d[1] + TH], [e[0], e[1] + TH]]), fill: shade(c, 0.4) }));
    gRooms.appendChild(el('polygon', { points: pts([a, b, d, e]), fill: c, stroke: shade(c, 1.7), 'stroke-width': r[1] === 'link' ? 0.5 : 1, 'class': 'top' }));
    if (r[0]) { var m = P((r[2] + r[4]) / 2, (r[3] + r[5]) / 2, z); gLabels.appendChild(el('text', { x: m[0], y: m[1] + 3, 'text-anchor': 'middle', 'class': 'zn' + (/^(Steerage|Revival|Cargo|Index|Biostock|Preservation|Control North|Control South)$/.test(r[0]) ? ' big' : '') }, r[0])); }
  });
  /* level key drawn on the map */
  [['Upper level', 1, '#1E6F78'], ['Main level', 0, '#34424C'], ['Lower level', -1, '#7A4A22']].forEach(function (k, i) {
    var x = 140, y = 730 + i * 24; svg.appendChild(el('rect', { x: x, y: y, width: 26, height: 12, fill: k[2], stroke: shade(k[2], 1.7) })); svg.appendChild(el('text', { x: x + 36, y: y + 10, 'class': 'key' }, k[0]));
  });
  /* north arrow: north is toward the top right */
  (function () { var x = 160, y = 190, dx = 0.866 * 46, dy = -0.5 * 46; svg.appendChild(el('line', { x1: x, y1: y, x2: x + dx, y2: y + dy, stroke: '#9FE8FF', 'stroke-width': 2 }));
    svg.appendChild(el('polygon', { points: (x + dx + 7) + ',' + (y + dy - 4) + ' ' + (x + dx - 6) + ',' + (y + dy - 3) + ' ' + (x + dx - 1) + ',' + (y + dy + 8), fill: '#9FE8FF' })); svg.appendChild(el('text', { x: x + dx + 12, y: y + dy - 6, 'class': 'key' }, 'N')); })();
  svg.appendChild(gRooms); svg.appendChild(gLabels); svg.appendChild(gPoi);

  var panel = document.getElementById('iso-info'), layerOn = {}, slot = {};
  LAYERS.forEach(function (l, i) { layerOn[l.id] = l.on; slot[l.id] = i; });
  function show(p, l) {
    panel.innerHTML = ''; var h = document.createElement('b'); h.textContent = p[4]; h.style.color = l.col; var s = document.createElement('span'); s.textContent = l.name; var t = document.createElement('p'); t.textContent = p[5]; var c = document.createElement('small'); c.textContent = 'Source: ' + p[6];
    panel.appendChild(s); panel.appendChild(h); panel.appendChild(t); panel.appendChild(c);
  }
  /* markers that share a spot are fanned out sideways so each stays clickable */
  var seen = {};
  POIS.forEach(function (p) {
    var l = LAYERS[slot[p[0]]], key = Math.round(p[1]) + ':' + Math.round(p[2]), n = seen[key] = (seen[key] || 0) + 1, q = P(p[1], p[2], p[3] * LV);
    var x = q[0] + (n - 1) * 19, y = q[1], stem = 30 + ((n - 1) % 2) * 9, small = p[0] === 'spawn';
    var g = el('g', { 'class': 'poi', 'data-layer': p[0], tabindex: 0, role: 'button', 'aria-label': l.name + ': ' + p[4] });
    g.appendChild(el('line', { x1: q[0], y1: q[1], x2: x, y2: y - stem, stroke: l.col, 'stroke-width': 1, opacity: 0.8 }));
    g.appendChild(el('circle', { cx: q[0], cy: q[1], r: 2, fill: l.col }));
    g.appendChild(el('circle', { cx: x, cy: y - stem, r: small ? 6 : 9.5, fill: '#06090C', stroke: l.col, 'stroke-width': 2, 'class': 'dot' }));
    g.appendChild(el('text', { x: x, y: y - stem + (p[7] && p[7].length > 1 ? 3 : 3.6), 'text-anchor': 'middle', fill: l.col, 'class': 'gl' + (p[7] && p[7].length > 1 ? ' sm' : '') }, p[7] || l.glyph));
    var pick = function () { show(p, l); Array.prototype.forEach.call(svg.querySelectorAll('.poi.sel'), function (e) { e.classList.remove('sel'); }); g.classList.add('sel'); };
    g.addEventListener('click', pick); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    gPoi.appendChild(g);
  });
  host.appendChild(svg);
  var sc = host.parentNode; if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) * 0.45;

  var bar = document.getElementById('iso-layers');
  function apply() { Array.prototype.forEach.call(svg.querySelectorAll('.poi'), function (g) { g.style.display = layerOn[g.getAttribute('data-layer')] ? '' : 'none'; }); }
  LAYERS.forEach(function (l) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', l.on ? 'true' : 'false'); b.style.setProperty('--c', l.col);
    var i = document.createElement('i'); i.textContent = l.glyph; b.appendChild(i); b.appendChild(document.createTextNode(l.name + ' (' + POIS.filter(function (p) { return p[0] === l.id; }).length + ')'));
    b.addEventListener('click', function () { layerOn[l.id] = !layerOn[l.id]; b.setAttribute('aria-pressed', layerOn[l.id] ? 'true' : 'false'); apply(); });
    bar.appendChild(b);
  });
  apply();
})();
