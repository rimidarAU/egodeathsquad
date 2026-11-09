(function () {
  var root = document.documentElement;
  var N = 7;
  var seen = 0; /* ratchet: what has been seen cannot be unseen */
  function update() {
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, window.scrollY / max));
    if (p > seen) seen = p;
    root.style.setProperty('--decay', seen.toFixed(4));
    for (var i = 1; i <= N; i++) root.classList.toggle('d' + i, seen >= i / (N + 1));
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
