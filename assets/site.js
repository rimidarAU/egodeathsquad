(function () {
  var KEY = "eds-survey";
  var SUBJECT = "Ego Death Squad Guest Book";
  var ADDR = ["egodeathsquad", "proton.me"].join("@");
  var RELAY = "https://formsubmit.co/ajax/" + ADDR;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.getElementById("y").textContent = new Date().getFullYear();

  /* ---- Background sound: a YouTube video looped as hidden audio ---- */
  var VIDEO = "hnFge7Xe08Q";
  var sndBtn = document.getElementById("snd");
  var player = null, wantSound = false;
  function setSndLabel(on, wait) {
    sndBtn.setAttribute("aria-pressed", on ? "true" : "false");
    sndBtn.classList.toggle("wait", !!wait);
    var label = wait ? "LOADING" : (on ? "SOUND ON" : "SOUND OFF");
    sndBtn.innerHTML = "&#9834; <span class=\"l\">" + label + "</span>";
    sndBtn.setAttribute("aria-label", "Background sound " + (wait ? "loading" : (on ? "on" : "off")));
  }
  function loadPlayer() {
    if (player || document.getElementById("yt-api")) return;
    setSndLabel(false, true);
    window.onYouTubeIframeAPIReady = function () {
      player = new YT.Player("yt", {
        videoId: VIDEO,
        playerVars: { autoplay: 1, loop: 1, playlist: VIDEO, controls: 0, playsinline: 1, rel: 0 },
        events: {
          onReady: function (e) { e.target.setVolume(40); if (wantSound) e.target.playVideo(); setSndLabel(wantSound); },
          onStateChange: function (e) { if (e.data === YT.PlayerState.ENDED) e.target.playVideo(); },
          onError: function () { player = null; wantSound = false; setSndLabel(false); sndBtn.title = "This video could not be played here."; }
        }
      });
    };
    var tag = document.createElement("script");
    tag.id = "yt-api"; tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = function () { tag.remove(); wantSound = false; setSndLabel(false); sndBtn.title = "Sound could not be loaded."; };
    document.head.appendChild(tag);
  }
  sndBtn.addEventListener("click", function () {
    wantSound = !wantSound;
    try { localStorage.setItem("eds-sound", wantSound ? "1" : "0"); } catch (e) {}
    if (!player) { if (wantSound) loadPlayer(); return; }
    if (wantSound) player.playVideo(); else player.pauseVideo();
    setSndLabel(wantSound);
  });
  // If it was left on last time, start it at the first tap or keypress
  // (browsers refuse sound before the visitor has touched the page).
  var wasOn = false;
  try { wasOn = localStorage.getItem("eds-sound") === "1"; } catch (e) {}
  if (wasOn) {
    var resume = function () {
      document.removeEventListener("pointerdown", resume); document.removeEventListener("keydown", resume);
      if (!wantSound) { wantSound = true; loadPlayer(); }
    };
    document.addEventListener("pointerdown", resume); document.addEventListener("keydown", resume);
    sndBtn.innerHTML = "&#9834; <span class=\"l\">TAP FOR SOUND</span>";
    sndBtn.setAttribute("aria-label", "Tap anywhere to resume background sound");
  }

  /* ---- Wingdings-style glyphs (he always spoke this way) ---- */
  var WD = { A:"✌", B:"👌", C:"👍", D:"👎", E:"☜", F:"☞", G:"☝", H:"☟", I:"✋", J:"☺", K:"😐", L:"☹", M:"💣", N:"☠", O:"⚐", P:"🏱", Q:"✈", R:"☼", S:"💧", T:"❄", U:"🕆", V:"✞", W:"🕈", X:"✠", Y:"✡", Z:"☪", " ":"  " };
  document.querySelectorAll("[data-wd]").forEach(function (el) {
    // U+FE0E asks for the text glyph, not the colour emoji
    el.textContent = el.dataset.wd.toUpperCase().split("").map(function (c) { return c === " " ? WD[c] : (WD[c] ? WD[c] + "\uFE0E" : c); }).join("");
  });

  /* ---- Entries: split into words so they can be let go ---- */
  document.querySelectorAll(".entry .txt").forEach(function (el) {
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.push(document.createTextNode(part)); return; }
          var s = document.createElement("span"); s.className = "word"; s.textContent = part; out.push(s);
        });
      } else { node.classList.add("word"); out.push(node); }
    });
    el.textContent = ""; out.forEach(function (n) { el.appendChild(n); });
  });
  document.querySelectorAll(".entry").forEach(function (row) {
    function toggle() { var on = row.classList.toggle("let-go"); row.setAttribute("aria-pressed", on ? "true" : "false"); }
    row.addEventListener("click", toggle);
  });

  /* ---- Reveal on scroll ---- */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---- Goners forget themselves one by one ---- */
  var goners = document.getElementById("gonerList");
  var gio = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) return; gio.disconnect();
    goners.querySelectorAll(".goner").forEach(function (g, i) {
      setTimeout(function () { g.classList.add("gone"); g.querySelector(".st").textContent = "FORGOTTEN"; }, 900 + i * 700);
    });
  }, { threshold: .5 });
  gio.observe(goners);

  /* ================= Survey program ================= */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  function hash(s) {
    var a = 0xdeadbeef, b = 0x41c6ce57;
    for (var i = 0; i < s.length; i++) { var k = s.charCodeAt(i); a = Math.imul(a ^ k, 2654435761); b = Math.imul(b ^ k, 1597334677); }
    a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
    b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
    return (4294967296 * (2097151 & b) + (a >>> 0)).toString(36);
  }
  function normalise(s) { return s.toUpperCase().replace(/[^A-Z]/g, ""); }
  var wrong = ["* That is still you talking.", "* Close. Closer than you were, anyway.", "* The program does not recognise that.", "* Try again, whoever you are.", "* He did not write that."];

  var state = load();
  if (typeof state.step !== "number") state.step = 0;
  var steps = document.querySelectorAll(".step");
  var bars = document.querySelectorAll(".progress span");

  function fillName() {
    document.querySelectorAll("[data-name]").forEach(function (el) { el.textContent = state.name || "unknown"; });
    document.getElementById("gbFormer").hidden = !state.name;
  }

  /* typewriter */
  var typing = null;
  function speak(step, done) {
    var el = step.querySelector(".say");
    var text = el.dataset.say.replace(/\\n/g, "\n").replace("{NAME}", (state.name || "NO ONE").toUpperCase());
    if (typing) { clearTimeout(typing); typing = null; }
    el.textContent = "";
    if (reduceMotion) { el.textContent = text; done(); return; }
    var i = 0, span = document.createElement("span"); span.className = "cur"; el.appendChild(span);
    function tick() {
      if (i >= text.length) { span.classList.remove("cur"); done(); return; }
      var ch = text[i++];
      span.appendChild(document.createTextNode(ch));
      typing = setTimeout(tick, ch === "\n" ? 180 : (/[.,]/.test(ch) ? 160 : 28));
    }
    tick();
  }

  function show(n, animate) {
    var current = document.querySelector(".step.active");
    var next = steps[n];
    bars.forEach(function (b, i) { b.classList.toggle("done", i < n); b.classList.toggle("cur", i === n); });
    fillName();
    function reveal() {
      steps.forEach(function (s) { s.classList.remove("active", "leaving", "ready"); });
      next.classList.add("active");
      armHint(next);
      speak(next, function () {
        next.classList.add("ready");
        var f = next.querySelector("input, textarea");
        if (f && animate) f.focus({ preventScroll: true });
      });
    }
    if (current && animate && !reduceMotion) { current.classList.remove("active"); current.classList.add("leaving"); setTimeout(reveal, 420); }
    else reveal();
  }

  function armHint(step) {
    var btn = step.querySelector(".hint button");
    if (!btn || btn.dataset.armed) return;
    btn.dataset.armed = "1";
    setTimeout(function () { btn.classList.add("ready"); }, 20000);
    btn.addEventListener("click", function () { openHint(step); });
  }
  function openHint(step) {
    var t = step.querySelector(".hint .text"); if (!t) return;
    t.classList.add("on"); step.querySelector(".hint button").style.display = "none";
  }

  function advance(from) {
    state.step = from + 1; save(state);
    setTimeout(function () { show(state.step, true); }, 600);
  }

  document.querySelectorAll("form.answer").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input");
      var fb = form.nextElementSibling;
      var n = Number(form.closest(".step").dataset.step);
      if (form.dataset.kind === "name") {
        var name = input.value.trim(); if (!name) return;
        state.name = name;
      } else if (form.dataset.hash.split(" ").indexOf(hash(normalise(input.value))) === -1) {
        form.misses = (form.misses || 0) + 1;
        if (form.misses >= 3) openHint(form.closest(".step"));
        fb.className = "feedback"; fb.textContent = wrong[Math.floor(Math.random() * wrong.length)];
        form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
        input.select(); return;
      }
      fb.className = "feedback ok"; fb.textContent = n === 0 ? "* Noted." : "* Accepted.";
      advance(n);
    });
  });

  /* ---- Guest book → FormSubmit → egodeathsquad@proton.me ---- */
  document.getElementById("book").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("gbName").value.trim();
    var msg = document.getElementById("gbMsg").value.trim();
    if (!msg) return;
    if (document.getElementById("gbHoney").value) return;
    // one message a minute per visitor, to keep the inbox sane
    var last = 0;
    try { last = Number(localStorage.getItem("eds-last-sent")) || 0; } catch (err) {}
    if (Date.now() - last < 60000) {
      var note = document.getElementById("after");
      note.textContent = "* The signal is still settling. Wait a minute, then try again.";
      note.classList.add("on");
      return;
    }
    var sig = name || "No one";
    if (state.name && state.name !== name) sig += " (formerly " + state.name + ")";
    var book = e.target, btn = document.getElementById("gbSend"), after = document.getElementById("after");
    btn.disabled = true; btn.textContent = "TRANSMITTING…"; after.classList.remove("on");
    fetch(RELAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ _subject: SUBJECT, _template: "box", _captcha: "false", name: sig, message: msg })
    }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok || String(j.success) !== "true") throw new Error(j.message || r.status); });
    }).then(function () {
      try { localStorage.setItem("eds-last-sent", String(Date.now())); } catch (err) {}
      book.classList.add("sent");
      after.textContent = "* RECEIVED. NO ONE WILL READ IT. SOMEONE WILL.\n* DON'T FORGET.";
      after.style.whiteSpace = "pre-line";
      after.classList.add("on");
    }).catch(function () {
      btn.disabled = false; btn.textContent = "TRANSMIT";
      after.textContent = "* The signal did not get through. Try again, or ";
      var a = document.createElement("a");
      a.href = "mailto:" + ADDR + "?subject=" + encodeURIComponent(SUBJECT) + "&body=" + encodeURIComponent(msg + "\n\n— " + sig);
      a.textContent = "send it by email";
      after.appendChild(a); after.appendChild(document.createTextNode(".")); after.classList.add("on");
    });
  });

  document.getElementById("reset").addEventListener("click", function () {
    state = { step: 0 }; save(state);
    document.querySelectorAll("form").forEach(function (f) { f.reset(); f.misses = 0; });
    document.querySelectorAll(".feedback").forEach(function (f) { f.textContent = ""; });
    document.querySelectorAll(".hint").forEach(function (h) {
      var b = h.querySelector("button"); b.style.display = ""; b.classList.remove("ready"); delete b.dataset.armed;
      h.querySelector(".text").classList.remove("on");
    });
    var book = document.getElementById("book"), send = document.getElementById("gbSend"), after = document.getElementById("after");
    book.classList.remove("sent"); send.disabled = false; send.textContent = "TRANSMIT";
    after.textContent = ""; after.className = "after";
    show(0, true);
    document.getElementById("survey").scrollIntoView();
  });

  show(Math.min(state.step, steps.length - 1), false);

  console.log("%c☜︎☠︎❄︎☼︎✡︎ ☠︎🕆︎💣︎👌︎☜︎☼︎ 💧︎☜︎✞︎☜︎☠︎❄︎☜︎☜︎☠︎", "font-size:18px");
  console.log("* Looking under the hood? He did that too. The answer is not stored here in plain text.");
})();
