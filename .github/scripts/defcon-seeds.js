/* Publishes random seeds for upcoming /defcon/ matches into defcon/seeds.json.
   A match is one UTC hour; its index is whole hours since the Unix epoch.
   - Adds a seed for each of the next AHEAD hours that has none and starts at least
     MARGIN minutes from now (time for the site to redeploy before the match begins).
   - Never changes or adds a seed for an hour that has started: an hour without a
     published seed keeps the page's clock-derived seed, the same for everyone.
   - Drops seeds older than KEEP hours (the page shows the last five matches). */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const FILE = path.join(__dirname, '..', '..', 'defcon', 'seeds.json');
const HOUR = 3600000, AHEAD = 12, MARGIN = 20, KEEP = 48;
const now = Date.now(), idx = Math.floor(now / HOUR);
let old = {};
try { old = JSON.parse(fs.readFileSync(FILE, 'utf8')).seeds || {}; } catch (e) {}
const seeds = {};
let added = 0;
for (let i = idx - KEEP; i <= idx + AHEAD; i++) {
  if (Number.isInteger(old[i])) seeds[i] = old[i];
  else if (i * HOUR - now >= MARGIN * 60000) { seeds[i] = crypto.randomInt(0, 2 ** 32); added++; }
}
if (added) fs.writeFileSync(FILE, JSON.stringify({ note: 'Random seeds for /defcon/ matches, by hours since the Unix epoch. Written by .github/workflows/defcon-seeds.yml.', seeds }, null, 1) + '\n');
console.log('hour ' + idx + ': ' + added + ' added, ' + Object.keys(seeds).length + ' kept');
