(function () {
  var R = window.RIDDLES || [];
  var KEY = 'eds-solved';
  var solved = {};
  try { solved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { solved = {}; }

  function norm(s) {
    var w = s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/);
    return w.filter(function (x, i) { return !(i === 0 && ['a', 'an', 'the'].indexOf(x) > -1); }).join('');
  }
  function sha(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(solved)); } catch (e) {} }
  function pad(n) { return ('0' + n).slice(-2); }

  var list = document.getElementById('list');
  var count = document.getElementById('count');

  function updateCount() {
    var n = Object.keys(solved).length;
    count.textContent = pad(n) + '/' + pad(R.length);
    if (n === R.length && R.length) document.getElementById('done').hidden = false;
  }

  function mark(el, id) {
    el.classList.add('solved');
    el.querySelector('input').disabled = true;
    el.querySelector('.status-tag').textContent = 'Solved';
    el.querySelector('.msg').textContent = '';
    solved[id] = 1; save(); updateCount();
  }

  R.forEach(function (r, i) {
    var el = document.createElement('article');
    el.className = 'slab-r';
    el.innerHTML =
      '<div class="meta mono-label"><span>File ' + pad(i + 1) + '</span><span class="status-tag">Open</span></div>' +
      '<p class="q"></p>' +
      '<form autocomplete="off"><label class="mono-label" for="a' + i + '">Answer</label>' +
      '<div class="field"><input id="a' + i + '" type="text" spellcheck="false" autocapitalize="off">' +
      '<button type="submit">Check</button></div></form>' +
      '<div class="foot"><button type="button" class="hintbtn">Hint</button><span class="msg" role="status"></span></div>';
    el.querySelector('.q').textContent = r.q;
    var msg = el.querySelector('.msg');
    el.querySelector('.hintbtn').addEventListener('click', function () { msg.textContent = 'Hint: ' + r.hint; });
    el.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = norm(el.querySelector('input').value);
      if (!v) return;
      sha(r.id + ':' + v).then(function (h) {
        if (r.h.indexOf(h) > -1) mark(el, r.id);
        else { msg.textContent = 'Not it. Try again.'; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
      }).catch(function () { msg.textContent = 'Needs a secure (https) connection.'; });
    });
    list.appendChild(el);
    if (solved[r.id]) { el.querySelector('input').value = '✓'; mark(el, r.id); }
  });
  updateCount();
})();
