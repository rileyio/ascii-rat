"use strict";

// ---------- Hyprland launcher welcome intro (?welcome=1 only) ----------
// Runs ONLY when the page is opened with ?welcome=1 (how the Hyprland bar
// widget launches it). A pixelated dot-pattern "WELCOME" materializes with
// a slight zoom while a pixel moon slides in behind it with a light
// transition; after a few seconds the whole thing fades out and the ASCII
// rat's own MATERIALIZE entrance replays as the GUI takes over.
// A normal load of index.html is completely unaffected, and no existing app
// logic, styles, or version strings are modified.

(function () {
  var on = false;
  try { on = new URLSearchParams(location.search).get("welcome") === "1"; } catch (e) {}
  if (!on) return;

  // replay the rat's entrance using the app's own existing logic
  function replayRatEntrance() {
    if (typeof entranceT !== "undefined" && typeof state !== "undefined" && state.entrance !== "NONE") {
      entranceT = performance.now();
    }
  }

  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  if (reduced) { replayRatEntrance(); return; }

  var style = document.createElement("style");
  style.textContent =
    "#welcomeIntro{position:fixed;inset:0;z-index:9999;background:#040704;transition:opacity .8s ease}" +
    "#welcomeIntro.done{opacity:0}" +
    "#welcomeIntro canvas{position:absolute;left:0;top:0;width:100%;height:100%;image-rendering:pixelated}";
  document.head.appendChild(style);

  var ov = document.createElement("div");
  ov.id = "welcomeIntro";
  var cv = document.createElement("canvas");
  ov.appendChild(cv);
  document.body.appendChild(ov);
  var ctx = cv.getContext("2d");
  if (!ctx) { ov.remove(); replayRatEntrance(); return; }

  // ---- pixel moon pattern (# = lit, o = crater) ----
  var MOON = [
    "....#####....",
    "...#######...",
    "..####o####..",
    ".#####o####..",
    ".###o####o##.",
    "####o####o###",
    "###o#####o###",
    ".####o#####..",
    ".o###o####o..",
    "..####o###...",
    "...o#####....",
    "....o###.....",
  ];

  // ---- sample "WELCOME" into a dot cloud (staggered like the rat's b offsets) ----
  var tc = document.createElement("canvas");
  tc.width = 220; tc.height = 64;
  var tctx = tc.getContext("2d");
  tctx.font = "bold 40px 'Courier New', monospace";
  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillStyle = "#fff";
  tctx.fillText("WELCOME", 110, 32);
  var img = tctx.getImageData(0, 0, 220, 64).data;
  var dots = [];
  for (var y = 0; y < 64; y += 3) {
    for (var x = 0; x < 220; x += 3) {
      if (img[(y * 220 + x) * 4 + 3] > 128) {
        dots.push({
          x: x - 110, y: y - 32,
          d: Math.random() * 1500,                       // materialize delay
          g: Math.random() < 0.5 ? "#7cf07c" : "#a8f0a0", // phosphor greens
        });
      }
    }
  }

  function fit() {
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
  }
  window.addEventListener("resize", fit);
  fit();

  var t0 = performance.now();
  var faded = false, removed = false;
  var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };

  function frame(now) {
    var t = now - t0;
    var W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);

    // light transition: the scene gently brightens as the moon arrives
    var light = easeOut(Math.min(1, Math.max(0, (t - 250) / 1450)));
    ctx.fillStyle = "rgba(214,255,214," + (0.05 * light).toFixed(3) + ")";
    ctx.fillRect(0, 0, W, H);

    // slight continuous zoom on the whole group (text + moon)
    var z = 0.92 + 0.10 * easeOut(Math.min(1, t / 2600)) +
            0.05 * Math.min(1, Math.max(0, (t - 2600) / 1600));

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-W / 2, -H / 2);

    // ---- moon: slides in from the left, ends centered behind the text ----
    var ms = Math.min(H * 0.42, W * 0.3);
    var cell = ms / 13;
    var mp = easeOut(Math.min(1, t / 2400));
    var mx = -ms + (W / 2 + ms / 2) * mp;
    var my = H / 2 - ms / 2;

    var gx = mx + ms / 2, gy = my + ms / 2;
    var ga = 0.9 * light * (0.92 + 0.08 * Math.sin(now * 0.002));
    var grad = ctx.createRadialGradient(gx, gy, ms * 0.1, gx, gy, ms * 1.6);
    grad.addColorStop(0, "rgba(222,238,200," + ga.toFixed(3) + ")");
    grad.addColorStop(1, "rgba(222,238,200,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(gx - ms * 1.6, gy - ms * 1.6, ms * 3.2, ms * 3.2);

    for (var r = 0; r < MOON.length; r++) {
      for (var c = 0; c < 13; c++) {
        var ch = MOON[r][c];
        if (ch === ".") continue;
        ctx.fillStyle = ch === "o" ? "#93a98a" : "#d6e6c8";
        ctx.fillRect(Math.round(mx + c * cell), Math.round(my + r * cell), Math.ceil(cell), Math.ceil(cell));
      }
    }

    // ---- dot-pattern WELCOME materializes in front of the moon ----
    var k = Math.min((W * 0.82) / 220, (H * 0.5) / 64);
    var dsz = Math.max(2, k * 2.4);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var p = Math.min(1, Math.max(0, (t - d.d) / 340));
      if (p <= 0) continue;
      var ep = easeOut(p);
      var jx = (1 - ep) * k * 2 * (Math.random() - 0.5);   // settle-in jitter
      var jy = (1 - ep) * k * 2 * (Math.random() - 0.5);
      var s = dsz * ep;
      ctx.globalAlpha = ep;
      ctx.fillStyle = d.g;
      ctx.fillRect(W / 2 + (d.x * k + jx) - s / 2, H / 2 + (d.y * k + jy) - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (!faded && t >= 3400) {
      faded = true;
      ov.classList.add("done");
      replayRatEntrance();   // rat materializes while the intro fades out
    }
    if (!removed && t >= 4400) {
      removed = true;
      window.removeEventListener("resize", fit);
      style.remove();
      ov.remove();
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
