(function () {
  var root = document.documentElement;
  var stages = ['d1', 'd2', 'd3', 'd4', 'd5'];
  function update() {
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, window.scrollY / max));
    root.style.setProperty('--decay', p.toFixed(4));
    for (var i = 0; i < stages.length; i++) {
      root.classList.toggle(stages[i], p >= (i + 1) / (stages.length + 1));
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
